package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubstituteApplicationVO {
    private String id;

    private String substitute_post_id;

    private String applicant_user_id;

    private String message;

    private String status;

    private LocalDateTime applied_at;
}
