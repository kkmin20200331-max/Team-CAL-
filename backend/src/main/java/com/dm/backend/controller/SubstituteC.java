package com.dm.backend.controller;

import com.dm.backend.service.SubstituteService;
import com.dm.backend.vo.SubstituteApplicationVO;
import com.dm.backend.vo.SubstituteCalendarVO;
import com.dm.backend.vo.SubstituteHistoryVO;
import com.dm.backend.vo.SubstitutePostVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/substitute")
public class SubstituteC {

    @Autowired
    private SubstituteService substituteService;

    // =========================
    // [공통]
    // =========================

    // 모집글 목록 조회
    @GetMapping
    public List<SubstitutePostVO> getPostList(
            @RequestParam String store_id
    ) {
        return substituteService.getPostList(store_id);
    }


    // =========================
    // [관리자]
    // =========================

    // 특정 모집글 지원자 조회
    @GetMapping("/manager")
    public List<SubstituteApplicationVO> getApplicationList(
            @RequestParam String post_id
    ) {
        return substituteService.getApplicationList(post_id);
    }

    // 대타 승인
    @PutMapping("/manager")
    public void approveSubstitute(
            @RequestParam(required = false) String shift_id,
            @RequestParam(required = false) String selected_user_id,
            @RequestParam(required = false) String application_id,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) SubstituteHistoryVO historyVO
    ) {
        if (application_id != null && !application_id.isBlank()) {
            substituteService.processSubstituteApplication(
                    application_id,
                    status,
                    historyVO
            );
            return;
        }

        substituteService.approveSubstitute(
                shift_id,
                selected_user_id,
                historyVO
        );
    }

    // application_id 하나로 승인 처리 (shift 없는 경우 포함)
    @PutMapping("/manager/approve")
    public void approveByApplicationId(
            @RequestParam String application_id,
            @RequestParam(required = false, defaultValue = "") String approved_by
    ) {
        substituteService.approveByApplicationId(application_id, approved_by);
    }

    // 모집글 취소
    @DeleteMapping("/manager")
    public void cancelPost(
            @RequestParam String post_id
    ) {
        substituteService.cancelPost(post_id);
    }


    // =========================
    // [직원]
    // =========================

    // 모집글 등록
    @PostMapping("/staff")
    public void createPost(
            @RequestBody SubstitutePostVO postVO
    ) {
        substituteService.createPost(postVO);
    }

    // 대타 지원
    @PostMapping("/staff/apply")
    public void apply(
            @RequestBody SubstituteApplicationVO applicationVO
    ) {
        substituteService.apply(applicationVO);
    }

    // 지원 취소
    @DeleteMapping("/staff")
    public void cancelApplication(
            @RequestParam String id
    ) {
        substituteService.cancelApplication(id);
    }

    // 내 지원 내역 + shift 정보 (달력용)
    @GetMapping("/staff/calendar")
    public List<SubstituteCalendarVO> getMyApplicationsWithShiftInfo(
            @RequestParam String user_id
    ) {
        return substituteService.getMyApplicationsWithShiftInfo(user_id);
    }

    // 내 지원 내역 조회
    @GetMapping("/staff")
    public List<SubstituteApplicationVO> getMyApplications(
            @RequestParam String user_id,
            @RequestParam(required = false) String status
    ) {
        return substituteService.getMyApplications(
                user_id,
                status
        );
    }

    // 내가 등록한 모집글 조회
    @GetMapping("/staff/post")
    public List<SubstitutePostVO> getMyPosts(
            @RequestParam String user_id,
            @RequestParam(required = false) String status
    ) {
        return substituteService.getMyPosts(
                user_id,
                status
        );
    }
}
