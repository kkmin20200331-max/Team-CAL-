package com.dm.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

        String body =
                """
                {
                  "to":"%s",
                  "messages":[
                    {
                      "type":"text",
                      "text":"%s"
                    }
                  ]
                }
                """
                        .formatted(
                                lineUserId,
                                message
                        );

        HttpEntity<String> entity =
                new HttpEntity<>(
                        body,
                        headers
                );

        restTemplate.postForEntity(
                "https://api.line.me/v2/bot/message/push",
                entity,
                String.class
        );
    }


}
