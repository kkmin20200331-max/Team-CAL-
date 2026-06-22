package com.dm.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // 1. /api로 시작하는 모든 백엔드 주소에 대해
                .allowedOrigins("http://localhost:5173") // 2. 우리 리액트 주소만 전면 허용
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 3. 사용할 HTTP 메서드들 지정
                .allowedHeaders("*") // 4. 어떤 헤더값 요청이 들어와도 허용
                .allowCredentials(true) // 5. 쿠키나 인증 세션을 주고받을 수 있게 허용
                .maxAge(3600); // 6. 브라우저가 CORS 검사 결과를 1시간 동안 캐싱하게 해서 통신 속도 최적화
    }
}