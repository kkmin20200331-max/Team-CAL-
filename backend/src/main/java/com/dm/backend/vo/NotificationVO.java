package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationVO {
    private String id;
    private String user_id;
    private String store_id;
    private String type;
    private String title;
    private String content;
    private String ref_id;
    private String is_read;
    private Date created_at;
}
