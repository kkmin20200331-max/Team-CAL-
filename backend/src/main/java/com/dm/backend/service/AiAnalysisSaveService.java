package com.dm.backend.service;

import com.dm.backend.vo.AiAnalysisResultVO;
import com.dm.backend.vo.AnalysisRequestVO;

public interface AiAnalysisSaveService {

    void saveAnalysis(
            AnalysisRequestVO request,
            AiAnalysisResultVO result
    );

}