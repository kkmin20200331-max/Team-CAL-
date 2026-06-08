package com.dm.backend.service;

import com.dm.backend.mapper.StoreMapper;
import com.dm.backend.vo.StoreVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StoreService {

    @Autowired
    private StoreMapper storeMapper;

    // =========================
    // [관리자]
    // =========================

    // 가게 등록
    public void registerStore(StoreVo storeVo) {
        storeMapper.registerStore(storeVo);
    }

    // 내가 관리하는 가게 목록 조회
    public List<StoreVo> getStoreList(String user_id) {
        return storeMapper.getStoreList(user_id);
    }

    // 가게 정보 수정
    public void updateStore(StoreVo storeVo) {
        storeMapper.updateStore(storeVo);
    }

    // 가게 삭제
    public void delStore(String id) {
        storeMapper.delStore(id);
    }

    // 경민 수정 5/29 18:00
    public List<StoreVo> getAllStores() {return storeMapper.getAllStores();}

    // 경민 추가 6/2 15:38
    // 직원 소속 매장 조회
    public StoreVo getStoreByUserId(String user_id) {
        return storeMapper.getStoreByUserId(user_id);
    }

    // =========================
    // [공통]
    // =========================

    // 가게 단건 조회
    public StoreVo getStore(String id) {
        return storeMapper.getStore(id);
    }
}
