package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubstituteHistoryVO {
    private String id;

    private String shift_id;

    private String store_id;

    private String original_user_id;

    private String substitute_user_id;

    private String approved_by;

    private LocalDateTime approved_at;
}
