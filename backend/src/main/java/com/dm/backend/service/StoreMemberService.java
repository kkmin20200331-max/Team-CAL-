package com.dm.backend.service;

import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.mapper.UserMapper;
import com.dm.backend.service.NotificationService;
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

    // =========================
    // [직원]
    // =========================

    // 매장 근무 신청
    // 이미 신청 중이거나 근무 중인 경우 신청 불가
   public void approveRegister(StoreMemberVo storeMemberVo) {

    int count = storeMemberMapper.existsMember(
            storeMemberVo.getStore_id(),
            storeMemberVo.getUser_id()
    );

    if (count > 0) {
        throw new RuntimeException("이미 신청했거나 근무중인 매장입니다.");
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

    List<StoreMemberVo> admins =
            storeMemberMapper.getAdmins(
                    storeMemberVo.getStore_id()
            );

    for (StoreMemberVo admin : admins) {
        createNotification(
                admin.getUser_id(),
                storeMemberVo.getStore_id(),
                "STAFF_APPROVAL_REQUEST",
                "직원 가입 요청",
                storeMemberVo.getUser_id() + "님이 매장 근무를 요청했습니다.",
                storeMemberVo.getId()
        );
    }
}

    // 근무 가능 요일 설정
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
    // =========================
    // [관리자]
    // =========================

    // 직원 승인
    // 직원 거절
    // 직원 역할 변경
    // 직원 레벨 변경
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

    // 직원 삭제
    // 매장 직원 제거
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

    // 경민 수정 6/5 12:00
    public StoreMemberVo getMemberInfo(String user_id, String store_id) {
        return storeMemberMapper.getMemberInfo(user_id, store_id);
    }

    // 경민 수정 6/5 12:00
    public void updatePayInfo(StoreMemberVo vo) {
        storeMemberMapper.updatePayInfo(vo);
    }

    // 대타 가능 직원 조회
    public List<StoreMemberVo> getAvailableMemberList(
            String store_id
    ) {
        return storeMemberMapper.getAvailableMemberList(
                store_id
        );
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
