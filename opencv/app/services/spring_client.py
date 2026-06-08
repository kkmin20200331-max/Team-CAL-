import json
import sqlite3
from pathlib import Path
from threading import Lock, Thread
from time import sleep, time
from typing import Any

from app.core.config import settings
from app.core.logger import get_logger
from app.schemas.response import AggregatedCongestionResponse, DetectionResponse

logger = get_logger(__name__)


class SpringClient:
    def __init__(self) -> None:
        self._worker: Thread | None = None
        self._lock = Lock()
        self._initialized = False

    def start(self) -> None:
        if not settings.send_to_spring:
            return
        self._ensure_store()
        self._ensure_worker()

    def send_congestion(self, payload: DetectionResponse | AggregatedCongestionResponse) -> bool:
        if not settings.send_to_spring:
            logger.info("[SPRING] skipped; SEND_TO_SPRING=false")
            return True

        data = self._to_spring_payload(payload)
        self._ensure_store()
        self._enqueue(data)
        self._ensure_worker()
        return True

    def pending_count(self) -> int:
        self._ensure_store()
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(*) FROM outbound_messages WHERE status IN ('PENDING', 'IN_FLIGHT')"
            ).fetchone()
        return int(row[0])

    def failed_count(self) -> int:
        self._ensure_store()
        with self._connect() as conn:
            row = conn.execute("SELECT COUNT(*) FROM outbound_messages WHERE status = 'FAILED'").fetchone()
        return int(row[0])

    def _to_spring_payload(self, payload: DetectionResponse | AggregatedCongestionResponse) -> dict:
        data = payload.model_dump(mode="json")
        data.pop("boxes", None)
        data.pop("annotatedImage", None)
        if not settings.include_aggregate_samples:
            data.pop("samples", None)
        return data

    def _ensure_worker(self) -> None:
        with self._lock:
            if self._worker and self._worker.is_alive():
                return
            self._worker = Thread(target=self._send_loop, daemon=True)
            self._worker.start()

    def _ensure_store(self) -> None:
        with self._lock:
            if self._initialized:
                return

            output_path = Path(settings.sender_queue_db)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with self._connect() as conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS outbound_messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        payload_json TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT 'PENDING',
                        attempts INTEGER NOT NULL DEFAULT 0,
                        next_attempt_at REAL NOT NULL DEFAULT 0,
                        created_at REAL NOT NULL,
                        updated_at REAL NOT NULL,
                        last_error TEXT
                    )
                    """
                )
                conn.execute("UPDATE outbound_messages SET status = 'PENDING' WHERE status = 'IN_FLIGHT'")
                conn.commit()
            self._initialized = True

    def _connect(self):
        return sqlite3.connect(settings.sender_queue_db)

    def _enqueue(self, payload: dict[str, Any]) -> None:
        now = time()
        payload_json = json.dumps(payload, ensure_ascii=False)
        with self._lock:
            with self._connect() as conn:
                pending_count = conn.execute(
                    "SELECT COUNT(*) FROM outbound_messages WHERE status IN ('PENDING', 'IN_FLIGHT')"
                ).fetchone()[0]
                status = "PENDING"
                if pending_count >= max(1, settings.sender_queue_max_size):
                    status = "FAILED"
                    logger.error("[SPRING] durable queue is full. payload saved as FAILED")
                    self._write_failed_payload(payload)

                conn.execute(
                    """
                    INSERT INTO outbound_messages (
                        payload_json, status, attempts, next_attempt_at, created_at, updated_at
                    )
                    VALUES (?, ?, 0, 0, ?, ?)
                    """,
                    (payload_json, status, now, now),
                )
                conn.commit()
        logger.info("[SPRING] durable payload queued. status=%s", status)

    def _send_loop(self) -> None:
        try:
            import httpx
        except ImportError:
            logger.error("[SPRING] httpx is not installed. durable sender disabled")
            return

        self._ensure_store()
        with httpx.Client(timeout=settings.spring_send_timeout_sec) as client:
            while True:
                message = self._claim_next_message()
                if message is None:
                    sleep(max(0.1, settings.sender_poll_interval_sec))
                    continue

                message_id, payload, attempts = message
                try:
                    self._post(client, payload)
                    self._delete_message(message_id)
                    logger.info("[SPRING] POST success: %s messageId=%s", settings.spring_congestion_url, message_id)
                except Exception as exc:
                    self._mark_retry_or_failed(message_id, payload, attempts, str(exc))

    def _claim_next_message(self) -> tuple[int, dict[str, Any], int] | None:
        now = time()
        with self._lock:
            with self._connect() as conn:
                row = conn.execute(
                    """
                    SELECT id, payload_json, attempts
                    FROM outbound_messages
                    WHERE status = 'PENDING' AND next_attempt_at <= ?
                    ORDER BY id
                    LIMIT 1
                    """,
                    (now,),
                ).fetchone()
                if row is None:
                    return None

                message_id = int(row[0])
                attempts = int(row[2]) + 1
                conn.execute(
                    """
                    UPDATE outbound_messages
                    SET status = 'IN_FLIGHT', attempts = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (attempts, now, message_id),
                )
                conn.commit()

        return message_id, json.loads(row[1]), attempts

    def _post(self, client, payload: dict[str, Any]) -> None:
        response = client.post(
            settings.spring_congestion_url,
            headers={"X-AI-API-KEY": settings.spring_api_key},
            json=payload,
        )
        response.raise_for_status()

    def _delete_message(self, message_id: int) -> None:
        with self._lock:
            with self._connect() as conn:
                conn.execute("DELETE FROM outbound_messages WHERE id = ?", (message_id,))
                conn.commit()

    def _mark_retry_or_failed(
        self,
        message_id: int,
        payload: dict[str, Any],
        attempts: int,
        error: str,
    ) -> None:
        now = time()
        max_attempts = max(1, settings.spring_send_retry)
        if attempts >= max_attempts:
            with self._lock:
                with self._connect() as conn:
                    conn.execute(
                        """
                        UPDATE outbound_messages
                        SET status = 'FAILED', updated_at = ?, last_error = ?
                        WHERE id = ?
                        """,
                        (now, error, message_id),
                    )
                    conn.commit()
            self._write_failed_payload(payload)
            logger.error("[SPRING] POST failed permanently messageId=%s error=%s", message_id, error)
            return

        delay_sec = min(60, 2 ** max(0, attempts - 1))
        with self._lock:
            with self._connect() as conn:
                conn.execute(
                    """
                    UPDATE outbound_messages
                    SET status = 'PENDING', next_attempt_at = ?, updated_at = ?, last_error = ?
                    WHERE id = ?
                    """,
                    (now + delay_sec, now, error, message_id),
                )
                conn.commit()
        logger.error(
            "[SPRING] POST failed messageId=%s attempt=%s/%s retryIn=%ss error=%s",
            message_id,
            attempts,
            max_attempts,
            delay_sec,
            error,
        )

    def _write_failed_payload(self, payload: dict[str, Any]) -> None:
        output_path = Path(settings.failed_payload_log)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("a", encoding="utf-8") as file:
            file.write(json.dumps(payload, ensure_ascii=False) + "\n")


spring_client = SpringClient()
