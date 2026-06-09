from collections import defaultdict
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter

from app.core.state import inference_state

router = APIRouter(tags=["java-compat"])


@router.post("/analyze/opencv")
def analyze_opencv_for_java():
    aggregate = inference_state.aggregate_latest()
    if aggregate is None:
        return {
            "available": False,
            "aggregate": None,
        }

    return {
        "available": True,
        "aggregate": {
            "cameraId": aggregate.cameraId,
            "measuredAt": aggregate.measuredAt,
            "lastCustomerCount": aggregate.lastCustomerCount,
            "status": aggregate.status,
        },
    }


@router.post("/analysis")
def analyze_for_java(payload: dict[str, Any]):
    store = payload.get("store") or {}
    people_logs = payload.get("peopleLogs") or []
    shifts = payload.get("shifts") or []
    members = payload.get("storeMembers") or []
    analysis_date = payload.get("analysisDate")

    hourly_counts = _hourly_people_counts(people_logs)
    total_visitors = sum(hourly_counts.values())
    peak_hour, peak_count = _peak_hour(hourly_counts)
    working_staff = _working_staff_by_hour(shifts)
    staff_count_at_peak = max(1, working_staff.get(peak_hour, _approved_member_count(members)))
    customers_per_staff = round(peak_count / staff_count_at_peak, 2) if peak_count else 0

    capacity = _safe_int(store.get("capacity"), default=0)
    congestion_rate = round((peak_count / capacity) * 100, 1) if capacity > 0 else 0
    risk_level = _risk_level(congestion_rate, customers_per_staff)
    recommended_extra_staff = max(0, -(-peak_count // 25) - staff_count_at_peak) if peak_count else 0

    return {
        "summary": {
            "overallStatus": "WATCH" if risk_level != "LOW" else "NORMAL",
            "mainMessage": (
                f"Peak traffic is around {peak_hour}:00 with {peak_count} customers. "
                f"Current staffing at peak is {staff_count_at_peak}."
            ),
            "riskLevel": risk_level,
            "storeName": store.get("name"),
            "analysisDate": _date_text(analysis_date),
        },
        "insights": [
            {
                "id": "java-compat-congestion",
                "type": "CONGESTION",
                "severity": risk_level,
                "badge": "CONGESTION",
                "title": f"Peak congestion at {peak_hour}:00",
                "message": f"Peak count is {peak_count}, capacity usage is {congestion_rate}%.",
                "actionLabel": "Check peak operations",
                "reason": "People log data shows the highest customer concentration in this time range.",
            },
            {
                "id": "java-compat-staffing",
                "type": "STAFFING",
                "severity": _staffing_risk(customers_per_staff),
                "badge": "STAFFING",
                "title": f"{customers_per_staff} customers per staff at peak",
                "message": f"{recommended_extra_staff} additional staff are recommended for the peak window.",
                "actionLabel": "Adjust staff schedule",
                "reason": "Staffing is estimated from shifts overlapping the peak hour.",
            },
        ],
        "scheduleRecommendations": [
            {
                "timeRange": f"{peak_hour:02d}:00-{(peak_hour + 1) % 24:02d}:00",
                "currentStaff": staff_count_at_peak,
                "recommendedStaff": staff_count_at_peak + recommended_extra_staff,
                "recommendedExtraStaff": recommended_extra_staff,
                "recommendedRole": None,
                "roleLabel": None,
                "roleReason": None,
                "status": "URGENT" if risk_level == "HIGH" else "WATCH",
                "reason": "Recommendation is based on peak people count and a target of 25 customers per staff.",
            }
        ],
        "operationMetrics": {
            "congestionLevel": risk_level,
            "staffingRisk": _staffing_risk(customers_per_staff),
            "conversionStatus": "NORMAL",
            "scheduleFit": "NEEDS_IMPROVEMENT" if recommended_extra_staff > 0 else "GOOD",
            "waitingRisk": risk_level,
            "congestionRate": congestion_rate,
        },
        "features": {
            "peakTime": f"{peak_hour:02d}:00",
            "peakCustomerCount": peak_count,
            "worstStaffingTime": f"{peak_hour:02d}:00",
            "customersPerStaff": customers_per_staff,
            "recommendedExtraStaff": recommended_extra_staff,
            "todayTotalVisitors": total_visitors,
            "sameDayAverageVisitors": total_visitors,
            "visitorIncreaseRate": 0,
            "conversionRate": 0,
            "staffCountAtPeak": staff_count_at_peak,
            "approvedMemberCount": _approved_member_count(members),
        },
    }


def _hourly_people_counts(rows: list[dict[str, Any]]) -> dict[int, int]:
    counts: dict[int, int] = defaultdict(int)
    for row in rows:
        measured_at = _parse_datetime(row.get("record_time") or row.get("recordTime"))
        hour = measured_at.hour if measured_at else 0
        counts[hour] += _safe_int(row.get("people_count") or row.get("peopleCount"), default=0)
    if not counts:
        counts[0] = 0
    return dict(counts)


def _peak_hour(hourly_counts: dict[int, int]) -> tuple[int, int]:
    hour = max(hourly_counts, key=lambda key: hourly_counts[key])
    return hour, hourly_counts[hour]


def _working_staff_by_hour(rows: list[dict[str, Any]]) -> dict[int, int]:
    staff_by_hour: dict[int, set[str]] = defaultdict(set)
    for index, row in enumerate(rows):
        start_at = _parse_datetime(row.get("start_at") or row.get("startAt"))
        end_at = _parse_datetime(row.get("end_at") or row.get("endAt"))
        if start_at is None or end_at is None:
            continue
        user_id = str(row.get("user_id") or row.get("userId") or index)
        for hour in range(start_at.hour, end_at.hour + 1):
            staff_by_hour[hour % 24].add(user_id)
    return {hour: len(users) for hour, users in staff_by_hour.items()}


def _approved_member_count(rows: list[dict[str, Any]]) -> int:
    approved = [
        row
        for row in rows
        if str(row.get("approval_status") or row.get("approvalStatus") or "").upper() in {"APPROVED", "Y", "YES", "ACTIVE"}
    ]
    return len(approved) if approved else len(rows)


def _parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())

    text = str(value).strip()
    if not text:
        return None
    text = text.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        try:
            return datetime.strptime(text, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _risk_level(congestion_rate: float, customers_per_staff: float) -> str:
    if congestion_rate >= 85 or customers_per_staff >= 30:
        return "HIGH"
    if congestion_rate >= 60 or customers_per_staff >= 22:
        return "MEDIUM"
    return "LOW"


def _staffing_risk(customers_per_staff: float) -> str:
    if customers_per_staff >= 30:
        return "HIGH"
    if customers_per_staff >= 22:
        return "MEDIUM"
    return "LOW"


def _date_text(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)[:10]
