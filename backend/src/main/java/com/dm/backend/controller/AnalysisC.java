package com.dm.backend.controller;

import com.dm.backend.service.AnalysisService;
import com.dm.backend.vo.AiAnalysisVO;
import com.dm.backend.vo.AnalysisRequestVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisC {

    @Autowired
    private AnalysisService analysisService;

    @PostMapping
    public AiAnalysisVO test(
            @RequestBody AnalysisRequestVO request
    ) {

        return analysisService.buildAnalysisData(
                request.getStore_id(),
                request.getStart_date(),
                request.getEnd_date()
        );
    }
}