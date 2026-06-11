package com.dm.backend.mapper;

import com.dm.backend.vo.UserLineVO;
import org.apache.ibatis.annotations.*;

@Mapper
public interface UserLineMapper {

    // LINE 연동 등록
    @Insert("""
        INSERT INTO USER_LINE
        (
            USER_ID,
            LINE_USER_ID
        )
        VALUES
        (
            #{user_id},
            #{line_user_id}
        )
    """)
    void register(
            UserLineVO vo
    );



    // LINE 연동 조회
    @Select("""
        SELECT *
        FROM USER_LINE
        WHERE USER_ID = #{user_id}
    """)
    UserLineVO getLineInfo(
            String user_id
    );



    // LINE USER ID 조회
    @Select("""
        SELECT LINE_USER_ID
        FROM USER_LINE
        WHERE USER_ID = #{user_id}
    """)
    String getLineUserId(
            String user_id
    );



    // LINE 연동 수정
    @Update("""
        UPDATE USER_LINE
        SET LINE_USER_ID = #{line_user_id}
        WHERE USER_ID = #{user_id}
    """)
    void update(
            UserLineVO vo
    );



    // LINE 연동 삭제
    @Delete("""
        DELETE FROM USER_LINE
        WHERE USER_ID = #{user_id}
    """)
    void delete(
            String user_id
    );

}