package com.dm.backend.controller;

import com.dm.backend.service.AiInsightPayloadService;
import com.dm.backend.vo.AiInsightAnalyzeRequestVO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai-insights")
public class AiInsightProxyC {

    // =========================
    // OpenCV FastAPI 연동 URL
    // =========================
    @Value("${fastapi.base-url:http://127.0.0.1:8000}")
    private String fastApiBaseUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient =
            RestClient.builder()
                    .requestFactory(requestFactory())
                    .build();
    private final AiInsightPayloadService aiInsightPayloadService;

    // =========================
    // 룰 기반 AI 인사이트 분석
    // =========================
    @PostMapping("/analyze")
    public ResponseEntity<String> analyze(@RequestBody AiInsightAnalyzeRequestVO request) {
        return forwardAnalysis(request, openCvUrl("/api/v1/ai-insights/analyze"));
    }

    // =========================
    // LLM 기반 AI 인사이트 분석
    // =========================
    @PostMapping("/analyze/llm")
    public ResponseEntity<String> analyzeWithLlm(@RequestBody AiInsightAnalyzeRequestVO request) {
        return forwardAnalysis(request, openCvUrl("/api/v1/ai-insights/analyze/llm"));
    }

    // =========================
    // Spring DB 데이터 → FastAPI payload 변환 후 전달
    // =========================
    private ResponseEntity<String> forwardAnalysis(
            AiInsightAnalyzeRequestVO request,
            String aiInsightUrl
    ) {
        Map<String, Object> payload;
        try {
            payload = aiInsightPayloadService.buildPayload(request);
            String jsonBody = objectMapper.writeValueAsString(payload);
            System.out.println("[AI_INSIGHT] request to FastAPI: " + jsonBody);
        } catch (JsonProcessingException e) {
            return ResponseEntity
                    .internalServerError()
                    .body("{\"message\":\"AI insight request body serialization failed\"}");
        } catch (RuntimeException e) {
            return ResponseEntity
                    .internalServerError()
                    .body("{\"message\":\"AI insight payload build failed\",\"detail\":\""
                            + escapeJson(e.getMessage())
                            + "\"}");
        }

        try {
            return restClient
                    .post()
                    .uri(aiInsightUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .exchange((clientRequest, clientResponse) -> {
                        String responseBody =
                                StreamUtils.copyToString(
                                        clientResponse.getBody(),
                                        StandardCharsets.UTF_8
                                );

                        System.out.println("[AI_INSIGHT] FastAPI response status: "
                                + clientResponse.getStatusCode());
                        System.out.println("[AI_INSIGHT] FastAPI response body: "
                                + responseBody);

                        return ResponseEntity
                                .status(clientResponse.getStatusCode())
                                .body(responseBody);
                    });
        } catch (RestClientException e) {
            System.out.println("[AI_INSIGHT] FastAPI request failed: " + e.getMessage());
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"AI insight upstream request failed\",\"detail\":\""
                            + escapeJson(e.getMessage())
                            + "\"}");
        }
    }

    // =========================
    // JSON 에러 응답용 문자열 이스케이프
    // =========================
    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }

    private String openCvUrl(String path) {
        String baseUrl = fastApiBaseUrl.endsWith("/")
                ? fastApiBaseUrl.substring(0, fastApiBaseUrl.length() - 1)
                : fastApiBaseUrl;
        return baseUrl + path;
    }

    private SimpleClientHttpRequestFactory requestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(10000);
        return factory;
    }
}
