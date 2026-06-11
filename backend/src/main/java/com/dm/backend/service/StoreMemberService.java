package com.dm.backend.service;

import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.mapper.UserMapper;
import com.dm.backend.vo.StoreMemberVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StoreMemberService {

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    @Autowired
    private UserMapper userMapper;

    // =========================
    // [직원]
    // =========================

    // 매장 근무 신청
    // 이미 신청 중이거나 근무 중인 경우 신청 불가
    public void approveRegister(StoreMemberVo storeMemberVo) {

        int count = storeMemberMapper.existsMember(
                storeMemberVo.getStore_id(),
                storeMemberVo.getUser_id()
        );

        if (count > 0) {
            throw new RuntimeException("이미 신청했거나 근무중인 매장입니다.");
        }

        // 기본값 세팅 (선택)
        if (storeMemberVo.getPay_type() == null) {
            storeMemberVo.setPay_type("HOURLY");
        }

        if (storeMemberVo.getPay_amount() == null) {
            storeMemberVo.setPay_amount(10320); // 기본 시급
        }

        storeMemberMapper.approveRegister(storeMemberVo);
    }

    // 근무 가능 요일 설정
    public void updateAvailableDays(
            String store_id,
            String user_id,
            String available_days
    ) {
        storeMemberMapper.updateAvailableDays(
                store_id,
                user_id,
                available_days
        );
    }
    // =========================
    // [관리자]
    // =========================

    // 직원 승인
    // 직원 거절
    // 직원 역할 변경
    // 직원 레벨 변경
    public void updateStoreMember(StoreMemberVo storeMemberVo) {

        storeMemberMapper.updateStoreMember(storeMemberVo);

        if ("APPROVED".equalsIgnoreCase(
                storeMemberVo.getApproval_status()
        )) {
            userMapper.approveUser(
                    storeMemberVo.getUser_id()
            );
        }
    }

    // 직원 삭제
    // 매장 직원 제거
    public void deleteStoreMember(
            String store_id,
            String user_id
    ) {
        storeMemberMapper.deleteStoreMember(
                store_id,
                user_id
        );
    }

    // 경민 수정 6/5 12:00
    public StoreMemberVo getMemberInfo(String user_id, String store_id) {
        return storeMemberMapper.getMemberInfo(user_id, store_id);
    }

    // 경민 수정 6/5 12:00
    public void updatePayInfo(StoreMemberVo vo) {
        storeMemberMapper.updatePayInfo(vo);
    }

    // 대타 가능 직원 조회
    public List<StoreMemberVo> getAvailableMemberList(
            String store_id
    ) {
        return storeMemberMapper.getAvailableMemberList(
                store_id
        );
    }
}
