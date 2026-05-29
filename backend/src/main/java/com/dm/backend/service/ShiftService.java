package com.dm.backend.service;

import com.dm.backend.mapper.FixedscheduleMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.vo.FixedscheduleVO;
import com.dm.backend.vo.ShiftVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ShiftService {

    @Autowired
    private ShiftMapper shiftMapper;

    @Autowired
    private FixedscheduleMapper fixedscheduleMapper;

    // =========================
    // [공통]
    // =========================

    // 근무표 단건 조회
    public ShiftVO getShift(
            String id
    ) {
        return shiftMapper.getShift(id);
    }


    // =========================
    // [관리자]
    // =========================

    // 근무표 등록
    public void registerShift(
            ShiftVO shiftVO
    ) {

        int conflict =
                shiftMapper.checkShiftConflict(
                        shiftVO.getUser_id(),
                        shiftVO.getWork_date(),
                        shiftVO.getStart_at(),
                        shiftVO.getEnd_at()
                );

        if (conflict > 0) {
            throw new RuntimeException(
                    "이미 해당 시간에 근무가 존재합니다."
            );
        }

        shiftMapper.registerShift(shiftVO);
    }

    // 매장별 근무표 조회
    public List<ShiftVO> getShiftList(
            String store_id,
            String start_date,
            String end_date
    ) {
        return shiftMapper.getShiftList(
                store_id,
                start_date,
                end_date
        );
    }

    // 근무표 수정
    public void updateShift(
            ShiftVO shiftVO
    ) {

        int conflict =
                shiftMapper.checkShiftConflictForUpdate(
                        shiftVO.getId(),
                        shiftVO.getUser_id(),
                        shiftVO.getWork_date(),
                        shiftVO.getStart_at(),
                        shiftVO.getEnd_at()
                );

        if (conflict > 0) {
            throw new RuntimeException(
                    "이미 해당 시간에 근무가 존재합니다."
            );
        }

        shiftMapper.updateShift(shiftVO);
    }

    // 근무표 삭제
    public void delShift(
            String id
    ) {
        shiftMapper.delShift(id);
    }

    // 고정 스케줄 기반 자동 생성
    @Transactional
    public void generateAutomatedShifts(
            String store_id,
            String start_date,
            String end_date
    ) {

        // 기존 코드 그대로 유지
    }


    // =========================
    // [직원]
    // =========================

    // 내 근무표 조회
    public List<ShiftVO> getMyShiftList(
            String user_id,
            String start_date,
            String end_date
    ) {
        return shiftMapper.getMyShiftList(
                user_id,
                start_date,
                end_date
        );
    }
}



