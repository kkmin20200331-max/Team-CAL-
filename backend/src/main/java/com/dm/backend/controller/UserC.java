package com.dm.backend.controller;

import com.dm.backend.service.UserService;
import com.dm.backend.vo.UserVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserC {

    @Autowired
    private UserService userservice;

    //회원가입 UserVo 객체 정보 값 다 필요
    @PostMapping
    public void registerUser(@RequestBody UserVo userVo) {
        userservice.registerUser(userVo);
    }

    //직원 조회 api store_id가 필요! 파라미터로 넘겨줄
    @GetMapping
    public List<UserVo> getStaff(@RequestParam String store_id) {
        return userservice.getStaff(store_id);
    }

    //guest 조회(승인 필요한 직원) store_id 필요 user가 관리자인지 확인할 필요가 있음
    @GetMapping("/guest")
    public List<UserVo>getGuest(@RequestParam String store_id, @RequestParam String role){
        return userservice.getGuest(store_id, role);
    }

    //개인정보수정(바뀐 정보만 수정하고 기존 정보는 그대로 담아서 UserVo 객체로 전달)
    @PutMapping
    public void approveStaff(@RequestBody UserVo userVo){
        userservice.approveStaff(userVo);
    }

    //유저 삭제 로직 id 필요
    @DeleteMapping
    public void delUser(@RequestParam String id){
        userservice.delUser(id);
    }

}
