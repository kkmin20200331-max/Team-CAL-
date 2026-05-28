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

    @Select("""
                select count(*)
                from fixed_schedule
                where store_id = #{store_id}
                and user_id = #{user_id}
                and weekday = #{weekday}
                and start_time = #{start_time}
                and end_time = #{end_time}
            """)
    int existsFixedSchedule(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id,
            @Param("weekday") String weekday,
            @Param("start_time") String start_time,
            @Param("end_time") String end_time
    );

    @Select("""
    select count(*)
    from fixed_schedule
    where store_id = #{store_id}
    and user_id = #{user_id}
    and weekday = #{weekday}
    and start_time < #{end_time}
    and end_time > #{start_time}
""")
    int checkFixedScheduleConflict(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id,
            @Param("weekday") String weekday,
            @Param("start_time") String start_time,
            @Param("end_time") String end_time
    );

    @Select("""
    select count(*)
    from fixed_schedule
    where store_id = #{store_id}
    and user_id = #{user_id}
    and weekday = #{weekday}
    and id != #{id}
    and start_time < #{end_time}
    and end_time > #{start_time}
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
