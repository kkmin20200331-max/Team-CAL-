package com.dm.backend.mapper;

import com.dm.backend.vo.AttendanceQrVO;
import org.apache.ibatis.annotations.*;

@Mapper
public interface AttendanceQrMapper {

    // =========================
    // 관리자
    // =========================

    @Insert("""
        INSERT INTO ATTENDANCE_QR
        (
            QR_TOKEN,
            STORE_ID,
            CREATED_AT,
            EXPIRED_AT,
            IS_ACTIVE
        )
        VALUES
        (
            #{qr_token},
            #{store_id},
            #{created_at},
            #{expired_at},
            'Y'
        )
    """)
    void createQr(
            AttendanceQrVO vo
    );

    @Select("""
        SELECT *
        FROM ATTENDANCE_QR
        WHERE QR_TOKEN = #{qr_token}
        AND IS_ACTIVE = 'Y'
    """)
    AttendanceQrVO getQr(
            @Param("qr_token")
            String qr_token
    );

    @Update("""
        UPDATE ATTENDANCE_QR
        SET IS_ACTIVE = 'N'
        WHERE QR_TOKEN = #{qr_token}
    """)
    void expireQr(
            @Param("qr_token")
            String qr_token
    );
}