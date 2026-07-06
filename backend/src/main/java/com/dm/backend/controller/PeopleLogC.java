package com.dm.backend.controller;

import com.dm.backend.service.PeopleLogService;
import com.dm.backend.vo.OpenCvCongestionPayloadVO;
import com.dm.backend.vo.PeopleLogVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/people_log", "/api/people_log"})
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
    public ResponseEntity<Map<String, Object>> saveOpenCvData(
            @RequestParam(required = false) String store_id,
            @RequestBody(required = false) OpenCvCongestionPayloadVO payload
    ) {
        if (payload == null) {
            return ResponseEntity
                    .accepted()
                    .body(Map.of(
                            "saved", false,
                            "message", "No OpenCV payload was provided. Waiting for agent data."
                    ));
        }

        try {
            PeopleLogVO saved =
                    peopleLogService.saveOpenCvPayload(
                            store_id,
                            payload
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of(
                            "saved", true,
                            "storeId", saved.getStore_id(),
                            "cameraId", saved.getCamera_id(),
                            "recordTime", saved.getRecord_time(),
                            "peopleCount", saved.getPeople_count()
                    ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "saved", false,
                            "message", e.getMessage()
                    ));
        }
    }
}
