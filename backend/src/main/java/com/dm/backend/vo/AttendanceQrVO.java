package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceQrVO {

    private String qr_token;

    private String store_id;

    private Date created_at;

    private Date expired_at;

    private String is_active;
}