from fastapi import APIRouter, Body, HTTPException

from app.schemas.schedule_generation import (
    ScheduleExplainRequest,
    ScheduleExplainResponse,
    ScheduleGenerationRequest,
    ScheduleGenerationResponse,
)
from app.services.schedule_generation_service import schedule_generation_service

router = APIRouter(prefix="/ai-schedules", tags=["ai-schedules"])


@router.post("/generate", response_model=ScheduleGenerationResponse)
def generate_schedule(request: ScheduleGenerationRequest = Body(...)):
    try:
        return schedule_generation_service.generate(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/explain", response_model=ScheduleExplainResponse)
def explain_schedule(request: ScheduleExplainRequest = Body(...)):
    try:
        return schedule_generation_service.explain(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
