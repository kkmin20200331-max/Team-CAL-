from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CameraStartResponse(BaseModel):
    running: bool
    storeId: int
    cameraId: str
    intervalSec: int
    message: str


class CameraStatusResponse(BaseModel):
    running: bool
    storeId: Optional[int] = None
    cameraId: Optional[str] = None
    lastCustomerCount: Optional[int] = None
    lastConfidenceAvg: Optional[float] = None
    lastMeasuredAt: Optional[datetime] = None
    lastSendSuccess: Optional[bool] = None
    lastError: Optional[str] = None
    statusMessage: Optional[str] = None
    modelName: Optional[str] = None
    imageSize: Optional[int] = None
    confidenceThreshold: Optional[float] = None
    processingMs: Optional[int] = None
    boxes: list["DetectionBox"] = Field(default_factory=list)
    annotatedImage: Optional[str] = None


class DetectionBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float


class DetectionResponse(BaseModel):
    storeId: int
    cameraId: str
    measuredAt: datetime
    customerCount: int
    confidenceAvg: float
    modelName: str
    imageSize: Optional[int] = None
    confidenceThreshold: Optional[float] = None
    sourceType: str
    processingMs: int
    status: str
    boxes: list[DetectionBox] = Field(default_factory=list)
    annotatedImage: Optional[str] = None
