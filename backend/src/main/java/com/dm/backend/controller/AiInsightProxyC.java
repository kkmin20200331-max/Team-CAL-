package com.dm.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-insights")
public class AiInsightProxyC {

    private static final String OPEN_CV_AI_INSIGHT_URL =
            "http://localhost:8000/api/v1/ai-insights/analyze/llm";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @PostMapping("/analyze/llm")
    public ResponseEntity<String> analyzeWithLlm(@RequestBody Map<String, Object> payload) {
        try {
            String jsonBody = objectMapper.writeValueAsString(payload);
            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(OPEN_CV_AI_INSIGHT_URL))
                            .header("Content-Type", "application/json")
                            .header("Accept", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                            .build();
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return ResponseEntity
                    .status(response.statusCode())
                    .body(response.body());
        } catch (JsonProcessingException e) {
            return ResponseEntity
                    .internalServerError()
                    .body("{\"message\":\"AI insight request body serialization failed\"}");
        } catch (IOException e) {
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"AI insight server request failed\"}");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"AI insight server request interrupted\"}");
        }
    }
}
