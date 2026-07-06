package com.dm.backend.mapper;

import com.dm.backend.vo.UserLineVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

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
            #{follow_yn}
        )
    """)
    void register(
            UserLineVO vo
    );



    // =========================
    // USER_ID 조회
    // =========================

    @Select("""
        SELECT
            USER_ID AS user_id,
            LINE_USER_ID AS line_user_id,
            FOLLOW_YN AS follow_yn
        FROM USER_LINE
        WHERE TRIM(USER_ID) = TRIM(#{user_id})
    """)
    UserLineVO findByUserId(
            String user_id
    );



    // =========================
    // LINE_USER_ID 조회
    // =========================

    @Select("""
        SELECT
            USER_ID AS user_id,
            LINE_USER_ID AS line_user_id,
            FOLLOW_YN AS follow_yn
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
        SELECT
            USER_ID AS user_id,
            LINE_USER_ID AS line_user_id,
            FOLLOW_YN AS follow_yn
        FROM USER_LINE
        WHERE TRIM(USER_ID) = TRIM(#{user_id})
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
        WHERE TRIM(USER_ID) = TRIM(#{user_id})
        AND UPPER(TRIM(FOLLOW_YN)) = 'Y'
    """)
    String getLineUserId(
            String user_id
    );



    // =========================
    // LINE USER ID 변경
    // =========================

    @Update("""
        UPDATE USER_LINE
        SET LINE_USER_ID = #{line_user_id},
            FOLLOW_YN = CASE
                WHEN #{follow_yn} IS NULL THEN FOLLOW_YN
                ELSE #{follow_yn}
            END
        WHERE TRIM(USER_ID) = TRIM(#{user_id})
    """)
    void updateLineUserId(
            UserLineVO vo
    );

    @Delete("""
        DELETE FROM USER_LINE
        WHERE LINE_USER_ID = #{line_user_id}
    """)
    void deleteByLineUserId(
            String line_user_id
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
        WHERE TRIM(USER_ID) = TRIM(#{user_id})
    """)
    void delete(
            String user_id
    );

    // =========================
    // shift_id → OWNER LINE USER ID 조회
    // (shift → user → line_user_id)
    // =========================
    @Select("""
        SELECT DISTINCT ul.LINE_USER_ID
        FROM SHIFT s
        JOIN STORE_MEMBER sm
            ON sm.STORE_ID = s.STORE_ID
        LEFT JOIN USERS u
            ON u.ID = sm.USER_ID
        JOIN USER_LINE ul
            ON TRIM(ul.USER_ID) = TRIM(sm.USER_ID)
        WHERE TRIM(s.ID) = TRIM(#{shift_id})
        AND UPPER(TRIM(sm.APPROVAL_STATUS)) = 'APPROVED'
        AND (
            UPPER(TRIM(sm.MEMBER_ROLE)) IN ('ADMIN', 'OWNER', 'MANAGER')
            OR UPPER(TRIM(u.ROLE)) IN ('ADMIN', 'MASTER')
        )
        AND UPPER(TRIM(ul.FOLLOW_YN)) = 'Y'
    """)
    List<String> getOwnerLineUserIdsByShiftId(String shift_id);

    @Select("""
        SELECT DISTINCT
            sm.USER_ID AS user_id,
            ul.LINE_USER_ID AS line_user_id,
            ul.FOLLOW_YN AS follow_yn,
            lang.LANGUAGE AS language
        FROM SHIFT s
        JOIN STORE_MEMBER sm
            ON sm.STORE_ID = s.STORE_ID
        LEFT JOIN USERS u
            ON u.ID = sm.USER_ID
        JOIN USER_LINE ul
            ON TRIM(ul.USER_ID) = TRIM(sm.USER_ID)
        LEFT JOIN USER_LANGUAGE lang
            ON TRIM(lang.USER_ID) = TRIM(sm.USER_ID)
        WHERE TRIM(s.ID) = TRIM(#{shift_id})
        AND UPPER(TRIM(sm.APPROVAL_STATUS)) = 'APPROVED'
        AND (
            UPPER(TRIM(sm.MEMBER_ROLE)) IN ('ADMIN', 'OWNER', 'MANAGER')
            OR UPPER(TRIM(u.ROLE)) IN ('ADMIN', 'MASTER')
        )
        AND UPPER(TRIM(ul.FOLLOW_YN)) = 'Y'
    """)
    List<UserLineVO> getOwnerLineTargetsByShiftId(String shift_id);

    @Select("""
        SELECT DISTINCT ul.LINE_USER_ID
        FROM STORE_MEMBER sm
        LEFT JOIN USERS u
            ON u.ID = sm.USER_ID
        JOIN USER_LINE ul
            ON TRIM(ul.USER_ID) = TRIM(sm.USER_ID)
        WHERE TRIM(sm.STORE_ID) = TRIM(#{store_id})
        AND UPPER(TRIM(sm.APPROVAL_STATUS)) = 'APPROVED'
        AND (
            UPPER(TRIM(sm.MEMBER_ROLE)) IN ('ADMIN', 'OWNER', 'MANAGER')
            OR UPPER(TRIM(u.ROLE)) IN ('ADMIN', 'MASTER')
        )
        AND UPPER(TRIM(ul.FOLLOW_YN)) = 'Y'
    """)
    List<String> getAdminLineUserIdsByStoreId(String store_id);

    @Select("""
        SELECT DISTINCT
            sm.USER_ID AS user_id,
            ul.LINE_USER_ID AS line_user_id,
            ul.FOLLOW_YN AS follow_yn,
            lang.LANGUAGE AS language
        FROM STORE_MEMBER sm
        LEFT JOIN USERS u
            ON u.ID = sm.USER_ID
        JOIN USER_LINE ul
            ON TRIM(ul.USER_ID) = TRIM(sm.USER_ID)
        LEFT JOIN USER_LANGUAGE lang
            ON TRIM(lang.USER_ID) = TRIM(sm.USER_ID)
        WHERE TRIM(sm.STORE_ID) = TRIM(#{store_id})
        AND UPPER(TRIM(sm.APPROVAL_STATUS)) = 'APPROVED'
        AND (
            UPPER(TRIM(sm.MEMBER_ROLE)) IN ('ADMIN', 'OWNER', 'MANAGER')
            OR UPPER(TRIM(u.ROLE)) IN ('ADMIN', 'MASTER')
        )
        AND UPPER(TRIM(ul.FOLLOW_YN)) = 'Y'
    """)
    List<UserLineVO> getAdminLineTargetsByStoreId(String store_id);


}
