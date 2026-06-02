from abc import ABC, abstractmethod


class VideoSource(ABC):
    @abstractmethod
    def open(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def read_sample(self, sample_index: int, interval_sec: int):
        raise NotImplementedError

    @abstractmethod
    def close(self) -> None:
        raise NotImplementedError
