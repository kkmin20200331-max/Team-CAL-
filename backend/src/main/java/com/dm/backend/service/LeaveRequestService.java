package com.dm.backend.service;

import com.dm.backend.mapper.LeaveRequestMapper;
import com.dm.backend.vo.LeaveRequestVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class LeaveRequestService {

    @Autowired
    private LeaveRequestMapper leaveRequestMapper;

    @Autowired
    private LineService lineService;

    @Autowired
    private UserLineService userLineService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.dm.backend.mapper.ShiftMapper shiftMapper;

    // =========================
    // [공통]
    // =========================

    public LeaveRequestVO getLeaveRequest(String id) {
        return leaveRequestMapper.getLeaveRequest(id);
    }

    // =========================
    // [관리자]
    // =========================

    public List<LeaveRequestVO> getLeaveRequestList(String store_id) {
        return leaveRequestMapper.getLeaveRequestList(store_id);
    }

    @Transactional
    public void processLeaveRequest(String id, String status) {

        if (!"APPROVED".equals(status)
                && !"REJECTED".equals(status)) {
            throw new IllegalArgumentException("잘못된 상태값");
        }

        LeaveRequestVO leave = leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("존재하지 않는 신청");
        }

        if (!"PENDING".equals(leave.getStatus())) {
            throw new IllegalStateException("이미 처리된 신청");
        }

        leaveRequestMapper.updateLeaveStatus(id, status);

        if ("APPROVED".equals(status)) {
            leaveRequestMapper.updateShiftStatusVacant(leave.getShift_id());
        } else if ("REJECTED".equals(status)) {
            // 선민 수정 - 휴무 거절 시 shift 상태를 SCHEDULED로 롤백
            leaveRequestMapper.rollbackShiftStatusScheduled(leave.getShift_id());
        }

        // =========================
        // 선민 수정 - 휴무 최종 처리(승인/거절) 시 해당 직원 대상 앱 알림(Notification) 추가
        // =========================
        try {
            com.dm.backend.vo.ShiftVO shift = shiftMapper.getShift(leave.getShift_id());
            String storeId = shift != null ? shift.getStore_id() : "";
            String title = "APPROVED".equals(status) ? "휴무 신청 승인" : "휴무 신청 거절";
            String content = "APPROVED".equals(status)
                    ? "신청하신 휴무가 승인되었습니다."
                    : "신청하신 휴무가 거절되었습니다. 사유는 매장 관리자에게 문의하세요.";
            createNotification(
                    leave.getUser_id(),
                    storeId,
                    "LEAVE_" + status,
                    title,
                    content,
                    leave.getId()
            );
        } catch (Exception e) {
            e.printStackTrace();
        }

        // =========================
        // LINE 알림 (직원)
        // =========================
        try {

            String lineUserId =
                    userLineService.getLineUserIdByUserId(leave.getUser_id());

            if (lineUserId != null) {

                String message =
                        "휴무 신청이 " +
                                ("APPROVED".equals(status) ? "승인" : "거절") +
                                "되었습니다.";

                lineService.sendMessage(lineUserId, message);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Transactional
    public void ownerCancelApprovedLeave(String id) {

        LeaveRequestVO leave =
                leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("존재하지 않는 신청");
        }

        if (!"APPROVED".equals(leave.getStatus())) {
            throw new IllegalStateException("승인된 신청만 취소 가능합니다.");
        }

        leaveRequestMapper.rollbackShiftStatusScheduled(leave.getShift_id());
        leaveRequestMapper.cancelLeaveRequest(id);
    }

    // =========================
    // [직원]
    // =========================

    public void registerLeaveRequest(LeaveRequestVO leaveRequestVO) {

        leaveRequestVO.setId(
                "LR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 15)
        );

        leaveRequestMapper.registerLeaveRequest(leaveRequestVO);

        // 선민 수정 - 휴무 신청 시 shift 상태를 LEAVE_PENDING으로 변경
        leaveRequestMapper.updateShiftStatusLeavePending(leaveRequestVO.getShift_id());

        sendLeaveRequestSubmittedToRequester(leaveRequestVO);
        sendLeaveRequestToOwner(leaveRequestVO);
    }

    // =========================
    // LINE 알림 - 관리자
    // =========================
    private void sendLeaveRequestSubmittedToRequester(LeaveRequestVO vo) {

        try {

            String lineUserId =
                    userLineService.getLineUserIdByUserId(vo.getUser_id());

            if (lineUserId != null) {
                lineService.sendMessage(
                        lineUserId,
                        "휴무 신청이 완료되었습니다.\n사유: " + defaultText(vo.getReason(), "-")
                );
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void sendLeaveRequestToOwner(LeaveRequestVO vo) {

        try {

            String ownerLineId =
                    userLineService.getOwnerLineUserIdByShiftId(vo.getShift_id());

            if (ownerLineId != null) {
                lineService.sendMessage(
                        ownerLineId,
                        "휴무 신청이 접수되었습니다.\n사유: " + vo.getReason()
                );
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // =========================
    // 직원 취소 (기존 유지)
    // =========================
    @Transactional
    public void cancelLeaveRequest(String id) {

        LeaveRequestVO leave =
                leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("존재하지 않는 신청");
        }

        if (!"PENDING".equals(leave.getStatus())) {
            throw new IllegalStateException("대기중인 신청만 취소 가능합니다.");
        }

        leaveRequestMapper.cancelLeaveRequest(id);

        // 선민 수정 - 대기 중 휴무 취소 시 shift 상태를 SCHEDULED로 복구
        leaveRequestMapper.rollbackShiftStatusScheduled(leave.getShift_id());
    }

    public List<LeaveRequestVO> getMyLeaveRequests(
            String user_id,
            int year,
            int month,
            String status
    ) {

        if (status == null || status.isBlank()) {
            return leaveRequestMapper.getMyLeaveRequests(user_id, year, month);
        }

        return leaveRequestMapper.getMyLeaveRequestsByStatus(user_id, year, month, status);
    }
    // =========================
    // LINE 보조 메서드 (추가)
    // =========================

    // 직원 user_id → LINE ID 변환 (없으면 UserLineService에서 가져옴)
    private String getLineUserId(String user_id) {
        try {
            return userLineService.getLineUserIdByUserId(user_id);
        } catch (Exception e) {
            return null;
        }
    }

    // shift_id → 관리자 LINE ID (없으면 UserLineService에서 가져옴)
    private String getOwnerLineUserId(String shift_id) {
        try {
            return userLineService.getOwnerLineUserIdByShiftId(shift_id);
        } catch (Exception e) {
            return null;
        }
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    // =========================
    // 선민 수정 - 앱 알림 헬퍼 메서드 추가
    // =========================
    private void createNotification(
            String userId,
            String storeId,
            String type,
            String title,
            String content,
            String refId
    ) {
        com.dm.backend.vo.NotificationVO notification = new com.dm.backend.vo.NotificationVO();
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

        notificationService.createNotification(notification);
    }
}
