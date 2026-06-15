package com.dm.backend.service;

import com.dm.backend.mapper.PeopleLogMapper;
import com.dm.backend.vo.OpenCvResponseVO;
import com.dm.backend.vo.PeopleLogVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PeopleLogService {

    private final OpenCvService openCvService;

    private final PeopleLogMapper peopleLogMapper;

    // =========================
    // [공통]
    // =========================

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

        System.out.println("available : "
                + response.getAvailable());

        System.out.println("cameraId : "
                + response.getAggregate().getCameraId());

        System.out.println("measuredAt : "
                + response.getAggregate().getMeasuredAt());

        System.out.println("lastCustomerCount : "
                + response.getAggregate().getLastCustomerCount());

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

        System.out.println("저장 예정 데이터");

        System.out.println("store_id : "
                + vo.getStore_id());

        System.out.println("camera_id : "
                + vo.getCamera_id());

        System.out.println("record_time : "
                + vo.getRecord_time());

        System.out.println("people_count : "
                + vo.getPeople_count());

        peopleLogMapper.savePeopleLog(
                vo
        );
    }

    public void savePeopleLog(
            PeopleLogVO vo
    ) {

        peopleLogMapper.savePeopleLog(
                vo
        );

        System.out.println(
                "PEOPLE_LOG 저장 완료"
        );
    }

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