package com.dm.backend.mapper;

import com.dm.backend.vo.AttendanceVO;
import org.apache.ibatis.annotations.*;

@Mapper
public interface AttendanceMapper {

    // =========================
    // 직원
    // =========================

    @Select("""
    SELECT *
    FROM ATTENDANCE
    WHERE STORE_ID = #{store_id}
    AND USER_ID = #{user_id}
""")
    AttendanceVO getTodayAttendance(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id
    );

    @Insert("""
        INSERT INTO ATTENDANCE
        (
            ID,
            STORE_ID,
            USER_ID,
            SHIFT_ID,
            WORK_DATE,
            CHECK_IN_AT,
            STATUS
        )
        VALUES
        (
            #{id},
            #{store_id},
            #{user_id},
            #{shift_id},
            TRUNC(SYSDATE),
            #{check_in_at},
            #{status}
        )
    """)
    void checkIn(
            AttendanceVO vo
    );

    @Update("""
        UPDATE ATTENDANCE
        SET
            CHECK_OUT_AT = #{check_out_at},
            WORK_MINUTES = #{work_minutes},
            OVERTIME_MINUTES = #{overtime_minutes},
            STATUS = #{status}
        WHERE ID = #{id}
    """)
    void checkOut(
            AttendanceVO vo
    );
}