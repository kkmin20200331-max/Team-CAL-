package com.dm.backend.mapper;

import com.dm.backend.vo.ShiftVO;
import org.apache.ibatis.annotations.*;
//@param
import org.apache.ibatis.annotations.Param;

import java.util.Date;
import java.util.List;

@Mapper
public interface ShiftMapper {

    // =========================
    // [공통]
    // =========================

    // 근무표 단건 조회
    @Select("""
            SELECT *
            FROM shift
            WHERE id = #{id}
            """)
    ShiftVO getShift(String id);

    //월별 근무 데이터 가져오기
    @Select("""
            SELECT *
            FROM shift
            WHERE user_id = #{user_id}
            AND TRUNC(work_date) BETWEEN TRUNC(#{start_date}) AND TRUNC(#{end_date})
            """)
    List<ShiftVO> getMonthlyShift(
            @Param("user_id") String user_id,
            @Param("start_date") Date start_date,
            @Param("end_date") Date end_date
    );

    // =========================
    // [관리자]
    // =========================

    // 근무표 등록
    @Insert("""
            INSERT INTO shift
            VALUES(
                #{id},
                #{store_id},
                #{user_id},
                #{work_date},
                #{start_at},
                #{end_at},
                #{status}
            )
            """)
    void registerShift(ShiftVO shiftVO);

    // 매장별 기간 조회
    @Select("""
            SELECT *
            FROM shift
            WHERE store_id = #{store_id}
            AND work_date >= TO_DATE(#{start_date}, 'YYYY-MM-DD')
            AND work_date <= TO_DATE(#{end_date}, 'YYYY-MM-DD')
            AND status != 'cancelled'
            ORDER BY work_date, start_at
            """)
    List<ShiftVO> getShiftList(
            @Param("store_id") String store_id,
            @Param("start_date") String start_date,
            @Param("end_date") String end_date
    );

    // 근무표 수정
    @Update("""
            UPDATE shift
            SET store_id = #{store_id},
                user_id = #{user_id},
                work_date = #{work_date},
                start_at = #{start_at},
                end_at = #{end_at},
                status = #{status}
            WHERE id = #{id}
            """)
    void updateShift(ShiftVO shiftVO);

    // 근무표 삭제
    @Delete("""
            DELETE FROM shift
            WHERE id = #{id}
            """)
    void delShift(String id);

    // 등록 시 중복 검사
    @Select("""
            SELECT COUNT(*)
            FROM shift
            WHERE user_id = #{user_id}
            AND TRUNC(work_date) = TRUNC(#{work_date})
            AND start_at < #{end_at}
            AND end_at > #{start_at}
            """)
    int checkShiftConflict(
            @Param("user_id") String user_id,
            @Param("work_date") Date work_date,
            @Param("start_at") Date start_at,
            @Param("end_at") Date end_at
    );

    // 수정 시 중복 검사
    @Select("""
            SELECT COUNT(*)
            FROM shift
            WHERE id != #{id}
            AND user_id = #{user_id}
            AND TRUNC(work_date) = TRUNC(#{work_date})
            AND start_at < #{end_at}
            AND end_at > #{start_at}
            """)
    int checkShiftConflictForUpdate(
            @Param("id") String id,
            @Param("user_id") String user_id,
            @Param("work_date") Date work_date,
            @Param("start_at") Date start_at,
            @Param("end_at") Date end_at
    );


    // =========================
    // [직원]
    // =========================

    // 내 근무표 조회
    @Select("""
            SELECT *
            FROM shift
            WHERE user_id = #{user_id}
            AND work_date >= TO_DATE(#{start_date}, 'YYYY-MM-DD')
            AND work_date <= TO_DATE(#{end_date}, 'YYYY-MM-DD')
            AND status != 'cancelled'
            ORDER BY work_date, start_at
            """)
    List<ShiftVO> getMyShiftList(
            @Param("user_id") String user_id,
            @Param("start_date") String start_date,
            @Param("end_date") String end_date
    );
}
