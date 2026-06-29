package com.dm.backend.service;

import com.dm.backend.mapper.AttendanceMapper;
import com.dm.backend.vo.AttendanceVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceMapper attendanceMapper;

    public String checkAttendance(
            String store_id,
            String user_id
    ) {
        Date now =
                new Date();

        AttendanceVO attendance =
                attendanceMapper.getTodayAttendance(
                        store_id,
                        user_id,
                        now
                );

        if (attendance == null) {
            AttendanceVO checkInVO =
                    new AttendanceVO(
                            UUID.randomUUID()
                                    .toString()
                                    .replace("-", "")
                                    .substring(0, 21),
                            store_id,
                            user_id,
                            null,
                            now,
                            now,
                            null,
                            0,
                            0,
                            "WORKING"
                    );

            attendanceMapper.checkIn(
                    checkInVO
            );

            return "출근 처리 완료";
        }

        boolean alreadyCheckedOut =
                attendance.getCheck_out_at() != null;

        long workMinutes =
                (now.getTime()
                        - attendance.getCheck_in_at().getTime())
                        / (1000 * 60);

        attendance.setCheck_out_at(
                now
        );

        attendance.setWork_minutes(
                (int) Math.max(0, workMinutes)
        );

        attendance.setOvertime_minutes(
                0
        );

        attendance.setStatus(
                "COMPLETED"
        );

        attendanceMapper.checkOut(
                attendance
        );

        if (alreadyCheckedOut) {
            return "퇴근 시간 갱신 완료";
        }

        return "퇴근 처리 완료";
    }

    public List<AttendanceVO> getMonthlyAttendance(
            String store_id,
            String user_id,
            String yearMonth
    ) {
        return attendanceMapper.getMonthlyAttendance(
                store_id,
                user_id,
                yearMonth
        );
    }
}
