package com.dm.backend.mapper;

import com.dm.backend.vo.BoardVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BoardMapper {

    // =========================
    // [관리자]
    // =========================

    // 게시판 생성
    @Insert("""
            insert into board
            values(
                #{id},
                #{store_id},
                #{name},
                #{created_by},
                now()
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
}