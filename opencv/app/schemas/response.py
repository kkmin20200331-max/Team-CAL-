from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CameraStartResponse(BaseModel):
    running: bool
    # Java 백엔드와 같은 문자열 store_id를 응답에도 유지합니다.
    storeId: str
    cameraId: str
    intervalSec: int
    aggregationIntervalSec: int
    message: str


class CameraStatusResponse(BaseModel):
    running: bool
    # 실행 중인 카메라가 연결된 문자열 매장 ID입니다.
    storeId: Optional[str] = None
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
    # 혼잡도 payload는 Spring의 OpenCvCongestionPayloadVO.storeId(String)와 매칭됩니다.
    storeId: str
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


class AggregatedSample(BaseModel):
    measuredAt: datetime
    customerCount: int
    confidenceAvg: float
    processingMs: int


class AggregatedCongestionResponse(BaseModel):
    # 집계 payload도 개별 감지 payload와 같은 문자열 매장 ID를 사용합니다.
    storeId: str
    cameraId: str
    measuredAt: datetime
    windowStartAt: datetime
    windowEndAt: datetime
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
    samples: list[AggregatedSample] = Field(default_factory=list)


class MetricsResponse(BaseModel):
    running: bool
    workers: int
    queueSize: int
    senderQueuePending: int = 0
    senderQueueFailed: int = 0
    processedFrames: int
    droppedFrames: int
    avgProcessingMs: Optional[float] = None
    lastCustomerCount: Optional[int] = None
    lastConfidenceAvg: Optional[float] = None
    lastMeasuredAt: Optional[datetime] = None
    lastSendSuccess: Optional[bool] = None
    lastSendAt: Optional[datetime] = None
