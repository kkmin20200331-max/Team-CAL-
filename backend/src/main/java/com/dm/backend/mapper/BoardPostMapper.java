package com.dm.backend.mapper;

import com.dm.backend.vo.BoardPostVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BoardPostMapper {

    // =========================
    // [공통]
    // =========================

    // 게시글 목록 조회
    // ✅ [수정] 작성자 아이디(username) 및 실명(writer_name) 표시를 위해 users 테이블 JOIN 적용
    @Select("""
        SELECT p.*, u.username, u.name AS writer_name
        FROM BOARD_POST p
        LEFT JOIN users u ON p.writer_id = u.id
        WHERE p.BOARD_ID = #{board_id}
        AND p.STATUS = 'PUBLISHED'
        ORDER BY p.IS_PINNED DESC,
                 p.CREATED_AT DESC
    """)
    List<BoardPostVO> getPostList(
            String board_id
    );



    // 게시글 단건 조회
    // ✅ [수정] 작성자 아이디(username) 및 실명(writer_name) 표시를 위해 users 테이블 JOIN 적용
    @Select("""
        SELECT p.*, u.username, u.name AS writer_name
        FROM BOARD_POST p
        LEFT JOIN users u ON p.writer_id = u.id
        WHERE p.ID = #{id}
    """)
    BoardPostVO getPost(
            String id
    );



    // 조회수 증가
    @Update("""
        UPDATE BOARD_POST
        SET VIEW_COUNT = VIEW_COUNT + 1
        WHERE ID = #{id}
    """)
    void increaseViewCount(
            String id
    );



    // 게시글 검색
    // ✅ [수정] 작성자 아이디(username) 및 실명(writer_name) 표시를 위해 users 테이블 JOIN 적용
    @Select("""
        SELECT p.*, u.username, u.name AS writer_name
        FROM BOARD_POST p
        LEFT JOIN users u ON p.writer_id = u.id
        WHERE p.STORE_ID = #{store_id}
        AND p.STATUS = 'PUBLISHED'
        AND (
            p.TITLE LIKE '%' || #{keyword} || '%'
            OR p.CONTENT LIKE '%' || #{keyword} || '%'
        )
        ORDER BY p.IS_PINNED DESC,
                 p.CREATED_AT DESC
    """)
    List<BoardPostVO> searchPost(
            @Param("store_id") String store_id,
            @Param("keyword") String keyword
    );



    // =========================
    // [관리자]
    // =========================

    // 게시글 등록
    @Insert("""
        INSERT INTO BOARD_POST
        (
            ID,
            BOARD_ID,
            STORE_ID,
            WRITER_ID,
            TITLE,
            CONTENT,
            STATUS,
            IS_PINNED,
            VIEW_COUNT,
            COMMENT_COUNT
        )
        VALUES
        (
            #{id},
            #{board_id},
            #{store_id},
            #{writer_id},
            #{title},
            #{content},
            #{status},
            #{is_pinned},
            0,
            0
        )
    """)
    void createPost(
            BoardPostVO vo
    );



    // 게시글 수정
    @Update("""
        UPDATE BOARD_POST
        SET
            TITLE = #{title},
            CONTENT = #{content},
            STATUS = #{status},
            IS_PINNED = #{is_pinned},
            UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID = #{id}
    """)
    void updatePost(
            BoardPostVO vo
    );



    // 게시글 삭제
    @Delete("""
        DELETE FROM BOARD_POST
        WHERE ID = #{id}
    """)
    void deletePost(
            String id
    );

}
