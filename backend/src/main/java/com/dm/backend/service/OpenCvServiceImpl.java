package com.dm.backend.service;

import com.dm.backend.vo.OpenCvResponseVO;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class OpenCvServiceImpl
        implements OpenCvService {

    private final RestClient restClient;

    public OpenCvServiceImpl() {

        this.restClient =
                RestClient.builder()
                        .baseUrl("http://localhost:8000")
                        .build();
    }

    @Override
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