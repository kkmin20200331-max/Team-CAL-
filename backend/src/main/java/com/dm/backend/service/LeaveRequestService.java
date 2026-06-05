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


    // =========================
    // [공통]
    // =========================

    // 휴무 신청 단건 조회
    public LeaveRequestVO getLeaveRequest(String id) {
        return leaveRequestMapper.getLeaveRequest(id);
    }


    // =========================
    // [관리자]
    // =========================

    // 매장별 승인 대기중 휴무 신청 목록 조회
    public List<LeaveRequestVO> getLeaveRequestList(String store_id) {
        return leaveRequestMapper.getLeaveRequestList(store_id);
    }

    // 휴무 신청 승인 / 거절 처리
    @Transactional
    public void processLeaveRequest(String id, String status) {

        if (!"APPROVED".equals(status)
                && !"REJECTED".equals(status)) {
            throw new IllegalArgumentException("잘못된 상태값");
        }

        LeaveRequestVO leave =
                leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("존재하지 않는 신청");
        }

        if (!"PENDING".equals(leave.getStatus())) {
            throw new IllegalStateException("이미 처리된 신청");
        }

        leaveRequestMapper.updateLeaveStatus(id, status);

        if ("APPROVED".equals(status)) {
            leaveRequestMapper.updateShiftStatusVacant(
                    leave.getShift_id()
            );
        }
    }

    // 승인된 휴무 취소
    @Transactional
    public void ownerCancelApprovedLeave(String id) {

        LeaveRequestVO leave =
                leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("존재하지 않는 신청");
        }

        if (!"APPROVED".equals(leave.getStatus())) {
            throw new IllegalStateException(
                    "승인된 신청만 취소 가능합니다."
            );
        }

        leaveRequestMapper.rollbackShiftStatusScheduled(
                leave.getShift_id()
        );

        leaveRequestMapper.cancelLeaveRequest(id);
    }


    // =========================
    // [직원]
    // =========================

    // 휴무 신청 등록
    public void registerLeaveRequest(LeaveRequestVO leaveRequestVO) {

        leaveRequestVO.setId(
                "LR_" +
                        UUID.randomUUID()
                                .toString()
                                .replace("-", "")
                                .substring(0, 15)
        );

        leaveRequestMapper.registerLeaveRequest(
                leaveRequestVO
        );
    }

    // 휴무 신청 취소 (PENDING만 가능)
    @Transactional
    public void cancelLeaveRequest(String id) {

        LeaveRequestVO leave =
                leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("존재하지 않는 신청");
        }

        if (!"PENDING".equals(leave.getStatus())) {
            throw new IllegalStateException(
                    "대기중인 신청만 취소 가능합니다."
            );
        }

        leaveRequestMapper.cancelLeaveRequest(id);
    }

    // 월별 휴무 신청 내역 조회 (전체/상태별)
    public List<LeaveRequestVO> getMyLeaveRequests(
            String user_id,
            int year,
            int month,
            String status
    ) {

        if (status == null || status.isBlank()) {
            return leaveRequestMapper.getMyLeaveRequests(
                    user_id,
                    year,
                    month
            );
        }

        return leaveRequestMapper.getMyLeaveRequestsByStatus(
                user_id,
                year,
                month,
                status
        );
    }
}
