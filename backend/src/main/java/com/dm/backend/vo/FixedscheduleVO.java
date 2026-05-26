package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FixedscheduleVO {
    private String id;
    private String store_id;
    private String user_id;
    private String weekday;
    private String start_time;
    private String end_time;
    private String active;
}
