package com.dm.backend.controller;

import com.dm.backend.service.SubstituteService;
import com.dm.backend.vo.SubstituteApplicationVO;
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

    // 모집글 생성
    @PostMapping
    public void createPost(
            @RequestBody SubstitutePostVO postVO
    ) {
        substituteService.createPost(postVO);
    }

    // 모집글 목록
    @GetMapping
    public List<SubstitutePostVO> getPostList(
            @RequestParam String store_id
    ) {
        return substituteService.getPostList(store_id);
    }

    // 지원
    @PostMapping("/apply")
    public void apply(
            @RequestBody SubstituteApplicationVO applicationVO
    ) {
        substituteService.apply(applicationVO);
    }

    // 지원자 조회
    @GetMapping("/application")
    public List<SubstituteApplicationVO> getApplicationList(
            @RequestParam String post_id
    ) {
        return substituteService.getApplicationList(post_id);
    }

    // 관리자 승인
    @PutMapping
    public void approveSubstitute(
            @RequestParam String shift_id,
            @RequestParam String selected_user_id,
            @RequestBody SubstituteHistoryVO historyVO
    ) {
        substituteService.approveSubstitute(
                shift_id,
                selected_user_id,
                historyVO
        );
    }

    //대타 신청 취소
    @DeleteMapping("/application")
    public void cancelApplication(
            @RequestParam String id
    ) {
        substituteService.cancelApplication(id);
    }

    //내 대타 지원 목록 조회
    @GetMapping("/my-application")
    public List<SubstituteApplicationVO> getMyApplications(
            @RequestParam String user_id
    ) {
        return substituteService.getMyApplications(user_id);
    }

    // 모집글 취소
    @PutMapping("/cancel")
    public void cancelPost(
            @RequestParam String post_id
    ) {
        substituteService.cancelPost(post_id);
    }

}