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

    // 경민 수정 5/29 - user_id, store_id로 직원 승인 처리
    @PutMapping
    public void updateStoreMember(@RequestParam String user_id, @RequestParam String store_id) {
        StoreMemberVo vo = new StoreMemberVo();
        vo.setUser_id(user_id);
        vo.setStore_id(store_id);
        storeMemberService.updateStoreMember(vo);
    }

    // 직원 삭제 / 매장 직원 제거
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

    // 경민 수정 6/5 12:00
    // 직원 급여 정보 조회
    @GetMapping("/pay")
    public StoreMemberVo getMemberInfo(
            @RequestParam String user_id,
            @RequestParam String store_id) {
        return storeMemberService.getMemberInfo(user_id, store_id);
    }

    // 경민 수정 6/5 12:00
    // 직원 급여 수정
    @PutMapping("/pay")
    public void updatePayInfo(@RequestBody StoreMemberVo vo) {
        storeMemberService.updatePayInfo(vo);
    }
}
