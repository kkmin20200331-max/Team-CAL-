package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoreVo {
    private String id;
    private String name;
    private String type;
    private String address;
    private Integer capacity;
    private String open_time;
    private String close_time;
    private String owner_user_id;
    private String approval_status;
    private String member_role;

    // 시급 정보 동기화를 위한 필드 추가
    private Double pay_amount;
    private String pay_type;
}

