package com.dm.backend.controller;

import com.dm.backend.service.LineService;
import com.dm.backend.service.UserLineService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/line")
public class LineWebhookC {

    @Autowired
    private UserLineService userLineService;

    @Autowired
    private LineService lineService;

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody(required = false) String body) {

        try {

            if (body == null || body.isBlank()) {
                return ResponseEntity.ok("OK");
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(body);

            JsonNode events = root.get("events");

            if (events == null || !events.isArray()) {
                return ResponseEntity.ok("OK");
            }

            for (JsonNode event : events) {

                String type = event.has("type") ? event.get("type").asText() : null;
                if (type == null) continue;

                JsonNode source = event.get("source");
                if (source == null || !source.has("userId")) continue;

                String lineUserId = source.get("userId").asText();

                System.out.println("EVENT: " + type);

                // follow
                if ("follow".equals(type)) {

                    userLineService.follow(lineUserId);

                    try {
                        lineService.sendMessage(lineUserId,
                                "CalPeace LINE 연동 완료");
                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                    System.out.println("친구추가 완료");
                }

                // unfollow
                if ("unfollow".equals(type)) {

                    userLineService.unfollow(lineUserId);

                    System.out.println("친구삭제 완료");
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return ResponseEntity.ok("OK");
    }
}