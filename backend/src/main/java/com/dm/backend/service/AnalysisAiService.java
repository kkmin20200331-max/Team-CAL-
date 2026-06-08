package com.dm.backend.service;

import com.dm.backend.vo.AiAnalysisResultVO;
import com.dm.backend.vo.AiAnalysisVO;

public interface AnalysisAiService {

    AiAnalysisResultVO requestAnalysis(
            AiAnalysisVO analysisVO
    );

}
