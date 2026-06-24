package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminApplicationVo {
    private String id;
    private String user_id;
    private String store_name;
    private String store_address;
    private String store_type;
    private Integer capacity;
    private String open_time;
    private String close_time;
    private String business_number;
    private String status;
    private String reject_reason;
    private LocalDateTime created_at;
    private LocalDateTime reviewed_at;
    private String reviewed_by;

    private String user_name;
    private String username;
    private String phone;
}
