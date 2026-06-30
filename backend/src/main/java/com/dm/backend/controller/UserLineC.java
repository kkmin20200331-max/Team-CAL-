package com.dm.backend.controller;

import com.dm.backend.mapper.UserLineMapper;
import com.dm.backend.service.UserLineService;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/user-line")
public class UserLineC {

    @Autowired
    private UserLineService userLineService;

    @Autowired
    private UserLineMapper userLineMapper;

    @PostMapping
    public void register(UserLineVO vo) {

        UserLineVO userInfo =
                userLineMapper.findByUserId(
                        vo.getUser_id()
                );

        if (userInfo != null) {
            userLineMapper.updateLineUserId(vo);
            return;
        }

        UserLineVO lineInfo =
                userLineMapper.findByLineUserId(
                        vo.getLine_user_id()
                );

        if (lineInfo != null) {
            throw new RuntimeException("이미 다른 계정에 연동된 LINE 계정입니다.");
        }

        userLineMapper.register(vo);
    }

    @GetMapping
    public Map<String, Object> getLineInfo(
            @RequestParam String user_id
    ) {

        UserLineVO lineInfo =
                userLineService.getLineInfo(user_id);

        String lineUserId =
                lineInfo == null ? null : lineInfo.getLine_user_id();

        return Map.of(
                "linked", lineUserId != null && !lineUserId.isBlank(),
                "user_id", lineInfo == null || lineInfo.getUser_id() == null ? "" : lineInfo.getUser_id(),
                "line_user_id", lineUserId == null ? "" : lineUserId
        );
    }

    @DeleteMapping
    public void delete(
            @RequestParam String user_id
    ) {
        userLineService.delete(user_id);
    }
}
