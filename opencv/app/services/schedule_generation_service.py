from collections import defaultdict
from datetime import date, datetime, time, timedelta
from math import ceil
from typing import Any

from app.schemas.schedule_generation import (
    ExistingShiftRow,
    GeneratedShift,
    ScheduleExplainRequest,
    ScheduleExplainResponse,
    ScheduleGenerationRequest,
    ScheduleGenerationResponse,
    ScheduleMember,
    ScheduleShiftReason,
    ScheduleSlotSummary,
)
from app.services.llm_client import llm_client


WEEKDAY_NAMES = {
    0: {"0", "MON", "MONDAY", "월", "월요일"},
    1: {"1", "TUE", "TUESDAY", "화", "화요일"},
    2: {"2", "WED", "WEDNESDAY", "수", "수요일"},
    3: {"3", "THU", "THURSDAY", "목", "목요일"},
    4: {"4", "FRI", "FRIDAY", "금", "금요일"},
    5: {"5", "SAT", "SATURDAY", "토", "토요일"},
    6: {"6", "SUN", "SUNDAY", "일", "일요일"},
}


class ScheduleGenerationService:
    def explain(self, request: ScheduleExplainRequest) -> ScheduleExplainResponse:
        fallback = ScheduleExplainResponse(
            source="rule-based",
            reasons=[
                ScheduleShiftReason(
                    shiftId=row.shift_id,
                    reason=self._fallback_explanation(row),
                )
                for row in request.generated_shifts
            ],
        )
        if not request.generated_shifts or not llm_client.is_enabled():
            return fallback

        payload = request.model_dump(by_alias=True)
        try:
            llm_result = llm_client.generate_schedule_explanations(payload)
            if not llm_result:
                return fallback

            llm_reasons = llm_result.get("reasons")
            if not isinstance(llm_reasons, list):
                return fallback

            fallback_by_id = {row.shiftId: row.reason for row in fallback.reasons}
            reasons: list[ScheduleShiftReason] = []
            for item in llm_reasons:
                if not isinstance(item, dict):
                    continue
                shift_id = item.get("shiftId") or item.get("shift_id")
                reason = item.get("reason")
                if shift_id is None or not reason:
                    continue
                reasons.append(ScheduleShiftReason(shiftId=str(shift_id), reason=str(reason)))

            if not reasons:
                return fallback

            returned_ids = {row.shiftId for row in reasons}
            for shift_id, reason in fallback_by_id.items():
                if shift_id not in returned_ids:
                    reasons.append(ScheduleShiftReason(shiftId=shift_id, reason=reason))

            return ScheduleExplainResponse(source="llm", reasons=reasons)
        except Exception:
            return fallback

    def generate(self, request: ScheduleGenerationRequest) -> ScheduleGenerationResponse:
        if request.slot_minutes <= 0:
            raise ValueError("slotMinutes must be greater than 0")
        if request.customers_per_staff <= 0:
            raise ValueError("customersPerStaff must be greater than 0")

        start_date = self._parse_date(request.start_date)
        end_date = self._parse_date(request.end_date)
        if end_date < start_date:
            raise ValueError("endDate must be greater than or equal to startDate")

        members = [member for member in request.members if member.approval_status.upper() == "APPROVED"]
        fixed_by_user = defaultdict(list)
        for row in request.fixed_schedules:
            if row.active.upper() == "Y":
                fixed_by_user[row.user_id].append(row)

        approved_leave_shift_ids = {
            row.shift_id for row in request.leave_requests if row.status.upper() == "APPROVED" and row.shift_id is not None
        }
        existing_shift_by_id = {row.id: row for row in request.shifts if row.id is not None}
        leave_blocked_shifts = [
            existing_shift_by_id[shift_id] for shift_id in approved_leave_shift_ids if shift_id in existing_shift_by_id
        ]

        occupied_by_user: dict[int, list[tuple[datetime, datetime]]] = defaultdict(list)
        for shift in request.shifts:
            if shift.id in approved_leave_shift_ids:
                continue
            occupied_by_user[shift.user_id].append(self._shift_range(shift))

        people_logs = [(self._parse_datetime(row.record_time), row.people_count) for row in request.people_logs]
        generated: list[GeneratedShift] = []
        summaries: list[ScheduleSlotSummary] = []
        warnings: list[str] = []
        assigned_by_user: dict[int, list[tuple[datetime, datetime]]] = defaultdict(list)

        for slot_start, slot_end in self._iter_slots(start_date, end_date, request.store.open_time, request.store.close_time, request.slot_minutes):
            expected_people = self._expected_people_count(people_logs, slot_start, slot_end)
            required_staff = max(request.min_staff, ceil(expected_people / request.customers_per_staff))
            already_working = self._count_overlaps(occupied_by_user, slot_start, slot_end)
            needed_staff = max(0, required_staff - already_working)

            candidates = self._candidate_members(
                members,
                fixed_by_user,
                leave_blocked_shifts,
                occupied_by_user,
                assigned_by_user,
                slot_start,
                slot_end,
            )
            selected = candidates[:needed_staff]

            for member in selected:
                assigned_by_user[member.user_id].append((slot_start, slot_end))
                generated.append(
                    GeneratedShift(
                        storeId=request.store.id,
                        userId=member.user_id,
                        userName=member.name,
                        workDate=slot_start.date().isoformat(),
                        startAt=self._format_datetime(slot_start),
                        endAt=self._format_datetime(slot_end),
                        status=request.output_status,
                        reason=f"예상 고객 {expected_people}명 기준 필요 인원 {required_staff}명",
                    )
                )

            shortage = max(0, needed_staff - len(selected))
            if shortage > 0:
                warnings.append(
                    f"{slot_start.date().isoformat()} {slot_start.strftime('%H:%M')}-{slot_end.strftime('%H:%M')} "
                    f"구간 후보 부족: {shortage}명 미배정"
                )

            summaries.append(
                ScheduleSlotSummary(
                    workDate=slot_start.date().isoformat(),
                    timeRange=f"{slot_start.strftime('%H:%M')}-{slot_end.strftime('%H:%M')}",
                    expectedPeopleCount=expected_people,
                    requiredStaff=required_staff,
                    assignedStaff=already_working + len(selected),
                    shortage=shortage,
                    candidateUserIds=[member.user_id for member in candidates],
                )
            )

        return ScheduleGenerationResponse(
            storeId=request.store.id,
            startDate=start_date.isoformat(),
            endDate=end_date.isoformat(),
            slotMinutes=request.slot_minutes,
            status=request.output_status,
            generatedShifts=self._merge_adjacent_shifts(generated),
            slotSummaries=summaries,
            warnings=warnings,
        )

    def _fallback_explanation(self, row) -> str:
        start_text = row.start_at.replace("T", " ")
        end_text = row.end_at.replace("T", " ")
        start_time = start_text[11:16] if len(start_text) >= 16 else start_text
        end_time = end_text[11:16] if len(end_text) >= 16 else end_text
        parts = [
            (
                f"{row.work_date} {start_time}-{end_time}은 예상 고객 수 "
                f"{row.expected_people_count}명 기준으로 {row.required_staff}명 배치가 필요합니다."
            )
        ]
        if row.is_closing_time and (row.user_level or "").upper() in {"CLOSER", "MANAGER"}:
            parts.append(f"마감 시간대라 {row.user_level} 직원을 우선 배정했습니다.")
        if row.newbie_solo_avoided:
            parts.append("신입 직원이 단독으로 근무하지 않도록 보조 인원을 함께 배치했습니다.")
        return " ".join(parts)

    def _candidate_members(
        self,
        members: list[ScheduleMember],
        fixed_by_user: dict[int, list[Any]],
        leave_blocked_shifts: list[ExistingShiftRow],
        occupied_by_user: dict[int, list[tuple[datetime, datetime]]],
        assigned_by_user: dict[int, list[tuple[datetime, datetime]]],
        slot_start: datetime,
        slot_end: datetime,
    ) -> list[ScheduleMember]:
        candidates = []
        for member in members:
            if not self._is_available(member, fixed_by_user.get(member.user_id, []), slot_start, slot_end):
                continue
            if self._has_overlap(occupied_by_user.get(member.user_id, []), slot_start, slot_end):
                continue
            if self._has_overlap(assigned_by_user.get(member.user_id, []), slot_start, slot_end):
                continue
            if self._has_leave_overlap(member.user_id, leave_blocked_shifts, slot_start, slot_end):
                continue
            candidates.append(member)

        candidates.sort(key=lambda member: (len(assigned_by_user.get(member.user_id, [])), member.user_id))
        return candidates

    def _is_available(self, member: ScheduleMember, fixed_rows: list[Any], slot_start: datetime, slot_end: datetime) -> bool:
        if fixed_rows:
            return any(
                self._weekday_matches(row.weekday, slot_start.weekday())
                and self._time_covers(row.start_time, row.end_time, slot_start.time(), slot_end.time())
                for row in fixed_rows
            )

        available_weekdays = self._parse_available_days(member.available_days)
        return not available_weekdays or slot_start.weekday() in available_weekdays

    def _parse_available_days(self, value: Any) -> set[int]:
        if value is None or value == "":
            return set()
        if isinstance(value, list):
            raw_items = value
        else:
            raw_items = str(value).replace("[", "").replace("]", "").replace('"', "").split(",")
        weekdays = set()
        for item in raw_items:
            text = str(item).strip().upper()
            for index, aliases in WEEKDAY_NAMES.items():
                if text in aliases:
                    weekdays.add(index)
        return weekdays

    def _weekday_matches(self, value: Any, weekday: int) -> bool:
        text = str(value).strip().upper()
        return text in WEEKDAY_NAMES[weekday]

    def _iter_slots(
        self,
        start_date: date,
        end_date: date,
        open_time_text: str,
        close_time_text: str,
        slot_minutes: int,
    ):
        open_time = self._parse_time(open_time_text)
        close_time = self._parse_time(close_time_text)
        current_date = start_date
        while current_date <= end_date:
            open_at = datetime.combine(current_date, open_time)
            close_at = datetime.combine(current_date, close_time)
            if close_at <= open_at:
                close_at += timedelta(days=1)

            slot_start = open_at
            while slot_start < close_at:
                slot_end = min(slot_start + timedelta(minutes=slot_minutes), close_at)
                yield slot_start, slot_end
                slot_start = slot_end
            current_date += timedelta(days=1)

    def _expected_people_count(self, people_logs: list[tuple[datetime, int]], slot_start: datetime, slot_end: datetime) -> int:
        exact = [count for logged_at, count in people_logs if slot_start <= logged_at < slot_end]
        if exact:
            return int(round(sum(exact) / len(exact)))

        same_weekday_time = [
            count
            for logged_at, count in people_logs
            if logged_at.weekday() == slot_start.weekday() and slot_start.time() <= logged_at.time() < slot_end.time()
        ]
        if same_weekday_time:
            return int(round(sum(same_weekday_time) / len(same_weekday_time)))

        same_time = [count for logged_at, count in people_logs if slot_start.time() <= logged_at.time() < slot_end.time()]
        if same_time:
            return int(round(sum(same_time) / len(same_time)))
        return 0

    def _count_overlaps(
        self,
        ranges_by_user: dict[int, list[tuple[datetime, datetime]]],
        slot_start: datetime,
        slot_end: datetime,
    ) -> int:
        return sum(1 for ranges in ranges_by_user.values() if self._has_overlap(ranges, slot_start, slot_end))

    def _has_leave_overlap(
        self,
        user_id: int,
        leave_blocked_shifts: list[ExistingShiftRow],
        slot_start: datetime,
        slot_end: datetime,
    ) -> bool:
        for shift in leave_blocked_shifts:
            if shift.user_id != user_id:
                continue
            leave_start, leave_end = self._shift_range(shift)
            if self._overlaps(leave_start, leave_end, slot_start, slot_end):
                return True
        return False

    def _has_overlap(self, ranges: list[tuple[datetime, datetime]], slot_start: datetime, slot_end: datetime) -> bool:
        return any(self._overlaps(start_at, end_at, slot_start, slot_end) for start_at, end_at in ranges)

    def _overlaps(self, start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
        return start_a < end_b and start_b < end_a

    def _shift_range(self, shift: ExistingShiftRow) -> tuple[datetime, datetime]:
        start_at = self._parse_datetime(shift.start_at, shift.work_date)
        end_at = self._parse_datetime(shift.end_at, shift.work_date)
        if end_at <= start_at:
            end_at += timedelta(days=1)
        return start_at, end_at

    def _time_covers(self, start_text: str, end_text: str, slot_start: time, slot_end: time) -> bool:
        start_time = self._parse_time(start_text)
        end_time = self._parse_time(end_text)
        if end_time <= start_time:
            return slot_start >= start_time or slot_end <= end_time
        return start_time <= slot_start and slot_end <= end_time

    def _merge_adjacent_shifts(self, shifts: list[GeneratedShift]) -> list[GeneratedShift]:
        if not shifts:
            return []
        sorted_shifts = sorted(shifts, key=lambda row: (row.userId, row.startAt, row.endAt))
        merged: list[GeneratedShift] = []
        for shift in sorted_shifts:
            if not merged:
                merged.append(shift)
                continue
            previous = merged[-1]
            if (
                previous.userId == shift.userId
                and previous.storeId == shift.storeId
                and previous.workDate == shift.workDate
                and previous.endAt == shift.startAt
                and previous.status == shift.status
            ):
                previous.endAt = shift.endAt
                previous.reason = shift.reason
            else:
                merged.append(shift)
        return merged

    def _parse_date(self, value: str) -> date:
        return date.fromisoformat(value[:10])

    def _parse_datetime(self, value: str, fallback_date: str | None = None) -> datetime:
        text = value.replace("Z", "+00:00")
        if "T" in text or (" " in text and "-" in text):
            return datetime.fromisoformat(text).replace(tzinfo=None)
        if fallback_date is None:
            raise ValueError(f"datetime value needs a date: {value}")
        return datetime.combine(self._parse_date(fallback_date), self._parse_time(value))

    def _parse_time(self, value: str) -> time:
        return time.fromisoformat(value[:8])

    def _format_datetime(self, value: datetime) -> str:
        return value.isoformat(timespec="minutes")


schedule_generation_service = ScheduleGenerationService()
