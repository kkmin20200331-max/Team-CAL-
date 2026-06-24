from enum import StrEnum

from pydantic import BaseModel, Field

from app.core.config import settings


class SourceType(StrEnum):
    VIDEO_FILE = "VIDEO_FILE"
    WEBCAM = "WEBCAM"
    RTSP = "RTSP"


class CameraStartRequest(BaseModel):
    storeId: str = Field(..., min_length=1)
    cameraId: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    sourceType: SourceType = SourceType.VIDEO_FILE
    intervalSec: int = Field(10, ge=1, le=3600)
    aggregationIntervalSec: int = Field(60, ge=1, le=3600)
    modelName: str = Field(default_factory=lambda: settings.default_model_name)
    imageSize: int = Field(640, ge=320, le=1280)
    confidence: float = Field(0.3, ge=0.01, le=1.0)
