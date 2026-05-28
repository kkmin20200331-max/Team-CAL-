from dataclasses import dataclass
from pathlib import Path
from time import perf_counter
from typing import Any

from app.core.config import settings
from app.schemas.response import DetectionBox


@dataclass
class DetectionResult:
    customer_count: int
    confidence_avg: float
    processing_ms: int
    boxes: list[DetectionBox]
    model_name: str
    image_size: int | None
    confidence_threshold: float


class PersonDetector:
    def __init__(self) -> None:
        self._models: dict[str, Any] = {}
        self.model_name = settings.default_model_name

    @property
    def is_loaded(self) -> bool:
        return bool(self._models)

    def load(self, model_name: str | None = None):
        resolved_model_name = Path(model_name or settings.default_model_name).stem
        if resolved_model_name in self._models:
            self.model_name = resolved_model_name
            return self._models[resolved_model_name]
        try:
            from ultralytics import YOLO
        except ImportError as exc:
            raise RuntimeError("ultralytics is not installed. Run: pip install ultralytics") from exc

        model_path = Path("models") / f"{resolved_model_name}.pt"
        configured_path = Path(settings.model_path)
        configured_yolo_model = Path(settings.yolo_model)
        if configured_yolo_model.exists() and resolved_model_name == configured_yolo_model.stem:
            selected_model = configured_yolo_model
        elif configured_path.exists() and resolved_model_name == Path(settings.model_path).stem:
            selected_model = configured_path
        elif model_path.exists():
            selected_model = model_path
        elif resolved_model_name == settings.default_model_name:
            selected_model = configured_yolo_model
        else:
            selected_model = Path(f"{resolved_model_name}.pt")

        self._models[resolved_model_name] = YOLO(str(selected_model))
        self.model_name = resolved_model_name
        return self._models[resolved_model_name]

    def detect(
        self,
        frame,
        model_name: str | None = None,
        image_size: int | None = None,
        confidence_threshold: float | None = None,
    ) -> DetectionResult:
        resolved_model_name = Path(model_name or settings.default_model_name).stem
        resolved_image_size = image_size
        resolved_confidence = confidence_threshold or settings.confidence_threshold
        model = self.load(resolved_model_name)
        started_at = perf_counter()
        predict_args: dict[str, Any] = {
            "verbose": False,
            "conf": resolved_confidence,
        }
        if resolved_image_size:
            predict_args["imgsz"] = resolved_image_size

        results = model(frame, **predict_args)
        detected_boxes: list[DetectionBox] = []

        for result in results:
            boxes = getattr(result, "boxes", None)
            if boxes is None:
                continue
            for box in boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                if class_id == 0 and confidence >= resolved_confidence:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    detected_boxes.append(
                        DetectionBox(
                            x1=round(x1),
                            y1=round(y1),
                            x2=round(x2),
                            y2=round(y2),
                            confidence=round(confidence, 4),
                        )
                    )

        processing_ms = round((perf_counter() - started_at) * 1000)
        confidences = [box.confidence for box in detected_boxes]
        confidence_avg = round(sum(confidences) / len(confidences), 4) if confidences else 0.0
        return DetectionResult(
            customer_count=len(detected_boxes),
            confidence_avg=confidence_avg,
            processing_ms=processing_ms,
            boxes=detected_boxes,
            model_name=resolved_model_name,
            image_size=resolved_image_size,
            confidence_threshold=resolved_confidence,
        )
