package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubstitutePostVO {
    private String id;

    private String shift_id;

    private String store_id;

    private String requester_user_id;

    private String reason;

    private String status;

    private LocalDateTime created_at;

    private LocalDateTime closed_at;
}
