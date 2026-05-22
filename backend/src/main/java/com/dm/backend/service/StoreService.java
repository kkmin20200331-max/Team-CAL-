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


    public void registerStore(StoreVo storeVo) {
        storeMapper.registerStore(storeVo);
    }

    public List<StoreVo> getStoreList(String userId) {
        return storeMapper.getStoreList(userId);
    }

    public StoreVo getStore(String id) {
        return storeMapper.getStore(id);
    }

    public void updateStore(StoreVo storeVo) {
        storeMapper.updateStore(storeVo);
    }

    public void delStore(String id) {
        storeMapper.delStore(id);
    }
}
