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
    // 1. 알바생 휴무 신청 등록
    public void registerLeaveRequest(LeaveRequestVO leaveRequestVO) {
        // ID 규격 준수 (LR_ + 15자리 무작위 문자열)
        leaveRequestVO.setId("LR_" + UUID.randomUUID().toString().substring(0, 15));
        leaveRequestMapper.registerLeaveRequest(leaveRequestVO);
    }

    // 2. 점주용 매장별 대기 신청 리스트 조회
    public List<LeaveRequestVO> getLeaveRequestList(String store_id) {
        return leaveRequestMapper.getLeaveRequestList(store_id);
    }

    // 3. 점주의 승인/거절 처리 워크플로우 (상태 변경 및 근무표 상태 연동)
    @Transactional
    public void processLeaveRequest(String id, String status) {
        // 매퍼 인터페이스 규격에 맞게 파라미터 전달 (updateLeaveStatus)
        leaveRequestMapper.updateLeaveStatus(id, status);

        // 점주가 'APPROVED'(승인)를 한 경우에만 연쇄적으로 근무표(SHIFT)를 공석으로 변경
        if ("APPROVED".equalsIgnoreCase(status)) {
            LeaveRequestVO leave = leaveRequestMapper.getLeaveRequest(id);
            if (leave != null) {
                // SHIFT 테이블의 해당 근무 상태를 'VACANT'로 업데이트
                leaveRequestMapper.updateShiftStatusVacant(leave.getShift_id());
            }
        }
    }

    // 4. 알바생의 휴무 신청 취소 프로세스 (승인 전/후 상태에 따른 완전 복구)
    @Transactional
    public void cancelLeaveRequest(String id) {
        // 취소하려는 휴무 신청 정보를 먼저 조회
        LeaveRequestVO leave = leaveRequestMapper.getLeaveRequest(id);

        if (leave == null) {
            throw new IllegalArgumentException("존재하지 않는 휴무 신청입니다.");
        }

        // 이미 점주가 승인(APPROVED)을 완료하여 근무표가 공석이 된 상태라면
        if ("APPROVED".equalsIgnoreCase(leave.getStatus())) {
            // 공석(VACANT)이 된 근무표(SHIFT)를 다시 정상 예정 근무(SCHEDULED) 상태로 복구
            leaveRequestMapper.rollbackShiftStatusScheduled(leave.getShift_id());
        }

        // 승인 전(PENDING)이든 후(APPROVED)든 최종적으로 해당 휴무 신청 레코드는 삭제
        leaveRequestMapper.deleteLeaveRequest(id);
    }

    // 기본 CRUD용 단건 상세 조회
    public LeaveRequestVO getLeaveRequest(String id) {
        return leaveRequestMapper.getLeaveRequest(id);
    }

}
