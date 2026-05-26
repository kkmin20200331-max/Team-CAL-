package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShiftVO {
    private String id;
    private String store_id;
    private String user_id;
    private Date work_date;    // DATE 타입 매핑
    private Date start_at;     // TIMESTAMP 타입 매핑
    private Date end_at;       // TIMESTAMP 타입 매핑
    private String status;
}
