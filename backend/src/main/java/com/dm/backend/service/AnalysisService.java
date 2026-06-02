package com.dm.backend.service;

import com.dm.backend.vo.AiAnalysisVO;

public interface AnalysisService {

    AiAnalysisVO buildAnalysisData(
            String store_id,
            String start_date,
            String end_date
    );
}