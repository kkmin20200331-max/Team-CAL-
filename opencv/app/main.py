from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.ai_insight_router import router as ai_insight_router
from app.api.camera_router import router as camera_router
from app.api.health_router import router as health_router
from app.api.inference_router import router as inference_router
from app.api.java_compat_router import router as java_compat_router
from app.core.config import settings
from app.services.spring_client import spring_client


app = FastAPI(
    title="ShiftOps AI Server",
    description="OpenCV/FastAPI server for YOLO person counting and Spring Boot delivery",
    version="0.1.0",
)

app.include_router(health_router)
app.include_router(ai_insight_router, prefix="/api/v1")
app.include_router(camera_router, prefix="/api/v1")
app.include_router(inference_router, prefix="/api/v1")
app.include_router(java_compat_router)
app.mount("/web", StaticFiles(directory="app/web"), name="web")


@app.on_event("startup")
def start_background_services():
    spring_client.start()


@app.get("/")
def root():
    return {
        "message": "ShiftOps AI server is running",
        "docs": "http://127.0.0.1:8000/docs",
        "experiment": "http://127.0.0.1:8000/experiment",
        "springEndpoint": settings.spring_congestion_url,
    }


@app.get("/experiment", include_in_schema=False)
def experiment_page():
    return FileResponse("app/web/index.html")
