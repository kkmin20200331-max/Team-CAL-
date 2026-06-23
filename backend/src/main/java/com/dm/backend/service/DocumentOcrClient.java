package com.dm.backend.service;

import com.dm.backend.vo.DocumentOcrRequestVO;
import com.dm.backend.vo.DocumentOcrResponseVO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
@RequiredArgsConstructor
public class DocumentOcrClient {

    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper;

    @Value("${fastapi.document-ocr.url:http://127.0.0.1:8000/api/v1/documents/ocr}")
    private String documentOcrUrl;

    public DocumentOcrResponseVO extract(DocumentOcrRequestVO request) {
        String body = toJson(request);
        return restClient.post()
                .uri(buildUri(request))
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(DocumentOcrResponseVO.class);
    }

    private URI buildUri(DocumentOcrRequestVO request) {
        return UriComponentsBuilder.fromUriString(documentOcrUrl)
                .queryParam("file_id", request.getFile_id())
                .queryParam("file_type", request.getFile_type())
                .queryParam("file_url", request.getFile_url())
                .queryParam("original_name", request.getOriginal_name())
                .build()
                .encode()
                .toUri();
    }

    private String toJson(DocumentOcrRequestVO request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("OCR 요청 JSON 생성에 실패했습니다.", e);
        }
    }
}
