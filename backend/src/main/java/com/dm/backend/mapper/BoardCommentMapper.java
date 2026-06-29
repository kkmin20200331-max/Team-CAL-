package com.dm.backend.mapper;

import com.dm.backend.vo.BoardCommentVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BoardCommentMapper {

    // =========================
    // [공통]
    // =========================

    // 댓글 목록 (게시글 기준)
    // ✅ [수정] 댓글 작성자 아이디(username) 및 실명(user_name) 표시를 위해 users 테이블 JOIN 적용
    @Select("""
        SELECT c.*, u.username, u.name AS user_name
        FROM BOARD_COMMENT c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.POST_ID = #{post_id}
        AND c.STATUS = 'ACTIVE'
        ORDER BY c.CREATED_AT ASC
    """)
    List<BoardCommentVO> getCommentList(
            @Param("post_id") String post_id
    );

    // =========================
    // [직원]
    // =========================

    // 댓글 등록
    @Insert("""
        INSERT INTO BOARD_COMMENT (
            ID,
            POST_ID,
            STORE_ID,
            USER_ID,
            PARENT_ID,
            CONTENT,
            STATUS
        )
        VALUES (
            #{id},
            #{post_id},
            #{store_id},
            #{user_id},
            #{parent_id, jdbcType=VARCHAR},
            #{content},
            'ACTIVE'
        )
    """)
    void createComment(BoardCommentVO vo);

    // 댓글 수정
    @Update("""
        UPDATE BOARD_COMMENT
        SET CONTENT = #{content},
            UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID = #{id}
    """)
    void updateComment(BoardCommentVO vo);

    // 댓글 삭제 (soft delete 추천)
    @Update("""
        UPDATE BOARD_COMMENT
        SET STATUS = 'DELETED',
            UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID = #{id}
    """)
    void deleteComment(@Param("id") String id);

    // ✅ [추가] 댓글 ID로 단일 댓글 조회 (댓글 삭제 전 본인 확인용)
    // ✅ [수정] 댓글 작성자 아이디(username) 및 실명(user_name) 표시를 위해 users 테이블 JOIN 적용
    @Select("""
        SELECT c.*, u.username, u.name AS user_name
        FROM BOARD_COMMENT c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.ID = #{id}
    """)
    BoardCommentVO getCommentById(@Param("id") String id);



    // =========================
    // 게시글 댓글 수 동기화
    // =========================

    @Update("""
        UPDATE BOARD_POST
        SET COMMENT_COUNT = (
            SELECT COUNT(*)
            FROM BOARD_COMMENT
            WHERE POST_ID = #{post_id}
            AND STATUS = 'ACTIVE'
        )
        WHERE ID = #{post_id}
    """)
    void syncCommentCount(@Param("post_id") String post_id);
}