from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


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
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    storeId: int = Field(validation_alias=AliasChoices("storeId", "store_id"))
    storeName: str | None = Field(default=None, validation_alias=AliasChoices("storeName", "store_name"))
    storeType: str = Field(default="OTHER", validation_alias=AliasChoices("storeType", "store_type"))
    storeTypeLabel: str | None = Field(default=None, validation_alias=AliasChoices("storeTypeLabel", "store_type_label"))
    date: str | None = None
    current: dict[str, Any] = Field(default_factory=dict)
    cameraAggregates: list[dict[str, Any]] = Field(
        default_factory=list,
        validation_alias=AliasChoices("cameraAggregates", "camera_aggregates"),
    )
    historicalBaseline: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("historicalBaseline", "historical_baseline"),
    )
    pos: dict[str, Any] = Field(default_factory=dict)
    staffSchedule: list[dict[str, Any]] = Field(
        default_factory=list,
        validation_alias=AliasChoices("staffSchedule", "staff_schedule"),
    )
    externalFactors: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("externalFactors", "external_factors"),
    )
