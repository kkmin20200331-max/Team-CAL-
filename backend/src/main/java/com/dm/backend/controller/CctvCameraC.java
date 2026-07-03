package com.dm.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dm.backend.service.PeopleLogService;
import com.dm.backend.vo.OpenCvCongestionPayloadVO;
import com.dm.backend.vo.PeopleLogVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/cctv")
public class CctvCameraC {

    @Value("${fastapi.base-url:http://127.0.0.1:8000}")
    private String fastApiBaseUrl;

    @Autowired
    private PeopleLogService peopleLogService;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
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

    @PostMapping(value = "/frame", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> analyzeBrowserFrame(
            @RequestParam String storeId,
            @RequestParam(defaultValue = "BROWSER-CAM") String cameraId,
            @RequestParam(defaultValue = "yolo11s") String modelName,
            @RequestParam(defaultValue = "640") int imageSize,
            @RequestParam(defaultValue = "0.3") double confidence,
            @RequestParam("image") MultipartFile image
    ) {
        try {
            String boundary = "----bitemate-frame-" + UUID.randomUUID();
            byte[] body = multipartBody(boundary, "image", image);
            String uri = openCvBaseUrl()
                    + "/inference/image"
                    + "?storeId=" + encode(storeId)
                    + "&cameraId=" + encode(cameraId)
                    + "&modelName=" + encode(modelName)
                    + "&imageSize=" + encode(imageSize)
                    + "&confidence=" + encode(confidence)
                    + "&sendToSpring=false";

            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(uri))
                            .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                            .header("Accept", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                            .build();
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                saveFrameResult(response.body(), storeId, cameraId);
            }

            return ResponseEntity
                    .status(response.statusCode())
                    .body(response.body());
        } catch (IOException e) {
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"OpenCV frame request failed\"}");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity
                    .status(502)
                    .body("{\"message\":\"OpenCV frame request interrupted\"}");
        }
    }

    @GetMapping("/stream")
    public ResponseEntity<StreamingResponseBody> stream() {
        try {
            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(openCvBaseUrl() + "/camera/stream"))
                            .header("Accept", "multipart/x-mixed-replace")
                            .GET()
                            .build();
            HttpResponse<InputStream> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

            String contentType =
                    response.headers()
                            .firstValue("content-type")
                            .orElse("multipart/x-mixed-replace; boundary=frame");

            StreamingResponseBody body =
                    outputStream -> {
                        try (InputStream inputStream = response.body()) {
                            inputStream.transferTo(outputStream);
                        }
                    };

            return ResponseEntity
                    .status(response.statusCode())
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(body);
        } catch (IOException e) {
            return ResponseEntity
                    .status(502)
                    .body(outputStream ->
                            outputStream.write("{\"message\":\"OpenCV stream request failed\"}".getBytes(StandardCharsets.UTF_8)));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity
                    .status(502)
                    .body(outputStream ->
                            outputStream.write("{\"message\":\"OpenCV stream request interrupted\"}".getBytes(StandardCharsets.UTF_8)));
        }
    }

    private ResponseEntity<String> post(String uri, Object body) {
        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(openCvBaseUrl() + uri))
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
                            .uri(URI.create(openCvBaseUrl() + uri))
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

    private byte[] multipartBody(String boundary, String fieldName, MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
                ? "frame.jpg"
                : file.getOriginalFilename();
        String contentType = file.getContentType() == null || file.getContentType().isBlank()
                ? "image/jpeg"
                : file.getContentType();
        String head = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"" + fieldName + "\"; filename=\"" + filename + "\"\r\n"
                + "Content-Type: " + contentType + "\r\n\r\n";
        String tail = "\r\n--" + boundary + "--\r\n";

        byte[] headBytes = head.getBytes(StandardCharsets.UTF_8);
        byte[] fileBytes = file.getBytes();
        byte[] tailBytes = tail.getBytes(StandardCharsets.UTF_8);
        byte[] body = new byte[headBytes.length + fileBytes.length + tailBytes.length];
        System.arraycopy(headBytes, 0, body, 0, headBytes.length);
        System.arraycopy(fileBytes, 0, body, headBytes.length, fileBytes.length);
        System.arraycopy(tailBytes, 0, body, headBytes.length + fileBytes.length, tailBytes.length);
        return body;
    }

    private void saveFrameResult(String responseBody, String fallbackStoreId, String fallbackCameraId) {
        try {
            OpenCvCongestionPayloadVO payload =
                    objectMapper.readValue(responseBody, OpenCvCongestionPayloadVO.class);
            if (payload.getStoreId() == null) {
                payload.setStoreId(fallbackStoreId);
            }
            if (payload.getCameraId() == null) {
                payload.setCameraId(fallbackCameraId);
            }
            if (payload.getMeasuredAt() == null) {
                payload.setMeasuredAt(LocalDateTime.now());
            }
            PeopleLogVO saved = peopleLogService.saveOpenCvPayload(fallbackStoreId, payload);
            System.out.println("[CCTV_FRAME] people_log saved: " + saved);
        } catch (Exception e) {
            System.out.println("[CCTV_FRAME] people_log save skipped: " + e.getMessage());
        }
    }

    private String openCvBaseUrl() {
        String baseUrl = fastApiBaseUrl.endsWith("/")
                ? fastApiBaseUrl.substring(0, fastApiBaseUrl.length() - 1)
                : fastApiBaseUrl;
        return baseUrl + "/api/v1";
    }

    private ResponseEntity<String> get(String uri) {
        try {
            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(openCvBaseUrl() + uri))
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
