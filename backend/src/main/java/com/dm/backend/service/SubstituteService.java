package com.dm.backend.service;

import com.dm.backend.mapper.SubstituteMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.vo.SubstituteRequestVO;
import com.dm.backend.vo.SubstituteApplyVO;
import com.dm.backend.vo.ShiftVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class SubstituteService {

    @Autowired
    private SubstituteMapper substituteMapper;

    @Autowired
    private ShiftMapper shiftMapper; // 💡 기존 쉬프트 매퍼 주입받아 재활용

    public void createRequest(SubstituteRequestVO request) {
        substituteMapper.insertRequest(request);
    }

    public List<SubstituteRequestVO> getOpenRequests() {
        return substituteMapper.selectOpenRequests();
    }

    public List<SubstituteApplyVO> getApplies(String substitute_request_id) {
        return substituteMapper.selectAppliesByRequestId(substitute_request_id);
    }

    public void insertApply(SubstituteApplyVO apply) {
        substituteMapper.insertApply(apply);
    }

    @Transactional
    public void approveMatching(String applyId, String requestId, String shiftId, String applicantUserId) {
        // 1. 지원 내역 및 구인글 상태 변경
        substituteMapper.updateApplyStatus(applyId, "APPROVED");
        substituteMapper.updateRequestStatus(requestId, "CLOSED");

        // 2. 💡 [질문자님 지적 반영] 기존 updateShift 메서드 그대로 재활용하기
        // 기존 스케줄 정보를 단건 조회로 안전하게 꺼내옵니다.
        ShiftVO existingShift = shiftMapper.getShift(shiftId);

        if (existingShift != null) {
            // 근무자 ID(user_id)만 대타 신청자 ID로 쏙 바꿔치기합니다.
            existingShift.setUser_id(applicantUserId);

            // 이미 존재하던 updateShift 메서드에 그대로 집어넣어서 업데이트 실행!
            shiftMapper.updateShift(existingShift);
        }
    }
}