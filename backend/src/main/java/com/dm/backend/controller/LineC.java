package com.dm.backend.controller;

import com.dm.backend.service.LineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/line")
public class LineC {

    @Autowired
    private LineService lineService;

    @GetMapping("/test")
    public String test() {

        lineService.sendMessage(
                "U3aebea394016df2ba82427d18ea6e5f8",
                "테스트 메시지"
        );

        return "OK";
    }
}