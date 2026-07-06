package com.dm.backend;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.dm.backend.mapper")
public class BackendApplication {

    // 선민 수정 (2026-07-06): 웹/모바일 타임존 시차(9시간) 오류 해결을 위해 기본 타임존을 Asia/Seoul로 설정
    @PostConstruct
    public void started() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
    }

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}
