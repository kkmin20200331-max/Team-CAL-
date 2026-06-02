package com.dm.backend.controller;

import com.dm.backend.service.StoreMemberService;
import com.dm.backend.vo.StoreMemberVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store_member")
public class StoreMemberC {

    @Autowired
    private StoreMemberService storeMemberService;

    //승인요청 - id, store_id, user_id 필요 나머지는 고정된 값으로 설정해둠
    @PostMapping
//    public void approveRegister(StoreMemberVo storeMemberVo) {
//        storeMemberService.approveRegister(storeMemberVo);
//    }
    // 경민 수정 5/19 18:00
    public void approveRegister(@RequestBody StoreMemberVo storeMemberVo) {
        storeMemberService.approveRegister(storeMemberVo);
    }

    //승인거절, 승인수락, 유저 등급 설정 (수정 정보만 바꾸어서 객체로 받음, 나머지는 기존 정보 그대로 필요)
//    @PutMapping
//    public void updateStoreMember(StoreMemberVo storeMemberVo) {
//        storeMemberService.updateStoreMember(storeMemberVo);
//    }

    @PutMapping
    public void updateStoreMember(@RequestParam String user_id, @RequestParam String store_id) {
        StoreMemberVo vo = new StoreMemberVo();
        vo.setUser_id(user_id);
        vo.setStore_id(store_id);
        storeMemberService.updateStoreMember(vo);
    }






}
