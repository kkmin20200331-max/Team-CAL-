from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class ScheduleStore(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: int
    name: str | None = None
    open_time: str = Field(validation_alias=AliasChoices("open_time", "openTime"))
    close_time: str = Field(validation_alias=AliasChoices("close_time", "closeTime"))
    capacity: int | None = None
    type: str | None = None


class ScheduleMember(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    store_id: int = Field(validation_alias=AliasChoices("store_id", "storeId"))
    user_id: int = Field(validation_alias=AliasChoices("user_id", "userId"))
    member_role: str | None = Field(default=None, validation_alias=AliasChoices("member_role", "memberRole"))
    user_level: str | None = Field(default=None, validation_alias=AliasChoices("user_level", "userLevel"))
    approval_status: str = Field(default="APPROVED", validation_alias=AliasChoices("approval_status", "approvalStatus"))
    pay_type: str | None = Field(default=None, validation_alias=AliasChoices("pay_type", "payType"))
    pay_amount: int | None = Field(default=None, validation_alias=AliasChoices("pay_amount", "payAmount"))
    available_days: Any = Field(default=None, validation_alias=AliasChoices("available_days", "availableDays"))
    name: str | None = None
    phone: str | None = None


class FixedScheduleRow(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    store_id: int = Field(validation_alias=AliasChoices("store_id", "storeId"))
    user_id: int = Field(validation_alias=AliasChoices("user_id", "userId"))
    weekday: Any
    start_time: str = Field(validation_alias=AliasChoices("start_time", "startTime"))
    end_time: str = Field(validation_alias=AliasChoices("end_time", "endTime"))
    active: str = "Y"


class ExistingShiftRow(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: int | None = None
    store_id: int = Field(validation_alias=AliasChoices("store_id", "storeId"))
    user_id: int = Field(validation_alias=AliasChoices("user_id", "userId"))
    work_date: str = Field(validation_alias=AliasChoices("work_date", "workDate"))
    start_at: str = Field(validation_alias=AliasChoices("start_at", "startAt"))
    end_at: str = Field(validation_alias=AliasChoices("end_at", "endAt"))
    status: str | None = None


class LeaveRequestRow(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: int | None = None
    shift_id: int | None = Field(default=None, validation_alias=AliasChoices("shift_id", "shiftId"))
    user_id: int = Field(validation_alias=AliasChoices("user_id", "userId"))
    status: str = "APPROVED"


class PeopleLogRow(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    store_id: int = Field(validation_alias=AliasChoices("store_id", "storeId"))
    record_time: str = Field(validation_alias=AliasChoices("record_time", "recordTime"))
    people_count: int = Field(validation_alias=AliasChoices("people_count", "peopleCount"))


class ScheduleGenerationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    store: ScheduleStore
    start_date: str = Field(validation_alias=AliasChoices("start_date", "startDate"))
    end_date: str = Field(validation_alias=AliasChoices("end_date", "endDate"))
    members: list[ScheduleMember] = Field(default_factory=list)
    fixed_schedules: list[FixedScheduleRow] = Field(
        default_factory=list,
        validation_alias=AliasChoices("fixed_schedules", "fixedSchedules"),
    )
    shifts: list[ExistingShiftRow] = Field(default_factory=list)
    leave_requests: list[LeaveRequestRow] = Field(
        default_factory=list,
        validation_alias=AliasChoices("leave_requests", "leaveRequests"),
    )
    people_logs: list[PeopleLogRow] = Field(
        default_factory=list,
        validation_alias=AliasChoices("people_logs", "peopleLogs"),
    )
    slot_minutes: int = Field(default=60, validation_alias=AliasChoices("slot_minutes", "slotMinutes"))
    customers_per_staff: int = Field(default=25, validation_alias=AliasChoices("customers_per_staff", "customersPerStaff"))
    min_staff: int = Field(default=1, validation_alias=AliasChoices("min_staff", "minStaff"))
    output_status: str = Field(default="confirmed", validation_alias=AliasChoices("output_status", "outputStatus"))


class GeneratedShift(BaseModel):
    storeId: int
    userId: int
    userName: str | None = None
    workDate: str
    startAt: str
    endAt: str
    status: str
    reason: str


class ScheduleSlotSummary(BaseModel):
    workDate: str
    timeRange: str
    expectedPeopleCount: int
    requiredStaff: int
    assignedStaff: int
    shortage: int
    candidateUserIds: list[int] = Field(default_factory=list)


class ScheduleGenerationResponse(BaseModel):
    storeId: int
    startDate: str
    endDate: str
    slotMinutes: int
    status: str
    generatedShifts: list[GeneratedShift] = Field(default_factory=list)
    slotSummaries: list[ScheduleSlotSummary] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class ScheduleExplainShift(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    shift_id: str = Field(validation_alias=AliasChoices("shift_id", "shiftId"))
    user_id: str | None = Field(default=None, validation_alias=AliasChoices("user_id", "userId"))
    user_level: str | None = Field(default=None, validation_alias=AliasChoices("user_level", "userLevel"))
    work_date: str = Field(validation_alias=AliasChoices("work_date", "workDate"))
    start_at: str = Field(validation_alias=AliasChoices("start_at", "startAt"))
    end_at: str = Field(validation_alias=AliasChoices("end_at", "endAt"))
    expected_people_count: int = Field(
        default=0,
        validation_alias=AliasChoices("expected_people_count", "expectedPeopleCount"),
    )
    required_staff: int = Field(default=1, validation_alias=AliasChoices("required_staff", "requiredStaff"))
    assigned_staff: int = Field(default=1, validation_alias=AliasChoices("assigned_staff", "assignedStaff"))
    is_closing_time: bool = Field(default=False, validation_alias=AliasChoices("is_closing_time", "isClosingTime"))
    newbie_solo_avoided: bool = Field(
        default=False,
        validation_alias=AliasChoices("newbie_solo_avoided", "newbieSoloAvoided"),
    )


class ScheduleExplainRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    store_name: str | None = Field(default=None, validation_alias=AliasChoices("store_name", "storeName"))
    generated_shifts: list[ScheduleExplainShift] = Field(
        default_factory=list,
        validation_alias=AliasChoices("generated_shifts", "generatedShifts"),
    )


class ScheduleShiftReason(BaseModel):
    shiftId: str
    reason: str


class ScheduleExplainResponse(BaseModel):
    source: str
    reasons: list[ScheduleShiftReason] = Field(default_factory=list)
