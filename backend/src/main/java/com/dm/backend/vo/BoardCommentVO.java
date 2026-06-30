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

    // ✅ [추가] 댓글 조회 시 작성자의 아이디(username)와 이름(user_name)을 함께 들고 오기 위한 필드
    private String username;
    private String user_name;
}