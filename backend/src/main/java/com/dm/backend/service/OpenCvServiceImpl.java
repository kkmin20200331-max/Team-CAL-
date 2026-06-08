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

        return restClient.post()
                .uri("/analyze/opencv")
                .retrieve()
                .body(OpenCvResponseVO.class);
    }
}