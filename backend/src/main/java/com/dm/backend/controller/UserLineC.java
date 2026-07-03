package com.dm.backend.controller;

import com.dm.backend.service.UserLineService;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/user-line")
public class UserLineC {

    @Autowired
    private UserLineService userLineService;

    @PostMapping
    public void register(@RequestBody UserLineVO vo) {
        userLineService.register(vo);
    }

    @GetMapping
    public Map<String, Object> getLineInfo(
            @RequestParam String user_id
    ) {

        UserLineVO lineInfo =
                userLineService.getLineInfo(user_id);

        String lineUserId =
                lineInfo == null ? null : lineInfo.getLine_user_id();
        String followYn =
                lineInfo == null ? null : lineInfo.getFollow_yn();
        boolean followed =
                "Y".equalsIgnoreCase(followYn);

        return Map.of(
                "linked", lineUserId != null && !lineUserId.isBlank(),
                "followed", followed,
                "follow_yn", followYn == null ? "N" : followYn,
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
