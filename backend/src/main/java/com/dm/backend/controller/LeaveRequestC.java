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

    // [공통] 휴무 단건 상세 조회
    @GetMapping("/{id}")
    public LeaveRequestVO getLeaveRequest(@PathVariable String id) {
        return leaveRequestService.getLeaveRequest(id);
    }

    // [관리자] 매장별 승인 대기 중(PENDING)인 휴무 신청 목록 최신순 조회
    @GetMapping
    public List<LeaveRequestVO> getLeaveRequestList(@RequestParam String store_id) {
        return leaveRequestService.getLeaveRequestList(store_id);
    }

    // [관리자] 휴무 신청 승인(APPROVED) 또는 거절(REJECTED) 처리
    @PutMapping("/{id}")
    public void processLeaveRequest(@PathVariable String id, @RequestParam String status) {
        leaveRequestService.processLeaveRequest(id, status);
    }

    //[관리자] 휴무 승인 취소
    @DeleteMapping("/owner")
    public void ownerCancelApprovedLeave(
            @RequestParam String id) {

        leaveRequestService.ownerCancelApprovedLeave(id);
    }
    // [직원] 휴무 신청 보내기
    @PostMapping
    public void registerLeaveRequest(@RequestBody LeaveRequestVO leaveRequestVO) {
        leaveRequestService.registerLeaveRequest(leaveRequestVO);
    }

    // [직원] 내가 신청했던 휴무 취소하기 (점주 승인 전/후 모두 유연하게 대응)
    @DeleteMapping
    public void cancelLeaveRequest(
            @RequestParam String id) {

        leaveRequestService.cancelLeaveRequest(id);
    }
    // [직원] 신청했던 휴무나 휴무 승인 내역 한달 단위 조회
    @GetMapping("/staff")
    public List<LeaveRequestVO> getMyLeaveRequests(
            @RequestParam String user_id,
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) String status
    ) {
        return leaveRequestService.getMyLeaveRequests(
                user_id,
                year,
                month,
                status
        );
    }



}
