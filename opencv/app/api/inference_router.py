from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.core.config import settings
from app.services.inference_service import inference_service

router = APIRouter(prefix="/inference", tags=["inference"])


@router.post("/image")
async def infer_image(
    # Spring/Oracle store.id와 동일하게 문자열 매장 ID를 그대로 전달합니다.
    storeId: str = Query(..., min_length=1),
    cameraId: str = "IMAGE-UPLOAD",
    modelName: str = Query(settings.default_model_name, pattern="^(yolo11s|yolov8[ns])$"),
    imageSize: int = Query(640, ge=320, le=1280),
    confidence: float = Query(0.3, ge=0.01, le=1.0),
    image: UploadFile = File(...),
):
    content = await image.read()
    try:
        return inference_service.infer_image_bytes(
            image_bytes=content,
            store_id=storeId,
            camera_id=cameraId,
            model_name=modelName,
            image_size=imageSize,
            confidence_threshold=confidence,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
