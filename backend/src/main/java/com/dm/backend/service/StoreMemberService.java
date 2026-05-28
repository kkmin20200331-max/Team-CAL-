package com.dm.backend.service;

import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.vo.StoreMemberVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StoreMemberService {

    @Autowired
    private StoreMemberMapper storeMemberMapper;



    public void approveRegister(StoreMemberVo storeMemberVo) {
        storeMemberMapper.approveRegister(storeMemberVo);
    }

    public void updateStoreMember(StoreMemberVo storeMemberVo) {
        storeMemberMapper.updateStoreMember(storeMemberVo);
    }

    public void deleteStoreMember(String store_id, String user_id) {
        storeMemberMapper.deleteStoreMember(store_id, user_id);
    }
}
