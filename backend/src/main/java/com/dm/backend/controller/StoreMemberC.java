package com.dm.backend.controller;

import com.dm.backend.service.StoreService;
import com.dm.backend.vo.StoreVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store")
public class StoreMemberC {

    @Autowired
    private StoreService storeService;

    //가게등록
    @PostMapping
    public void registerStore(@RequestBody StoreVo storeVo) {
        storeService.registerStore(storeVo);
    }
    //가게조회 user_id 필요 (그 유저가 관리하는 가게 전체 조회)
    @GetMapping
    public List<StoreVo> getStoreList(@RequestParam String user_id) {
        return storeService.getStoreList(user_id);
    }
    //가게 하나 조회 store_id 필요
    @GetMapping("/{id}")
    public StoreVo getStore(@PathVariable String id) {
        return storeService.getStore(id);
    }
    //가게 정보 수정 (바뀐 정보 수정, 기존 정보 유지 storeVo 객체 전체 정보 필요 )
    @PutMapping
    public void updateStore(@RequestBody StoreVo storeVo) {
        storeService.updateStore(storeVo);
    }
    //가게 삭제 store_id 필요
    @DeleteMapping
    public void delStore(@RequestParam String id) {
        storeService.delStore(id);
    }


}
