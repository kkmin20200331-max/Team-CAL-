from pathlib import Path
from queue import Full, Queue
from threading import Lock, Thread
from time import sleep
from typing import Any

from app.core.config import settings
from app.core.logger import get_logger
from app.schemas.response import AggregatedCongestionResponse, DetectionResponse

logger = get_logger(__name__)


class SpringClient:
    def __init__(self) -> None:
        self._queue: Queue[dict[str, Any]] = Queue(maxsize=max(1, settings.sender_queue_max_size))
        self._worker: Thread | None = None
        self._lock = Lock()

    def send_congestion(self, payload: DetectionResponse | AggregatedCongestionResponse) -> bool:
        if not settings.send_to_spring:
            logger.info("[SPRING] skipped; SEND_TO_SPRING=false")
            return True

        self._ensure_worker()
        data = self._to_spring_payload(payload)
        try:
            self._queue.put_nowait(data)
            logger.info("[SPRING] queued payload. queueSize=%s", self._queue.qsize())
            return True
        except Full:
            logger.error("[SPRING] sender queue is full. payload moved to failed log")
            self._write_failed_payload(data)
            return False

    def _to_spring_payload(self, payload: DetectionResponse | AggregatedCongestionResponse) -> dict:
        data = payload.model_dump(mode="json")
        data.pop("boxes", None)
        data.pop("annotatedImage", None)
        return data

    def _ensure_worker(self) -> None:
        with self._lock:
            if self._worker and self._worker.is_alive():
                return
            self._worker = Thread(target=self._send_loop, daemon=True)
            self._worker.start()

    def _send_loop(self) -> None:
        try:
            import httpx
        except ImportError:
            logger.error("[SPRING] httpx is not installed. sender disabled")
            return

        with httpx.Client(timeout=settings.spring_send_timeout_sec) as client:
            while True:
                payload = self._queue.get()
                try:
                    self._post_with_retry(client, payload)
                finally:
                    self._queue.task_done()

    def _post_with_retry(self, client, payload: dict[str, Any]) -> None:
        attempts = max(1, settings.spring_send_retry)
        for attempt in range(1, attempts + 1):
            try:
                response = client.post(
                    settings.spring_congestion_url,
                    headers={"X-AI-API-KEY": settings.spring_api_key},
                    json=payload,
                )
                response.raise_for_status()
                logger.info("[SPRING] POST success: %s", settings.spring_congestion_url)
                return
            except Exception as exc:
                logger.error("[SPRING] POST failed attempt=%s/%s error=%s", attempt, attempts, exc)
                if attempt < attempts:
                    sleep(2 ** (attempt - 1))

        self._write_failed_payload(payload)

    def _write_failed_payload(self, payload: dict[str, Any]) -> None:
        import json

        output_path = Path(settings.failed_payload_log)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("a", encoding="utf-8") as file:
            file.write(json.dumps(payload, ensure_ascii=False) + "\n")


spring_client = SpringClient()
