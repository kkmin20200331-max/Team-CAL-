package com.dm.backend.service;

import com.dm.backend.mapper.AttendanceMapper;
import com.dm.backend.vo.AttendanceVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
public class AttendanceServiceImpl
        implements AttendanceService {

    @Autowired
    private AttendanceMapper attendanceMapper;

    @Override
    public String checkAttendance(
            String store_id,
            String user_id
    ) {

        AttendanceVO attendance =
                attendanceMapper.getTodayAttendance(
                        store_id,
                        user_id
                );

        // =========================
        // 출근
        // =========================

        if(attendance == null){

            AttendanceVO checkInVO =
                    new AttendanceVO(
                            UUID.randomUUID()
                                    .toString()
                                    .replace("-","")
                                    .substring(0,21),
                            store_id,
                            user_id,
                            null,
                            new Date(),
                            new Date(),
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

        // =========================
        // 퇴근
        // =========================

        if(attendance.getCheck_out_at() == null){

            Date checkOutAt = new Date();

            long workMinutes =
                    (checkOutAt.getTime() - attendance.getCheck_in_at().getTime())
                            / (1000 * 60);

            attendance.setCheck_out_at(checkOutAt);
            attendance.setWork_minutes((int) workMinutes);
            attendance.setOvertime_minutes(0);
            attendance.setStatus("COMPLETED");

            attendanceMapper.checkOut(attendance);

            return "퇴근 처리 완료";
        }

        // =========================
        // 이미 퇴근
        // =========================

        return "이미 퇴근 처리되었습니다.";
    }
}
