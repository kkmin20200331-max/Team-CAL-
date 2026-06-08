package com.dm.backend.mapper;

import com.dm.backend.vo.AiAnalysisDbVO;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AiAnalysisMapper {

    @Insert("""
        INSERT INTO AI_ANALYSIS
        (
            STORE_ID,
            ANALYSIS_TYPE,
            ANALYSIS_START_DATE,
            ANALYSIS_END_DATE,
            RESULT_JSON
        )
        VALUES
        (
            #{store_id},
            #{analysis_type},
            #{analysis_start_date},
            #{analysis_end_date},
            #{result_json}
        )
    """)
    void saveAnalysis(AiAnalysisDbVO vo);

}
