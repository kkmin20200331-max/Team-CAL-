package com.dm.backend.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthC {

    @GetMapping("/api/hello")
    public Map<String, String> hello() {
        return Map.of("message", "Spring Boot OK");
    }
}
