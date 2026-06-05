from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CameraStartResponse(BaseModel):
    running: bool
    storeId: int
    cameraId: str
    intervalSec: int
    aggregationIntervalSec: int
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
    workers: Optional[int] = None
    queueSize: int = 0
    processedFrames: int = 0
    droppedFrames: int = 0
    avgProcessingMs: Optional[float] = None
    lastSendAt: Optional[datetime] = None
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


class AggregatedCongestionResponse(BaseModel):
    storeId: int
    cameraId: str
    measuredAt: datetime
    intervalSec: int
    avgCustomerCount: float
    maxCustomerCount: int
    minCustomerCount: int
    lastCustomerCount: int
    sampleCount: int
    confidenceAvg: float
    processingMsAvg: float
    processedFrames: int
    droppedFrames: int
    modelName: str
    imageSize: Optional[int] = None
    confidenceThreshold: Optional[float] = None
    sourceType: str
    status: str


class MetricsResponse(BaseModel):
    running: bool
    workers: int
    queueSize: int
    processedFrames: int
    droppedFrames: int
    avgProcessingMs: Optional[float] = None
    lastCustomerCount: Optional[int] = None
    lastConfidenceAvg: Optional[float] = None
    lastMeasuredAt: Optional[datetime] = None
    lastSendSuccess: Optional[bool] = None
    lastSendAt: Optional[datetime] = None
