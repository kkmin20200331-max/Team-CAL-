package com.dm.backend.controller;

import com.dm.backend.service.UserService;
import com.dm.backend.vo.UserVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserC {

    @Autowired
    private UserService userservice;

    @PostMapping
    public ResponseEntity<?> registerUser(@RequestBody UserVo userVo) {
        try {
            userservice.registerUser(userVo);
            return ResponseEntity.ok(userVo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserVo userVo) {
        UserVo result = userservice.login(userVo);

        if (result == null) {
            return ResponseEntity
                    .status(401)
                    .body("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        if (!"ACTIVE".equalsIgnoreCase(result.getStatus())) {
            return ResponseEntity
                    .status(403)
                    .body("승인 대기 또는 거절된 계정입니다.");
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/check-nickname")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
        boolean exists = userservice.checkNickname(nickname);
        if (exists) {
            return ResponseEntity.status(409).body("이미 사용 중인 닉네임입니다.");
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        boolean exists = userservice.checkUsername(username);
        if (exists) {
            return ResponseEntity.status(409).body("이미 사용 중인 아이디입니다.");
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public void approveStaff(@RequestBody UserVo userVo) {
        userservice.approveStaff(userVo);
    }

    @PutMapping("/approve")
    public void approveUser(@RequestParam String id) {
        userservice.approveUser(id);
    }

    @DeleteMapping
    public void delUser(@RequestParam String id) {
        userservice.delUser(id);
    }

    @GetMapping
    public List<UserVo> getStaff(@RequestParam String store_id) {
        return userservice.getStaff(store_id);
    }

    @GetMapping("/guest")
    public List<UserVo> getGuest(
            @RequestParam String store_id,
            @RequestParam String role
    ) {
        return userservice.getPendingStaff(store_id, role);
    }

    @GetMapping("/pending")
    public List<UserVo> getPendingStaff(
            @RequestParam String store_id,
            @RequestParam String role
    ) {
        return userservice.getPendingStaff(store_id, role);
    }

    // =========================
    // 프로필 이미지 업로드
    // =========================
    @PostMapping("/{id}/profile-image")
    public ResponseEntity<Map<String, String>> uploadProfileImage(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file
    ) {
        String profileImageUrl = userservice.uploadProfileImage(id, file);
        return ResponseEntity.ok(Map.of("profile_image", profileImageUrl));
    }
}
