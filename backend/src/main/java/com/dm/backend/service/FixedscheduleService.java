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

    public void registerFixedschedule(FixedscheduleVO fixedscheduleVO) {
        // 요일 검증
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
                fixedscheduleVO.getWeekday().toUpperCase()
        )) {
            throw new RuntimeException(
                    "잘못된 요일입니다."
            );
        }

        // 시간 검증
        try {
            LocalTime.parse(
                    fixedscheduleVO.getStart_time()
            );

            LocalTime.parse(
                    fixedscheduleVO.getEnd_time()
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "시간 형식이 잘못되었습니다. (HH:mm)"
            );

        }
        int exists =
                fixedscheduleMapper.existsFixedSchedule(
                        fixedscheduleVO.getStore_id(),
                        fixedscheduleVO.getUser_id(),
                        fixedscheduleVO.getWeekday(),
                        fixedscheduleVO.getStart_time(),
                        fixedscheduleVO.getEnd_time()
                );

        if(exists > 0){
            throw new RuntimeException(
                    "이미 등록된 고정 근무입니다."
            );
        }

        int conflict =
                fixedscheduleMapper
                        .checkFixedScheduleConflict(
                                fixedscheduleVO.getStore_id(),
                                fixedscheduleVO.getUser_id(),
                                fixedscheduleVO.getWeekday(),
                                fixedscheduleVO.getStart_time(),
                                fixedscheduleVO.getEnd_time()
                        );

        if(conflict > 0){
            throw new RuntimeException(
                    "이미 해당 요일에 겹치는 고정근무가 존재합니다."
            );
        }
        fixedscheduleMapper.registerFixedschedule(
                fixedscheduleVO
        );
    }

    public List<FixedscheduleVO> getFixedScheduleList(String store_id) {
        return fixedscheduleMapper.getFixedScheduleList(store_id);
    }

    public FixedscheduleVO getFixedSchedule(String id) {
        return fixedscheduleMapper.getFixedSchedule(id);
    }

    public void updateFixedSchedule(FixedscheduleVO fixedscheduleVO) {
        // 요일 검증
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
                fixedscheduleVO.getWeekday().toUpperCase()
        )) {
            throw new RuntimeException(
                    "잘못된 요일입니다."
            );
        }

        // 시간 검증
        try {
            LocalTime.parse(
                    fixedscheduleVO.getStart_time()
            );

            LocalTime.parse(
                    fixedscheduleVO.getEnd_time()
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "시간 형식이 잘못되었습니다. (HH:mm)"
            );

        }
        int conflict =
                fixedscheduleMapper.checkFixedScheduleConflictForUpdate(
                        fixedscheduleVO.getId(),
                        fixedscheduleVO.getStore_id(),
                        fixedscheduleVO.getUser_id(),
                        fixedscheduleVO.getWeekday(),
                        fixedscheduleVO.getStart_time(),
                        fixedscheduleVO.getEnd_time()
                );

        if(conflict > 0){
            throw new RuntimeException(
                    "이미 해당 요일에 겹치는 고정근무가 존재합니다."
            );
        }
        fixedscheduleMapper.updateFixedSchedule(fixedscheduleVO);
    }

    public void delFixedSchedule(String id) {
        fixedscheduleMapper.delFixedSchedule(id);
    }
}
