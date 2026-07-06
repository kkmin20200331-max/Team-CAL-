package com.dm.backend.controller;

import com.dm.backend.service.LineService;
import com.dm.backend.service.UserLineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/line")
public class LineC {

    @Autowired
    private LineService lineService;

    @Autowired
    private UserLineService userLineService;

    @GetMapping("/test")
    public String test() {
        lineService.sendMessage(
                "U3aebea394016df2ba82427d18ea6e5f8",
                "테스트 메시지"
        );
        return "OK";
    }

    @PostMapping("/send")
    public ResponseEntity<String> sendToUser(@RequestBody Map<String, String> body) {
        String userId = body.get("user_id");
        String message = body.get("message");
        if (userId == null || message == null) {
            return ResponseEntity.badRequest().body("user_id and message are required");
        }
        String lineUserId = userLineService.getLineUserIdByUserId(userId);
        if (lineUserId == null || lineUserId.isBlank()) {
            return ResponseEntity.status(404).body("LINE account not linked");
        }
        lineService.sendMessage(lineUserId, message);
        return ResponseEntity.ok("sent");
    }
}