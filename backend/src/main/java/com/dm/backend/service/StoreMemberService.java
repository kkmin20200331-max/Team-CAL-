package com.dm.backend.service;

import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.mapper.UserMapper;
import com.dm.backend.vo.NotificationVO;
import com.dm.backend.vo.StoreMemberVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class StoreMemberService {

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private NotificationService notificationService;

    public void approveRegister(StoreMemberVo storeMemberVo) {
        int count = storeMemberMapper.existsMember(
                storeMemberVo.getStore_id(),
                storeMemberVo.getUser_id()
        );

        if (count > 0) {
            StoreMemberVo existing = storeMemberMapper.getMemberInfo(
                    storeMemberVo.getUser_id(),
                    storeMemberVo.getStore_id()
            );

            if (existing != null && "PENDING".equalsIgnoreCase(existing.getApproval_status())) {
                notifyAdminsForStaffRequest(existing);
                return;
            }

            throw new RuntimeException("이미 요청했거나 근무 중인 매장입니다.");
        }

        if (storeMemberVo.getId() == null || storeMemberVo.getId().isBlank()) {
            storeMemberVo.setId(
                    "SM_" + UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 18)
            );
        }

        storeMemberVo.setApproval_status("PENDING");
        storeMemberVo.setMember_role("STAFF");
        storeMemberVo.setUser_level("NEWBIE");

        if (storeMemberVo.getPay_type() == null) {
            storeMemberVo.setPay_type("HOURLY");
        }

        if (storeMemberVo.getPay_amount() == null) {
            storeMemberVo.setPay_amount(10320);
        }

        storeMemberMapper.approveRegister(storeMemberVo);
        notifyAdminsForStaffRequest(storeMemberVo);
    }

    public void updateAvailableDays(
            String store_id,
            String user_id,
            String available_days
    ) {
        storeMemberMapper.updateAvailableDays(
                store_id,
                user_id,
                available_days
        );
    }

    public void updateStoreMember(StoreMemberVo storeMemberVo) {
        storeMemberMapper.updateStoreMember(storeMemberVo);

        userMapper.approveUser(
                storeMemberVo.getUser_id()
        );

        createNotification(
                storeMemberVo.getUser_id(),
                storeMemberVo.getStore_id(),
                "STAFF_APPROVED",
                "근무 지점 승인 완료",
                "매장 근무 요청이 승인되었습니다. 모바일 앱에서 근무 지점에 접속할 수 있습니다.",
                storeMemberVo.getStore_id()
        );
    }

    public void approveRequestById(String id) {
        StoreMemberVo member = storeMemberMapper.getMemberById(id);
        if (member == null) {
            throw new RuntimeException("존재하지 않는 근무 요청입니다.");
        }

        updateStoreMember(member);
    }

    public void rejectRequestById(String id) {
        StoreMemberVo member = storeMemberMapper.getMemberById(id);
        if (member == null) {
            throw new RuntimeException("존재하지 않는 근무 요청입니다.");
        }

        storeMemberMapper.deleteStoreMemberById(id);

        createNotification(
                member.getUser_id(),
                member.getStore_id(),
                "STAFF_REJECTED",
                "근무 지점 요청 거절",
                "매장 근무 요청이 거절되었습니다.",
                member.getStore_id()
        );
    }

    public void deleteStoreMember(
            String store_id,
            String user_id
    ) {
        storeMemberMapper.deleteStoreMember(
                store_id,
                user_id
        );
    }

    public StoreMemberVo getMemberInfo(String user_id, String store_id) {
        return storeMemberMapper.getMemberInfo(user_id, store_id);
    }

    public void updatePayInfo(StoreMemberVo vo) {
        storeMemberMapper.updatePayInfo(vo);
    }

    public List<StoreMemberVo> getAvailableMemberList(
            String store_id
    ) {
        return storeMemberMapper.getAvailableMemberList(
                store_id
        );
    }

    // 선민 수정 (2026-07-06): 알림 발송 시 USR_... 대신 유저 실명(name)을 노출하도록 개선
    private void notifyAdminsForStaffRequest(StoreMemberVo storeMemberVo) {
        List<StoreMemberVo> admins =
                storeMemberMapper.getAdmins(
                        storeMemberVo.getStore_id()
                );

        com.dm.backend.vo.UserVo applicant = userMapper.getUserById(storeMemberVo.getUser_id());
        String applicantName = applicant != null ? applicant.getName() : storeMemberVo.getUser_id();

        for (StoreMemberVo admin : admins) {
            createNotification(
                    admin.getUser_id(),
                    storeMemberVo.getStore_id(),
                    "STAFF_APPROVAL_REQUEST",
                    "직원 근무 요청",
                    applicantName + "님이 매장 근무를 요청했습니다.",
                    storeMemberVo.getId()
            );
        }
    }

    private void createNotification(
            String userId,
            String storeId,
            String type,
            String title,
            String content,
            String refId
    ) {
        NotificationVO notification =
                new NotificationVO();

        notification.setId(
                "NOTI_" + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 16)
        );
        notification.setUser_id(userId);
        notification.setStore_id(storeId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setRef_id(refId);

        notificationService.createNotification(
                notification
        );
    }
}
