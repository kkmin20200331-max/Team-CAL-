package com.dm.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

public class TestApi {

    @RestController
    @RequestMapping("/api")
    public class TestController {

        @GetMapping("/hello")
        public Map<String, String> hello() {
            return Map.of("message", "Spring Boot 연결 성공");
        }
    }


}
