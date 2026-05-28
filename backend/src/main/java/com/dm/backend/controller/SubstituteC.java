package com.dm.backend.controller;

import com.dm.backend.service.SubstituteService;
import com.dm.backend.vo.SubstituteRequestVO;
import com.dm.backend.vo.SubstituteApplyVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/substitutes")
public class SubstituteC {

    @Autowired
    private SubstituteService substituteService;

    // 1. 대타 요청글 등록
    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody SubstituteRequestVO requestVO) {
        substituteService.createRequest(requestVO);
        return ResponseEntity.ok("대타 요청 등록 완료");
    }
    // 2. 현재 구인 중인 대타 글 목록 전체 조회
    @GetMapping
    public List<SubstituteRequestVO> getAllRequests() {
        return substituteService.getOpenRequests();
    }
   // 3. 대타 지원자 목록 조회
    @GetMapping("/request")
    public List<SubstituteApplyVO> getApplies(@RequestParam String substitute_request_id) {
        return substituteService.getApplies(substitute_request_id);
    }
    // 4. 대타 지원하기 등록
    @PostMapping("/request")
    public ResponseEntity<?> applySubstitute(@RequestBody SubstituteApplyVO applyVO) {
        substituteService.insertApply(applyVO);
        return ResponseEntity.ok("대타 지원 등록 완료");
    }
    // 5. 점주 승인 시 -> 특정 지원 내역 상태 변경
    // 6. 점주 승인 시 -> 원본 대타 요청글 마감 처리
    @PutMapping
    public ResponseEntity<?> approveMatching(
            @RequestParam("applyId") String applyId,
            @RequestParam("requestId") String requestId,
            @RequestParam("shiftId") String shiftId,
            @RequestParam("applicantUserId") String applicantUserId) {

        substituteService.approveMatching(applyId, requestId, shiftId, applicantUserId);
        return ResponseEntity.ok("대타 매칭 승인 및 실시간 근무표 반영 완료");
    }
}