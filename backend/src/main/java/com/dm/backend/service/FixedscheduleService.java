package com.dm.backend.service;

import com.dm.backend.mapper.FixedscheduleMapper;
import com.dm.backend.vo.FixedscheduleVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

@Service
public class FixedscheduleService {

    @Autowired
    private FixedscheduleMapper fixedscheduleMapper;

    // =========================
    // [공통]
    // =========================

    // 고정 스케줄 단건 조회
    public FixedscheduleVO getFixedSchedule(
            String id
    ) {
        return fixedscheduleMapper.getFixedSchedule(id);
    }


    // =========================
    // [관리자]
    // =========================

    // 고정 스케줄 등록
    public void registerFixedschedule(
            FixedscheduleVO fixedscheduleVO
    ) {

        validateWeekday(
                fixedscheduleVO.getWeekday()
        );

        validateTime(
                fixedscheduleVO.getStart_time(),
                fixedscheduleVO.getEnd_time()
        );

        int exists =
                fixedscheduleMapper.existsFixedSchedule(
                        fixedscheduleVO.getStore_id(),
                        fixedscheduleVO.getUser_id(),
                        fixedscheduleVO.getWeekday(),
                        fixedscheduleVO.getStart_time(),
                        fixedscheduleVO.getEnd_time()
                );

        if (exists > 0) {
            throw new RuntimeException(
                    "이미 등록된 고정 근무입니다."
            );
        }

        int conflict =
                fixedscheduleMapper.checkFixedScheduleConflict(
                        fixedscheduleVO.getStore_id(),
                        fixedscheduleVO.getUser_id(),
                        fixedscheduleVO.getWeekday(),
                        fixedscheduleVO.getStart_time(),
                        fixedscheduleVO.getEnd_time()
                );

        if (conflict > 0) {
            throw new RuntimeException(
                    "이미 해당 요일에 겹치는 고정근무가 존재합니다."
            );
        }

        fixedscheduleMapper.registerFixedschedule(
                fixedscheduleVO
        );
    }

    // 매장별 고정 스케줄 조회
    public List<FixedscheduleVO> getFixedScheduleList(
            String store_id
    ) {
        return fixedscheduleMapper.getFixedScheduleList(
                store_id
        );
    }

    // 고정 스케줄 수정
    public void updateFixedSchedule(
            FixedscheduleVO fixedscheduleVO
    ) {

        validateWeekday(
                fixedscheduleVO.getWeekday()
        );

        validateTime(
                fixedscheduleVO.getStart_time(),
                fixedscheduleVO.getEnd_time()
        );

        int conflict =
                fixedscheduleMapper
                        .checkFixedScheduleConflictForUpdate(
                                fixedscheduleVO.getId(),
                                fixedscheduleVO.getStore_id(),
                                fixedscheduleVO.getUser_id(),
                                fixedscheduleVO.getWeekday(),
                                fixedscheduleVO.getStart_time(),
                                fixedscheduleVO.getEnd_time()
                        );

        if (conflict > 0) {
            throw new RuntimeException(
                    "이미 해당 요일에 겹치는 고정근무가 존재합니다."
            );
        }

        fixedscheduleMapper.updateFixedSchedule(
                fixedscheduleVO
        );
    }

    // 고정 스케줄 삭제
    public void delFixedSchedule(
            String id
    ) {
        fixedscheduleMapper.delFixedSchedule(id);
    }


    // =========================
    // 내부 검증 메서드
    // =========================

    private void validateWeekday(
            String weekday
    ) {

        List<String> weekdays = List.of(
                "MON",
                "TUE",
                "WED",
                "THU",
                "FRI",
                "SAT",
                "SUN"
        );

        if (!weekdays.contains(
                weekday.toUpperCase()
        )) {
            throw new RuntimeException(
                    "잘못된 요일입니다."
            );
        }
    }

    private void validateTime(
            String startTime,
            String endTime
    ) {

        try {

            LocalTime.parse(startTime);
            LocalTime.parse(endTime);

        } catch (Exception e) {

            throw new RuntimeException(
                    "시간 형식이 잘못되었습니다. (HH:mm)"
            );
        }
    }
}
