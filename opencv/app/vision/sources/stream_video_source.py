from threading import Lock, Thread
from typing import Any

from app.schemas.request import SourceType
from app.vision.sources.base import VideoSource


class StreamVideoSource(VideoSource):
    def __init__(self, source: str, source_type: SourceType) -> None:
        self.source = source
        self.source_type = source_type
        self.capture: Any = None
        self._latest_frame: Any = None
        self._lock = Lock()
        self._reader: Thread | None = None
        self._running = False

    def open(self) -> None:
        try:
            import cv2
        except ImportError as exc:
            raise RuntimeError("opencv-python is not installed. Run: pip install opencv-python") from exc

        source_value: int | str = self.source
        if self.source_type == SourceType.WEBCAM:
            source_value = int(self.source)

        self.capture = cv2.VideoCapture(source_value)
        if not self.capture.isOpened():
            raise RuntimeError(f"stream source could not be opened: {self.source}")

        self._running = True
        self._reader = Thread(target=self._read_latest_loop, daemon=True)
        self._reader.start()

    def read_sample(self, sample_index: int, interval_sec: int):
        del sample_index, interval_sec
        with self._lock:
            return None if self._latest_frame is None else self._latest_frame.copy()

    def close(self) -> None:
        self._running = False
        if self._reader and self._reader.is_alive():
            self._reader.join(timeout=1)
        if self.capture is not None:
            self.capture.release()
            self.capture = None

    def _read_latest_loop(self) -> None:
        while self._running and self.capture is not None:
            ok, frame = self.capture.read()
            if ok:
                with self._lock:
                    self._latest_frame = frame
