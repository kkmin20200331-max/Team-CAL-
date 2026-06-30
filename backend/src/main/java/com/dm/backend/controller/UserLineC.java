package com.dm.backend.controller;

import com.dm.backend.mapper.UserLineMapper;
import com.dm.backend.service.UserLineService;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-line")
public class UserLineC {

    @Autowired
    private UserLineService userLineService;
    @Autowired
    private UserLineMapper userLineMapper;

    // 연동 등록
    @PostMapping
    public void register(@RequestBody UserLineVO vo) {

        UserLineVO userInfo =
                userLineMapper.findByUserId(
                        vo.getUser_id()
                );

        if(userInfo != null){

            userLineMapper.updateLineUserId(
                    vo
            );

            return;
        }

        UserLineVO lineInfo =
                userLineMapper.findByLineUserId(
                        vo.getLine_user_id()
                );

        if(lineInfo != null){

            throw new RuntimeException(
                    "이미 다른 계정에 연동된 LINE 계정입니다."
            );
        }

        userLineMapper.register(
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
