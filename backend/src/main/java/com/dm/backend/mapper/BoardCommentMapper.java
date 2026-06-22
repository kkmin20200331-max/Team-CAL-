package com.dm.backend.mapper;

import com.dm.backend.vo.BoardCommentVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BoardCommentMapper {

    // 댓글 목록 조회 (게시글별)
    @Select("""
        SELECT *
        FROM BOARD_COMMENT
        WHERE POST_ID = #{post_id}
        ORDER BY CREATED_AT ASC
    """)
    List<BoardCommentVO> getCommentList(String post_id);

    // 댓글 등록
    @Insert("""
        INSERT INTO BOARD_COMMENT (ID, POST_ID, USER_ID, CONTENT, CREATED_AT)
        VALUES (#{id}, #{post_id}, #{user_id}, #{content}, CURRENT_TIMESTAMP)
    """)
    void createComment(BoardCommentVO vo);

    // 댓글 삭제
    @Delete("""
        DELETE FROM BOARD_COMMENT
        WHERE ID = #{id}
    """)
    void deleteComment(String id);

    // 게시글 댓글 수 업데이트
    @Update("""
        UPDATE BOARD_POST
        SET COMMENT_COUNT = (
            SELECT COUNT(*) FROM BOARD_COMMENT WHERE POST_ID = #{post_id}
        )
        WHERE ID = #{post_id}
    """)
    void syncCommentCount(String post_id);
}
