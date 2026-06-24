from concurrent.futures import FIRST_COMPLETED, Future, ThreadPoolExecutor, wait
from dataclasses import dataclass, field
from datetime import datetime
from threading import Lock, Thread, local
from time import sleep

from app.core.config import settings
from app.core.logger import get_logger
from app.core.state import inference_state
from app.schemas.request import CameraStartRequest, SourceType
from app.schemas.response import AggregatedCongestionResponse, AggregatedSample, CameraStartResponse, DetectionResponse
from app.services.spring_client import spring_client
from app.vision.frame_sampler import FrameSampler
from app.vision.person_detector import PersonDetector
from app.vision.sources import create_video_source
from app.vision.sources.base import VideoSource

logger = get_logger(__name__)


@dataclass
class AggregationBucket:
    interval_sec: int
    target_sample_count: int
    samples: list[DetectionResponse] = field(default_factory=list)

    def add(self, payload: DetectionResponse) -> AggregatedCongestionResponse | None:
        self.samples.append(payload)
        if len(self.samples) >= self.target_sample_count:
            return self.flush()
        return None

    def flush(self) -> AggregatedCongestionResponse | None:
        if not self.samples:
            return None

        customer_counts = [sample.customerCount for sample in self.samples]
        confidence_values = [sample.confidenceAvg for sample in self.samples]
        processing_values = [sample.processingMs for sample in self.samples]
        first_sample = self.samples[0]
        last_sample = self.samples[-1]
        summary = AggregatedCongestionResponse(
            storeId=last_sample.storeId,
            cameraId=last_sample.cameraId,
            measuredAt=last_sample.measuredAt,
            windowStartAt=first_sample.measuredAt,
            windowEndAt=last_sample.measuredAt,
            intervalSec=self.interval_sec,
            avgCustomerCount=round(sum(customer_counts) / len(customer_counts), 2),
            maxCustomerCount=max(customer_counts),
            minCustomerCount=min(customer_counts),
            lastCustomerCount=last_sample.customerCount,
            sampleCount=len(self.samples),
            confidenceAvg=round(sum(confidence_values) / len(confidence_values), 4),
            processingMsAvg=round(sum(processing_values) / len(processing_values), 2),
            processedFrames=len(self.samples),
            droppedFrames=0,
            modelName=last_sample.modelName,
            imageSize=last_sample.imageSize,
            confidenceThreshold=last_sample.confidenceThreshold,
            sourceType=last_sample.sourceType,
            status="SUCCESS",
            samples=[
                AggregatedSample(
                    measuredAt=sample.measuredAt,
                    customerCount=sample.customerCount,
                    confidenceAvg=sample.confidenceAvg,
                    processingMs=sample.processingMs,
                )
                for sample in self.samples
            ],
        )
        self.samples = []
        return summary


class InferenceService:
    def __init__(self) -> None:
        self.detector = PersonDetector()
        self._worker_local = local()
        self._active_source: VideoSource | None = None
        self._source_lock = Lock()

    def start(self, request: CameraStartRequest) -> CameraStartResponse:
        if inference_state.snapshot().running:
            raise RuntimeError("inference loop is already running")

        worker = Thread(target=self._run_loop, args=(request,), daemon=True)
        inference_state.mark_started(
            request.storeId,
            request.cameraId,
            worker,
            source=request.source,
            source_type=request.sourceType.value,
            model_name=request.modelName,
            image_size=request.imageSize,
            confidence_threshold=request.confidence,
            workers=max(1, settings.inference_workers),
        )
        worker.start()
        return CameraStartResponse(
            running=True,
            storeId=request.storeId,
            cameraId=request.cameraId,
            intervalSec=request.intervalSec,
            aggregationIntervalSec=request.aggregationIntervalSec,
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

    def metrics(self):
        metrics = inference_state.metrics()
        if settings.send_to_spring:
            metrics.senderQueuePending = spring_client.pending_count()
            metrics.senderQueueFailed = spring_client.failed_count()
        return metrics

    def preview_stream(self):
        snapshot = inference_state.snapshot()
        if not snapshot.running:
            raise RuntimeError("camera is not running")

        source_type = inference_state.source_type
        if source_type == SourceType.VIDEO_FILE.value:
            return self._file_preview_stream(inference_state.source or "")
        return self._live_preview_stream()

    def infer_image_bytes(
        self,
        image_bytes: bytes,
        store_id: str,
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
        annotated_image = self._annotate_frame(image, detection.boxes) if settings.include_image_annotated_image else None

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
        video_source = create_video_source(request.source, request.sourceType)
        sampler = FrameSampler(request.intervalSec)
        retry_count = 0
        sample_index = 0
        pending: set[Future] = set()
        target_sample_count = max(1, -(-request.aggregationIntervalSec // request.intervalSec))
        aggregation_bucket = AggregationBucket(
            interval_sec=request.aggregationIntervalSec,
            target_sample_count=target_sample_count,
        )

        try:
            video_source.open()
            with self._source_lock:
                self._active_source = video_source
            self.detector.load(request.modelName)
            logger.info("[CAMERA] source connected: %s", request.source)
            stop_message = "stopped"

            with ThreadPoolExecutor(max_workers=max(1, settings.inference_workers)) as executor:
                while self._should_sample_next(request, sampler):
                    frame = self._read_sample_frame(video_source, request, sample_index)
                    if frame is None:
                        if request.sourceType == SourceType.VIDEO_FILE:
                            logger.info("[CAMERA] video finished: %s", request.source)
                            stop_message = "video ended"
                            break
                        retry_count += 1
                        inference_state.mark_dropped_frame()
                        if retry_count >= settings.max_frame_retries:
                            raise RuntimeError("frame read failed after max retries")
                        logger.error("[ERROR] frame read failed. retry=%s/%s", retry_count, settings.max_frame_retries)
                        continue

                    retry_count = 0
                    sample_index += 1
                    pending.add(executor.submit(self._process_frame, request, frame))
                    inference_state.mark_queue_size(len(pending))
                    logger.info("[CAMERA] sample queued: index=%s pending=%s", sample_index, len(pending))

                    if len(pending) >= max(1, settings.max_pending_frames):
                        pending = self._drain_completed(
                            pending,
                            wait_for_one=True,
                            aggregation_bucket=aggregation_bucket,
                        )
                    else:
                        pending = self._drain_completed(
                            pending,
                            wait_for_one=False,
                            aggregation_bucket=aggregation_bucket,
                        )

                while pending and not inference_state.stop_event.is_set():
                    pending = self._drain_completed(pending, wait_for_one=True, aggregation_bucket=aggregation_bucket)
                summary = aggregation_bucket.flush()
                if summary is not None:
                    self._send_aggregate(summary)
        except Exception as exc:
            inference_state.mark_error(str(exc))
            logger.error("[ERROR] inference loop failed: %s", exc)
        finally:
            with self._source_lock:
                if self._active_source is video_source:
                    self._active_source = None
            video_source.close()
            inference_state.mark_stopped(stop_message if "stop_message" in locals() else "stopped")

    def _live_preview_stream(self):
        frame_delay = 1 / max(1, settings.preview_stream_fps)
        while inference_state.snapshot().running and not inference_state.stop_event.is_set():
            with self._source_lock:
                source = self._active_source
            frame = source.latest_frame() if hasattr(source, "latest_frame") else None
            if frame is None:
                sleep(frame_delay)
                continue
            yield self._encode_mjpeg_frame(frame)
            sleep(frame_delay)

    def _file_preview_stream(self, source: str):
        try:
            import cv2
        except ImportError as exc:
            raise RuntimeError("opencv-python is required for preview streaming") from exc

        capture = cv2.VideoCapture(source)
        if not capture.isOpened():
            raise RuntimeError(f"video file could not be opened: {source}")

        try:
            fps = capture.get(cv2.CAP_PROP_FPS) or settings.preview_stream_fps
            frame_delay = 1 / max(1, min(settings.preview_stream_fps, int(fps) or settings.preview_stream_fps))
            while inference_state.snapshot().running and not inference_state.stop_event.is_set():
                ok, frame = capture.read()
                if not ok:
                    capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                yield self._encode_mjpeg_frame(frame)
                sleep(frame_delay)
        finally:
            capture.release()

    def _should_sample_next(self, request: CameraStartRequest, sampler: FrameSampler) -> bool:
        if inference_state.stop_event.is_set():
            return False
        if request.sourceType == SourceType.VIDEO_FILE:
            return True
        return sampler.wait_next(inference_state.stop_event)

    def _read_sample_frame(self, video_source: VideoSource, request: CameraStartRequest, sample_index: int):
        return video_source.read_sample(sample_index, request.intervalSec)

    def _process_frame(self, request: CameraStartRequest, frame) -> DetectionResponse:
        detector = self._thread_detector()
        detection = detector.detect(
            frame,
            model_name=request.modelName,
            image_size=request.imageSize,
            confidence_threshold=request.confidence,
        )
        annotated_image = self._annotate_frame(frame, detection.boxes) if settings.include_camera_annotated_image else None
        return self._build_payload(
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

    def _thread_detector(self) -> PersonDetector:
        detector = getattr(self._worker_local, "detector", None)
        if detector is None:
            detector = PersonDetector()
            self._worker_local.detector = detector
        return detector

    def _drain_completed(
        self,
        pending: set[Future],
        wait_for_one: bool,
        aggregation_bucket: AggregationBucket,
    ) -> set[Future]:
        if not pending:
            return pending

        if wait_for_one:
            done, remaining = wait(pending, return_when=FIRST_COMPLETED)
        else:
            done = {future for future in pending if future.done()}
            remaining = pending - done

        for future in done:
            payload = self._handle_frame_result(future)
            summary = aggregation_bucket.add(payload)
            if summary is not None:
                self._send_aggregate(summary)
        inference_state.mark_queue_size(len(remaining))
        return remaining

    def _handle_frame_result(self, future: Future) -> DetectionResponse:
        payload = future.result()
        inference_state.mark_result(
            customer_count=payload.customerCount,
            confidence_avg=payload.confidenceAvg,
            measured_at=payload.measuredAt,
            send_success=inference_state.snapshot().lastSendSuccess or False,
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
        return payload

    def _send_aggregate(self, summary: AggregatedCongestionResponse) -> None:
        summary.droppedFrames = inference_state.metrics().droppedFrames
        inference_state.mark_aggregate(summary)
        send_success = spring_client.send_congestion(summary)
        inference_state.mark_send_result(send_success, summary.measuredAt)
        logger.info(
            "[AGGREGATE] measuredAt=%s avg=%s max=%s min=%s samples=%s sent=%s",
            summary.measuredAt.isoformat(),
            summary.avgCustomerCount,
            summary.maxCustomerCount,
            summary.minCustomerCount,
            summary.sampleCount,
            send_success,
        )

    def _build_payload(
        self,
        store_id: str,
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

    def _encode_mjpeg_frame(self, frame) -> bytes:
        try:
            import cv2
        except ImportError as exc:
            raise RuntimeError("opencv-python is required for preview streaming") from exc

        ok, encoded = cv2.imencode(
            ".jpg",
            frame,
            [int(cv2.IMWRITE_JPEG_QUALITY), int(settings.preview_jpeg_quality)],
        )
        if not ok:
            raise RuntimeError("preview frame could not be encoded")
        return (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n"
            b"Cache-Control: no-cache\r\n\r\n"
            + encoded.tobytes()
            + b"\r\n"
        )


inference_service = InferenceService()
