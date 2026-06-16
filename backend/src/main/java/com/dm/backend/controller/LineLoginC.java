package com.dm.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/line")
public class LineLoginC {

    private final String CLIENT_ID = "YOUR_CHANNEL_ID";
    private final String REDIRECT_URI = "http://localhost:8080/api/line/callback";

    // 1. LINE 로그인 시작 URL 반환
    @GetMapping("/login")
    public String linelogin(@RequestParam String role) {

        String state = role; // ADMIN or STAFF

        String url = "https://access.line.me/oauth2/v2.1/authorize"
                + "?response_type=code"
                + "&client_id=" + CLIENT_ID
                + "&redirect_uri=" + REDIRECT_URI
                + "&state=" + state
                + "&scope=profile%20openid";

        return "redirect:" + url;
    }
    @GetMapping("/callback")
    public String callback (
            @RequestParam String code,
            @RequestParam String state
    ) {

        // 1. code -> access token 요청
        // 2. token -> LINE profile 조회
        // 3. userId 확보

        // 4. state 기반 redirect
        if ("ADMIN".equals(state)) {
            return "redirect:http://localhost:5173/admin/branch-selection";
        }

        if ("STAFF".equals(state)) {
            return "redirect:http://localhost:5173/employee/home";
        }

        return "redirect:http://localhost:5173";
    }
}
