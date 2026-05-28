package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeaveRequestVO {
    private String id;
    private String shift_id;      // SHIFT(id) 외래키 참조
    private String user_id;       // USERS(id) 외래키 참조
    private String reason;        // 사유
    private String status;        // PENDING, APPROVED, REJECTED
    private Date requested_at;    // 신청 일시 (TIMESTAMP)
    private Date processed_at;    // 처리 일시 (TIMESTAMP)
}
