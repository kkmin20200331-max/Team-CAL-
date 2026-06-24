package com.dm.backend.controller;

import com.dm.backend.service.StoreService;
import com.dm.backend.vo.StoreVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store")
public class StoreC {

    @Autowired
    private StoreService storeService;

    // =========================
    // [관리자]
    // =========================

    // 가게 등록
    @PostMapping
    public void registerStore(
            @RequestBody StoreVo storeVo
    ) {
        storeService.registerStore(storeVo);
    }

    // 내가 관리하는 가게 목록 조회
    @GetMapping
    public List<StoreVo> getStoreList(
            @RequestParam String user_id
    ) {
        return storeService.getStoreList(user_id);
    }

    // 가게 정보 수정
    @PutMapping
    public void updateStore(
            @RequestBody StoreVo storeVo
    ) {
        storeService.updateStore(storeVo);
    }

    // 가게 삭제
    @DeleteMapping
    public void delStore(
            @RequestParam String id
    ) {
        storeService.delStore(id);
    }
    // 경민 수정 5/29 18:00
    // 전체 가게 조회
    @GetMapping("/all")
    public List<StoreVo> getAllStores() {return storeService.getAllStores();}

    // 경민 추가 6/2 15:38
    // 직원 소속 매장 조회
    @GetMapping("/my")
    public StoreVo getMyStore(@RequestParam String user_id) {
        return storeService.getStoreByUserId(user_id);
    }

    @GetMapping("/my-memberships")
    public List<StoreVo> getMyStoreMemberships(@RequestParam String user_id) {
        return storeService.getStoreMemberships(user_id);
    }

    // =========================
    // [공통]
    // =========================

    // 가게 단건 조회
    @GetMapping("/{id}")
    public StoreVo getStore(
            @PathVariable String id
    ) {
        return storeService.getStore(id);
    }
}
