package com.dm.backend.service;

import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.mapper.SubstituteMapper;
import com.dm.backend.vo.NotificationVO;
import com.dm.backend.vo.ShiftVO;
import com.dm.backend.vo.StoreMemberVo;
import com.dm.backend.vo.SubstituteApplicationVO;
import com.dm.backend.vo.SubstituteCalendarVO;
import com.dm.backend.vo.SubstituteHistoryVO;
import com.dm.backend.vo.SubstitutePostVO;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

@Service
public class SubstituteService {

    @Autowired
    private SubstituteMapper substituteMapper;

    @Autowired
    private LineService lineService;

    @Autowired
    private UserLineService userLineService;

    @Autowired
    private UserLanguageService userLanguageService;

    @Autowired
    private LineMessageTemplateService lineMessageTemplateService;

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

    @Transactional
    public void approveByApplicationId(String applicationId, String approvedBy) {
        SubstituteApplicationVO application = substituteMapper.getApplication(applicationId);
        if (application == null) {
            throw new IllegalArgumentException("Substitute application not found.");
        }

        SubstitutePostVO post = substituteMapper.getPost(application.getSubstitute_post_id());
        if (post == null) {
            throw new IllegalArgumentException("Substitute post not found.");
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

    @Transactional
    public void approveSubstitute(
            String shift_id,
            String selectedUserId,
            SubstituteHistoryVO historyVO
    ) {

        if (shift_id == null || shift_id.isBlank()
                || selectedUserId == null || selectedUserId.isBlank()) {
            throw new IllegalArgumentException("Shift ID and selected user ID are required.");
        }

        if (historyVO == null) {
            historyVO = new SubstituteHistoryVO();
        }

        SubstitutePostVO post = substituteMapper.getOpenPostByShiftId(shift_id);

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
                lineMessageTemplateService::substituteApprovedForApplicant
        );

        if (historyVO.getOriginal_user_id() != null
                && !historyVO.getOriginal_user_id().equals(selectedUserId)) {
            sendLineToUser(
                    historyVO.getOriginal_user_id(),
                    lineMessageTemplateService::substituteApprovedForRequester
            );
        }
    }

    @Transactional
    public void processSubstituteApplication(
            String applicationId,
            String status,
            SubstituteHistoryVO historyVO
    ) {

        SubstituteApplicationVO application = substituteMapper.getApplication(applicationId);
        if (application == null) {
            throw new IllegalArgumentException("Substitute application not found.");
        }

        String nextStatus = status == null || status.isBlank()
                ? "APPROVED"
                : status.toUpperCase();

        if ("REJECTED".equals(nextStatus)) {
            substituteMapper.updateApplicationStatus(applicationId, "REJECTED");
            return;
        }

        if (!"APPROVED".equals(nextStatus)) {
            throw new IllegalArgumentException("Unsupported substitute application status.");
        }

        SubstitutePostVO post = substituteMapper.getPost(application.getSubstitute_post_id());
        if (post == null) {
            throw new IllegalArgumentException("Substitute post not found.");
        }

        if (post.getShift_id() == null || post.getShift_id().isBlank()) {
            throw new IllegalStateException("Emergency substitute requests are approved by application ID only.");
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

        String shift_id = substituteMapper.getShiftIdByPostId(post_id);
        substituteMapper.cancelPost(post_id);

        if (shift_id != null && !shift_id.isEmpty()) {
            substituteMapper.updateShiftStatus(shift_id, "SCHEDULED");
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
            substituteMapper.updateShiftStatus(postVO.getShift_id(), "SUBSTITUTE_OPEN");
            notifyAvailableStaffForShiftPost(postVO);
            return;
        }

        notifyAvailableStaffForEmergencyPost(postVO);
    }

    private void notifyAdminsForSubstitutePost(SubstitutePostVO postVO) {

        String reason = defaultText(postVO.getReason(), "N/A");

        sendLineToAdmins(
                postVO.getStore_id(),
                language -> lineMessageTemplateService.substituteRequest(language, reason)
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

        List<StoreMemberVo> members = storeMemberMapper.getAvailableMembersByDay(
                postVO.getStore_id(),
                workDate.getDayOfWeek().name()
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
                    lineMessageTemplateService::substituteRecruitment
            );
        }
    }

    private void notifyAvailableStaffForEmergencyPost(SubstitutePostVO postVO) {

        String dateStr = extractDateFromReason(postVO.getReason());
        if (dateStr == null) {
            return;
        }

        List<ShiftVO> activeShifts = shiftMapper.getShiftList(postVO.getStore_id(), dateStr, dateStr);

        Set<String> workingUserIds = new HashSet<>();
        if (activeShifts != null) {
            for (ShiftVO shift : activeShifts) {
                if (shift.getUser_id() != null) {
                    workingUserIds.add(shift.getUser_id());
                }
            }
        }

        List<StoreMemberVo> allMembers = storeMemberMapper.getStoreMembers(postVO.getStore_id());
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
                    language -> lineMessageTemplateService.emergencySubstituteRecruitment(language, dateStr)
            );
        }
    }

    @Transactional
    public void apply(SubstituteApplicationVO applicationVO) {

        if (applicationVO.getId() == null || applicationVO.getId().trim().isEmpty()) {
            String uniquePart = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
            applicationVO.setId("SA_" + (System.currentTimeMillis() / 1000) + uniquePart);
        }

        if (applicationVO.getStatus() == null || applicationVO.getStatus().isBlank()) {
            applicationVO.setStatus("PENDING");
        }

        if (applicationVO.getApplied_at() == null) {
            applicationVO.setApplied_at(LocalDateTime.now());
        }

        substituteMapper.apply(applicationVO);

        SubstitutePostVO post = substituteMapper.getPost(applicationVO.getSubstitute_post_id());
        if (post == null) {
            return;
        }

        sendLineToAdmins(
                post.getStore_id(),
                lineMessageTemplateService::substituteApplication
        );
    }

    @Transactional
    public void cancelApplication(String id) {

        SubstituteApplicationVO application = substituteMapper.getApplication(id);
        if (application == null) {
            throw new IllegalArgumentException("Substitute application not found.");
        }

        if (!"PENDING".equals(application.getStatus())) {
            throw new IllegalStateException("Only pending substitute applications can be cancelled.");
        }

        substituteMapper.cancelApplication(id);

        SubstitutePostVO post = substituteMapper.getPost(application.getSubstitute_post_id());
        if (post == null) {
            return;
        }

        sendLineToAdmins(
                post.getStore_id(),
                lineMessageTemplateService::substituteApplicationCancelled
        );
    }

    public List<SubstituteApplicationVO> getMyApplications(String user_id, String status) {

        if (status == null || status.isBlank()) {
            return substituteMapper.getMyApplications(user_id);
        }

        return substituteMapper.getMyApplicationsByStatus(user_id, status);
    }

    public List<SubstituteCalendarVO> getMyApplicationsWithShiftInfo(String user_id) {
        return substituteMapper.getMyApplicationsWithShiftInfo(user_id);
    }

    public List<SubstitutePostVO> getMyPosts(String user_id, String status) {

        if (status == null || status.isBlank()) {
            return substituteMapper.getMyPosts(user_id);
        }

        return substituteMapper.getMyPostsByStatus(user_id, status);
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

    private void closePostAfterApproval(SubstitutePostVO post, String selectedUserId) {

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

        // 긴급 대타 승인 시 해당 직원에게 근무(shift) 생성
        String dateStr = extractDateFromReason(post.getReason());
        if (dateStr != null && post.getStore_id() != null) {
            try {
                Date workDate = java.sql.Date.valueOf(dateStr);
                ShiftVO newShift = new ShiftVO();
                newShift.setId("SH_SUB_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
                newShift.setStore_id(post.getStore_id());
                newShift.setUser_id(application.getApplicant_user_id());
                newShift.setWork_date(workDate);
                newShift.setStart_at(workDate);
                newShift.setEnd_at(workDate);
                newShift.setStatus("confirmed");
                shiftMapper.registerShift(newShift);
            } catch (Exception e) {
                System.err.println("긴급 대타 shift 생성 실패: " + e.getMessage());
            }
        }

        sendLineToUser(
                application.getApplicant_user_id(),
                lineMessageTemplateService::substituteApprovedForApplicant
        );

        if (post.getRequester_user_id() != null
                && !post.getRequester_user_id().equals(application.getApplicant_user_id())) {
            sendLineToUser(
                    post.getRequester_user_id(),
                    lineMessageTemplateService::substituteApprovedForRequester
            );
        }
    }

    private void sendLineToAdmins(String storeId, Function<String, String> messageFactory) {

        try {
            List<UserLineVO> adminTargets = userLineService.getAdminLineTargetsByStoreId(storeId);

            System.out.println("Admin LINE target count for store_id " + storeId + ": " + adminTargets.size());

            if (adminTargets.isEmpty()) {
                System.out.println("No admin LINE user found for store_id: " + storeId);
                return;
            }

            for (UserLineVO adminTarget : adminTargets) {
                try {
                    String language = userLanguageService.normalize(adminTarget.getLanguage());
                    lineService.sendMessage(
                            adminTarget.getLine_user_id(),
                            messageFactory.apply(language)
                    );
                } catch (Exception e) {
                    System.err.println("LINE send failed for admin line user: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Admin LINE lookup failed for store_id " + storeId + ": " + e.getMessage());
        }
    }

    private void createSubstituteNotification(String userId, SubstitutePostVO postVO, String dateStr) {

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

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
