package com.dm.backend.controller;

import com.dm.backend.service.AttendanceQrService;
import com.dm.backend.vo.AttendanceQrVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/attendance/qr")
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

    // =========================
    // 직원
    // =========================

    @PostMapping("/check")
    public ResponseEntity<Map<String, String>> checkByQr(
            @RequestBody Map<String, String> request
    ) {

        try {
            String message =
                    attendanceQrService.checkAttendanceByQr(
                            request.get("qr_token"),
                            request.get("user_id")
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "status",
                            "SUCCESS",
                            "message",
                            message
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "status",
                                    "FAIL",
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }
}
