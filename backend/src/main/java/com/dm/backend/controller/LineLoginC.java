package com.dm.backend.controller;

import com.dm.backend.service.LineLoginService;
import com.dm.backend.service.UserLineService;
import com.dm.backend.vo.LineProfileVO;
import com.dm.backend.vo.UserLineVO;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/api/line")
public class LineLoginC {

    @Value("${line.login.channel-id}")
    private String clientId;

    @Value("${line.login.redirect-uri}")
    private String redirectUri;

    @Autowired
    private LineLoginService lineLoginService;

    @Autowired
    private UserLineService userLineService;

    // =========================
    // LINE 로그인 시작
    // =========================

    @GetMapping("/login")
    public RedirectView lineLogin(
            @RequestParam String userId,
            HttpSession session
    ) {

        session.setAttribute(
                "line_link_user_id",
                userId
        );


        String url =
                "https://access.line.me/oauth2/v2.1/authorize"
                        + "?response_type=code"
                        + "&client_id=" + clientId
                        + "&redirect_uri=" + redirectUri
                        + "&scope=profile%20openid";

        return new RedirectView(url);
    }

    // =========================
    // LINE Callback
    // =========================

    @GetMapping("/callback")
    public RedirectView callback(
            @RequestParam String code,
            HttpSession session
    ) {

        // =========================
        // 현재 로그인 사용자
        // =========================

        String userId =
                (String) session.getAttribute(
                        "line_link_user_id"
                );

        if(userId == null){

            return new RedirectView(
                    "http://localhost:5173/auth/login"
            );
        }

        // =========================
        // 1. Access Token 발급
        // =========================

        String accessToken =
                lineLoginService.getAccessToken(
                        code
                );

        // =========================
        // 2. Profile 조회
        // =========================

        LineProfileVO profile =
                lineLoginService.getProfile(
                        accessToken
                );

        System.out.println(
                "LINE USER ID = "
                        + profile.getUserId()
        );

        // =========================
        // 3. USER_LINE 저장
        // =========================

        UserLineVO vo =
                new UserLineVO();

        vo.setUser_id(
                userId
        );

        vo.setLine_user_id(
                profile.getUserId()
        );

        userLineService.register(
                vo
        );

        // =========================
        // 친구추가 페이지 이동
        // =========================

        return new RedirectView(
                "http://localhost:5173/line/friend-add"
        );
    }
}