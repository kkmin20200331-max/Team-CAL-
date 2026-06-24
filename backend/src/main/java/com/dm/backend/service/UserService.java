package com.dm.backend.service;

import com.dm.backend.mapper.UserMapper;
import com.dm.backend.vo.AdminApplicationVo;
import com.dm.backend.vo.UserVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private SupabaseStorageService supabaseStorageService;

    @Autowired
    private AdminApplicationService adminApplicationService;

    // =========================
    // 회원가입 중복 검사
    // =========================
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

    // =========================
    // 회원가입
    // - STAFF: 즉시 활성화
    // - ADMIN: 승인 대기 신청 생성
    // =========================
    public void registerUser(UserVo userVo) {
        validateDuplicateUser(userVo);
        userVo.setId("USR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));

        boolean adminSignup = "ADMIN".equalsIgnoreCase(userVo.getRole());
        userVo.setRole(adminSignup ? "ADMIN" : "STAFF");
        userVo.setStatus(adminSignup ? "PENDING" : "ACTIVE");

        userMapper.registerUser(userVo);

        if (adminSignup) {
            AdminApplicationVo application = new AdminApplicationVo();
            application.setUser_id(userVo.getId());
            application.setStore_name(userVo.getBrandName());
            application.setStore_address(userVo.getStoreAddress() != null ? userVo.getStoreAddress() : "");
            application.setStore_type(userVo.getStoreType() != null ? userVo.getStoreType() : "OTHER");
            application.setCapacity(userVo.getMaxCapacity());
            application.setOpen_time(userVo.getOpenTime());
            application.setClose_time(userVo.getCloseTime());
            application.setBusiness_number(userVo.getBusinessNumber());
            adminApplicationService.createApplication(application);
        }
    }

    // =========================
    // 로그인
    // =========================
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

    // =========================
    // 프로필 이미지 업로드
    // =========================
    public String uploadProfileImage(String id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 프로필 이미지가 없습니다.");
        }

        String storagePath = "profile/" + id + extensionOf(file.getOriginalFilename());
        try {
            supabaseStorageService.upload(storagePath, file);
            String profileImageUrl = supabaseStorageService.createSignedUrl(storagePath);
            userMapper.updateProfileImage(id, profileImageUrl);
            return profileImageUrl;
        } catch (Exception e) {
            throw new IllegalStateException("프로필 이미지 업로드에 실패했습니다.", e);
        }
    }

    private String extensionOf(String originalName) {
        if (originalName == null || originalName.isBlank() || !originalName.contains(".")) {
            return "";
        }
        String extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
        return extension.matches("\\.[a-z0-9]{1,10}") ? extension : "";
    }
}
