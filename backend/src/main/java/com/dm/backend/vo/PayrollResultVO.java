package com.dm.backend.vo;
import lombok.Data;

@Data
public class PayrollResultVO {

    private double basePay;        // 기본급
    private double overtimePay;    // 연장수당
    private double nightPay;       // 야간수당
    private double weeklyPay;      // 주휴수당
    private double totalPay;       // 총합
}
