package com.dm.backend.controller;

import com.dm.backend.service.UserLineService;
import com.dm.backend.vo.UserLineVO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/line")
public class LineWebhookC {

    @Autowired
    private UserLineService userLineService;

    @GetMapping("/webhook")
    public String verify() {
        return "OK";
    }

    @PostMapping("/webhook")
    public String webhook(
            @RequestBody String body
    ) {

        try {

            ObjectMapper mapper =
                    new ObjectMapper();

            JsonNode root =
                    mapper.readTree(body);

            JsonNode event =
                    root.get("events")
                            .get(0);

            String lineUserId =
                    event.get("source")
                            .get("userId")
                            .asText();

            String message =
                    event.get("message")
                            .get("text")
                            .asText();

            System.out.println(
                    "LINE USER ID : " + lineUserId
            );

            System.out.println(
                    "MESSAGE : " + message
            );

            // 예시
            // "연동 user01"
            if(message.startsWith("연동 ")){

                String userId =
                        message.replace(
                                "연동 ",
                                ""
                        );

                UserLineVO vo =
                        new UserLineVO(
                                userId,
                                lineUserId
                        );

                userLineService.register(
                        vo
                );

                System.out.println(
                        "연동 완료"
                );
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return "OK";
    }
}