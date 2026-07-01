package com.dm.backend.controller;

import com.dm.backend.service.LineLoginService;
import com.dm.backend.service.UserLineService;
import com.dm.backend.vo.LineProfileVO;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/line")
public class LineLoginC {

    @Value("${line.login.channel-id}")
    private String clientId;

    @Value("${line.login.redirect-uri:https://bitemate.kro.kr/api/line/callback}")
    private String redirectUri;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${line.official-account-url:https://line.me/R/ti/p/@354cpsdr}")
    private String officialAccountUrl;

    @Autowired
    private LineLoginService lineLoginService;

    @Autowired
    private UserLineService userLineService;

    // =========================
    // LINE 로그인 시작
    // =========================

    @GetMapping("/login")
    public RedirectView lineLogin(
            @RequestParam String userId
    ) {

        String url =
                "https://access.line.me/oauth2/v2.1/authorize"
                        + "?response_type=code"
                        + "&client_id=" + clientId
                        + "&redirect_uri="
                        + URLEncoder.encode(
                        redirectUri,
                        StandardCharsets.UTF_8
                )
                        + "&state=" + userId
                        + "&scope=profile%20openid";

        System.out.println(
                "LINE LOGIN URL = " + url
        );

        return new RedirectView(url);
    }

    // =========================
    // LINE Callback
    // =========================

    @GetMapping("/callback")
    public RedirectView callback(

            @RequestParam(required = false)
            String code,

            @RequestParam(required = false)
            String state,

            @RequestParam(required = false)
            String error,

            @RequestParam(required = false)
            String error_description

    ) {

        System.out.println(
                "CODE = " + code
        );

        System.out.println(
                "STATE(USER_ID) = " + state
        );

        System.out.println(
                "ERROR = " + error
        );

        System.out.println(
                "ERROR_DESCRIPTION = "
                        + error_description
        );

        // =========================
        // 로그인 취소
        // =========================

        if (code == null) {

            return new RedirectView(
                    frontendBaseUrl + "/line/error?message="
                            + URLEncoder.encode(
                            "LINE 로그인이 취소되었습니다.",
                            StandardCharsets.UTF_8
                    )
            );
        }

        String userId = state;

        if (userId == null) {

            return new RedirectView(
                    frontendBaseUrl + "/line/error?message="
                            + URLEncoder.encode(
                            "사용자 정보를 찾을 수 없습니다.",
                            StandardCharsets.UTF_8
                    )
            );
        }

        try {

            // =========================
            // Access Token 발급
            // =========================

            String accessToken =
                    lineLoginService.getAccessToken(
                            code
                    );

            // =========================
            // Profile 조회
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
            // USER_LINE 저장
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

            System.out.println(
                    "USER_LINE 저장 완료"
            );

            // =========================
            // 친구추가 페이지
            // =========================

            return new RedirectView(
                    frontendBaseUrl + "/line/success?friendUrl="
                            + URLEncoder.encode(
                            officialAccountUrl,
                            StandardCharsets.UTF_8
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return new RedirectView(
                    frontendBaseUrl + "/line/error?message="
                            + URLEncoder.encode(
                            e.getMessage(),
                            StandardCharsets.UTF_8
                    )
            );
        }
    }
}
