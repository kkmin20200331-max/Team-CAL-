from typing import Any

from app.schemas.request import SourceType


class CameraReader:
    def __init__(self, source: str, source_type: SourceType) -> None:
        self.source = source
        self.source_type = source_type
        self.capture: Any = None
        self._cv2: Any = None

    def open(self) -> None:
        try:
            import cv2
        except ImportError as exc:
            raise RuntimeError("opencv-python is not installed. Run: pip install opencv-python") from exc

        self._cv2 = cv2
        source_value: int | str = self.source
        if self.source_type == SourceType.WEBCAM:
            source_value = int(self.source)

        self.capture = cv2.VideoCapture(source_value)
        if not self.capture.isOpened():
            raise RuntimeError(f"camera source could not be opened: {self.source}")

    def read(self):
        if self.capture is None:
            raise RuntimeError("camera source is not open")
        ok, frame = self.capture.read()
        return frame if ok else None

    def read_at_second(self, second: int):
        if self.capture is None or self._cv2 is None:
            raise RuntimeError("camera source is not open")
        if self.source_type != SourceType.VIDEO_FILE:
            return self.read()

        duration_sec = self.duration_sec()
        if duration_sec is not None and second > duration_sec:
            return None

        self.capture.set(self._cv2.CAP_PROP_POS_MSEC, second * 1000)
        ok, frame = self.capture.read()
        return frame if ok else None

    def duration_sec(self) -> float | None:
        if self.capture is None or self._cv2 is None:
            return None
        frame_count = self.capture.get(self._cv2.CAP_PROP_FRAME_COUNT)
        fps = self.capture.get(self._cv2.CAP_PROP_FPS)
        if not frame_count or not fps:
            return None
        return frame_count / fps

    def close(self) -> None:
        if self.capture is not None:
            self.capture.release()
            self.capture = None
