import logging

from fastapi import APIRouter, Body, HTTPException

from app.schemas.ai_insight import AiInsightAnalyzeRequest, AiInsightResponse
from app.services.ai_insight_service import ai_insight_service

router = APIRouter(prefix="/ai-insights", tags=["ai-insights"])
logger = logging.getLogger(__name__)


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
def analyze_insight(request: AiInsightAnalyzeRequest | None = Body(default=None)):
    try:
        if request is None:
            request = _empty_request()
        return ai_insight_service.analyze(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("AI insight analyze failed")
        raise HTTPException(status_code=500, detail=f"AI insight analyze failed: {exc}") from exc


@router.post("/analyze/llm", response_model=AiInsightResponse)
def analyze_llm_insight(request: AiInsightAnalyzeRequest | None = Body(default=None)):
    try:
        if request is None:
            request = _empty_request()
        return ai_insight_service.analyze_with_llm(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("AI insight LLM analyze failed")
        raise HTTPException(status_code=500, detail=f"AI insight LLM analyze failed: {exc}") from exc


def _empty_request() -> AiInsightAnalyzeRequest:
    return AiInsightAnalyzeRequest(
        storeId=1,
        storeName="Store 1",
        storeType="OTHER",
        current={
            "currentCustomerCount": 0,
            "todayTotalVisitors": 0,
            "conversionRate": 0,
        },
        cameraAggregates=[],
        historicalBaseline={
            "sameDayAverageVisitors": 1,
            "averagePeakCustomerCount": 1,
        },
        pos={"conversionRate": 0},
        staffSchedule=[],
        externalFactors={"source": "empty-request-fallback"},
    )
