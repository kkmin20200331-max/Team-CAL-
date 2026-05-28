package com.dm.backend.controller;

import com.dm.backend.service.LeaveRequestService;
import com.dm.backend.vo.LeaveRequestVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave_request")
public class LeaveRequestC {
    @Autowired
    private LeaveRequestService leaveRequestService;

    // [알바생] 휴무 신청 보내기
    // JSON Body 예시: { "shift_id": "SHF_Park_20260526_01", "user_id": "U9L0mN1o...", "reason": "학교 시험" }
    @PostMapping
    public void registerLeaveRequest(@RequestBody LeaveRequestVO leaveRequestVO) {
        leaveRequestService.registerLeaveRequest(leaveRequestVO);
    }

    // [점주] 매장별 승인 대기 중(PENDING)인 휴무 신청 목록 최신순 조회
    // 요청 URL 예시: GET /api/leave?store_id=V1StGXR8...
    @GetMapping
    public List<LeaveRequestVO> getLeaveRequestList(@RequestParam String store_id) {
        return leaveRequestService.getLeaveRequestList(store_id);
    }

    // [점주] 휴무 신청 승인(APPROVED) 또는 거절(REJECTED) 처리
    // 요청 URL 예시: PUT /api/leave/LR_Park_20260526?status=APPROVED
    @PutMapping("/{id}")
    public void processLeaveRequest(@PathVariable String id, @RequestParam String status) {
        leaveRequestService.processLeaveRequest(id, status);
    }

    // [알바생] 내가 신청했던 휴무 취소하기 (점주 승인 전/후 모두 유연하게 대응)
    // 요청 URL 예시: DELETE /api/leave/LR_Park_20260526
    @DeleteMapping("/{id}")
    public void cancelLeaveRequest(@PathVariable String id) {
        leaveRequestService.cancelLeaveRequest(id);
    }

    // [공통] 휴무 단건 상세 조회
    // 요청 URL 예시: GET /api/leave/LR_Park_20260526
    @GetMapping("/{id}")
    public LeaveRequestVO getLeaveRequest(@PathVariable String id) {
        return leaveRequestService.getLeaveRequest(id);
    }
}
