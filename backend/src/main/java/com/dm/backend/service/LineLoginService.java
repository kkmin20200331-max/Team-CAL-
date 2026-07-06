package com.dm.backend.service;

import com.dm.backend.vo.LineProfileVO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class LineLoginService {

    @Value("${line.login.channel-id}")
    private String channelId;

    @Value("${line.login.channel-secret}")
    private String channelSecret;

    @Value("${line.login.redirect-uri:https://bitemate.kro.kr/api/line/callback}")
    private String redirectUri;

    private final RestTemplate restTemplate =
            new RestTemplate();

    // =========================
    // Access Token 발급
    // =========================

    public String getAccessToken(
            String code
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_FORM_URLENCODED
        );

        MultiValueMap<String, String> body =
                new LinkedMultiValueMap<>();

        body.add(
                "grant_type",
                "authorization_code"
        );

        body.add(
                "code",
                code
        );

        body.add(
                "redirect_uri",
                redirectUri
        );

        body.add(
                "client_id",
                channelId
        );

        body.add(
                "client_secret",
                channelSecret
        );

        HttpEntity<?> request =
                new HttpEntity<>(
                        body,
                        headers
                );

        ResponseEntity<Map> response =
                restTemplate.postForEntity(
                        "https://api.line.me/oauth2/v2.1/token",
                        request,
                        Map.class
                );

        return (String)
                response.getBody()
                        .get("access_token");
    }

    // =========================
    // Profile 조회
    // =========================

    public LineProfileVO getProfile(
            String accessToken
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(
                accessToken
        );

        HttpEntity<?> request =
                new HttpEntity<>(
                        headers
                );

        ResponseEntity<LineProfileVO> response =
                restTemplate.exchange(
                        "https://api.line.me/v2/profile",
                        HttpMethod.GET,
                        request,
                        LineProfileVO.class
                );

        return response.getBody();
    }

    public boolean isFriend(
            String accessToken
    ) {

        try {
            HttpHeaders headers =
                    new HttpHeaders();

            headers.setBearerAuth(
                    accessToken
            );

            HttpEntity<?> request =
                    new HttpEntity<>(
                            headers
                    );

            ResponseEntity<Map> response =
                    restTemplate.exchange(
                            "https://api.line.me/friendship/v1/status",
                            HttpMethod.GET,
                            request,
                            Map.class
                    );

            Object friendFlag =
                    response.getBody() == null
                            ? null
                            : response.getBody().get("friendFlag");

            return Boolean.TRUE.equals(friendFlag);
        } catch (Exception e) {
            System.err.println("LINE friendship status check failed: " + e.getMessage());
            return false;
        }
    }
}
