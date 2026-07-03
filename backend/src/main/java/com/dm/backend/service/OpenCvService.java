package com.dm.backend.service;

import com.dm.backend.vo.OpenCvResponseVO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class OpenCvService {

    private final RestClient restClient;

    public OpenCvService(
            @Value("${fastapi.base-url:http://127.0.0.1:8000}") String fastApiBaseUrl
    ) {

        this.restClient =
                RestClient.builder()
                        .baseUrl(fastApiBaseUrl)
                        .build();
    }

    // =========================
    // [OpenCV 분석]
    // =========================

    public OpenCvResponseVO analyze() {

        System.out.println("========== OpenCV 호출 시작 ==========");

        OpenCvResponseVO response =
                restClient.post()
                        .uri("/analyze/opencv")
                        .retrieve()
                        .body(OpenCvResponseVO.class);

        System.out.println("OpenCV 응답 : " + response);

        System.out.println("========== OpenCV 호출 종료 ==========");

        return response;
    }
}
