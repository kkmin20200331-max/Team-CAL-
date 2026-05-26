package com.dm.backend.service;

import com.dm.backend.mapper.UserMapper;
import com.dm.backend.vo.UserVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public List<UserVo> getStaff(String store_id) {
        return userMapper.getStaff(store_id);
    }

    public List<UserVo> getGuest(String store_id, String role) {
        if(role == "admin" || role == "ADMIN"){
            return userMapper.getGuest(store_id);
        }
        return null;
    }

    // 로그인
    public UserVo login(String username, String password) {
        return userMapper.login(username, password);
    }

    public void registerUser(UserVo userVo) {
        userMapper.registerUser(userVo);
    }

    public void approveStaff(UserVo userVo) {
        userMapper.approveStaff(userVo);
    }

    public void delUser(String id) {
        userMapper.delUser(id);
    }
}
