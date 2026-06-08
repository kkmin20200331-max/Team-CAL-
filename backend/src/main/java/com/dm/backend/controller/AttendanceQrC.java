package com.dm.backend.controller;

import com.dm.backend.service.AttendanceQrService;
import com.dm.backend.vo.AttendanceQrVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/attendance/qr")
public class AttendanceQrC {

    @Autowired
    private AttendanceQrService attendanceQrService;

    // =========================
    // 관리자
    // =========================

    @PostMapping("/{store_id}")
    public AttendanceQrVO generateQr(
            @PathVariable
            String store_id
    ) {

        return attendanceQrService.generateQr(
                store_id
        );
    }
}