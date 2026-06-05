package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoardPostVO {

    private String id;

    private String board_id;
    private String store_id;

    private String writer_id;

    private String title;
    private String content;

    private Date created_at;
    private Date updated_at;
}