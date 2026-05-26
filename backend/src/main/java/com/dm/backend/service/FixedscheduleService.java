package com.dm.backend.service;

import com.dm.backend.mapper.FixedscheduleMapper;
import com.dm.backend.vo.FixedscheduleVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FixedscheduleService {
    @Autowired
    private FixedscheduleMapper fixedscheduleMapper;

    public void registerFixedschedule(FixedscheduleVO fixedscheduleVO) {
        fixedscheduleMapper.registerFixedschedule(fixedscheduleVO);
    }

    public List<FixedscheduleVO> getFixedScheduleList(String store_id) {
        return fixedscheduleMapper.getFixedScheduleList(store_id);
    }

    public FixedscheduleVO getFixedSchedule(String id) {
        return fixedscheduleMapper.getFixedSchedule(id);
    }

    public void updateFixedSchedule(FixedscheduleVO fixedscheduleVO) {
        fixedscheduleMapper.updateFixedSchedule(fixedscheduleVO);
    }

    public void delFixedSchedule(String id) {
        fixedscheduleMapper.delFixedSchedule(id);
    }
}
