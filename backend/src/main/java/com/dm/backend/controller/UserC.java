package com.dm.backend.controller;

import com.dm.backend.service.UserService;
import com.dm.backend.service.BusinessValidationService;
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

    @Autowired
    private BusinessValidationService businessValidationService;

    // =========================
    // [공통] 사업자등록번호 진위여부 검증
    // =========================
    @PostMapping("/validate-business")
    public ResponseEntity<?> validateBusiness(@RequestBody Map<String, String> request) {
        String businessNumber = request.get("businessNumber");
        BusinessValidationService.BusinessValidationResult result = businessValidationService.validate(businessNumber);
        if (result.isValid()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(400).body(result);
        }
    }

    // =========================
    // [공통] 회원가입 신청
    // =========================
    @PostMapping
    public ResponseEntity<?> registerUser(@RequestBody UserVo userVo) {
        try {
            userservice.registerUser(userVo);
            return ResponseEntity.ok(userVo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    // =========================
    // [공통] 로그인
    // =========================
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

    // =========================
    // [공통] 닉네임 중복 확인
    // =========================
    @GetMapping("/check-nickname")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
        boolean exists = userservice.checkNickname(nickname);
        if (exists) {
            return ResponseEntity.status(409).body("이미 사용 중인 닉네임입니다.");
        }
        return ResponseEntity.ok().build();
    }

    // =========================
    // [공통] 아이디(username) 중복 확인
    // =========================
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        boolean exists = userservice.checkUsername(username);
        if (exists) {
            return ResponseEntity.status(409).body("이미 사용 중인 아이디입니다.");
        }
        return ResponseEntity.ok().build();
    }

    // =========================
    // [관리자] 직원 정보 수정(승인 등)
    // =========================
    @PutMapping
    public void approveStaff(@RequestBody UserVo userVo) {
        userservice.approveStaff(userVo);
    }

    // =========================
    // [관리자] 회원가입 승인
    // =========================
    @PutMapping("/approve")
    public void approveUser(@RequestParam String id) {
        userservice.approveUser(id);
    }

    // =========================
    // [관리자/직원] 유저 정보 삭제 (회원탈퇴 등)
    // =========================
    @DeleteMapping
    public void delUser(@RequestParam String id) {
        userservice.delUser(id);
    }

    // =========================
    // [관리자] 매장 소속 직원 목록 조회
    // =========================
    @GetMapping
    public List<UserVo> getStaff(@RequestParam String store_id) {
        return userservice.getStaff(store_id);
    }

    // =========================
    // [관리자] 매장 게스트(승인대기) 목록 조회
    // =========================
    @GetMapping("/guest")
    public List<UserVo> getGuest(
            @RequestParam String store_id,
            @RequestParam String role
    ) {
        return userservice.getPendingStaff(store_id, role);
    }

    // =========================
    // [관리자] 매장 승인 대기 직원 목록 조회
    // =========================
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
