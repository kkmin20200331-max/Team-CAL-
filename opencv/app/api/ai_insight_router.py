from fastapi import APIRouter, HTTPException

from app.schemas.ai_insight import AiInsightAnalyzeRequest, AiInsightResponse
from app.services.ai_insight_service import ai_insight_service

router = APIRouter(prefix="/ai-insights", tags=["ai-insights"])


@router.get("/rule-based", response_model=AiInsightResponse)
def rule_based_insight():
    return ai_insight_service.build_rule_based_insight()


@router.get("/dummy", response_model=AiInsightResponse)
def dummy_insight():
    return ai_insight_service.build_rule_based_insight(source="dummy")


@router.get("/samples")
def sample_names():
    return {"samples": ai_insight_service.list_samples()}


@router.get("/samples/{sample_name}/rule-based", response_model=AiInsightResponse)
def sample_rule_based_insight(sample_name: str):
    try:
        return ai_insight_service.build_sample_insight(sample_name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="sample not found") from exc


@router.get("/samples/{sample_name}/llm", response_model=AiInsightResponse)
def sample_llm_insight(sample_name: str):
    try:
        return ai_insight_service.build_sample_llm_insight(sample_name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="sample not found") from exc


@router.get("/llm", response_model=AiInsightResponse)
def llm_insight():
    return ai_insight_service.build_llm_insight()


@router.post("/analyze", response_model=AiInsightResponse)
def analyze_insight(request: AiInsightAnalyzeRequest):
    try:
        return ai_insight_service.analyze(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/analyze/llm", response_model=AiInsightResponse)
def analyze_llm_insight(request: AiInsightAnalyzeRequest):
    try:
        return ai_insight_service.analyze_with_llm(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
