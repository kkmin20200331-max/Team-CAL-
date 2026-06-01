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

    // =========================
    // [직원]
    // =========================

    // 매장 근무 신청
    // store_id, user_id 필요
    @PostMapping
    public void approveRegister(
            @RequestBody StoreMemberVo storeMemberVo
    ) {
        storeMemberService.approveRegister(storeMemberVo);
    }


    // =========================
    // [관리자]
    // =========================

    // 직원 승인
    // 직원 거절
    // 직원 역할 변경
    // 직원 레벨 변경
    @PutMapping
    public void updateStoreMember(
            @RequestBody StoreMemberVo storeMemberVo
    ) {
        storeMemberService.updateStoreMember(storeMemberVo);
    }

    // 직원 삭제
    // 매장 직원 제거
    @DeleteMapping
    public void deleteStoreMember(
            @RequestParam String store_id,
            @RequestParam String user_id
    ){
        storeMemberService.deleteStoreMember(
                store_id,
                user_id
        );
    }
}
