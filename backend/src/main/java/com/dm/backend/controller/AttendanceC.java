package com.dm.backend.controller;

import com.dm.backend.service.AttendanceService;
import com.dm.backend.vo.AttendanceVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceC {

    @Autowired
    private AttendanceService attendanceService;

    // =========================
    // 직원
    // =========================

    @PostMapping("/check")
    public String attendanceCheck(
            @RequestBody Map<String,String> request
    ) {

        return attendanceService.checkAttendance(
                request.get("store_id"),
                request.get("user_id")
        );
    }


    // =========================
    // 월별 출퇴근 조회
    // =========================

    @GetMapping("/monthly")
    public List<AttendanceVO> getMonthlyAttendance(

            @RequestParam String store_id,

            @RequestParam String user_id,

            @RequestParam String yearMonth

    ) {

        return attendanceService.getMonthlyAttendance(
                store_id,
                user_id,
                yearMonth
        );
    }

}