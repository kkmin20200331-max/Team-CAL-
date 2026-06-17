package com.dm.backend.controller;

import com.dm.backend.service.AiInsightPayloadService;
import com.dm.backend.vo.AiInsightAnalyzeRequestVO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai-insights")
public class AiInsightProxyC {

    private static final String OPEN_CV_AI_INSIGHT_LLM_URL =
            "http://127.0.0.1:8000/api/v1/ai-insights/analyze/llm";
    private static final String OPEN_CV_AI_INSIGHT_RULE_URL =
            "http://127.0.0.1:8000/api/v1/ai-insights/analyze";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient =
            RestClient.builder()
                    .requestFactory(new SimpleClientHttpRequestFactory())
                    .build();
    private final AiInsightPayloadService aiInsightPayloadService;

    @PostMapping("/analyze")
    public ResponseEntity<String> analyze(@RequestBody AiInsightAnalyzeRequestVO request) {
        return forwardAnalysis(request, OPEN_CV_AI_INSIGHT_RULE_URL);
    }

    @PostMapping("/analyze/llm")
    public ResponseEntity<String> analyzeWithLlm(@RequestBody AiInsightAnalyzeRequestVO request) {
        return forwardAnalysis(request, OPEN_CV_AI_INSIGHT_LLM_URL);
    }

    private ResponseEntity<String> forwardAnalysis(
            AiInsightAnalyzeRequestVO request,
            String aiInsightUrl
    ) {
        try {
            Map<String, Object> payload = aiInsightPayloadService.buildPayload(request);
            String jsonBody = objectMapper.writeValueAsString(payload);

            System.out.println("[AI_INSIGHT] request to FastAPI: " + jsonBody);

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
    }

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
}
