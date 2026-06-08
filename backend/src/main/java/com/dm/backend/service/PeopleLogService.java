package com.dm.backend.service;

import com.dm.backend.vo.PeopleLogVO;

import java.util.List;

public interface PeopleLogService {

    // =========================
    // 공통
    // =========================

    void savePeopleLog(
            PeopleLogVO vo
    );
    void saveOpenCvData(
            String store_id
    );

    List<PeopleLogVO> getPeopleLogList(
            String store_id,
            String start_date,
            String end_date
    );

}