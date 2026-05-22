from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    model_path: str = "models/yolo11s.pt"
    model_name: str = "yolo11s"
    confidence_threshold: float = 0.35
    spring_congestion_url: str = "http://127.0.0.1:8080/api/ai/congestion"
    spring_api_key: str = "shiftops-ai-secret"
    send_to_spring: bool = False
    max_frame_retries: int = 3


settings = Settings()
