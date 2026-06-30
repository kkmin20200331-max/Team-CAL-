package com.dm.backend.service;

import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.mapper.SubstituteMapper;
import com.dm.backend.mapper.UserLineMapper;
import com.dm.backend.vo.*;
import com.dm.backend.service.NotificationService;
import com.dm.backend.vo.NotificationVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class SubstituteService {

    @Autowired
    private SubstituteMapper substituteMapper;
    @Autowired
    private UserLineMapper userLineMapper;
    @Autowired
    private LineService lineService;
    @Autowired
    private StoreMemberMapper storeMemberMapper;
    @Autowired
    private ShiftMapper shiftMapper;
    @Autowired
    private NotificationService notificationService;

    // =========================
    // [공통]
    // =========================

    // 모집글 목록 조회
    public List<SubstitutePostVO> getPostList(
            String store_id
    ) {
        return substituteMapper.getPostList(store_id);
    }


    // =========================
    // [관리자]
    // =========================

    // 지원자 목록 조회
    public List<SubstituteApplicationVO> getApplicationList(
            String post_id
    ) {
        return substituteMapper.getApplicationList(post_id);
    }

    // application_id 하나로 대타 승인 처리 (shift 없는 경우 포함)
    @Transactional
    public void approveByApplicationId(String applicationId, String approvedBy) {
        SubstituteApplicationVO app = substituteMapper.getApplication(applicationId);
        if (app == null) throw new RuntimeException("Application not found: " + applicationId);

        SubstitutePostVO post = substituteMapper.getPost(app.getSubstitute_post_id());
        if (post == null) throw new RuntimeException("Post not found");

        // 지원 상태 승인으로 변경
        substituteMapper.approveApplication(applicationId);

        // 모집글 마감
        substituteMapper.closePost(post.getId());

        String shiftId = post.getShift_id();
        if (shiftId != null && !shiftId.trim().isEmpty()) {
            // shift가 있으면 shift 담당자 교체 + 상태 변경 + 이력 기록
            substituteMapper.updateShiftUser(shiftId, app.getApplicant_user_id());
            substituteMapper.updateShiftStatus(shiftId, "SUBSTITUTED");

            SubstituteHistoryVO history = new SubstituteHistoryVO();
            String uniquePart = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 6);
            history.setId("SH_" + (System.currentTimeMillis() / 1000) + uniquePart);
            history.setShift_id(shiftId);
            history.setStore_id(post.getStore_id());
            history.setOriginal_user_id(post.getRequester_user_id());
            history.setSubstitute_user_id(app.getApplicant_user_id());
            history.setApproved_by(approvedBy);
            history.setApproved_at(LocalDateTime.now());
            substituteMapper.insertHistory(history);
        }

        // LINE 알림
        String lineUserId = userLineMapper.getLineUserId(app.getApplicant_user_id());
        if (lineUserId != null) {
            lineService.sendMessage(lineUserId,
                """
                [대타 승인]

                신청하신 대타 근무가 승인되었습니다.

                앱에서 근무 일정을 확인해주세요.
                """
            );
        }
    }

    // 대타 승인
    @Transactional
    public void approveSubstitute(
            String shift_id,
            String selectedUserId,
            SubstituteHistoryVO historyVO
    ) {

        substituteMapper.updateShiftUser(
                shift_id,
                selectedUserId
        );

        substituteMapper.updateShiftStatus(
                shift_id,
                "SUBSTITUTED"
        );

        substituteMapper.insertHistory(
                historyVO
        );

        // =========================
        // LINE 알림
        // =========================

        String lineUserId =
                userLineMapper.getLineUserId(
                        selectedUserId
                );

        if(lineUserId != null){

            lineService.sendMessage(
                    lineUserId,
                    """
                    [대타 승인]
    
                    신청하신 대타 근무가 승인되었습니다.
    
                    앱에서 근무 일정을 확인해주세요.
                    """
            );
        }
    }

    // 모집글 취소
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


    // =========================
    // [직원]
    // =========================

    // 모집글 생성
    @Transactional
    public void createPost(SubstitutePostVO postVO) {
        // 1. ID가 없는 경우 고유한 ID 자동 생성 (Oracle DDL length: 21자 제한 준수)
        if (postVO.getId() == null || postVO.getId().trim().isEmpty()) {
            String uniquePart = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 6);
            postVO.setId("SP_" + (System.currentTimeMillis() / 1000) + uniquePart); // 총 19자
        }

        // 2. shift_id가 빈 문자열("")이면 null 처리
        if (postVO.getShift_id() != null && postVO.getShift_id().trim().isEmpty()) {
            postVO.setShift_id(null);
        }

        substituteMapper.createPost(postVO);

        // 3. shift_id가 있는 경우에만 관련 shift 업데이트 및 알림 프로세스 실행
        if (postVO.getShift_id() != null) {
            substituteMapper.updateShiftStatus(
                    postVO.getShift_id(),
                    "SUBSTITUTE_OPEN"
            );

            // =========================
            // 근무 요일 확인
            // =========================
            ShiftVO shift = shiftMapper.getShift(postVO.getShift_id());

            if (shift != null && shift.getWork_date() != null) {
                LocalDate workDate = shift.getWork_date()
                        .toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate();

                String day = workDate.getDayOfWeek().name();

                // =========================
                // 해당 요일 가능한 직원 조회
                // =========================
                List<StoreMemberVo> members = storeMemberMapper.getAvailableMembersByDay(
                        postVO.getStore_id(),
                        day
                );

                // =========================
                // LINE 알림
                // =========================
                for (StoreMemberVo member : members) {
                    // 모집글 작성자 제외
                    if (member.getUser_id().equals(postVO.getRequester_user_id())) {
                        continue;
                    }

                    String lineUserId = userLineMapper.getLineUserId(member.getUser_id());

                    if (lineUserId != null) {
                        lineService.sendMessage(
                                lineUserId,
                                """
                                [대타 모집]
            
                                새로운 대타 모집글이 등록되었습니다.
            
                                앱에서 확인해주세요.
                                """
                        );
                    }
                }
            }
        } else {
            // ====================================================
            // [추가된 요구사항]: 스케줄이 지정되지 않은 긴급 대타 요청 (reason에서 날짜 추출)
            // 해당 날짜에 근무가 없는 비번 직원들에게 인앱 알림을 생성합니다.
            // ====================================================
            String reason = postVO.getReason();
            String dateStr = null;
            if (reason != null && reason.contains("[") && reason.contains("]")) {
                int start = reason.indexOf("[") + 1;
                int end = reason.indexOf("]");
                if (start < end) {
                    dateStr = reason.substring(start, end).trim(); // 예: "2026-06-23"
                }
            }

            if (dateStr != null && dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                // 1. 해당 날짜에 근무가 배정된 스케줄 목록 조회
                List<ShiftVO> activeShifts = shiftMapper.getShiftList(postVO.getStore_id(), dateStr, dateStr);
                java.util.Set<String> workingUserIds = new java.util.HashSet<>();
                if (activeShifts != null) {
                    for (ShiftVO s : activeShifts) {
                        if (s.getUser_id() != null) {
                            workingUserIds.add(s.getUser_id());
                        }
                    }
                }

                // 2. 매장 전체 직원 조회
                List<StoreMemberVo> allMembers = storeMemberMapper.getStoreMembers(postVO.getStore_id());
                if (allMembers != null) {
                    for (StoreMemberVo member : allMembers) {
                        // 승인된 실직원(STAFF) 중, 해당 날짜에 근무(스케줄)가 없는 사람만 필터링
                        if ("APPROVED".equals(member.getApproval_status()) && "STAFF".equals(member.getMember_role())) {
                            String empUserId = member.getUser_id();
                            
                            // 요청자(점주 등) 제외 및 근무 중이지 않은 직원
                            if (empUserId != null && !empUserId.equals(postVO.getRequester_user_id()) && !workingUserIds.contains(empUserId)) {
                                // 3. 알림 DB 적재 (웹 및 모바일 앱 알림 탭에 공통 표시됨)
                                NotificationVO notification = new NotificationVO();
                                notification.setId("NOTI_" + java.util.UUID.randomUUID().toString().replace("-", ""));
                                notification.setUser_id(empUserId);
                                notification.setStore_id(postVO.getStore_id());
                                notification.setType("SCHEDULE"); // 알림 타입 지정
                                notification.setTitle("대타 요청 알림");
                                notification.setContent(dateStr + " 대타 근무가 가능한가요? (" + reason + ")");
                                notification.setRef_id(postVO.getId()); // 참조 ID를 대타글 ID로 설정
                                
                                try {
                                    notificationService.createNotification(notification);
                                } catch (Exception e) {
                                    System.err.println("알림 생성 중 오류: " + e.getMessage());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 대타 지원
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

        substituteMapper.apply(
                applicationVO
        );

        // =========================
        // 관리자 LINE 알림
        // =========================

        SubstitutePostVO post =
                substituteMapper.getPost(
                        applicationVO.getSubstitute_post_id()
                );

        List<StoreMemberVo> admins =
                storeMemberMapper.getAdmins(
                        post.getStore_id()
                );

        for(StoreMemberVo admin : admins){

            String lineUserId =
                    userLineMapper.getLineUserId(
                            admin.getUser_id()
                    );

            if(lineUserId != null){

                lineService.sendMessage(
                        lineUserId,
                        """
                        [대타 지원]
                        
                        새로운 대타 지원이 등록되었습니다.
                        
                        앱에서 확인해주세요.
                        """
                );
            }
        }
    }

    // 지원 취소
    @Transactional
    public void cancelApplication(String id) {

        SubstituteApplicationVO application =
                substituteMapper.getApplication(id);

        if (application == null) {
            throw new IllegalArgumentException(
                    "존재하지 않는 신청입니다."
            );
        }

        if (!"PENDING".equals(application.getStatus())) {
            throw new IllegalStateException(
                    "대기중인 신청만 취소 가능합니다."
            );
        }

        substituteMapper.cancelApplication(id);

        // =========================
        // 관리자 LINE 알림
        // =========================

        SubstitutePostVO post =
                substituteMapper.getPost(
                        application.getSubstitute_post_id()
                );

        List<StoreMemberVo> admins =
                storeMemberMapper.getAdmins(
                        post.getStore_id()
                );

        for(StoreMemberVo admin : admins){

            String lineUserId =
                    userLineMapper.getLineUserId(
                            admin.getUser_id()
                    );

            if(lineUserId != null){

                lineService.sendMessage(
                        lineUserId,
                        """
                        [대타 지원 취소]
                        
                        지원자 1명이 대타 신청을 취소했습니다.
                        
                        앱에서 확인해주세요.
                        """
                );
            }
        }
    }

    // 내 지원 내역 조회
    public List<SubstituteApplicationVO> getMyApplications(
            String user_id,
            String status
    ) {

        if (status == null || status.isBlank()) {
            return substituteMapper.getMyApplications(
                    user_id
            );
        }

        return substituteMapper.getMyApplicationsByStatus(
                user_id,
                status
        );
    }

    // 내 모집글 조회
    public List<SubstitutePostVO> getMyPosts(
            String user_id,
            String status
    ) {

        if (status == null || status.isBlank()) {
            return substituteMapper.getMyPosts(
                    user_id
            );
        }

        return substituteMapper.getMyPostsByStatus(
                user_id,
                status
        );
    }
}