package com.dm.backend.service;

import com.dm.backend.mapper.PeopleLogMapper;
import com.dm.backend.vo.OpenCvResponseVO;
import com.dm.backend.vo.PeopleLogVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PeopleLogServiceImpl
        implements PeopleLogService {

    @Autowired
    private OpenCvService openCvService;

    @Autowired
    private PeopleLogMapper peopleLogMapper;

    // =========================
    // 공통
    // =========================

    @Override
    public void saveOpenCvData(
            String store_id
    ) {

        OpenCvResponseVO response =
                openCvService.analyze();

        if (
                response == null
                        || !Boolean.TRUE.equals(
                        response.getAvailable()
                )
        ) {
            return;
        }

        PeopleLogVO vo =
                new PeopleLogVO(
                        null,
                        store_id,
                        response.getAggregate()
                                .getCameraId(),
                        response.getAggregate()
                                .getMeasuredAt(),
                        response.getAggregate()
                                .getLastCustomerCount()
                );

        peopleLogMapper.savePeopleLog(
                vo
        );
    }

    @Override
    public void savePeopleLog(
            PeopleLogVO vo
    ) {
        peopleLogMapper.savePeopleLog(
                vo
        );
    }

    @Override
    public List<PeopleLogVO> getPeopleLogList(
            String store_id,
            String start_date,
            String end_date
    ) {
        return peopleLogMapper.getPeopleLogList(
                store_id,
                start_date,
                end_date
        );
    }

}