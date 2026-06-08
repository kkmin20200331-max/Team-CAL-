package com.dm.backend.controller;

import com.dm.backend.service.AnalysisService;
import com.dm.backend.vo.AiAnalysisResultVO;
import com.dm.backend.vo.AiAnalysisVO;
import com.dm.backend.vo.AnalysisRequestVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/analyze/ai")
public class AnalysisC {

    @Autowired
    private AnalysisService analysisService;

    @PostMapping
    public AiAnalysisResultVO analysis(
            @RequestBody AnalysisRequestVO request
    ) {
        return analysisService.runAnalysis(request);
    }



}