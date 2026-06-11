package com.dm.backend.controller;

import com.dm.backend.service.UserLineService;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-line")
public class UserLineC {

    @Autowired
    private UserLineService userLineService;

    // 연동 등록
    @PostMapping
    public void register(
            @RequestBody UserLineVO vo
    ) {
        userLineService.register(
                vo
        );
    }



    // 연동 조회
    @GetMapping
    public UserLineVO getLineInfo(
            @RequestParam String user_id
    ) {
        return userLineService.getLineInfo(
                user_id
        );
    }



    // 연동 해제
    @DeleteMapping
    public void delete(
            @RequestParam String user_id
    ) {
        userLineService.delete(
                user_id
        );
    }

}