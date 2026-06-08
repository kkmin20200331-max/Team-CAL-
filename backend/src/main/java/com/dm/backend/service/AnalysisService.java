package com.dm.backend.service;

import com.dm.backend.vo.AiAnalysisResultVO;
import com.dm.backend.vo.AiAnalysisVO;
import com.dm.backend.vo.AnalysisRequestVO;

public interface AnalysisService {

    AiAnalysisVO buildAnalysisData(
            String store_id,
            String start_date,
            String end_date
    );

    AiAnalysisResultVO runAnalysis(AnalysisRequestVO request);
}