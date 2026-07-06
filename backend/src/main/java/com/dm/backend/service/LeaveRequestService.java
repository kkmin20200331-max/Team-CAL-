package com.dm.backend.service;

import com.dm.backend.mapper.LeaveRequestMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.vo.LeaveRequestVO;
import com.dm.backend.vo.NotificationVO;
import com.dm.backend.vo.ShiftVO;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.function.Function;

@Service
public class LeaveRequestService {

    @Autowired
    private LeaveRequestMapper leaveRequestMapper;

    @Autowired
    private LineService lineService;

    @Autowired
    private UserLineService userLineService;

    @Autowired
    private UserLanguageService userLanguageService;

    @Autowired
    private LineMessageTemplateService lineMessageTemplateService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ShiftMapper shiftMapper;

    public LeaveRequestVO getLeaveRequest(String id) {
        return leaveRequestMapper.getLeaveRequest(id);
    }

    public List<LeaveRequestVO> getLeaveRequestList(String store_id) {
        return leaveRequestMapper.getLeaveRequestList(store_id);
    }

    @Transactional
    public void processLeaveRequest(String id, String status) {

        if (!"APPROVED".equals(status) && !"REJECTED".equals(status)) {
            throw new IllegalArgumentException("Unsupported leave request status.");
        }

        LeaveRequestVO leave = leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("Leave request not found.");
        }

        if (!"PENDING".equals(leave.getStatus())) {
            throw new IllegalStateException("Leave request is already processed.");
        }

        leaveRequestMapper.updateLeaveStatus(id, status);

        if ("APPROVED".equals(status)) {
            leaveRequestMapper.updateShiftStatusVacant(leave.getShift_id());
        } else {
            leaveRequestMapper.rollbackShiftStatusScheduled(leave.getShift_id());
        }

        createLeaveResultNotification(leave, status);
        sendLeaveResultToStaff(leave, status);
    }

    @Transactional
    public void ownerCancelApprovedLeave(String id) {

        LeaveRequestVO leave = leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("Leave request not found.");
        }

        if (!"APPROVED".equals(leave.getStatus())) {
            throw new IllegalStateException("Only approved leave requests can be cancelled.");
        }

        leaveRequestMapper.rollbackShiftStatusScheduled(leave.getShift_id());
        leaveRequestMapper.cancelLeaveRequest(id);
    }

    @Transactional
    public void registerLeaveRequest(LeaveRequestVO leaveRequestVO) {

        leaveRequestVO.setId("LR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 15));

        leaveRequestMapper.registerLeaveRequest(leaveRequestVO);
        leaveRequestMapper.updateShiftStatusLeavePending(leaveRequestVO.getShift_id());

        sendLeaveRequestSubmittedToRequester(leaveRequestVO);
        sendLeaveRequestToAdmins(leaveRequestVO);
    }

    private void createLeaveResultNotification(LeaveRequestVO leave, String status) {

        try {
            ShiftVO shift = shiftMapper.getShift(leave.getShift_id());
            String storeId = shift != null ? shift.getStore_id() : "";
            boolean approved = "APPROVED".equals(status);

            createNotification(
                    leave.getUser_id(),
                    storeId,
                    "LEAVE_" + status,
                    approved ? "휴무 신청 승인" : "휴무 신청 거절",
                    approved
                            ? "휴무 신청이 승인되었습니다."
                            : "휴무 신청이 거절되었습니다.",
                    leave.getId()
            );
        } catch (Exception e) {
            System.err.println("Leave result notification create failed: " + e.getMessage());
        }
    }

    private void sendLeaveResultToStaff(LeaveRequestVO leave, String status) {

        sendLineToUser(
                leave.getUser_id(),
                language -> lineMessageTemplateService.leaveResult(language, status)
        );
    }

    private void sendLeaveRequestToAdmins(LeaveRequestVO vo) {

        String reason = defaultText(vo.getReason(), "N/A");

        try {
            List<UserLineVO> adminTargets =
                    userLineService.getOwnerLineTargetsByShiftId(vo.getShift_id());

            System.out.println(
                    "Leave admin LINE target count for shift_id " + vo.getShift_id() + ": " + adminTargets.size()
            );

            if (adminTargets.isEmpty()) {
                System.out.println("No admin LINE user found for shift_id: " + vo.getShift_id());
                return;
            }

            for (UserLineVO adminTarget : adminTargets) {
                try {
                    String language = userLanguageService.normalize(adminTarget.getLanguage());
                    lineService.sendMessage(
                            adminTarget.getLine_user_id(),
                            lineMessageTemplateService.leaveRequest(language, reason)
                    );
                } catch (Exception e) {
                    System.err.println("LINE send failed for admin line user: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Leave admin LINE lookup failed for shift_id " + vo.getShift_id() + ": " + e.getMessage());
        }
    }

    private void sendLeaveRequestSubmittedToRequester(LeaveRequestVO vo) {

        sendLineToUser(
                vo.getUser_id(),
                lineMessageTemplateService::leaveRequestSubmitted
        );
    }

    @Transactional
    public void cancelLeaveRequest(String id) {

        LeaveRequestVO leave = leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("Leave request not found.");
        }

        if (!"PENDING".equals(leave.getStatus())) {
            throw new IllegalStateException("Only pending leave requests can be cancelled.");
        }

        leaveRequestMapper.cancelLeaveRequest(id);
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

    private void sendLineToUser(String userId, Function<String, String> messageFactory) {

        try {
            String lineUserId = userLineService.getLineUserIdByUserId(userId);

            if (lineUserId == null) {
                return;
            }

            String language = userLanguageService.getLanguage(userId);
            lineService.sendMessage(lineUserId, messageFactory.apply(language));
        } catch (Exception e) {
            System.err.println("LINE send failed for user_id " + userId + ": " + e.getMessage());
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
        NotificationVO notification = new NotificationVO();
        notification.setId("NOTI_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        notification.setUser_id(userId);
        notification.setStore_id(storeId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setRef_id(refId);

        notificationService.createNotification(notification);
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
