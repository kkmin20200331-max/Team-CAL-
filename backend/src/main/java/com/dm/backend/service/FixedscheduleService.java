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

    public FixedscheduleVO getFixedSchedule(
            String id
    ) {
        return fixedscheduleMapper.getFixedSchedule(id);
    }

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

        // 비활성화된 동일 요일 스케줄이 있으면 재활성화
        int reactivated = fixedscheduleMapper.reactivateFixedSchedule(
                fixedscheduleVO.getStore_id(),
                fixedscheduleVO.getUser_id(),
                fixedscheduleVO.getWeekday(),
                fixedscheduleVO.getStart_time(),
                fixedscheduleVO.getEnd_time()
        );
        if (reactivated > 0) {
            return;
        }

        // 이미 활성화된 동일 스케줄이면 스킵
        int exists = fixedscheduleMapper.existsFixedSchedule(
                fixedscheduleVO.getStore_id(),
                fixedscheduleVO.getUser_id(),
                fixedscheduleVO.getWeekday(),
                fixedscheduleVO.getStart_time(),
                fixedscheduleVO.getEnd_time()
        );
        if (exists > 0) {
            return;
        }

        fixedscheduleMapper.registerFixedschedule(
                fixedscheduleVO
        );
    }

    public List<FixedscheduleVO> getFixedScheduleList(
            String store_id
    ) {
        return fixedscheduleMapper.getFixedScheduleList(
                store_id
        );
    }

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

        fixedscheduleMapper.updateFixedSchedule(
                fixedscheduleVO
        );
    }

    public void delFixedSchedule(
            String id
    ) {
        fixedscheduleMapper.delFixedSchedule(id);
    }

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

        if (weekday == null || !weekdays.contains(weekday.toUpperCase())) {
            throw new RuntimeException("잘못된 요일입니다.");
        }
    }

    private void validateTime(
            String startTime,
            String endTime
    ) {
        try {
            LocalTime start = LocalTime.parse(startTime);
            LocalTime end = LocalTime.parse(endTime);
            if (!end.isAfter(start)) {
                throw new IllegalArgumentException();
            }
        } catch (Exception e) {
            throw new RuntimeException("시간 형식이 잘못되었습니다. (HH:mm)");
        }
    }
}
