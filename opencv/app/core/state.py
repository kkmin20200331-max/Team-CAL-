from datetime import datetime
from threading import Event, Lock, Thread
from typing import Optional

from app.schemas.response import AggregatedCongestionResponse, CameraStatusResponse, DetectionBox, MetricsResponse


class InferenceState:
    def __init__(self) -> None:
        self._lock = Lock()
        self.stop_event = Event()
        self.worker: Optional[Thread] = None
        self.running = False
        self.store_id: Optional[str] = None
        self.camera_id: Optional[str] = None
        self.source: Optional[str] = None
        self.source_type: Optional[str] = None
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
        self.workers: Optional[int] = None
        self.queue_size = 0
        self.processed_frames = 0
        self.dropped_frames = 0
        self.total_processing_ms = 0
        self.last_send_at: Optional[datetime] = None
        self.boxes: list[DetectionBox] = []
        self.annotated_image: Optional[str] = None
        self.latest_aggregate: Optional[AggregatedCongestionResponse] = None

    def mark_started(
        self,
        store_id: str,
        camera_id: str,
        worker: Thread,
        source: str | None = None,
        source_type: str | None = None,
        model_name: str | None = None,
        image_size: int | None = None,
        confidence_threshold: float | None = None,
        workers: int | None = None,
    ) -> None:
        with self._lock:
            self.stop_event.clear()
            self.worker = worker
            self.running = True
            self.store_id = store_id
            self.camera_id = camera_id
            self.source = source
            self.source_type = source_type
            self.model_name = model_name
            self.image_size = image_size
            self.confidence_threshold = confidence_threshold
            self.processing_ms = None
            self.workers = workers
            self.queue_size = 0
            self.processed_frames = 0
            self.dropped_frames = 0
            self.total_processing_ms = 0
            self.last_send_at = None
            self.boxes = []
            self.annotated_image = None
            self.latest_aggregate = None
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
            self.processed_frames += 1
            if processing_ms is not None:
                self.total_processing_ms += processing_ms
            self.boxes = boxes or []
            self.annotated_image = annotated_image
            self.last_error = None
            self.status_message = "sample processed"

    def mark_queue_size(self, queue_size: int) -> None:
        with self._lock:
            self.queue_size = queue_size

    def mark_dropped_frame(self) -> None:
        with self._lock:
            self.dropped_frames += 1

    def mark_send_result(self, send_success: bool, sent_at: datetime | None = None) -> None:
        with self._lock:
            self.last_send_success = send_success
            self.last_send_at = sent_at or datetime.now()

    def mark_aggregate(self, aggregate: AggregatedCongestionResponse) -> None:
        with self._lock:
            self.latest_aggregate = aggregate

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
            avg_processing_ms = (
                round(self.total_processing_ms / self.processed_frames, 2) if self.processed_frames else None
            )
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
                workers=self.workers,
                queueSize=self.queue_size,
                processedFrames=self.processed_frames,
                droppedFrames=self.dropped_frames,
                avgProcessingMs=avg_processing_ms,
                lastSendAt=self.last_send_at,
                boxes=self.boxes,
                annotatedImage=self.annotated_image,
            )

    def metrics(self) -> MetricsResponse:
        with self._lock:
            avg_processing_ms = (
                round(self.total_processing_ms / self.processed_frames, 2) if self.processed_frames else None
            )
            return MetricsResponse(
                running=self.running,
                workers=self.workers or 0,
                queueSize=self.queue_size,
                processedFrames=self.processed_frames,
                droppedFrames=self.dropped_frames,
                avgProcessingMs=avg_processing_ms,
                lastCustomerCount=self.last_customer_count,
                lastConfidenceAvg=self.last_confidence_avg,
                lastMeasuredAt=self.last_measured_at,
                lastSendSuccess=self.last_send_success,
                lastSendAt=self.last_send_at,
            )

    def aggregate_latest(self) -> Optional[AggregatedCongestionResponse]:
        with self._lock:
            return self.latest_aggregate


inference_state = InferenceState()
