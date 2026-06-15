from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    yolo_model: str = "yolo11s.pt"
    model_path: str = "models/yolo11s.pt"
    model_name: str = "yolo11s"
    confidence_threshold: float = 0.35
    spring_congestion_url: str = "http://127.0.0.1:8080/api/ai/congestion"
    spring_api_key: str = "shiftops-ai-secret"
    send_to_spring: bool = False
    max_frame_retries: int = 3
    inference_workers: int = 2
    max_pending_frames: int = 20
    sender_queue_max_size: int = 100
    sender_queue_db: str = "logs/sender_queue.sqlite3"
    sender_poll_interval_sec: float = 1.0
    include_aggregate_samples: bool = True
    include_camera_annotated_image: bool = True
    include_image_annotated_image: bool = True
    preview_stream_fps: int = 12
    preview_jpeg_quality: int = 75
    spring_send_retry: int = 3
    spring_send_timeout_sec: float = 3.0
    failed_payload_log: str = "logs/failed_payloads.log"
    llm_provider: str = "none"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    llm_timeout_sec: float = 20.0

    @property
    def default_model_name(self) -> str:
        return Path(self.yolo_model).stem if self.yolo_model else self.model_name


settings = Settings()
