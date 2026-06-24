package com.dm.backend.service;

import com.dm.backend.mapper.AdminApplicationMapper;
import com.dm.backend.mapper.UserMapper;
import com.dm.backend.vo.AdminApplicationVo;
import com.dm.backend.vo.StoreVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminApplicationService {

    private final AdminApplicationMapper adminApplicationMapper;
    private final UserMapper userMapper;
    private final StoreService storeService;

    // =========================
    // 관리자 가입 신청 생성
    // =========================
    public void createApplication(AdminApplicationVo application) {
        application.setId("AA_" + UUID.randomUUID().toString().replace("-", "").substring(0, 18));
        application.setStatus("PENDING");
        adminApplicationMapper.insertApplication(application);
    }

    // =========================
    // 신청 목록 조회
    // =========================
    public List<AdminApplicationVo> getApplications(String status) {
        return adminApplicationMapper.getApplicationsByStatus(
                status == null || status.isBlank() ? "PENDING" : status
        );
    }

    // =========================
    // 관리자 신청 승인
    // =========================
    public void approveApplication(String id, String reviewedBy) {
        AdminApplicationVo application = adminApplicationMapper.getApplicationById(id);
        if (application == null) {
            throw new IllegalArgumentException("관리자 가입 신청을 찾을 수 없습니다.");
        }

        userMapper.updateUserStatus(application.getUser_id(), "ACTIVE");

        StoreVo store = new StoreVo();
        store.setId("ST_" + UUID.randomUUID().toString().replace("-", "").substring(0, 18));
        store.setName(application.getStore_name());
        store.setAddress(application.getStore_address() == null || application.getStore_address().isBlank()
                ? "주소 미입력"
                : application.getStore_address());
        store.setType(application.getStore_type());
        store.setCapacity(application.getCapacity() != null ? application.getCapacity() : 0);
        store.setOpen_time(application.getOpen_time() != null ? application.getOpen_time() : "09:00");
        store.setClose_time(application.getClose_time() != null ? application.getClose_time() : "22:00");
        store.setOwner_user_id(application.getUser_id());
        storeService.registerStore(store);

        adminApplicationMapper.approveApplication(id, reviewedBy);
    }

    // =========================
    // 관리자 신청 거절
    // =========================
    public void rejectApplication(String id, String rejectReason, String reviewedBy) {
        AdminApplicationVo application = adminApplicationMapper.getApplicationById(id);
        if (application == null) {
            throw new IllegalArgumentException("관리자 가입 신청을 찾을 수 없습니다.");
        }

        userMapper.updateUserStatus(application.getUser_id(), "REJECTED");
        adminApplicationMapper.rejectApplication(id, rejectReason, reviewedBy);
    }
}
