from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Body, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from app.core.state import inference_state
from app.core.config import settings
from app.schemas.request import CameraStartRequest, SourceType
from app.services.inference_service import inference_service

router = APIRouter(prefix="/camera", tags=["camera"])


@router.post("/start")
def start_camera(
    request: CameraStartRequest | None = Body(default=None),
    storeId: str | None = Query(default=None, min_length=1),
    cameraId: str | None = Query(default=None),
    source: str | None = Query(default=None),
    sourceType: SourceType = SourceType.WEBCAM,
    intervalSec: int = Query(default=5, ge=1, le=3600),
    aggregationIntervalSec: int = Query(default=60, ge=1, le=3600),
    modelName: str = Query(default_factory=lambda: settings.default_model_name, pattern="^(yolo11s|yolov8[ns])$"),
    imageSize: int = Query(default=640, ge=320, le=1280),
    confidence: float = Query(default=0.3, ge=0.01, le=1.0),
):
    if request is None:
        request = CameraStartRequest(
            storeId=storeId or "1",
            cameraId=cameraId or "CAM-001",
            source=source or "0",
            sourceType=sourceType,
            intervalSec=intervalSec,
            aggregationIntervalSec=aggregationIntervalSec,
            modelName=modelName,
            imageSize=imageSize,
            confidence=confidence,
        )
    try:
        return inference_service.start(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/stop")
def stop_camera():
    return inference_service.stop()


@router.get("/status")
def camera_status():
    return inference_service.status()


@router.get("/metrics")
def camera_metrics():
    return inference_service.metrics()


@router.get("/stream")
def camera_stream():
    try:
        return StreamingResponse(
            inference_service.preview_stream(),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/aggregate/latest")
def latest_aggregate():
    aggregate = inference_state.aggregate_latest()
    if aggregate is None:
        return {
            "available": False,
            "message": "aggregate summary is not available yet",
        }
    return {
        "available": True,
        "aggregate": aggregate,
    }


@router.post("/upload-video")
async def upload_video(video: UploadFile = File(...)):
    extension = Path(video.filename or "").suffix.lower()
    if extension not in {".mp4", ".mov", ".avi", ".mkv"}:
        raise HTTPException(status_code=400, detail="video file must be mp4, mov, avi, or mkv")

    upload_dir = Path("test_assets/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid4().hex}{extension}"
    output_path = upload_dir / safe_name
    content = await video.read()
    output_path.write_bytes(content)

    return {
        "filename": video.filename,
        "source": output_path.as_posix(),
        "bytes": len(content),
    }
