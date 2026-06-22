package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoardCommentVO {

    private String id;

    private String post_id;
    private String store_id;
    private String user_id;

    private String parent_id;

    private String content;

    private String status;

    private Date created_at;
    private Date updated_at;
}