package com.dm.backend.mapper;

import com.dm.backend.vo.AttendanceVO;
import org.apache.ibatis.annotations.*;

import java.util.Date;
import java.util.List;

@Mapper
public interface AttendanceMapper {

    // =========================
    // 직원
    // =========================

    @Select("""
            SELECT *
            FROM (
                SELECT *
                FROM ATTENDANCE
                WHERE STORE_ID = #{store_id}
                AND USER_ID = #{user_id}
                AND TRUNC(WORK_DATE) = TRUNC(#{work_date})
                ORDER BY CHECK_IN_AT DESC
            )
            WHERE ROWNUM = 1
            """)
    AttendanceVO getTodayAttendance(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id,
            @Param("work_date") Date work_date
    );

    @Select("""
            SELECT *
            FROM ATTENDANCE
            WHERE STORE_ID = #{store_id}
            AND USER_ID = #{user_id}
            AND WORK_DATE >= TRUNC(#{start_date})
            AND WORK_DATE <= TRUNC(#{end_date})
            AND CHECK_IN_AT IS NOT NULL
            AND CHECK_OUT_AT IS NOT NULL
            ORDER BY WORK_DATE, CHECK_IN_AT
            """)
    List<AttendanceVO> getCompletedAttendanceList(
            @Param("user_id") String user_id,
            @Param("store_id") String store_id,
            @Param("start_date") Date start_date,
            @Param("end_date") Date end_date
    );
    // =========================
    // 월별 출퇴근 내역
    // =========================

    @Select("""
                SELECT *
                FROM ATTENDANCE
                WHERE STORE_ID = #{store_id}
                AND USER_ID = #{user_id}
                AND TO_CHAR(WORK_DATE,'YYYY-MM') = #{yearMonth}
                ORDER BY WORK_DATE DESC
            """)
    List<AttendanceVO> getMonthlyAttendance(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id,
            @Param("yearMonth") String yearMonth
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
                    #{shift_id,jdbcType=VARCHAR},
                    TRUNC(#{work_date}),
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
