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

    private String status;

    private String is_pinned;

    private Integer comment_count;

    private Integer view_count;

    // ✅ [추가] 게시글 조회 시 작성자의 아이디(username)와 이름(writer_name)을 함께 들고 오기 위한 필드
    private String username;
    private String writer_name;
}