package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubstituteRequestVO {
    private String id;
    private String shift_id;
    private Date work_date;
    private String start_at;
    private String end_at;
    private int pay_rate;
    private String status;
    private Timestamp created_at;
}
