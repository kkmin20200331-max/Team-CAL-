package com.dm.backend.service;

import com.dm.backend.mapper.FixedscheduleMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.mapper.SubstituteMapper;
import com.dm.backend.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PayrollService {

    @Autowired
    private ShiftMapper shiftMapper;

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    @Autowired
    private FixedscheduleMapper fixedscheduleMapper;

    @Autowired
    private SubstituteMapper substituteMapper;

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

        List<ShiftVO> shifts =
                shiftMapper.getMonthlyShift(
                        user_id,
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

        Map<String, List<ShiftVO>> weekMap =
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

        for (ShiftVO shift : shifts) {

            // 대타 근무는 주휴 계산 제외
            if (substituteShiftIds.contains(shift.getId())) {
                continue;
            }



            LocalDate workDate =
                    shift.getWork_date()
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
                    .add(shift);
        }

        // =========================
        // 기본급 / 연장 / 야간
        // =========================

        for (ShiftVO shift : shifts) {

            LocalDateTime startTime =
                    shift.getStart_at()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime();

            LocalDateTime endTime =
                    shift.getEnd_at()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime();

            double workHours =
                    Duration.between(
                            startTime,
                            endTime
                    ).toMinutes() / 60.0;

            baseHours += workHours;

            double overtimeHours =
                    Math.max(
                            workHours - 8,
                            0
                    );

            overtimePay +=
                    overtimeHours
                            * pay_amount
                            * 0.5;

            nightPay +=
                    calculateNightPay(
                            startTime,
                            endTime,
                            pay_amount
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

            for (List<ShiftVO> weekShifts : weekMap.values()) {

                double weekHours = 0;

                for (ShiftVO shift : weekShifts) {

                    LocalDateTime startTime =
                            shift.getStart_at()
                                    .toInstant()
                                    .atZone(ZoneId.systemDefault())
                                    .toLocalDateTime();

                    LocalDateTime endTime =
                            shift.getEnd_at()
                                    .toInstant()
                                    .atZone(ZoneId.systemDefault())
                                    .toLocalDateTime();

                    weekHours +=
                            Duration.between(
                                    startTime,
                                    endTime
                            ).toMinutes() / 60.0;
                }

                // 주 15시간 미만
                if (weekHours < 15) {
                    continue;
                }

                // 개근 체크
                if (!isWeeklyAttendanceComplete(
                        weekShifts,
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

    // =========================
    // 주휴 개근 체크
    // =========================

    private boolean isWeeklyAttendanceComplete(
            List<ShiftVO> weekShifts,
            List<FixedscheduleVO> schedules
    ) {

        Set<String> workedDays =
                new HashSet<>();

        for (ShiftVO shift : weekShifts) {

            LocalDate date =
                    shift.getWork_date()
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
}