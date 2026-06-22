package com.dm.backend.mapper;

import com.dm.backend.vo.UserLineVO;
import org.apache.ibatis.annotations.*;

@Mapper
public interface UserLineMapper {

    // =========================
    // LINE 연동 등록
    // =========================

    @Insert("""
        INSERT INTO USER_LINE
        (
            USER_ID,
            LINE_USER_ID,
            FOLLOW_YN
        )
        VALUES
        (
            #{user_id},
            #{line_user_id},
            'N'
        )
    """)
    void register(
            UserLineVO vo
    );



    // =========================
    // USER_ID 조회
    // =========================

    @Select("""
        SELECT *
        FROM USER_LINE
        WHERE USER_ID = #{user_id}
    """)
    UserLineVO findByUserId(
            String user_id
    );



    // =========================
    // LINE_USER_ID 조회
    // =========================

    @Select("""
        SELECT *
        FROM USER_LINE
        WHERE LINE_USER_ID = #{line_user_id}
    """)
    UserLineVO findByLineUserId(
            String line_user_id
    );



    // =========================
    // LINE 연동 조회
    // =========================

    @Select("""
        SELECT *
        FROM USER_LINE
        WHERE USER_ID = #{user_id}
    """)
    UserLineVO getLineInfo(
            String user_id
    );



    // =========================
    // 알림 가능 LINE USER ID 조회
    // =========================

    @Select("""
        SELECT LINE_USER_ID
        FROM USER_LINE
        WHERE USER_ID = #{user_id}
        AND FOLLOW_YN = 'Y'
    """)
    String getLineUserId(
            String user_id
    );



    // =========================
    // LINE USER ID 변경
    // =========================

    @Update("""
        UPDATE USER_LINE
        SET LINE_USER_ID = #{line_user_id}
        WHERE USER_ID = #{user_id}
    """)
    void updateLineUserId(
            UserLineVO vo
    );



    // =========================
    // 친구추가
    // =========================

    @Update("""
        UPDATE USER_LINE
        SET FOLLOW_YN = 'Y'
        WHERE LINE_USER_ID = #{line_user_id}
    """)
    void follow(
            String line_user_id
    );



    // =========================
    // 친구삭제
    // =========================

    @Update("""
        UPDATE USER_LINE
        SET FOLLOW_YN = 'N'
        WHERE LINE_USER_ID = #{line_user_id}
    """)
    void unfollow(
            String line_user_id
    );



    // =========================
    // LINE 연동 삭제
    // =========================

    @Delete("""
        DELETE FROM USER_LINE
        WHERE USER_ID = #{user_id}
    """)
    void delete(
            String user_id
    );

    // =========================
    // shift_id → OWNER LINE USER ID 조회
    // (shift → user → line_user_id)
    // =========================
    @Select("""
        SELECT ul.LINE_USER_ID
        FROM USER_LINE ul
        JOIN SHIFT s
            ON s.USER_ID = ul.USER_ID
        WHERE s.ID = #{shift_id}
        AND ul.FOLLOW_YN = 'Y'
    """)
    String getOwnerLineUserIdByShiftId(String shift_id);


}