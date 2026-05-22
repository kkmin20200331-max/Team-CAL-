from datetime import datetime
from threading import Thread

from app.core.config import settings
from app.core.logger import get_logger
from app.core.state import inference_state
from app.schemas.request import CameraStartRequest, SourceType
from app.schemas.response import CameraStartResponse, DetectionResponse
from app.services.spring_client import spring_client
from app.vision.camera_reader import CameraReader
from app.vision.frame_sampler import FrameSampler
from app.vision.person_detector import PersonDetector

logger = get_logger(__name__)


class InferenceService:
    def __init__(self) -> None:
        self.detector = PersonDetector()

    def start(self, request: CameraStartRequest) -> CameraStartResponse:
        if inference_state.snapshot().running:
            raise RuntimeError("inference loop is already running")

        worker = Thread(target=self._run_loop, args=(request,), daemon=True)
        inference_state.mark_started(
            request.storeId,
            request.cameraId,
            worker,
            model_name=request.modelName,
            image_size=request.imageSize,
            confidence_threshold=request.confidence,
        )
        worker.start()
        return CameraStartResponse(
            running=True,
            storeId=request.storeId,
            cameraId=request.cameraId,
            intervalSec=request.intervalSec,
            message="inference loop started",
        )

    def stop(self):
        inference_state.stop_event.set()
        worker = inference_state.worker
        if worker and worker.is_alive():
            worker.join(timeout=3)
        inference_state.mark_stopped("stopped by user")
        return {"running": False, "message": "inference loop stopped"}

    def status(self):
        return inference_state.snapshot()

    def infer_image_bytes(
        self,
        image_bytes: bytes,
        store_id: int,
        camera_id: str,
        model_name: str | None = None,
        image_size: int | None = None,
        confidence_threshold: float | None = None,
    ) -> DetectionResponse:
        try:
            import cv2
            import numpy as np
        except ImportError as exc:
            raise RuntimeError("opencv-python and numpy are required for image inference") from exc

        image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            raise RuntimeError("uploaded image could not be decoded")

        detection = self.detector.detect(
            image,
            model_name=model_name,
            image_size=image_size,
            confidence_threshold=confidence_threshold,
        )
        annotated_image = self._annotate_frame(image, detection.boxes)

        payload = self._build_payload(
            store_id=store_id,
            camera_id=camera_id,
            source_type="IMAGE",
            customer_count=detection.customer_count,
            confidence_avg=detection.confidence_avg,
            processing_ms=detection.processing_ms,
            model_name=detection.model_name,
            image_size=detection.image_size,
            confidence_threshold=detection.confidence_threshold,
            boxes=detection.boxes,
            annotated_image=annotated_image,
        )
        spring_client.send_congestion(payload)
        return payload

    def _run_loop(self, request: CameraStartRequest) -> None:
        reader = CameraReader(request.source, request.sourceType)
        sampler = FrameSampler(request.intervalSec)
        retry_count = 0
        sample_index = 0

        try:
            reader.open()
            logger.info("[CAMERA] source connected: %s", request.source)
            stop_message = "stopped"

            while self._should_sample_next(request, sampler):
                frame = self._read_sample_frame(reader, request, sample_index)
                if frame is None:
                    if request.sourceType == SourceType.VIDEO_FILE:
                        logger.info("[CAMERA] video finished: %s", request.source)
                        stop_message = "video ended"
                        break
                    retry_count += 1
                    if retry_count >= settings.max_frame_retries:
                        raise RuntimeError("frame read failed after max retries")
                    logger.error("[ERROR] frame read failed. retry=%s/%s", retry_count, settings.max_frame_retries)
                    continue

                retry_count = 0
                sample_index += 1
                detection = self.detector.detect(
                    frame,
                    model_name=request.modelName,
                    image_size=request.imageSize,
                    confidence_threshold=request.confidence,
                )
                annotated_image = self._annotate_frame(frame, detection.boxes)
                payload = self._build_payload(
                    store_id=request.storeId,
                    camera_id=request.cameraId,
                    source_type=request.sourceType.value,
                    customer_count=detection.customer_count,
                    confidence_avg=detection.confidence_avg,
                    processing_ms=detection.processing_ms,
                    model_name=detection.model_name,
                    image_size=detection.image_size,
                    confidence_threshold=detection.confidence_threshold,
                    boxes=detection.boxes,
                    annotated_image=annotated_image,
                )
                send_success = spring_client.send_congestion(payload)
                inference_state.mark_result(
                    customer_count=payload.customerCount,
                    confidence_avg=payload.confidenceAvg,
                    measured_at=payload.measuredAt,
                    send_success=send_success,
                    model_name=payload.modelName,
                    image_size=payload.imageSize,
                    confidence_threshold=payload.confidenceThreshold,
                    processing_ms=payload.processingMs,
                    boxes=payload.boxes,
                    annotated_image=payload.annotatedImage,
                )
                logger.info(
                    "[INFERENCE] measuredAt=%s count=%s confidenceAvg=%s processingMs=%s",
                    payload.measuredAt.isoformat(),
                    payload.customerCount,
                    payload.confidenceAvg,
                    payload.processingMs,
                )
        except Exception as exc:
            inference_state.mark_error(str(exc))
            logger.error("[ERROR] inference loop failed: %s", exc)
        finally:
            reader.close()
            inference_state.mark_stopped(stop_message if "stop_message" in locals() else "stopped")

    def _should_sample_next(self, request: CameraStartRequest, sampler: FrameSampler) -> bool:
        if inference_state.stop_event.is_set():
            return False
        if request.sourceType == SourceType.VIDEO_FILE:
            return True
        return sampler.wait_next(inference_state.stop_event)

    def _read_sample_frame(self, reader: CameraReader, request: CameraStartRequest, sample_index: int):
        if request.sourceType == SourceType.VIDEO_FILE:
            return reader.read_at_second(sample_index * request.intervalSec)
        return reader.read()

    def _build_payload(
        self,
        store_id: int,
        camera_id: str,
        source_type: str,
        customer_count: int,
        confidence_avg: float,
        processing_ms: int,
        model_name: str | None = None,
        image_size: int | None = None,
        confidence_threshold: float | None = None,
        boxes=None,
        annotated_image: str | None = None,
    ) -> DetectionResponse:
        return DetectionResponse(
            storeId=store_id,
            cameraId=camera_id,
            measuredAt=datetime.now(),
            customerCount=customer_count,
            confidenceAvg=confidence_avg,
            modelName=model_name or self.detector.model_name,
            imageSize=image_size,
            confidenceThreshold=confidence_threshold,
            sourceType=source_type,
            processingMs=processing_ms,
            status="SUCCESS",
            boxes=boxes or [],
            annotatedImage=annotated_image,
        )

    def _annotate_frame(self, frame, boxes) -> str:
        try:
            import base64

            import cv2
        except ImportError as exc:
            raise RuntimeError("opencv-python is required for annotated image output") from exc

        annotated_frame = frame.copy()
        for index, box in enumerate(boxes, start=1):
            cv2.rectangle(annotated_frame, (box.x1, box.y1), (box.x2, box.y2), (20, 184, 166), 2)
            label = f"person {index}: {box.confidence:.2f}"
            cv2.putText(
                annotated_frame,
                label,
                (box.x1, max(18, box.y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (20, 184, 166),
                2,
                cv2.LINE_AA,
            )

        ok, encoded_image = cv2.imencode(".jpg", annotated_frame)
        if not ok:
            raise RuntimeError("annotated image could not be encoded")
        return "data:image/jpeg;base64," + base64.b64encode(encoded_image).decode("ascii")


inference_service = InferenceService()
