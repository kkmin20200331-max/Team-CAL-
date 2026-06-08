package com.dm.backend.service;

import com.dm.backend.vo.AiAnalysisResultVO;
import com.dm.backend.vo.AiAnalysisVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;


@Service
public class AnalysisAiServiceImpl
        implements AnalysisAiService {


    private final RestClient restClient;

    public AnalysisAiServiceImpl() {

        this.restClient =
                RestClient.builder()
                        .baseUrl("http://localhost:8000")
                        .build();
    }

    @Override
    public AiAnalysisResultVO requestAnalysis(
            AiAnalysisVO analysisVO
    ) {

        return restClient.post()
                .uri("/analysis")
                .body(analysisVO)
                .retrieve()
                .body(AiAnalysisResultVO.class);
    }



}