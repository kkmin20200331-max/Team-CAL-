package com.dm.backend.controller;

import com.dm.backend.service.LineService;
import com.dm.backend.service.UserLineService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/line")
public class LineWebhookC {

    @Autowired
    private UserLineService userLineService;

    @Autowired
    private LineService lineService;

    // =========================
    // Webhook Verify
    // =========================

    @GetMapping("/webhook")
    public String verify() {
        return "OK";
    }

    // =========================
    // LINE Webhook
    // =========================

    @PostMapping("/webhook")
    public String webhook(
            @RequestBody String body
    ) {

        try {

            ObjectMapper mapper =
                    new ObjectMapper();

            JsonNode root =
                    mapper.readTree(body);

            JsonNode events =
                    root.get("events");

            if (events == null) {
                return "OK";
            }

            for (JsonNode event : events) {

                String type =
                        event.get("type")
                                .asText();

                JsonNode source =
                        event.get("source");

                if (source == null
                        || source.get("userId") == null) {
                    continue;
                }

                String lineUserId =
                        source.get("userId")
                                .asText();

                System.out.println(
                        "EVENT : " + type
                );

                System.out.println(
                        "LINE USER ID : "
                                + lineUserId
                );

                // =========================
                // 친구추가
                // =========================

                if ("follow".equals(type)) {

                    userLineService.follow(
                            lineUserId
                    );

                    try {

                        lineService.sendMessage(
                                lineUserId,
                                """
                                CalPeace LINE 연동이 완료되었습니다.
                                
                                이제 대타 신청, 승인, 공지사항 등의
                                알림을 받아보실 수 있습니다.
                                """
                        );

                    } catch (Exception e) {

                        e.printStackTrace();
                    }

                    System.out.println(
                            "친구추가 완료"
                    );
                }

                // =========================
                // 친구삭제
                // =========================

                if ("unfollow".equals(type)) {

                    userLineService.unfollow(
                            lineUserId
                    );

                    System.out.println(
                            "친구삭제 완료"
                    );
                }
            }

        } catch (Exception e) {

            e.printStackTrace();
        }

        return "OK";
    }
}