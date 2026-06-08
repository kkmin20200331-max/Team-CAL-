package com.dm.backend.mapper;

import com.dm.backend.vo.PeopleLogVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface PeopleLogMapper {

    // =========================
    // 공통
    // =========================

    @Insert("""
        INSERT INTO PEOPLE_LOG
        (
            STORE_ID,
            CAMERA_ID,
            RECORD_TIME,
            PEOPLE_COUNT
        )
        VALUES
        (
            #{store_id},
            #{camera_id},
            #{record_time},
            #{people_count}
        )
    """)
    void savePeopleLog(
            PeopleLogVO vo
    );

    @Select("""
        SELECT *
        FROM PEOPLE_LOG
        WHERE STORE_ID = #{store_id}
        AND RECORD_TIME BETWEEN #{start_date}
        AND #{end_date}
        ORDER BY RECORD_TIME
    """)
    List<PeopleLogVO> getPeopleLogList(
            @Param("store_id") String store_id,
            @Param("start_date") String start_date,
            @Param("end_date") String end_date
    );

}