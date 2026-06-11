package com.dm.backend.controller;

import com.dm.backend.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/attendance")
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

}