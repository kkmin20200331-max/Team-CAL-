package com.dm.backend.controller;

import com.dm.backend.service.AdminApplicationService;
import com.dm.backend.vo.AdminApplicationVo;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin-applications")
public class AdminApplicationC {

    private final AdminApplicationService adminApplicationService;

    // =========================
    // 관리자 가입 신청 목록
    // =========================
    @GetMapping
    public List<AdminApplicationVo> getApplications(
            @RequestParam(required = false) String status
    ) {
        return adminApplicationService.getApplications(status);
    }

    // =========================
    // 관리자 가입 신청 승인
    // =========================
    @PutMapping("/{id}/approve")
    public void approveApplication(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        adminApplicationService.approveApplication(id, body != null ? body.get("reviewed_by") : null);
    }

    // =========================
    // 관리자 가입 신청 거절
    // =========================
    @PutMapping("/{id}/reject")
    public void rejectApplication(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        adminApplicationService.rejectApplication(
                id,
                body != null ? body.get("reject_reason") : null,
                body != null ? body.get("reviewed_by") : null
        );
    }
}
