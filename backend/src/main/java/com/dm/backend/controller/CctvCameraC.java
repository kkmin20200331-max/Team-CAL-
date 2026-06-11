package com.dm.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/cctv")
public class CctvCameraC {

    private static final String OPEN_CV_BASE_URL = "http://localhost:8000/api/v1";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @PostMapping("/start")
    public ResponseEntity<String> startCamera(@RequestBody Map<String, Object> payload) {
        return postWithoutBody(startUri(withOpenCvDefaults(payload)));
    }

    @PostMapping("/stop")
    public ResponseEntity<String> stopCamera() {
        return postWithoutBody("/camera/stop");
    }

    @GetMapping("/status")
    public ResponseEntity<String> status() {
        return get("/camera/status");
    }

    @GetMapping("/metrics")
    public ResponseEntity<String> metrics() {
        return get("/camera/metrics");
    }

    @GetMapping("/aggregate/latest")
    public ResponseEntity<String> latestAggregate() {
        return get("/camera/aggregate/latest");
    }

    private ResponseEntity<String> post(String uri, Object body) {
        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(OPEN_CV_BASE_URL + uri))
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
                    .body("{\"message\":\"CCTV request body serialization failed\"}");
        } catch (IOException e) {
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"OpenCV server request failed\"}");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"OpenCV server request interrupted\"}");
        }
    }

    private ResponseEntity<String> postWithoutBody(String uri) {
        try {
            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(OPEN_CV_BASE_URL + uri))
                            .header("Accept", "application/json")
                            .POST(HttpRequest.BodyPublishers.noBody())
                            .build();
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return ResponseEntity
                    .status(response.statusCode())
                    .body(response.body());
        } catch (IOException e) {
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"OpenCV server request failed\"}");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"OpenCV server request interrupted\"}");
        }
    }

    private Map<String, Object> withOpenCvDefaults(Map<String, Object> payload) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("storeId", payload.getOrDefault("storeId", 1));
        body.put("cameraId", payload.getOrDefault("cameraId", "CAM-001"));
        body.put("source", payload.getOrDefault("source", "0"));
        body.put("sourceType", payload.getOrDefault("sourceType", "WEBCAM"));
        body.put("intervalSec", payload.getOrDefault("intervalSec", 5));
        body.put("aggregationIntervalSec", payload.getOrDefault("aggregationIntervalSec", 60));
        body.put("modelName", payload.getOrDefault("modelName", "yolo11s"));
        body.put("imageSize", payload.getOrDefault("imageSize", 640));
        body.put("confidence", payload.getOrDefault("confidence", 0.3));
        return body;
    }

    private String startUri(Map<String, Object> body) {
        return "/camera/start"
                + "?storeId=" + encode(body.get("storeId"))
                + "&cameraId=" + encode(body.get("cameraId"))
                + "&source=" + encode(body.get("source"))
                + "&sourceType=" + encode(body.get("sourceType"))
                + "&intervalSec=" + encode(body.get("intervalSec"))
                + "&aggregationIntervalSec=" + encode(body.get("aggregationIntervalSec"))
                + "&modelName=" + encode(body.get("modelName"))
                + "&imageSize=" + encode(body.get("imageSize"))
                + "&confidence=" + encode(body.get("confidence"));
    }

    private String encode(Object value) {
        return URLEncoder.encode(String.valueOf(value), StandardCharsets.UTF_8);
    }

    private ResponseEntity<String> get(String uri) {
        try {
            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(OPEN_CV_BASE_URL + uri))
                            .header("Accept", "application/json")
                            .GET()
                            .build();
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return ResponseEntity
                    .status(response.statusCode())
                    .body(response.body());
        } catch (IOException e) {
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"OpenCV server request failed\"}");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"OpenCV server request interrupted\"}");
        }
    }
}
