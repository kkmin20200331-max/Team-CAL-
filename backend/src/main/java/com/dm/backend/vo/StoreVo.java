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
    private String address;
    private Integer capacity;
    private String open_time;
    private String close_time;
}
