from time import monotonic, sleep


class FrameSampler:
    def __init__(self, interval_sec: int) -> None:
        self.interval_sec = interval_sec
        self._next_at = monotonic()

    def wait_next(self, stop_event) -> bool:
        remaining = self._next_at - monotonic()
        if remaining > 0:
            stop_event.wait(remaining)
        if stop_event.is_set():
            return False
        self._next_at = monotonic() + self.interval_sec
        sleep(0)
        return True
