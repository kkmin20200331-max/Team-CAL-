package com.dm.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.List;
import java.util.Map;

@Service
public class LineService {


    @Value("${line.channel.access-token}")
    private String accessToken;

    public void sendMessage(
            String lineUserId,
            String message
    ) {

        RestTemplate restTemplate =
                new RestTemplate();

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(accessToken);

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        Map<String, Object> body =
                Map.of(
                        "to", lineUserId,
                        "messages", List.of(
                                Map.of(
                                        "type", "text",
                                        "text", message
                                )
                        )
                );

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(
                        body,
                        headers
                );

        try {
            restTemplate.postForEntity(
                    "https://api.line.me/v2/bot/message/push",
                    entity,
                    String.class
            );
            System.out.println("LINE push success to " + lineUserId);
        } catch (HttpStatusCodeException e) {
            System.err.println(
                    "LINE push failed to "
                            + lineUserId
                            + ": "
                            + e.getStatusCode()
                            + " "
                            + e.getResponseBodyAsString()
            );
            throw e;
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
