from typing import Any, Literal

from pydantic import BaseModel, Field


Severity = Literal["LOW", "MEDIUM", "HIGH"]
InsightType = Literal["STAFFING", "CONVERSION", "CONGESTION", "SCHEDULE"]
ScheduleStatus = Literal["NORMAL", "WATCH", "URGENT"]


class AiInsightContext(BaseModel):
    storeId: int
    storeName: str
    storeType: str
    storeTypeLabel: str | None = None


class CalendarContext(BaseModel):
    date: str | None = None
    dayOfWeek: str | None = None
    isWeekend: bool = False
    isHoliday: bool = False
    holidayName: str | None = None
    season: Literal["SPRING", "SUMMER", "AUTUMN", "WINTER"] | None = None
    month: int | None = None


class AiInsightSummary(BaseModel):
    overallStatus: str
    mainMessage: str
    riskLevel: Severity


class AiInsightCard(BaseModel):
    id: str
    type: InsightType
    severity: Severity
    badge: str
    title: str
    message: str
    actionLabel: str
    reason: str


class ScheduleRecommendation(BaseModel):
    timeRange: str
    currentStaff: int
    recommendedStaff: int
    recommendedExtraStaff: int
    recommendedRole: str | None = None
    roleLabel: str | None = None
    roleReason: str | None = None
    status: ScheduleStatus
    reason: str


class OperationMetrics(BaseModel):
    congestionLevel: Severity
    staffingRisk: Severity
    conversionStatus: Literal["LOW", "NORMAL", "GOOD"]
    scheduleFit: Literal["GOOD", "NEEDS_IMPROVEMENT"]
    waitingRisk: Severity


class AiInsightFeatures(BaseModel):
    peakTime: str
    peakCustomerCount: int
    worstStaffingTime: str
    customersPerStaff: float
    recommendedExtraStaff: int
    todayTotalVisitors: int
    sameDayAverageVisitors: int
    visitorIncreaseRate: float
    conversionRate: int
    lowConversionTime: str | None = None
    lowConversionRate: int | None = None


class AiInsightResponse(BaseModel):
    context: AiInsightContext
    calendarContext: CalendarContext
    summary: AiInsightSummary
    insights: list[AiInsightCard] = Field(default_factory=list)
    scheduleRecommendations: list[ScheduleRecommendation] = Field(default_factory=list)
    operationMetrics: OperationMetrics
    features: AiInsightFeatures
    source: Literal["rule-based", "dummy", "llm", "llm-fallback"] = "rule-based"


class AiInsightAnalyzeRequest(BaseModel):
    storeId: int
    storeName: str | None = None
    storeType: str = "OTHER"
    storeTypeLabel: str | None = None
    date: str | None = None
    current: dict[str, Any]
    cameraAggregates: list[dict[str, Any]]
    historicalBaseline: dict[str, Any]
    pos: dict[str, Any]
    staffSchedule: list[dict[str, Any]] = Field(default_factory=list)
    externalFactors: dict[str, Any] = Field(default_factory=dict)
