package com.dm.backend.controller;

import com.dm.backend.service.LineService;
import com.dm.backend.service.UserLineService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
                handleEvent(event);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return ResponseEntity.ok("OK");
    }

    private void handleEvent(JsonNode event) {

        String type = event.has("type") ? event.get("type").asText() : null;
        if (type == null) {
            return;
        }

        JsonNode source = event.get("source");
        if (source == null || !source.has("userId")) {
            return;
        }

        String lineUserId = source.get("userId").asText();
        System.out.println("LINE event: " + type);

        if ("follow".equals(type)) {
            userLineService.follow(lineUserId);
            sendFollowMessage(lineUserId);
            System.out.println("LINE follow completed");
        }

        if ("unfollow".equals(type)) {
            userLineService.unfollow(lineUserId);
            System.out.println("LINE unfollow completed");
        }
    }

    private void sendFollowMessage(String lineUserId) {

        try {
            lineService.sendMessage(
                    lineUserId,
                    "바이트메이트 LINE 알림 수신이 활성화되었습니다."
            );
        } catch (Exception e) {
            System.err.println("LINE follow message failed: " + e.getMessage());
        }
    }
}
