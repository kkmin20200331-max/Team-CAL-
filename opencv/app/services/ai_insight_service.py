import json
from datetime import date
from math import ceil
from pathlib import Path
from typing import Any

from app.schemas.ai_insight import (
    AiInsightCard,
    AiInsightAnalyzeRequest,
    AiInsightContext,
    AiInsightFeatures,
    AiInsightResponse,
    AiInsightSummary,
    CalendarContext,
    OperationMetrics,
    ScheduleRecommendation,
)
from app.services.llm_client import llm_client


class AiInsightService:
    def __init__(self, dummy_path: Path | None = None) -> None:
        self.dummy_path = dummy_path or Path("app/data/customer_analysis_dummy.json")
        self.sample_dir = Path("app/data/ai_insight_samples")

    def build_rule_based_insight(self, data: dict[str, Any] | None = None, source: str = "rule-based") -> AiInsightResponse:
        payload = data or self.load_dummy_data()
        features = self.build_features(payload)
        return self._build_response(payload, features, source=source)

    def analyze(self, request: AiInsightAnalyzeRequest) -> AiInsightResponse:
        return self.build_rule_based_insight(request.model_dump(), source="rule-based")

    def build_llm_insight(self, data: dict[str, Any] | None = None) -> AiInsightResponse:
        payload = data or self.load_dummy_data()
        baseline = self.build_rule_based_insight(payload)
        if not llm_client.is_enabled():
            return self._with_source(baseline, "llm-fallback")

        try:
            llm_result = llm_client.generate_ai_insight(
                {
                    "storeContext": baseline.context.model_dump(),
                    "calendarContext": baseline.calendarContext.model_dump(),
                    "features": baseline.features.model_dump(),
                    "baselineResponse": baseline.model_dump(),
                    "rawData": payload,
                }
            )
            if llm_result is None:
                return self._with_source(baseline, "llm-fallback")
            llm_result = self._normalize_llm_result(llm_result, baseline)
            return AiInsightResponse.model_validate(
                {
                    **llm_result,
                    "context": baseline.context.model_dump(),
                    "calendarContext": baseline.calendarContext.model_dump(),
                    "features": baseline.features.model_dump(),
                    "source": "llm",
                }
            )
        except Exception:
            return self._with_source(baseline, "llm-fallback")

    def analyze_with_llm(self, request: AiInsightAnalyzeRequest) -> AiInsightResponse:
        return self.build_llm_insight(request.model_dump())

    def load_dummy_data(self) -> dict[str, Any]:
        with self.dummy_path.open("r", encoding="utf-8") as file:
            return json.load(file)

    def list_samples(self) -> list[str]:
        if not self.sample_dir.exists():
            return []
        return sorted(path.stem for path in self.sample_dir.glob("*.json"))

    def load_sample_data(self, sample_name: str) -> dict[str, Any]:
        if not sample_name.replace("_", "").replace("-", "").isalnum():
            raise FileNotFoundError(sample_name)
        sample_path = self.sample_dir / f"{sample_name}.json"
        if not sample_path.exists():
            raise FileNotFoundError(sample_name)
        with sample_path.open("r", encoding="utf-8") as file:
            return json.load(file)

    def build_sample_insight(self, sample_name: str) -> AiInsightResponse:
        return self.build_rule_based_insight(self.load_sample_data(sample_name), source="dummy")

    def build_sample_llm_insight(self, sample_name: str) -> AiInsightResponse:
        return self.build_llm_insight(self.load_sample_data(sample_name))

    def _with_source(self, response: AiInsightResponse, source: str) -> AiInsightResponse:
        data = response.model_dump()
        data["source"] = source
        return AiInsightResponse.model_validate(data)

    def _normalize_llm_result(self, llm_result: dict[str, Any], baseline: AiInsightResponse) -> dict[str, Any]:
        normalized = dict(llm_result)
        baseline_data = baseline.model_dump()
        for key in ("summary", "insights", "operationMetrics"):
            if key not in normalized or normalized[key] is None:
                normalized[key] = baseline_data[key]

        baseline_schedules = [item.model_dump() for item in baseline.scheduleRecommendations]
        llm_schedules = normalized.get("scheduleRecommendations") or []
        merged_schedules = []
        for index, baseline_schedule in enumerate(baseline_schedules):
            llm_schedule = llm_schedules[index] if index < len(llm_schedules) and isinstance(llm_schedules[index], dict) else {}
            merged_schedule = {
                **baseline_schedule,
                **llm_schedule,
                "timeRange": baseline_schedule["timeRange"],
                "currentStaff": baseline_schedule["currentStaff"],
                "recommendedStaff": baseline_schedule["recommendedStaff"],
                "recommendedExtraStaff": baseline_schedule["recommendedExtraStaff"],
                "status": baseline_schedule["status"],
            }
            merged_schedules.append(merged_schedule)
        normalized["scheduleRecommendations"] = merged_schedules
        return normalized

    def build_features(self, data: dict[str, Any]) -> AiInsightFeatures:
        camera_rows = [self._normalize_camera_row(row) for row in data.get("cameraAggregates", [])]
        if not camera_rows:
            raise ValueError("cameraAggregates must contain at least one row")

        peak = max(camera_rows, key=lambda row: row["maxCustomerCount"])

        staffing_scores = []
        for row in camera_rows:
            staff_count = max(row["workingStaffCount"], 1)
            customers_per_staff = row["maxCustomerCount"] / staff_count
            staffing_scores.append(
                {
                    "time": row["time"],
                    "maxCustomerCount": row["maxCustomerCount"],
                    "workingStaffCount": row["workingStaffCount"],
                    "customersPerStaff": round(customers_per_staff, 2),
                }
            )
        worst_staffing = max(staffing_scores, key=lambda row: row["customersPerStaff"])
        target_customers_per_staff = 25
        recommended_staff = ceil(worst_staffing["maxCustomerCount"] / target_customers_per_staff)
        recommended_extra_staff = max(0, recommended_staff - worst_staffing["workingStaffCount"])

        current = data.get("current", {})
        historical_baseline = data.get("historicalBaseline", {})
        today_visitors = int(self._first_value(current, "todayTotalVisitors", "today_total_visitors", default=0))
        baseline_visitors = int(
            self._first_value(
                historical_baseline,
                "sameDayAverageVisitors",
                "same_day_average_visitors",
                default=max(today_visitors, 1),
            )
        )
        visitor_increase_rate = 0.0
        if baseline_visitors > 0:
            visitor_increase_rate = round((today_visitors - baseline_visitors) / baseline_visitors * 100, 1)

        pos = data.get("pos", {})
        hourly_orders = [self._normalize_order_row(row) for row in pos.get("hourlyOrders", [])]
        low_conversion = min(hourly_orders, key=lambda row: row["conversionRate"]) if hourly_orders else None
        conversion_rate = int(self._first_value(pos, "conversionRate", "conversion_rate", default=current.get("conversionRate", 0)))

        return AiInsightFeatures(
            peakTime=peak["time"],
            peakCustomerCount=peak["maxCustomerCount"],
            worstStaffingTime=worst_staffing["time"],
            customersPerStaff=worst_staffing["customersPerStaff"],
            recommendedExtraStaff=recommended_extra_staff,
            todayTotalVisitors=today_visitors,
            sameDayAverageVisitors=baseline_visitors,
            visitorIncreaseRate=visitor_increase_rate,
            conversionRate=conversion_rate,
            lowConversionTime=low_conversion["time"] if low_conversion else None,
            lowConversionRate=low_conversion["conversionRate"] if low_conversion else None,
        )

    def _normalize_camera_row(self, row: dict[str, Any]) -> dict[str, Any]:
        customer_count = self._first_value(
            row,
            "maxCustomerCount",
            "max_customer_count",
            "customerCount",
            "customer_count",
            "lastCustomerCount",
            "last_customer_count",
            "avgCustomerCount",
            "avg_customer_count",
        )
        if customer_count is None:
            raise ValueError("each cameraAggregates row needs maxCustomerCount, customerCount, or lastCustomerCount")

        staff_count = self._first_value(row, "workingStaffCount", "working_staff_count", "currentStaff", "current_staff", default=1)
        time_text = str(self._first_value(row, "time", "measuredAt", "measured_at", default="00:00"))
        if "T" in time_text:
            time_text = time_text.split("T", maxsplit=1)[1][:5]

        max_count = int(round(float(customer_count)))
        return {
            "time": time_text[:5],
            "maxCustomerCount": max_count,
            "workingStaffCount": max(1, int(staff_count)),
        }

    def _normalize_order_row(self, row: dict[str, Any]) -> dict[str, Any]:
        conversion_rate = self._first_value(row, "conversionRate", "conversion_rate", default=0)
        return {
            "time": str(self._first_value(row, "time", "measuredAt", "measured_at", default="00:00"))[:5],
            "conversionRate": int(round(float(conversion_rate))),
        }

    def _first_value(self, data: dict[str, Any], *keys: str, default: Any = None) -> Any:
        for key in keys:
            value = data.get(key)
            if value is not None:
                return value
        return default

    def _build_response(self, data: dict[str, Any], features: AiInsightFeatures, source: str) -> AiInsightResponse:
        staffing_risk = self._risk_from_customers_per_staff(features.customersPerStaff)
        congestion_level = self._risk_from_peak(features.peakCustomerCount)
        waiting_risk = "HIGH" if staffing_risk == "HIGH" and congestion_level != "LOW" else congestion_level
        conversion_status = self._conversion_status(features.conversionRate)
        schedule_fit = "NEEDS_IMPROVEMENT" if features.recommendedExtraStaff > 0 else "GOOD"

        insights = [
            self._staffing_insight(data, features, staffing_risk),
            self._congestion_insight(data, features, congestion_level),
        ]
        if features.lowConversionRate is not None and features.lowConversionRate < 70:
            insights.append(self._conversion_insight(features))

        schedule_recommendations = self._schedule_recommendations(data, features, staffing_risk)
        risk_level = "HIGH" if "HIGH" in {staffing_risk, congestion_level, waiting_risk} else "MEDIUM"

        return AiInsightResponse(
            context=AiInsightContext(
                storeId=data["storeId"],
                storeName=data.get("storeName") or f"Store {data['storeId']}",
                storeType=data.get("storeType", "OTHER"),
                storeTypeLabel=data.get("storeTypeLabel"),
            ),
            calendarContext=self._build_calendar_context(data.get("date")),
            summary=AiInsightSummary(
                overallStatus="주의" if risk_level == "HIGH" else "안정",
                mainMessage=(
                    f"오늘 {features.peakTime} 전후 방문 집중이 예상됩니다. "
                    f"직원 1명당 최대 {features.customersPerStaff}명을 대응해야 합니다."
                ),
                riskLevel=risk_level,
            ),
            insights=insights,
            scheduleRecommendations=schedule_recommendations,
            operationMetrics=OperationMetrics(
                congestionLevel=congestion_level,
                staffingRisk=staffing_risk,
                conversionStatus=conversion_status,
                scheduleFit=schedule_fit,
                waitingRisk=waiting_risk,
            ),
            features=features,
            source=source,
        )

    def _build_calendar_context(self, date_text: str | None) -> CalendarContext:
        if not date_text:
            return CalendarContext()

        try:
            target_date = date.fromisoformat(date_text[:10])
        except ValueError:
            return CalendarContext(date=date_text)

        holiday_name = self._fixed_korean_holiday_name(target_date)
        return CalendarContext(
            date=target_date.isoformat(),
            dayOfWeek=target_date.strftime("%A"),
            isWeekend=target_date.weekday() >= 5,
            isHoliday=holiday_name is not None,
            holidayName=holiday_name,
            season=self._season_for_month(target_date.month),
            month=target_date.month,
        )

    def _fixed_korean_holiday_name(self, target_date: date) -> str | None:
        fixed_holidays = {
            (1, 1): "New Year's Day",
            (3, 1): "Independence Movement Day",
            (5, 5): "Children's Day",
            (6, 6): "Memorial Day",
            (8, 15): "Liberation Day",
            (10, 3): "National Foundation Day",
            (10, 9): "Hangul Day",
            (12, 25): "Christmas Day",
        }
        return fixed_holidays.get((target_date.month, target_date.day))

    def _season_for_month(self, month: int) -> str:
        if month in {3, 4, 5}:
            return "SPRING"
        if month in {6, 7, 8}:
            return "SUMMER"
        if month in {9, 10, 11}:
            return "AUTUMN"
        return "WINTER"

    def _staffing_insight(
        self,
        data: dict[str, Any],
        features: AiInsightFeatures,
        staffing_risk: str,
    ) -> AiInsightCard:
        return AiInsightCard(
            id="insight-001",
            type="STAFFING",
            severity=staffing_risk,
            badge="인력 점검",
            title=f"{features.worstStaffingTime} 구간 인력 부담이 높습니다",
            message=(
                f"{features.worstStaffingTime}에는 직원 1명당 최대 "
                f"{features.customersPerStaff}명의 고객을 대응하는 흐름입니다."
            ),
            actionLabel=(
                f"직원 {features.recommendedExtraStaff}명 추가 배치"
                if features.recommendedExtraStaff > 0
                else "현재 근무표 유지"
            ),
            reason="직원 1명당 고객 수가 기준치를 넘으면 응대 지연과 대기 증가 가능성이 커집니다.",
        )

    def _congestion_insight(
        self,
        data: dict[str, Any],
        features: AiInsightFeatures,
        congestion_level: str,
    ) -> AiInsightCard:
        event_text = ""
        external = data.get("externalFactors", {})
        if external.get("nearbyEvent"):
            event_text = " 주변 이벤트 영향도 함께 감지되었습니다."

        return AiInsightCard(
            id="insight-002",
            type="CONGESTION",
            severity=congestion_level,
            badge="방문 집중",
            title=f"{features.peakTime} 피크 고객 수가 {features.peakCustomerCount}명으로 예상됩니다",
            message=(
                f"오늘 방문자는 평소 대비 {features.visitorIncreaseRate}% 증가했습니다."
                f"{event_text}"
            ),
            actionLabel="피크 시간 운영 동선 점검",
            reason="피크 고객 수와 방문 증가율이 높으면 현장 응대, 결제, 대기 안내 등 운영 동선의 부담이 커질 수 있습니다.",
        )

    def _conversion_insight(self, features: AiInsightFeatures) -> AiInsightCard:
        return AiInsightCard(
            id="insight-003",
            type="CONVERSION",
            severity="MEDIUM",
            badge="전환율 점검",
            title=f"{features.lowConversionTime} 전환율이 {features.lowConversionRate}%로 낮습니다",
            message="방문 흐름에 비해 이용 또는 주문 전환이 낮은 시간대입니다. 상품/서비스 안내와 대기 안내를 점검할 필요가 있습니다.",
            actionLabel="이용 안내 강화",
            reason="방문 대비 이용 또는 주문 수가 낮으면 혼잡이 매출로 이어지지 않을 수 있습니다.",
        )

    def _schedule_recommendations(
        self,
        data: dict[str, Any],
        features: AiInsightFeatures,
        staffing_risk: str,
    ) -> list[ScheduleRecommendation]:
        schedule_rows = data.get("staffSchedule", [])
        target_schedule = self._find_schedule_for_time(schedule_rows, features.worstStaffingTime)
        if target_schedule is None:
            return []

        current_staff = target_schedule["currentStaff"]
        recommended_staff = current_staff + features.recommendedExtraStaff
        return [
            ScheduleRecommendation(
                timeRange=target_schedule["timeRange"],
                currentStaff=current_staff,
                recommendedStaff=recommended_staff,
                recommendedExtraStaff=features.recommendedExtraStaff,
                recommendedRole=None,
                roleLabel=None,
                roleReason=None,
                status="URGENT" if staffing_risk == "HIGH" else "WATCH",
                reason=(
                    f"{features.worstStaffingTime} 기준 직원 1명당 고객 수가 "
                    f"{features.customersPerStaff}명입니다."
                ),
            )
        ]

    def _find_schedule_for_time(self, schedule_rows: list[dict[str, Any]], time_text: str) -> dict[str, Any] | None:
        hour = int(time_text.split(":", maxsplit=1)[0])
        for row in schedule_rows:
            start_text, end_text = row["timeRange"].split("-", maxsplit=1)
            start_hour = int(start_text.split(":", maxsplit=1)[0])
            end_hour = int(end_text.split(":", maxsplit=1)[0])
            if start_hour <= hour < end_hour:
                return row
        return None

    def _risk_from_customers_per_staff(self, customers_per_staff: float) -> str:
        if customers_per_staff >= 30:
            return "HIGH"
        if customers_per_staff >= 22:
            return "MEDIUM"
        return "LOW"

    def _risk_from_peak(self, peak_customer_count: int) -> str:
        if peak_customer_count >= 90:
            return "HIGH"
        if peak_customer_count >= 60:
            return "MEDIUM"
        return "LOW"

    def _conversion_status(self, conversion_rate: int) -> str:
        if conversion_rate >= 80:
            return "GOOD"
        if conversion_rate >= 70:
            return "NORMAL"
        return "LOW"


ai_insight_service = AiInsightService()
