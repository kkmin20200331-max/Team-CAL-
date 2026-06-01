package com.dm.backend.service;

import com.dm.backend.mapper.FixedscheduleMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.vo.FixedscheduleVO;
import com.dm.backend.vo.PayrollResultVO;
import com.dm.backend.vo.ShiftVO;
import com.dm.backend.vo.StoreMemberVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.WeekFields;
import java.util.*;

@Service
public class PayrollService {

    @Autowired
    private ShiftMapper shiftMapper;

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    @Autowired
    private FixedscheduleMapper fixedscheduleMapper;

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

        Map<Integer, List<ShiftVO>> weekMap =
                new HashMap<>();

        // =========================
        // 주차별 그룹핑
        // =========================

        for (ShiftVO shift : shifts) {

            LocalDate workDate =
                    shift.getWork_date()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate();

            int week =
                    workDate.get(
                            WeekFields.ISO.weekOfMonth()
                    );

            weekMap
                    .computeIfAbsent(
                            week,
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
                            * 1.5;

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

                if (
                        weekHours >= 15
                                &&
                                isWeeklyAttendanceComplete(
                                        weekShifts,
                                        schedules
                                )
                ) {

                    weeklyPay +=
                            (weekHours / 40.0)
                                    * pay_amount;
                }
            }
        }

        else if ("MONTHLY".equalsIgnoreCase(pay_type)) {

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