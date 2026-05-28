package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class SubstituteApplyVO {
    private String id;
    private String substitute_request_id;
    private String applicant_user_id;
    private String status;
    private Timestamp applied_at;
}
