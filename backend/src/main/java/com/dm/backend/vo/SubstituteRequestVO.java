package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubstituteRequestVO {
    private String id;
    private String shift_id;
    private String status;
    private Timestamp created_at;
}
