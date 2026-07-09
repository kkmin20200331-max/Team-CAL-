package com.dm.backend.service;

import com.dm.backend.mapper.AttendanceMapper;
import com.dm.backend.mapper.FixedscheduleMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.mapper.SubstituteMapper;
import com.dm.backend.mapper.UserMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PayrollService {

    @Autowired
    private AttendanceMapper attendanceMapper;

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    @Autowired
    private FixedscheduleMapper fixedscheduleMapper;

    @Autowired
    private SubstituteMapper substituteMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ShiftMapper shiftMapper;

    @Autowired
    private NotificationService notificationService;

    public int requestWeeklyPay(
            String user_id,
            String store_id,
            String week_start,
            String week_end,
            double amount
    ) {
        List<StoreMemberVo> admins = storeMemberMapper.getAdmins(store_id);
        if (admins == null || admins.isEmpty()) {
            return 0;
        }

        int sentCount = 0;
        for (StoreMemberVo admin : admins) {
            if (admin.getUser_id() == null || admin.getUser_id().equals(user_id)) {
                continue;
            }

            NotificationVO notification = new NotificationVO();
            notification.setId("NOTI_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            notification.setUser_id(admin.getUser_id());
            notification.setStore_id(store_id);
            notification.setType("WEEKLY_PAY_REQUEST");
            notification.setTitle("주급 신청 요청");
            notification.setContent(user_id + "님이 " + week_start + " ~ " + week_end + " 주급 "
                    + Math.round(amount) + "원을 신청했습니다.");
            notification.setRef_id(user_id + ":" + week_start);
            notificationService.createNotification(notification);
            sentCount++;
        }

        return sentCount;
    }

    public List<PayrollEntryVO> calculateStorePayroll(
            String store_id,
            String year_month
    ) {

        YearMonth yearMonth =
                YearMonth.parse(year_month);

        Date startDate =
                Date.from(
                        yearMonth
                                .atDay(1)
                                .atStartOfDay(ZoneId.systemDefault())
                                .toInstant()
                );

        Date endDate =
                Date.from(
                        yearMonth
                                .atEndOfMonth()
                                .atTime(23, 59, 59)
                                .atZone(ZoneId.systemDefault())
                                .toInstant()
                );

        List<UserVo> staffList =
                userMapper.getStaff(store_id);

        List<PayrollEntryVO> payrollEntries =
                new ArrayList<>();

        for (UserVo staff : staffList) {

            StoreMemberVo memberInfo =
                    storeMemberMapper.getMemberInfo(
                            staff.getId(),
                            store_id
                    );

            PayrollResultVO payroll =
                    calculatePayroll(
                            staff.getId(),
                            store_id,
                            startDate,
                            endDate
                    );

            List<AttendanceVO> attendances =
                    getCombinedAttendances(
                            staff.getId(),
                            store_id,
                            startDate,
                            endDate
                    );

            PayrollWorkSummary summary =
                    summarizeWorkHours(attendances);

            PayrollEntryVO entry =
                    new PayrollEntryVO();

            entry.setId(
                    "PAY-" + store_id + "-" + staff.getId() + "-" + year_month
            );
            entry.setEmployeeId(staff.getId());
            entry.setEmployeeName(staff.getName());
            entry.setPosition(resolvePosition(memberInfo));
            entry.setLocation(store_id);
            entry.setPeriod(year_month);
            entry.setRegularHours(summary.regularHours);
            entry.setOvertimeHours(summary.overtimeHours);
            entry.setHolidayHours(summary.nightHours);
            entry.setHourlyRate(
                    memberInfo != null && memberInfo.getPay_amount() != null
                            ? memberInfo.getPay_amount()
                            : 0
            );
            entry.setBasePay(payroll.getBasePay());
            entry.setOvertimePay(payroll.getOvertimePay());
            entry.setHolidayPay(
                    payroll.getNightPay()
                            + payroll.getWeeklyPay()
            );
            entry.setTax(0);
            entry.setInsurance(0);
            entry.setPension(0);
            entry.setTotalPay(payroll.getTotalPay());
            entry.setStatus(
                    payroll.getTotalPay() > 0
                            ? "approved"
                            : "pending"
            );
            entry.setRequestedDate(
                    yearMonth
                            .atEndOfMonth()
                            .format(DateTimeFormatter.ISO_LOCAL_DATE)
            );

            payrollEntries.add(entry);
        }

        return payrollEntries;
    }

    public PayrollResultVO calculatePayroll(
            String user_id,
            String store_id,
            Date start_date,
            Date end_date
    ) {

        StoreMemberVo payInfo =
                storeMemberMapper.getPayInfo(
                        user_id,
                        store_id
                );

        // 경민 수정 6/5 17:40
        if (payInfo == null || payInfo.getPay_amount() == null) {
            return new PayrollResultVO();
        }

        List<AttendanceVO> attendances =
                getCombinedAttendances(
                        user_id,
                        store_id,
                        start_date,
                        end_date
                );

        List<FixedscheduleVO> schedules =
                fixedscheduleMapper.getActiveSchedule(
                        user_id,
                        store_id
                );

        double pay_amount =
                payInfo.getPay_amount();

        String pay_type =
                payInfo.getPay_type();

        double baseHours = 0;
        double basePay = 0;
        double overtimePay = 0;
        double nightPay = 0;
        double weeklyPay = 0;

        Map<String, List<AttendanceVO>> weekMap =
                new HashMap<>();

        // =========================
        // 경민 수정 6/5 17:03
        // 대타 shift ID 목록
        // =========================

        List<SubstituteHistoryVO> subHistory =
                substituteMapper.getMySubstituteHistory(user_id);

        Set<String> substituteShiftIds =
                subHistory.stream()
                        .map(SubstituteHistoryVO::getShift_id)
                        .collect(Collectors.toSet());

        // =========================
        // 주차별 그룹핑
        // =========================

        for (AttendanceVO attendance : attendances) {

            // 대타 근무는 주휴 계산 제외
            if (attendance.getShift_id() != null
                    && substituteShiftIds.contains(attendance.getShift_id())) {
                continue;
            }

            LocalDate workDate =
                    attendance.getWork_date()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate();

            int weekYear =
                    workDate.get(
                            WeekFields.ISO.weekBasedYear()
                    );

            int week =
                    workDate.get(
                            WeekFields.ISO.weekOfWeekBasedYear()
                    );

            String weekKey =
                    weekYear + "-" + week;

            weekMap
                    .computeIfAbsent(
                            weekKey,
                            k -> new ArrayList<>()
                    )
                    .add(attendance);
        }

        // =========================
        // 기본급 / 연장 / 야간
        // =========================

        double hourlyRate = "MONTHLY".equalsIgnoreCase(pay_type) ? (pay_amount / 209.0) : pay_amount;

        for (AttendanceVO attendance : attendances) {

            LocalDateTime startTime =
                    attendance.getCheck_in_at()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime();

            LocalDateTime endTime =
                    attendance.getCheck_out_at()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime();

            double workHours =
                    resolveWorkHours(
                            attendance,
                            startTime,
                            endTime
                    );

            baseHours += workHours;

            double overtimeHours =
                    Math.max(
                            workHours - 8,
                            0
                    );

            overtimePay +=
                    overtimeHours
                            * hourlyRate
                            * 0.5;

            nightPay +=
                    calculateNightPay(
                            startTime,
                            endTime,
                            hourlyRate
                    );
        }

        // =========================
        // 기본급 계산
        // =========================

        if ("HOURLY".equalsIgnoreCase(pay_type)) {

            basePay =
                    baseHours
                            * pay_amount;

            // =========================
            // 주휴수당 계산
            // =========================

            for (List<AttendanceVO> weekAttendances : weekMap.values()) {

                double weekHours = 0;

                for (AttendanceVO attendance : weekAttendances) {

                    LocalDateTime startTime =
                            attendance.getCheck_in_at()
                                    .toInstant()
                                    .atZone(ZoneId.systemDefault())
                                    .toLocalDateTime();

                    LocalDateTime endTime =
                            attendance.getCheck_out_at()
                                    .toInstant()
                                    .atZone(ZoneId.systemDefault())
                                    .toLocalDateTime();

                    weekHours +=
                            resolveWorkHours(
                                    attendance,
                                    startTime,
                                    endTime
                            );
                }

                // 주 15시간 미만
                if (weekHours < 15) {
                    continue;
                }

                // 개근 체크
                if (!isWeeklyAttendanceComplete(
                        weekAttendances,
                        schedules
                )) {
                    continue;
                }

                // =========================
                // 소정근로일수
                // =========================

                int scheduledDays = schedules.size();

                if (scheduledDays == 0) {
                    continue;
                }

                // =========================
                // 1일 평균 근로시간
                // =========================

                double averageDailyHours =
                        weekHours / scheduledDays;

                // =========================
                // 법정 주휴수당
                // =========================

                weeklyPay +=
                        averageDailyHours
                                * pay_amount;
            }

        } else if ("MONTHLY".equalsIgnoreCase(pay_type)) {

            basePay =
                    pay_amount;

            weeklyPay = 0;
        }

        PayrollResultVO result =
                new PayrollResultVO();

        result.setBasePay(basePay);
        result.setOvertimePay(overtimePay);
        result.setNightPay(nightPay);
        result.setWeeklyPay(weeklyPay);

        result.setTotalPay(
                basePay
                        + overtimePay
                        + nightPay
                        + weeklyPay
        );

        return result;
    }

    private double resolveWorkHours(
            AttendanceVO attendance,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {

        if (attendance.getWork_minutes() != null
                && attendance.getWork_minutes() > 0) {
            return attendance.getWork_minutes() / 60.0;
        }

        return Duration.between(
                startTime,
                endTime
        ).toMinutes() / 60.0;
    }

    private PayrollWorkSummary summarizeWorkHours(
            List<AttendanceVO> attendances
    ) {

        PayrollWorkSummary summary =
                new PayrollWorkSummary();

        for (AttendanceVO attendance : attendances) {

            LocalDateTime startTime =
                    attendance.getCheck_in_at()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime();

            LocalDateTime endTime =
                    attendance.getCheck_out_at()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime();

            double workHours =
                    resolveWorkHours(
                            attendance,
                            startTime,
                            endTime
                    );

            summary.regularHours += workHours;
            summary.overtimeHours +=
                    Math.max(
                            workHours - 8,
                            0
                    );
            summary.nightHours +=
                    calculateNightHours(
                            startTime,
                            endTime
                    );
        }

        return summary;
    }

    private String resolvePosition(
            StoreMemberVo memberInfo
    ) {

        if (memberInfo == null) {
            return "직원";
        }

        if (memberInfo.getUser_level() != null
                && !memberInfo.getUser_level().isBlank()) {
            return memberInfo.getUser_level();
        }

        if (memberInfo.getMember_role() != null
                && !memberInfo.getMember_role().isBlank()) {
            return memberInfo.getMember_role();
        }

        return "직원";
    }

    private double calculateNightHours(
            LocalDateTime start,
            LocalDateTime end
    ) {

        double nightMinutes = 0;

        LocalDateTime currentDate =
                start.toLocalDate()
                        .atStartOfDay();

        while (!currentDate.isAfter(end)) {

            LocalDateTime nightStart =
                    currentDate.withHour(22);

            LocalDateTime nightEnd =
                    currentDate.plusDays(1)
                            .withHour(6);

            LocalDateTime overlapStart =
                    start.isAfter(nightStart)
                            ? start
                            : nightStart;

            LocalDateTime overlapEnd =
                    end.isBefore(nightEnd)
                            ? end
                            : nightEnd;

            if (
                    overlapStart.isBefore(
                            overlapEnd
                    )
            ) {

                nightMinutes +=
                        Duration.between(
                                overlapStart,
                                overlapEnd
                        ).toMinutes();
            }

            currentDate =
                    currentDate.plusDays(1);
        }

        return nightMinutes / 60.0;
    }

    private static class PayrollWorkSummary {
        private double regularHours;
        private double overtimeHours;
        private double nightHours;
    }

    // =========================
    // 주휴 개근 체크
    // =========================

    private boolean isWeeklyAttendanceComplete(
            List<AttendanceVO> weekAttendances,
            List<FixedscheduleVO> schedules
    ) {

        Set<String> workedDays =
                new HashSet<>();

        for (AttendanceVO attendance : weekAttendances) {

            LocalDate date =
                    attendance.getWork_date()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate();

            workedDays.add(
                    convertDay(
                            date.getDayOfWeek()
                    )
            );
        }

        for (FixedscheduleVO schedule : schedules) {

            if (
                    !workedDays.contains(
                            schedule.getWeekday()
                                    .toUpperCase()
                    )
            ) {
                return false;
            }
        }

        return true;
    }

    // =========================
    // 요일 변환
    // =========================

    private String convertDay(
            DayOfWeek day
    ) {

        switch (day) {

            case MONDAY:
                return "MON";

            case TUESDAY:
                return "TUE";

            case WEDNESDAY:
                return "WED";

            case THURSDAY:
                return "THU";

            case FRIDAY:
                return "FRI";

            case SATURDAY:
                return "SAT";

            case SUNDAY:
                return "SUN";

            default:
                return "";
        }
    }

    // =========================
    // 야간수당
    // =========================

    private double calculateNightPay(
            LocalDateTime start,
            LocalDateTime end,
            double hourlyRate
    ) {

        double nightMinutes = 0;

        LocalDateTime currentDate =
                start.toLocalDate()
                        .atStartOfDay();

        while (!currentDate.isAfter(end)) {

            LocalDateTime nightStart =
                    currentDate.withHour(22);

            LocalDateTime nightEnd =
                    currentDate.plusDays(1)
                            .withHour(6);

            LocalDateTime overlapStart =
                    start.isAfter(nightStart)
                            ? start
                            : nightStart;

            LocalDateTime overlapEnd =
                    end.isBefore(nightEnd)
                            ? end
                            : nightEnd;

            if (
                    overlapStart.isBefore(
                            overlapEnd
                    )
            ) {

                nightMinutes +=
                        Duration.between(
                                overlapStart,
                                overlapEnd
                        ).toMinutes();
            }

            currentDate =
                    currentDate.plusDays(1);
        }

        return
                (nightMinutes / 60.0)
                        * hourlyRate
                        * 0.5;
     }

    private List<AttendanceVO> getCombinedAttendances(
            String user_id,
            String store_id,
            Date start_date,
            Date end_date
    ) {
        List<AttendanceVO> actual =
                attendanceMapper.getCompletedAttendanceList(
                        user_id,
                        store_id,
                        start_date,
                        end_date
                );
        if (actual == null) {
            actual = new ArrayList<>();
        }

        List<ShiftVO> shifts =
                shiftMapper.getMonthlyShift(
                        user_id,
                        start_date,
                        end_date
                );

        if (shifts == null || shifts.isEmpty()) {
            return actual;
        }

        List<AttendanceVO> combined = new ArrayList<>(actual);

        Set<String> attendedShiftIds = actual.stream()
                .map(AttendanceVO::getShift_id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> attendedDates = actual.stream()
                .map(a -> {
                    if (a.getWork_date() == null) return null;
                    return a.getWork_date().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().toString();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (ShiftVO shift : shifts) {
            String status = shift.getStatus();
            if (status != null && (status.equalsIgnoreCase("VACANT") || status.equalsIgnoreCase("CANCELLED"))) {
                continue;
            }

            if (attendedShiftIds.contains(shift.getId())) {
                continue;
            }

            LocalDate localDate = shift.getWork_date().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            if (attendedDates.contains(localDate.toString())) {
                continue;
            }

            try {
                AttendanceVO sim = new AttendanceVO();
                sim.setId("SIM-" + shift.getId());
                sim.setStore_id(shift.getStore_id());
                sim.setUser_id(shift.getUser_id());
                sim.setShift_id(shift.getId());
                sim.setWork_date(shift.getWork_date());

                Date startAt = shift.getStart_at();
                Date endAt = shift.getEnd_at();

                if (startAt != null && endAt != null) {
                    sim.setCheck_in_at(startAt);
                    sim.setCheck_out_at(endAt);

                    LocalDateTime startDateTime = startAt.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                    LocalDateTime endDateTime = endAt.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                    long diffMinutes = Duration.between(startDateTime, endDateTime).toMinutes();
                    sim.setWork_minutes((int) diffMinutes);
                } else {
                    sim.setCheck_in_at(shift.getWork_date());
                    sim.setCheck_out_at(shift.getWork_date());
                    sim.setWork_minutes(0);
                }

                combined.add(sim);
            } catch (Exception e) {
                // Ignore parsing errors for this shift
            }
        }

        return combined;
    }
}
