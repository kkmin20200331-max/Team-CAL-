package com.dm.backend.controller;

import com.dm.backend.service.UserService;
import com.dm.backend.vo.UserVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserC {

    @Autowired
    private UserService userservice;

    // =========================
    // [공통]
    // =========================

    // 회원가입
    @PostMapping
    public UserVo registerUser(@RequestBody UserVo userVo) {
        System.out.println("✅ 프론트에서 도착한 회원가입 데이터: " + userVo);
        userservice.registerUser(userVo);
        return userVo;
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserVo userVo) {
        UserVo result = userservice.login(userVo);

        if (result == null) {
            return ResponseEntity
                    .status(401)
                    .body("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        return ResponseEntity.ok(result);
    }

    // 경민 수정 6/11 12:00
    // 닉네임 중복 확인
    @GetMapping("/check-nickname")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
        boolean exists = userservice.checkNickname(nickname);
        if (exists) return ResponseEntity.status(409).body("이미 사용 중인 닉네임입니다.");
        return ResponseEntity.ok().build();
    }

    // 경민 수정 6/11 12:00
    // 아이디 중복 확인
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        boolean exists = userservice.checkUsername(username);
        if (exists) return ResponseEntity.status(409).body("이미 사용 중인 아이디입니다.");
        return ResponseEntity.ok().build();
    }

    // 개인정보 수정
    @PutMapping
    public void approveStaff(@RequestBody UserVo userVo) {
        userservice.approveStaff(userVo);
    }

    // 회원 삭제
    @DeleteMapping
    public void delUser(@RequestParam String id) {
        userservice.delUser(id);
    }


    // =========================
    // [관리자]
    // =========================

    // 승인된 직원 목록 조회
    @GetMapping
    public List<UserVo> getStaff(@RequestParam String store_id) {
        return userservice.getStaff(store_id);
    }

    // 승인 대기 직원 목록 조회
    @GetMapping("/guest")
    public List<UserVo> getGuest(
            @RequestParam String store_id,
            @RequestParam String role
    ) {
        return userservice.getGuest(store_id, role);
    }

    // =========================
    // [프로필 이미지]
    // =========================

    @PostMapping("/{id}/profile-image")
    public ResponseEntity<?> updateProfileImageUrl(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        try {
            String url = body.get("profile_image");
            userservice.updateProfileImageUrl(id, url);
            return ResponseEntity.ok(Map.of("profile_image", url));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

}
