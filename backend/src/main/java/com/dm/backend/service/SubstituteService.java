package com.dm.backend.service;

import com.dm.backend.mapper.SubstituteMapper;
import com.dm.backend.vo.SubstituteApplicationVO;
import com.dm.backend.vo.SubstituteHistoryVO;
import com.dm.backend.vo.SubstitutePostVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubstituteService {

    @Autowired
    private SubstituteMapper substituteMapper;


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

        substituteMapper.insertHistory(historyVO);
    }

    // 모집글 취소
    @Transactional
    public void cancelPost(String post_id) {

        String shift_id =
                substituteMapper.getShiftIdByPostId(post_id);

        substituteMapper.cancelPost(post_id);

        substituteMapper.updateShiftStatus(
                shift_id,
                "SCHEDULED"
        );
    }


    // =========================
    // [직원]
    // =========================

    // 모집글 생성
    @Transactional
    public void createPost(SubstitutePostVO postVO) {

        substituteMapper.createPost(postVO);

        substituteMapper.updateShiftStatus(
                postVO.getShift_id(),
                "SUBSTITUTE_OPEN"
        );
    }

    // 대타 지원
    public void apply(
            SubstituteApplicationVO applicationVO
    ) {
        substituteMapper.apply(applicationVO);
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