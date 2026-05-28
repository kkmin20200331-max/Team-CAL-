from datetime import datetime
from threading import Event, Lock, Thread
from typing import Optional

from app.schemas.response import CameraStatusResponse, DetectionBox


class InferenceState:
    def __init__(self) -> None:
        self._lock = Lock()
        self.stop_event = Event()
        self.worker: Optional[Thread] = None
        self.running = False
        self.store_id: Optional[int] = None
        self.camera_id: Optional[str] = None
        self.last_customer_count: Optional[int] = None
        self.last_confidence_avg: Optional[float] = None
        self.last_measured_at: Optional[datetime] = None
        self.last_send_success: Optional[bool] = None
        self.last_error: Optional[str] = None
        self.status_message: Optional[str] = None
        self.model_name: Optional[str] = None
        self.image_size: Optional[int] = None
        self.confidence_threshold: Optional[float] = None
        self.processing_ms: Optional[int] = None
        self.boxes: list[DetectionBox] = []
        self.annotated_image: Optional[str] = None

    def mark_started(
        self,
        store_id: int,
        camera_id: str,
        worker: Thread,
        model_name: str | None = None,
        image_size: int | None = None,
        confidence_threshold: float | None = None,
    ) -> None:
        with self._lock:
            self.stop_event.clear()
            self.worker = worker
            self.running = True
            self.store_id = store_id
            self.camera_id = camera_id
            self.model_name = model_name
            self.image_size = image_size
            self.confidence_threshold = confidence_threshold
            self.processing_ms = None
            self.boxes = []
            self.annotated_image = None
            self.last_error = None
            self.status_message = "running"

    def mark_result(
        self,
        customer_count: int,
        confidence_avg: float,
        measured_at: datetime,
        send_success: bool,
        model_name: str | None = None,
        image_size: int | None = None,
        confidence_threshold: float | None = None,
        processing_ms: int | None = None,
        boxes: list[DetectionBox] | None = None,
        annotated_image: str | None = None,
    ) -> None:
        with self._lock:
            self.last_customer_count = customer_count
            self.last_confidence_avg = confidence_avg
            self.last_measured_at = measured_at
            self.last_send_success = send_success
            self.model_name = model_name
            self.image_size = image_size
            self.confidence_threshold = confidence_threshold
            self.processing_ms = processing_ms
            self.boxes = boxes or []
            self.annotated_image = annotated_image
            self.last_error = None
            self.status_message = "sample processed"

    def mark_error(self, error: str) -> None:
        with self._lock:
            self.last_error = error
            self.status_message = "error"

    def mark_stopped(self, message: str = "stopped") -> None:
        with self._lock:
            self.running = False
            self.worker = None
            self.stop_event.set()
            self.status_message = message

    def snapshot(self) -> CameraStatusResponse:
        with self._lock:
            return CameraStatusResponse(
                running=self.running,
                storeId=self.store_id,
                cameraId=self.camera_id,
                lastCustomerCount=self.last_customer_count,
                lastConfidenceAvg=self.last_confidence_avg,
                lastMeasuredAt=self.last_measured_at,
                lastSendSuccess=self.last_send_success,
                lastError=self.last_error,
                statusMessage=self.status_message,
                modelName=self.model_name,
                imageSize=self.image_size,
                confidenceThreshold=self.confidence_threshold,
                processingMs=self.processing_ms,
                boxes=self.boxes,
                annotatedImage=self.annotated_image,
            )


inference_state = InferenceState()
