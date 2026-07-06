package com.dm.backend.mapper;

import com.dm.backend.vo.FixedscheduleVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FixedscheduleMapper {

    // =========================
    // [공통]
    // =========================

    // 고정 스케줄 단건 조회
    @Select("""
            SELECT *
            FROM fixed_schedule
            WHERE id = #{id}
            """)
    FixedscheduleVO getFixedSchedule(
            String id
    );

    //급여 관리에 필요한 개근 조회
    @Select("""
                SELECT *
                FROM fixed_schedule
                WHERE user_id = #{user_id}
                AND store_id = #{store_id}
                AND active = 'Y'
            """)
    List<FixedscheduleVO> getActiveSchedule(
            @Param("user_id") String user_id,
            @Param("store_id") String store_id
    );

    // =========================
    // [관리자]
    // =========================

    // 고정 스케줄 등록
    @Insert("""
            INSERT INTO fixed_schedule
            VALUES (
                #{id},
                #{store_id},
                #{user_id},
                #{weekday},
                #{start_time},
                #{end_time},
                #{active}
            )
            """)
    void registerFixedschedule(
            FixedscheduleVO fixedscheduleVO
    );

    // 매장별 고정 스케줄 조회
    @Select("""
            SELECT *
            FROM fixed_schedule
            WHERE store_id = #{store_id}
            """)
    List<FixedscheduleVO> getFixedScheduleList(
            String store_id
    );

    // 고정 스케줄 수정
    @Update("""
            UPDATE fixed_schedule
            SET weekday = #{weekday},
                start_time = #{start_time},
                end_time = #{end_time},
                active = #{active}
            WHERE id = #{id}
            """)
    void updateFixedSchedule(
            FixedscheduleVO fixedscheduleVO
    );

    // 고정 스케줄 삭제
    @Delete("""
            DELETE FROM fixed_schedule
            WHERE id = #{id}
            """)
    void delFixedSchedule(
            String id
    );

    // 고정 스케줄 비활성화 (user_id + store_id + weekday 기준)
    @Update("""
            UPDATE fixed_schedule
            SET active = 'N'
            WHERE user_id = #{user_id}
            AND store_id = #{store_id}
            AND weekday = #{weekday}
            """)
    void deactivateFixedSchedule(
            @Param("user_id") String user_id,
            @Param("store_id") String store_id,
            @Param("weekday") String weekday
    );

    // 비활성화된 고정 스케줄 재활성화 (동일 조건)
    @Update("""
            UPDATE fixed_schedule
            SET active = 'Y',
                start_time = #{start_time},
                end_time = #{end_time}
            WHERE store_id = #{store_id}
            AND user_id = #{user_id}
            AND weekday = #{weekday}
            AND active = 'N'
            """)
    int reactivateFixedSchedule(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id,
            @Param("weekday") String weekday,
            @Param("start_time") String start_time,
            @Param("end_time") String end_time
    );

    // 동일 데이터 존재 여부
    @Select("""
            SELECT COUNT(*)
            FROM fixed_schedule
            WHERE store_id = #{store_id}
            AND user_id = #{user_id}
            AND weekday = #{weekday}
            AND start_time = #{start_time}
            AND end_time = #{end_time}
            """)
    int existsFixedSchedule(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id,
            @Param("weekday") String weekday,
            @Param("start_time") String start_time,
            @Param("end_time") String end_time
    );

    // 등록 시 시간 중복 체크
    @Select("""
            SELECT COUNT(*)
            FROM fixed_schedule
            WHERE store_id = #{store_id}
            AND user_id = #{user_id}
            AND weekday = #{weekday}
            AND start_time < #{end_time}
            AND end_time > #{start_time}
            """)
    int checkFixedScheduleConflict(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id,
            @Param("weekday") String weekday,
            @Param("start_time") String start_time,
            @Param("end_time") String end_time
    );

    // 수정 시 시간 중복 체크
    @Select("""
            SELECT COUNT(*)
            FROM fixed_schedule
            WHERE store_id = #{store_id}
            AND user_id = #{user_id}
            AND weekday = #{weekday}
            AND id != #{id}
            AND start_time < #{end_time}
            AND end_time > #{start_time}
            """)
    int checkFixedScheduleConflictForUpdate(
            @Param("id") String id,
            @Param("store_id") String store_id,
            @Param("user_id") String user_id,
            @Param("weekday") String weekday,
            @Param("start_time") String start_time,
            @Param("end_time") String end_time
    );
}
