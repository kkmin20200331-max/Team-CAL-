package com.dm.backend.mapper;

import com.dm.backend.vo.PeopleLogVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PeopleLogMapper {

    @Select("""
        SELECT *
        FROM PEOPLE_LOG
        WHERE STORE_ID = #{store_id}
        AND RECORD_TIME BETWEEN #{start_date} AND #{end_date}
        ORDER BY RECORD_TIME
    """)
    List<PeopleLogVO> getPeopleLogList(
            @Param("store_id") String store_id,
            @Param("start_date") String start_date,
            @Param("end_date") String end_date
    );
}