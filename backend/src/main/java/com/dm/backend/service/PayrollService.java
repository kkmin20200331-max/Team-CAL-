package com.dm.backend.service;

import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.vo.PayrollResultVO;
import com.dm.backend.vo.ShiftVO;
import com.dm.backend.vo.StoreMemberVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Service
public class PayrollService {

    @Autowired
    private ShiftMapper shiftMapper;

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    public PayrollResultVO calculateMonthlyPay(String user_id, String store_id, Date start, Date end) {

        StoreMemberVo payInfo = storeMemberMapper.getPayInfo(user_id, store_id);
        List<ShiftVO> shifts = shiftMapper.getMonthlyShift(user_id, start, end);

        double hourlyRate = payInfo.getPay_amount();

        double baseHours = 0;
        double overtimePay = 0;
        double nightPay = 0;

        for (ShiftVO s : shifts) {

            LocalDateTime startTime =
                    s.getStart_at().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();

            LocalDateTime endTime =
                    s.getEnd_at().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();

            double workHours = Duration.between(startTime, endTime).toMinutes() / 60.0;

            // =====================
            // 기본 / 연장
            // =====================
            baseHours += Math.min(workHours, 8.0);

            double overtimeHours = Math.max(workHours - 8.0, 0);
            overtimePay += overtimeHours * hourlyRate * 1.5;

            // =====================
            // 야간
            // =====================
            LocalDateTime cursor = startTime;

            while (cursor.isBefore(endTime)) {

                if (isNight(cursor)) {
                    nightPay += (hourlyRate * 0.5) / 60.0;
                }

                cursor = cursor.plusMinutes(1);
            }
        }

        double basePay = baseHours * hourlyRate;

        // =====================
        // 주휴수당 (간단 버전)
        // =====================
        double weeklyPay = 0;

        double totalHours = baseHours;
        if (totalHours >= 15) {
            weeklyPay = (totalHours / 40.0) * hourlyRate;
        }

        // =====================
        // DTO 반환
        // =====================
        PayrollResultVO payVO = new PayrollResultVO();

        payVO.setBasePay(basePay);
        payVO.setOvertimePay(overtimePay);
        payVO.setNightPay(nightPay);
        payVO.setWeeklyPay(weeklyPay);

        payVO.setTotalPay(
                basePay + overtimePay + nightPay + weeklyPay
        );

        return payVO;
    }

    // =========================
    // 야간 시간 체크
    // =========================
    private boolean isNight(java.time.LocalDateTime time) {

        int hour = time.getHour();

        return (hour >= 22 || hour < 6);
    }
}