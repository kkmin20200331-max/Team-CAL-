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
