package com.dm.backend.controller;

import com.dm.backend.service.PayrollService;
import com.dm.backend.vo.PayrollEntryVO;
import com.dm.backend.vo.PayrollResultVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/payroll")
public class PayrollC {

    @Autowired
    private PayrollService payrollService;

    // =========================
    // [공통]
    // =========================

    // 급여 조회
    @GetMapping
    public PayrollResultVO getPayroll(
            @RequestParam String user_id,
            @RequestParam String store_id,
            @RequestParam
            @DateTimeFormat(pattern = "yyyy-MM-dd")
            Date start_date,
            @RequestParam
            @DateTimeFormat(pattern = "yyyy-MM-dd")
            Date end_date
    ) {
        return payrollService.calculatePayroll(
                user_id,
                store_id,
                start_date,
                end_date
        );
    }

    // 관리자 급여 목록 조회
    @GetMapping("/store")
    public List<PayrollEntryVO> getStorePayroll(
            @RequestParam String store_id,
            @RequestParam String year_month
    ) {
        return payrollService.calculateStorePayroll(
                store_id,
                year_month
        );
    }
}
