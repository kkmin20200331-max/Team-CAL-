package com.dm.backend.mapper;

import com.dm.backend.vo.ShiftVO;
import org.apache.ibatis.annotations.*;

import java.util.Date;
import java.util.List;

@Mapper
public interface ShiftMapper {
    @Insert("insert into shift values(#{id}, #{store_id}, #{user_id}, #{work_date}, #{start_at}, #{end_at}, #{status})")
    void registerShift(ShiftVO shiftVO);

    // 캘린더 조회용 (특정 매장의 특정 기간 근무표 전체 조회)
    // Oracle의 TO_DATE를 활용해 문자열 기간 파싱 매칭
    @Select("select * from shift where store_id = #{store_id} " +
            "and work_date >= TO_DATE(#{start_date}, 'YYYY-MM-DD') " +
            "and work_date <= TO_DATE(#{end_date}, 'YYYY-MM-DD') " +
            "order by work_date, start_at")
    List<ShiftVO> getShiftList(String store_id, String start_date, String end_date);

    @Select("select * from shift where id = #{id}")
    ShiftVO getShift(String id);

    @Update("update shift set store_id = #{store_id}, user_id = #{user_id}, work_date = #{work_date}, start_at = #{start_at}, end_at = #{end_at}, status = #{status} where id = #{id}")
    void updateShift(ShiftVO shiftVO);

    @Delete("delete from shift where id = #{id}")
    void delShift(String id);



    //근무시간 충돌 검사
    @Select("""
                select count(*)
                from shift
                where user_id = #{user_id}
                and TRUNC(work_date) = TRUNC(#{work_date})
                and start_at < #{end_at}
                and end_at > #{start_at}
            """)
    int checkShiftConflict(
            @Param("user_id") String user_id,
            @Param("work_date") Date work_date,
            @Param("start_at") Date start_at,
            @Param("end_at") Date end_at
    );

    //직원용 기간 내 근무 조회
    @Select("""
                select *
                from shift
                where user_id = #{user_id}
                and work_date >= TO_DATE(#{start_date}, 'YYYY-MM-DD')
                and work_date <= TO_DATE(#{end_date}, 'YYYY-MM-DD')
                order by work_date, start_at
            """)
    List<ShiftVO> getMyShiftList(
            @Param("user_id") String user_id,
            @Param("start_date") String start_date,
            @Param("end_date") String end_date
    );

    @Select("""
                select count(*)
                from shift
                where id != #{id}
                and user_id = #{user_id}
                and TRUNC(work_date) = TRUNC(#{work_date})
                and start_at < #{end_at}
                and end_at > #{start_at}
            """)
    int checkShiftConflictForUpdate(
            @Param("id") String id,
            @Param("user_id") String user_id,
            @Param("work_date") Date work_date,
            @Param("start_at") Date start_at,
            @Param("end_at") Date end_at
    );
}
