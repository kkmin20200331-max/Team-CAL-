package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoreMemberVo {
    private String id;
    private String store_id;
    private String user_id;
    private String member_role;
    private String user_level;
    private String approval_status;
    private String pay_type;
    private Integer pay_amount;
    private String available_days;
}
