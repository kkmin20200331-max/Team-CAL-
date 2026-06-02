from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.request import CameraStartRequest
from app.services.inference_service import inference_service

router = APIRouter(prefix="/camera", tags=["camera"])


@router.post("/start")
def start_camera(request: CameraStartRequest):
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
