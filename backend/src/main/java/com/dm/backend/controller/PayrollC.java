package com.dm.backend.controller;

import com.dm.backend.service.PayrollService;
import com.dm.backend.vo.PayrollResultVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

@RestController
@RequestMapping("/api/payroll")
public class PayrollC {

    @Autowired
    private PayrollService payrollService;

    @GetMapping
    public PayrollResultVO getMonthlyPay(
            @RequestParam String user_id,
            @RequestParam String store_id,
            @RequestParam Date start_date,
            @RequestParam Date end_date
    ) {
        return payrollService.calculateMonthlyPay(
                user_id,
                store_id,
                start_date,
                end_date
        );
    }
}
