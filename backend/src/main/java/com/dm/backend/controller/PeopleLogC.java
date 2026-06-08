package com.dm.backend.controller;

import com.dm.backend.service.PeopleLogService;
import com.dm.backend.vo.PeopleLogVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/people_log")
public class PeopleLogC {

    @Autowired
    private PeopleLogService peopleLogService;

    // =========================
    // 공통
    // =========================

    @PostMapping
    public void savePeopleLog(
            @RequestBody PeopleLogVO vo
    ) {
        peopleLogService.savePeopleLog(
                vo
        );
    }

    @GetMapping
    public List<PeopleLogVO> getPeopleLogList(
            @RequestParam String store_id,
            @RequestParam String start_date,
            @RequestParam String end_date
    ) {
        return peopleLogService.getPeopleLogList(
                store_id,
                start_date,
                end_date
        );
    }

    @PostMapping("/opencv")
    public void saveOpenCvData(
            @RequestParam String store_id
    ) {

        peopleLogService.saveOpenCvData(
                store_id
        );
    }
}