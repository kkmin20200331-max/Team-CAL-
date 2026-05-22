from fastapi import APIRouter

from app.services.inference_service import inference_service

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok",
        "running": inference_service.status().running,
        "modelLoaded": inference_service.detector.is_loaded,
        "modelName": inference_service.detector.model_name,
    }
