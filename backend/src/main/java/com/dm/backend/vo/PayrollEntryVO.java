package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayrollEntryVO {
    private String id;
    private String employeeId;
    private String employeeName;
    private String position;
    private String location;
    private String period;
    private double regularHours;
    private double overtimeHours;
    private double holidayHours;
    private double hourlyRate;
    private double basePay;
    private double overtimePay;
    private double holidayPay;
    private double tax;
    private double insurance;
    private double pension;
    private double totalPay;
    private String status;
    private String requestedDate;
    private String paidDate;
}
