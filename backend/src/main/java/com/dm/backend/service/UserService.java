package com.dm.backend.service;

import com.dm.backend.mapper.UserMapper;
import com.dm.backend.vo.UserVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${supabase.project.url}")
    private String supabaseUrl;

    @Value("${supabase.project.key}")
    private String supabaseKey;

    private static final String BUCKET = "documents";

    // =========================
    // [공통]
    // =========================
    //중복체크 로직
    public void validateDuplicateUser(UserVo userVo) {

        if (userMapper.countByUsername(userVo.getUsername()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        if (userMapper.countByName(userVo.getName()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }
    }
    // 회원가입
    // STAFF 신청 시 GUEST 상태로 저장
    public void registerUser(UserVo userVo) {
        validateDuplicateUser(userVo);
        userVo.setId("USR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));

        if ("STAFF".equalsIgnoreCase(userVo.getRole())) {
            userVo.setRole("GUEST");
        }

        userVo.setStatus("ACTIVE");

        userMapper.registerUser(userVo);
    }

    // 로그인
    public UserVo login(UserVo userVo) {
        UserVo member = userMapper.login(userVo);

        if (member != null) {
            member.setPassword(null);
        }

        return member;
    }

    // 경민 수정 6/11 12:00
    // 닉네임 중복체크
    public boolean checkNickname(String nickname) {
        return userMapper.countByName(nickname) > 0;
    }

    // 경민 수정 6/11 12:00
    // 아이디 중복체크
    public boolean checkUsername(String username) {
        return userMapper.countByUsername(username) > 0;
    }

    // 개인정보 수정
    public void approveStaff(UserVo userVo) {
        userMapper.approveStaff(userVo);
    }

    // 회원 삭제
    public void delUser(String id) {
        userMapper.delUser(id);
    }

    // =========================
    // [관리자]
    // =========================

    // 승인된 직원 목록 조회
    public List<UserVo> getStaff(String store_id) {
        return userMapper.getStaff(store_id);
    }

    // 승인 대기 직원 목록 조회
    public List<UserVo> getGuest(String store_id, String role) {
        if ("admin".equalsIgnoreCase(role)) {
            return userMapper.getGuest(store_id);
        }
        return null;
    }

    // =========================
    // [프로필 이미지]
    // =========================

    public String uploadProfileImage(String userId, MultipartFile file) throws Exception {
        String ext = "";
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "profile";
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx >= 0) ext = originalName.substring(dotIdx);

        String path = "profile/" + userId + ext;
        String apiUrl = supabaseUrl.replaceAll("/$", "") + "/storage/v1/object/" + BUCKET + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.set("x-upsert", "true");
        headers.setContentType(MediaType.parseMediaType(
                file.getContentType() != null ? file.getContentType() : "application/octet-stream"
        ));

        restTemplate.exchange(apiUrl, HttpMethod.POST, new HttpEntity<>(file.getBytes(), headers), Map.class);

        // 공개 URL 생성
        String publicUrl = supabaseUrl.replaceAll("/$", "") + "/storage/v1/object/public/" + BUCKET + "/" + path;
        userMapper.updateProfileImage(userId, publicUrl);
        return publicUrl;
    }

}