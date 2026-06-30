package com.dm.backend.mapper;

import com.dm.backend.vo.BoardVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BoardMapper {

    // =========================
    // [관리자]
    // =========================

    // 게시판 생성 (오라클 DB 호환을 위해 now() 대신 SYSDATE 사용)
    @Insert("""
            insert into board
            (
                id,
                store_id,
                name,
                created_by,
                created_at
            )
            values(
                #{id},
                #{store_id},
                #{name},
                #{created_by},
                SYSDATE -- 오라클 DB 환경에 맞춰 SYSDATE로 수정
            )
            """)
    void registerBoard(BoardVO boardVO);

    // 게시판 수정
    @Update("""
            update board
            set name = #{name}
            where id = #{id}
            """)
    void updateBoard(BoardVO boardVO);

    // 게시판 삭제
    @Delete("""
            delete from board
            where id = #{id}
            """)
    void deleteBoard(String id);

    @Select("""
            select count(*)
            from board_post
            where board_id = #{id}
            """)
    int countPostByBoardId(String id);


    // =========================
    // [공통]
    // =========================

    // 매장 게시판 목록 조회
    @Select("""
            select *
            from board
            where store_id = #{store_id}
            order by created_at asc
            """)
    List<BoardVO> getBoardList(String store_id);

    // 게시판 단건 조회
    @Select("""
            select *
            from board
            where id = #{id}
            """)
    BoardVO getBoard(String id);

    @Select("""
            select *
            from board
            where store_id = #{store_id}
            and upper(trim(name)) = upper(trim(#{name}))
            """)
    BoardVO getBoardByStoreAndName(
            @Param("store_id") String store_id,
            @Param("name") String name
    );
}
