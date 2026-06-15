package com.dm.backend.service;

import com.dm.backend.vo.AiAnalysisResultVO;
import com.dm.backend.vo.AiAnalysisVO;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class AnalysisAiService {

    private final RestClient restClient;

    public AnalysisAiService() {

        this.restClient =
                RestClient.builder()
                        .baseUrl("http://localhost:8000")
                        .build();
    }

    public AiAnalysisResultVO requestAnalysis(
            AiAnalysisVO analysisVO
    ) {

        System.out.println("========== AI 서버 호출 ==========");

        System.out.println("Store : "
                + analysisVO.getStore().getName());

        System.out.println("PeopleLog 개수 : "
                + analysisVO.getPeopleLogs().size());

        System.out.println("Shift 개수 : "
                + analysisVO.getShifts().size());

        System.out.println("StoreMember 개수 : "
                + analysisVO.getStoreMembers().size());

        AiAnalysisResultVO result =
                restClient.post()
                        .uri("/analysis")
                        .body(analysisVO)
                        .retrieve()
                        .body(AiAnalysisResultVO.class);

        System.out.println("AI 응답 : " + result);

        return result;
    }
}