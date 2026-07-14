package com.dm.backend.controller;

import com.dm.backend.service.LineLoginService;
import com.dm.backend.service.UserLineService;
import com.dm.backend.service.UserLanguageService;
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

    @Autowired
    private UserLanguageService userLanguageService;

    // =========================
    // LINE 로그인 시작
    // =========================

    @GetMapping("/login")
    public RedirectView lineLogin(
            @RequestParam String userId,
            @RequestParam(required = false, defaultValue = "web") String source,
            @RequestParam(required = false) String lang
    ) {
        String normalizedSource =
                "app".equalsIgnoreCase(source) ? "app" : "web";
        String state =
                userId + "::" + normalizedSource;

        String uiLocale = lang;
        if (uiLocale == null || uiLocale.isBlank()) {
            uiLocale = userLanguageService.getLanguage(userId);
        }

        String url =
                "https://access.line.me/oauth2/v2.1/authorize"
                        + "?response_type=code"
                        + "&client_id=" + clientId
                        + "&redirect_uri="
                        + URLEncoder.encode(
                        redirectUri,
                        StandardCharsets.UTF_8
                )
                        + "&state="
                        + URLEncoder.encode(
                        state,
                        StandardCharsets.UTF_8
                )
                        + "&scope=profile%20openid"
                        + ("app".equals(normalizedSource) ? "&bot_prompt=aggressive" : "")
                        + (uiLocale != null && !uiLocale.isBlank() ? "&ui_locales=" + uiLocale : "");

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

        String userId = null;
        String source = "web";

        if (state != null && state.contains("::")) {
            String[] stateParts = state.split("::", 2);
            userId = stateParts[0];
            source = stateParts.length > 1 ? stateParts[1] : "web";
        } else {
            userId = state;
        }

        String language = "ko";
        if (userId != null && !userId.isBlank()) {
            language = userLanguageService.getLanguage(userId);
        }

        // =========================
        // 로그인 취소
        // =========================

        if (code == null) {
            String cancelMessage = "LINE 로그인이 취소되었습니다.";
            if ("ja".equals(language)) {
                cancelMessage = "LINEログインがキャンセルされました。";
            } else if ("en".equals(language)) {
                cancelMessage = "LINE login was cancelled.";
            }

            return new RedirectView(
                    frontendBaseUrl + "/line/error?message="
                            + URLEncoder.encode(
                            cancelMessage,
                            StandardCharsets.UTF_8
                    )
            );
        }

        if (userId == null || userId.isBlank()) {
            String notFoundMessage = "사용자 정보를 찾을 수 없습니다.";
            if ("ja".equals(language)) {
                notFoundMessage = "ユーザー情報が見つかりません。";
            } else if ("en".equals(language)) {
                notFoundMessage = "User information not found.";
            }

            return new RedirectView(
                    frontendBaseUrl + "/line/error?message="
                            + URLEncoder.encode(
                            notFoundMessage,
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
            boolean friend =
                    lineLoginService.isFriend(
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
            vo.setFollow_yn(
                    friend ? "Y" : "N"
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

            if ("app".equalsIgnoreCase(source)) {
                return new RedirectView(
                        officialAccountUrl
                );
            }

            return new RedirectView(
                    frontendBaseUrl + "/line/success?userId="
                            + URLEncoder.encode(
                            userId,
                            StandardCharsets.UTF_8
                    )
                            + "&friendUrl="
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
