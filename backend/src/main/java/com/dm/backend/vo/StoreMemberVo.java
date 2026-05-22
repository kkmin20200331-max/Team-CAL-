package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoreMemberVo {
    private String id;
    private String name;
    private String address;
    private String capacity;
    private String open_time;
    private String close_time;
}
