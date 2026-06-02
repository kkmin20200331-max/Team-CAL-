package com.dm.backend.mapper;

import com.dm.backend.vo.BoardPostVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BoardPostMapper {

    // =========================
    // [공통]
    // =========================

    // 게시글 작성
    @Insert("""
            insert into board_post
            values(
                #{id},
                #{board_id},
                #{store_id},
                #{writer_id},
                #{title},
                #{content},
                now(),
                now()
            )
            """)
    void registerPost(BoardPostVO boardPostVO);

    // 게시글 수정
    @Update("""
            update board_post
            set title = #{title},
                content = #{content},
                updated_at = now()
            where id = #{id}
            """)
    void updatePost(BoardPostVO boardPostVO);

    // 게시글 삭제
    @Delete("""
            delete from board_post
            where id = #{id}
            """)
    void deletePost(String id);


    // 게시글 목록 조회
    @Select("""
            select *
            from board_post
            where board_id = #{board_id}
            order by created_at desc
            """)
    List<BoardPostVO> getPostList(String board_id);

    // 게시글 조회
    @Select("""
            select *
            from board_post
            where id = #{id}
            """)
    BoardPostVO getPost(String id);
}