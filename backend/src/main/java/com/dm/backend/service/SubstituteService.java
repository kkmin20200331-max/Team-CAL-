package com.dm.backend.service;

import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.mapper.SubstituteMapper;
import com.dm.backend.vo.NotificationVO;
import com.dm.backend.vo.ShiftVO;
import com.dm.backend.vo.StoreMemberVo;
import com.dm.backend.vo.SubstituteApplicationVO;
import com.dm.backend.vo.SubstituteHistoryVO;
import com.dm.backend.vo.SubstitutePostVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class SubstituteService {

    @Autowired
    private SubstituteMapper substituteMapper;

    @Autowired
    private LineService lineService;

    @Autowired
    private UserLineService userLineService;

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    @Autowired
    private ShiftMapper shiftMapper;

    @Autowired
    private NotificationService notificationService;

    public List<SubstitutePostVO> getPostList(String store_id) {
        return substituteMapper.getPostList(store_id);
    }

    public List<SubstituteApplicationVO> getApplicationList(String post_id) {
        return substituteMapper.getApplicationList(post_id);
    }

    // application_id 하나로 대타 승인 처리 (shift 없는 경우 포함)
    @Transactional
    public void approveByApplicationId(String applicationId, String approvedBy) {
        SubstituteApplicationVO application = substituteMapper.getApplication(applicationId);
        if (application == null) {
            throw new IllegalArgumentException("존재하지 않는 대타 지원입니다.");
        }

        SubstitutePostVO post = substituteMapper.getPost(application.getSubstitute_post_id());
        if (post == null) {
            throw new IllegalArgumentException("대타 모집글을 찾을 수 없습니다.");
        }

        String shiftId = post.getShift_id();
        if (shiftId == null || shiftId.isBlank()) {
            approveEmergencyApplication(application, post);
            return;
        }

        SubstituteHistoryVO history = new SubstituteHistoryVO();
        history.setApproved_by(approvedBy);

        approveSubstitute(shiftId, application.getApplicant_user_id(), history);
    }

    // 대타 승인
    @Transactional
    public void approveSubstitute(
            String shift_id,
            String selectedUserId,
            SubstituteHistoryVO historyVO
    ) {

        if (shift_id == null || shift_id.isBlank()
                || selectedUserId == null || selectedUserId.isBlank()) {
            throw new IllegalArgumentException("대타 승인에 필요한 근무 ID 또는 직원 ID가 없습니다.");
        }

        if (historyVO == null) {
            historyVO = new SubstituteHistoryVO();
        }

        SubstitutePostVO post =
                substituteMapper.getOpenPostByShiftId(shift_id);

        if (post != null) {
            fillHistoryFromPost(historyVO, post, shift_id, selectedUserId);
        } else {
            fillHistoryWithoutPost(historyVO, shift_id, selectedUserId);
        }

        substituteMapper.updateShiftUser(shift_id, selectedUserId);
        substituteMapper.updateShiftStatus(shift_id, "SUBSTITUTED");
        substituteMapper.insertHistory(historyVO);
        closePostAfterApproval(post, selectedUserId);

        sendLineToUser(
                selectedUserId,
                "[대타 승인]\n신청하신 대타 근무가 승인되었습니다.\n앱에서 근무 일정을 확인해주세요."
        );

        if (historyVO.getOriginal_user_id() != null
                && !historyVO.getOriginal_user_id().equals(selectedUserId)) {
            sendLineToUser(
                    historyVO.getOriginal_user_id(),
                    "[대타 승인]\n요청하신 대타 근무자가 확정되었습니다.\n앱에서 내용을 확인해주세요."
            );
        }
    }

    @Transactional
    public void processSubstituteApplication(
            String applicationId,
            String status,
            SubstituteHistoryVO historyVO
    ) {

        SubstituteApplicationVO application =
                substituteMapper.getApplication(applicationId);

        if (application == null) {
            throw new IllegalArgumentException("존재하지 않는 대타 지원입니다.");
        }

        String nextStatus = status == null || status.isBlank()
                ? "APPROVED"
                : status.toUpperCase();

        if ("REJECTED".equals(nextStatus)) {
            substituteMapper.updateApplicationStatus(applicationId, "REJECTED");
            return;
        }

        if (!"APPROVED".equals(nextStatus)) {
            throw new IllegalArgumentException("지원 처리 상태가 올바르지 않습니다.");
        }

        SubstitutePostVO post =
                substituteMapper.getPost(application.getSubstitute_post_id());

        if (post == null) {
            throw new IllegalArgumentException("대타 모집글을 찾을 수 없습니다.");
        }

        if (post.getShift_id() == null || post.getShift_id().isBlank()) {
            throw new IllegalStateException("근무가 연결되지 않은 긴급 대타 요청은 근무표를 자동 변경할 수 없습니다.");
        }

        if (historyVO == null) {
            historyVO = new SubstituteHistoryVO();
        }

        fillHistoryFromPost(
                historyVO,
                post,
                post.getShift_id(),
                application.getApplicant_user_id()
        );

        approveSubstitute(
                post.getShift_id(),
                application.getApplicant_user_id(),
                historyVO
        );
    }

    @Transactional
    public void cancelPost(String post_id) {

        String shift_id =
                substituteMapper.getShiftIdByPostId(post_id);

        substituteMapper.cancelPost(post_id);

        if (shift_id != null && !shift_id.isEmpty()) {
            substituteMapper.updateShiftStatus(
                    shift_id,
                    "SCHEDULED"
            );
        }
    }

    @Transactional
    public void createPost(SubstitutePostVO postVO) {

        if (postVO.getId() == null || postVO.getId().trim().isEmpty()) {
            String uniquePart = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
            postVO.setId("SP_" + (System.currentTimeMillis() / 1000) + uniquePart);
        }

        if (postVO.getStatus() == null || postVO.getStatus().isBlank()) {
            postVO.setStatus("PENDING");
        }

        if (postVO.getCreated_at() == null) {
            postVO.setCreated_at(LocalDateTime.now());
        }

        if (postVO.getShift_id() != null && postVO.getShift_id().trim().isEmpty()) {
            postVO.setShift_id(null);
        }

        substituteMapper.createPost(postVO);
        notifyAdminsForSubstitutePost(postVO);

        if (postVO.getShift_id() != null) {
            substituteMapper.updateShiftStatus(
                    postVO.getShift_id(),
                    "SUBSTITUTE_OPEN"
            );

            notifyAvailableStaffForShiftPost(postVO);
            return;
        }

        notifyAvailableStaffForEmergencyPost(postVO);
    }

    private void notifyAdminsForSubstitutePost(SubstitutePostVO postVO) {

        String reason =
                postVO.getReason() == null || postVO.getReason().isBlank()
                        ? "미입력"
                        : postVO.getReason();

        sendLineToAdmins(
                postVO.getStore_id(),
                "[대타 신청]\n새로운 대타 요청이 등록되었습니다.\n사유: "
                        + reason
                        + "\n앱에서 대타 요청을 확인해주세요."
        );
    }

    private void notifyAvailableStaffForShiftPost(SubstitutePostVO postVO) {

        ShiftVO shift = shiftMapper.getShift(postVO.getShift_id());

        if (shift == null || shift.getWork_date() == null) {
            return;
        }

        LocalDate workDate = shift.getWork_date()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();

        String day = workDate.getDayOfWeek().name();

        List<StoreMemberVo> members = storeMemberMapper.getAvailableMembersByDay(
                postVO.getStore_id(),
                day
        );

        if (members == null) {
            return;
        }

        for (StoreMemberVo member : members) {
            if (!isApprovedStaff(member)
                    || isSameUser(member.getUser_id(), postVO.getRequester_user_id())) {
                continue;
            }

            sendLineToUser(
                    member.getUser_id(),
                    "[대타 모집]\n새로운 대타 모집글이 등록되었습니다.\n앱에서 확인해주세요."
            );
        }
    }

    private void notifyAvailableStaffForEmergencyPost(SubstitutePostVO postVO) {

        String dateStr = extractDateFromReason(postVO.getReason());

        if (dateStr == null) {
            return;
        }

        List<ShiftVO> activeShifts =
                shiftMapper.getShiftList(postVO.getStore_id(), dateStr, dateStr);

        Set<String> workingUserIds = new HashSet<>();
        if (activeShifts != null) {
            for (ShiftVO shift : activeShifts) {
                if (shift.getUser_id() != null) {
                    workingUserIds.add(shift.getUser_id());
                }
            }
        }

        List<StoreMemberVo> allMembers =
                storeMemberMapper.getStoreMembers(postVO.getStore_id());

        if (allMembers == null) {
            return;
        }

        for (StoreMemberVo member : allMembers) {
            String userId = member.getUser_id();

            if (!isApprovedStaff(member)
                    || userId == null
                    || isSameUser(userId, postVO.getRequester_user_id())
                    || workingUserIds.contains(userId)) {
                continue;
            }

            createSubstituteNotification(userId, postVO, dateStr);
            sendLineToUser(
                    userId,
                    "[긴급 대타 요청]\n" + dateStr + " 대타 근무가 가능한지 확인해주세요.\n앱에서 내용을 확인할 수 있습니다."
            );
        }
    }

    @Transactional
    public void apply(
            SubstituteApplicationVO applicationVO
    ) {
        if (applicationVO.getId() == null || applicationVO.getId().trim().isEmpty()) {
            String uniquePart = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 6);
            applicationVO.setId("SA_" + (System.currentTimeMillis() / 1000) + uniquePart);
        }
        if (applicationVO.getApplied_at() == null) {
            applicationVO.setApplied_at(LocalDateTime.now());
        }

        if (applicationVO.getId() == null || applicationVO.getId().isBlank()) {
            applicationVO.setId("SA_" + UUID.randomUUID().toString().replace("-", "").substring(0, 15));
        }

        if (applicationVO.getStatus() == null || applicationVO.getStatus().isBlank()) {
            applicationVO.setStatus("PENDING");
        }

        if (applicationVO.getApplied_at() == null) {
            applicationVO.setApplied_at(LocalDateTime.now());
        }

        substituteMapper.apply(applicationVO);

        SubstitutePostVO post =
                substituteMapper.getPost(
                        applicationVO.getSubstitute_post_id()
                );

        if (post == null) {
            return;
        }

        sendLineToAdmins(
                post.getStore_id(),
                "[대타 지원]\n새로운 대타 지원자가 등록되었습니다.\n앱에서 지원자 목록을 확인해주세요."
        );
    }

    @Transactional
    public void cancelApplication(String id) {

        SubstituteApplicationVO application =
                substituteMapper.getApplication(id);

        if (application == null) {
            throw new IllegalArgumentException("존재하지 않는 신청입니다.");
        }

        if (!"PENDING".equals(application.getStatus())) {
            throw new IllegalStateException("대기 중인 신청만 취소할 수 있습니다.");
        }

        substituteMapper.cancelApplication(id);

        SubstitutePostVO post =
                substituteMapper.getPost(
                        application.getSubstitute_post_id()
                );

        if (post == null) {
            return;
        }

        sendLineToAdmins(
                post.getStore_id(),
                "[대타 지원 취소]\n대타 지원자 1명이 신청을 취소했습니다.\n앱에서 확인해주세요."
        );
    }

    public List<SubstituteApplicationVO> getMyApplications(
            String user_id,
            String status
    ) {

        if (status == null || status.isBlank()) {
            return substituteMapper.getMyApplications(user_id);
        }

        return substituteMapper.getMyApplicationsByStatus(
                user_id,
                status
        );
    }

    public List<SubstitutePostVO> getMyPosts(
            String user_id,
            String status
    ) {

        if (status == null || status.isBlank()) {
            return substituteMapper.getMyPosts(user_id);
        }

        return substituteMapper.getMyPostsByStatus(
                user_id,
                status
        );
    }

    private void sendLineToUser(String userId, String message) {

        try {
            String lineUserId =
                    userLineService.getLineUserIdByUserId(userId);

            if (lineUserId == null) {
                return;
            }

            lineService.sendMessage(lineUserId, message);
        } catch (Exception e) {
            System.err.println("LINE send failed for user_id " + userId + ": " + e.getMessage());
        }
    }

    private void fillHistoryFromPost(
            SubstituteHistoryVO historyVO,
            SubstitutePostVO post,
            String shiftId,
            String selectedUserId
    ) {

        if (historyVO.getId() == null || historyVO.getId().isBlank()) {
            historyVO.setId("SH_" + UUID.randomUUID().toString().replace("-", "").substring(0, 15));
        }

        if (historyVO.getShift_id() == null || historyVO.getShift_id().isBlank()) {
            historyVO.setShift_id(shiftId);
        }

        if (historyVO.getStore_id() == null || historyVO.getStore_id().isBlank()) {
            historyVO.setStore_id(post.getStore_id());
        }

        if (historyVO.getOriginal_user_id() == null || historyVO.getOriginal_user_id().isBlank()) {
            historyVO.setOriginal_user_id(post.getRequester_user_id());
        }

        if (historyVO.getSubstitute_user_id() == null || historyVO.getSubstitute_user_id().isBlank()) {
            historyVO.setSubstitute_user_id(selectedUserId);
        }

        if (historyVO.getApproved_at() == null) {
            historyVO.setApproved_at(LocalDateTime.now());
        }
    }

    private void fillHistoryWithoutPost(
            SubstituteHistoryVO historyVO,
            String shiftId,
            String selectedUserId
    ) {

        if (historyVO.getId() == null || historyVO.getId().isBlank()) {
            historyVO.setId("SH_" + UUID.randomUUID().toString().replace("-", "").substring(0, 15));
        }

        if (historyVO.getShift_id() == null || historyVO.getShift_id().isBlank()) {
            historyVO.setShift_id(shiftId);
        }

        if (historyVO.getSubstitute_user_id() == null || historyVO.getSubstitute_user_id().isBlank()) {
            historyVO.setSubstitute_user_id(selectedUserId);
        }

        if (historyVO.getApproved_at() == null) {
            historyVO.setApproved_at(LocalDateTime.now());
        }
    }

    private void closePostAfterApproval(
            SubstitutePostVO post,
            String selectedUserId
    ) {

        if (post == null) {
            return;
        }

        SubstituteApplicationVO approvedApplication =
                substituteMapper.getPendingApplicationByPostAndApplicant(
                        post.getId(),
                        selectedUserId
                );

        if (approvedApplication != null) {
            substituteMapper.updateApplicationStatus(approvedApplication.getId(), "APPROVED");
            substituteMapper.rejectOtherApplications(post.getId(), approvedApplication.getId());
        }

        substituteMapper.closePost(post.getId());
    }

    private void approveEmergencyApplication(
            SubstituteApplicationVO application,
            SubstitutePostVO post
    ) {

        substituteMapper.updateApplicationStatus(application.getId(), "APPROVED");
        substituteMapper.rejectOtherApplications(post.getId(), application.getId());
        substituteMapper.closePost(post.getId());

        sendLineToUser(
                application.getApplicant_user_id(),
                "[대타 승인]\n신청하신 긴급 대타 요청이 승인되었습니다.\n앱에서 내용을 확인해주세요."
        );

        if (post.getRequester_user_id() != null
                && !post.getRequester_user_id().equals(application.getApplicant_user_id())) {
            sendLineToUser(
                    post.getRequester_user_id(),
                    "[대타 승인]\n요청하신 긴급 대타 근무자가 확정되었습니다.\n앱에서 내용을 확인해주세요."
            );
        }
    }

    private void sendLineToAdmins(String storeId, String message) {

        try {
            List<String> adminLineIds =
                    userLineService.getAdminLineUserIdsByStoreId(storeId);

            System.out.println("Admin LINE target count for store_id " + storeId + ": " + adminLineIds.size());

            if (adminLineIds.isEmpty()) {
                System.out.println("No admin LINE user found for store_id: " + storeId);
                return;
            }

            for (String adminLineId : adminLineIds) {
                try {
                    lineService.sendMessage(adminLineId, message);
                } catch (Exception e) {
                    System.err.println("LINE send failed for admin line user: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Admin LINE lookup failed for store_id " + storeId + ": " + e.getMessage());
        }
    }

    private void createSubstituteNotification(
            String userId,
            SubstitutePostVO postVO,
            String dateStr
    ) {

        NotificationVO notification = new NotificationVO();
        notification.setId("NOTI_" + UUID.randomUUID().toString().replace("-", ""));
        notification.setUser_id(userId);
        notification.setStore_id(postVO.getStore_id());
        notification.setType("SCHEDULE");
        notification.setTitle("대타 요청 알림");
        notification.setContent(dateStr + " 대타 근무 가능 여부를 확인해주세요. (" + postVO.getReason() + ")");
        notification.setRef_id(postVO.getId());

        try {
            notificationService.createNotification(notification);
        } catch (Exception e) {
            System.err.println("Notification create failed: " + e.getMessage());
        }
    }

    private boolean isApprovedStaff(StoreMemberVo member) {
        return member != null
                && "APPROVED".equalsIgnoreCase(member.getApproval_status())
                && "STAFF".equalsIgnoreCase(member.getMember_role());
    }

    private boolean isSameUser(String left, String right) {
        return left != null && left.equals(right);
    }

    private String extractDateFromReason(String reason) {

        if (reason == null || !reason.contains("[") || !reason.contains("]")) {
            return null;
        }

        int start = reason.indexOf("[") + 1;
        int end = reason.indexOf("]");

        if (start >= end) {
            return null;
        }

        String dateStr = reason.substring(start, end).trim();
        return dateStr.matches("\\d{4}-\\d{2}-\\d{2}") ? dateStr : null;
    }
}
