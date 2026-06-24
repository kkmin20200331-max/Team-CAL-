package com.dm.backend.service;

import com.dm.backend.mapper.UserMapper;
import com.dm.backend.vo.UserVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public void validateDuplicateUser(UserVo userVo) {
        if (userMapper.countByUsername(userVo.getUsername()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        if (userMapper.countByName(userVo.getName()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        if (userMapper.countByPhone(userVo.getPhone()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 전화번호입니다.");
        }
    }

    public void registerUser(UserVo userVo) {
        validateDuplicateUser(userVo);
        userVo.setId("USR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));

        userVo.setRole("ADMIN".equalsIgnoreCase(userVo.getRole()) ? "ADMIN" : "STAFF");
        userVo.setStatus("ACTIVE");

        userMapper.registerUser(userVo);
    }

    public UserVo login(UserVo userVo) {
        UserVo member = userMapper.login(userVo);

        if (member != null) {
            if ("GUEST".equalsIgnoreCase(member.getRole())) {
                member.setRole("STAFF");
            }
            member.setPassword(null);
        }

        return member;
    }

    public boolean checkNickname(String nickname) {
        return userMapper.countByName(nickname) > 0;
    }

    public boolean checkUsername(String username) {
        return userMapper.countByUsername(username) > 0;
    }

    public void approveStaff(UserVo userVo) {
        userMapper.approveStaff(userVo);
    }

    public void approveUser(String id) {
        userMapper.approveUser(id);
    }

    public void delUser(String id) {
        userMapper.delUser(id);
    }

    public List<UserVo> getStaff(String store_id) {
        return userMapper.getStaff(store_id);
    }

    public List<UserVo> getPendingStaff(String store_id, String role) {
        if ("admin".equalsIgnoreCase(role)) {
            return userMapper.getPendingStaff(store_id);
        }
        return List.of();
    }
}
