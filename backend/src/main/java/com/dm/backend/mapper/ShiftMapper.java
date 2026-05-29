package com.dm.backend.mapper;

import com.dm.backend.vo.ShiftVO;
import org.apache.ibatis.annotations.*;
//@param
import org.apache.ibatis.annotations.Param;

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

    @Update("update shift set store_id = #{store_id}, user_id = #{user_id}, work_date = #{work_date}, start_at = #{start_at}, end_at = #{end_at}, status = #{status} where id = #{id}")
    void updateShift(ShiftVO shiftVO);

    @Delete("delete from shift where id = #{id}")
    void delShift(String id);

    // 직원 개인 근무표 조회 (user_id + 기간)
    @Select("SELECT * FROM shift WHERE user_id = #{user_id} " +
            "AND work_date >= TO_DATE(#{start_date}, 'YYYY-MM-DD') " +
            "AND work_date <= TO_DATE(#{end_date}, 'YYYY-MM-DD') " +
            "ORDER BY work_date, start_at")
    List<ShiftVO> getShiftListByUser(@Param("user_id") String user_id,
                                     @Param("start_date") String start_date,
                                     @Param("end_date") String end_date);

    // 경민 수정 5/29 17:36
    @Select("SELECT * FROM shift WHERE id = #{id}")
    ShiftVO getShift(String id);

}
