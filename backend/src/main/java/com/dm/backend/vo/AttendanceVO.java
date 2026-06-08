package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceVO {

    private String id;

    private String store_id;

    private String user_id;

    private String shift_id;

    private Date work_date;

    private Date check_in_at;

    private Date check_out_at;

    private Integer work_minutes;

    private Integer overtime_minutes;

    private String status;
}