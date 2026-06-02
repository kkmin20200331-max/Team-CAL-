from typing import Any

from app.vision.sources.base import VideoSource


class FileVideoSource(VideoSource):
    def __init__(self, source: str) -> None:
        self.source = source
        self.capture: Any = None
        self._cv2: Any = None

    def open(self) -> None:
        try:
            import cv2
        except ImportError as exc:
            raise RuntimeError("opencv-python is not installed. Run: pip install opencv-python") from exc

        self._cv2 = cv2
        self.capture = cv2.VideoCapture(self.source)
        if not self.capture.isOpened():
            raise RuntimeError(f"video file could not be opened: {self.source}")

    def read_sample(self, sample_index: int, interval_sec: int):
        if self.capture is None or self._cv2 is None:
            raise RuntimeError("video file is not open")

        second = sample_index * interval_sec
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
