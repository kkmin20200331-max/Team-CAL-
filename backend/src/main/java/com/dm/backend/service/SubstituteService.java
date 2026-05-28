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

    public void createPost(SubstitutePostVO postVO) {
        substituteMapper.createPost(postVO);

        substituteMapper.updateShiftStatus(
                postVO.getShift_id(),
                "SUBSTITUTE_OPEN"
        );
    }

    public List<SubstitutePostVO> getPostList(String store_id) {
        return substituteMapper.getPostList(store_id);
    }

    public void apply(SubstituteApplicationVO applicationVO) {
        substituteMapper.apply(applicationVO);
    }

    public List<SubstituteApplicationVO> getApplicationList(String post_id) {
        return substituteMapper.getApplicationList(post_id);
    }

    @Transactional
    public void approveSubstitute(
            String shift_id,
            String selectedUser_id,
            SubstituteHistoryVO historyVO
    ) {

        substituteMapper.updateShiftUser(
                shift_id,
                selectedUser_id
        );

        substituteMapper.updateShiftStatus(
                shift_id,
                "SUBSTITUTED"
        );

        substituteMapper.insertHistory(historyVO);
    }

    public void cancelApplication(String id) {
        substituteMapper.cancelApplication(id);
    }

    public List<SubstituteApplicationVO> getMyApplications(String user_id) {
        return substituteMapper.getMyApplications(user_id);
    }

    public void cancelPost(String post_id) {
        // 모집글에 연결된 shift 조회
        String shift_id = substituteMapper.getShiftIdByPostId(post_id);

        // 모집글 취소
        substituteMapper.cancelPost(post_id);

        // shift 상태 원복
        substituteMapper.updateShiftStatus(
                shift_id,
                "SCHEDULED"
        );
    }
}