package com.dm.backend.service;

import com.dm.backend.mapper.UserMapper;
import com.dm.backend.vo.UserVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
// 경민 수정 5/28 17:30
import java.util.UUID;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public List<UserVo> getStaff(String store_id) {
        return userMapper.getStaff(store_id);
    }

    // 경민 수정 5/29 15:08
    public List<UserVo> getGuest(String store_id, String role) {
        // 전: if(role == "admin" || role == "ADMIN")  → Java에서 String == 은 항상 false
        if("admin".equalsIgnoreCase(role)){
            return userMapper.getGuest(store_id);
        }
        return null;
    }
//    public List<UserVo> getGuest(String store_id, String role) {
//        if(role == "admin" || role == "ADMIN"){
//            return userMapper.getGuest(store_id);
//        }
//        return null;
//    }

    // 경민 수정 5/28 17:30
    public void registerUser(UserVo userVo) {
    userVo.setId("USR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
    if ("STAFF".equalsIgnoreCase(userVo.getRole())) userVo.setRole("GUEST");
    userVo.setStatus("ACTIVE");
    userMapper.registerUser(userVo);
    }

    public void approveStaff(UserVo userVo) {
        userMapper.approveStaff(userVo);
    }

    public void delUser(String id) {
        userMapper.delUser(id);
    }

    public UserVo login(UserVo userVo) {
        UserVo member = userMapper.login(userVo);

        if (member != null) {
            member.setPassword(null);
        }

        return member;
    }

    // 경민 수정 5/29 15:11
    public void approveUser(String id) {
        userMapper.approveUser(id);
    }



}
