package com.dm.backend.mapper;

import com.dm.backend.vo.FixedscheduleVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FixedscheduleMapper {
    @Insert("insert into fixed_schedule values (#{id}, #{store_id}, #{user_id}, #{weekday}, #{start_time}, #{end_time}, #{active})")
    void registerFixedschedule(FixedscheduleVO fixedscheduleVO);

    @Select("select * from fixed_schedule where store_id = #{store_id}")
    List<FixedscheduleVO> getFixedScheduleList(String store_id);

    @Select("select * from fixed_schedule where id = #{id}")
    FixedscheduleVO getFixedSchedule(String id);

    @Update("update fixed_schedule set weekday = #{weekday}, start_time = #{start_time}, end_time = #{end_time}, active = #{active} where id = #{id}")
    void updateFixedSchedule(FixedscheduleVO fixedscheduleVO);

    @Delete("delete from fixed_schedule where id = #{id}")
    void delFixedSchedule(String id);
}
