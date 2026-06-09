package com.dm.backend.controller;

import com.dm.backend.service.PeopleLogService;
import com.dm.backend.vo.OpenCvCongestionPayloadVO;
import com.dm.backend.vo.PeopleLogVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/congestion")
public class AiCongestionC {

    @Autowired
    private PeopleLogService peopleLogService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> saveCongestionLog(
            @RequestBody OpenCvCongestionPayloadVO payload
    ) {
        Integer peopleCount = payload.resolvePeopleCount();

        if (
                payload.getStoreId() == null
                        || payload.getCameraId() == null
                        || payload.getMeasuredAt() == null
                        || peopleCount == null
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "saved", false,
                            "message", "storeId, cameraId, measuredAt, customerCount or lastCustomerCount is required"
                    ));
        }

        PeopleLogVO vo =
                new PeopleLogVO(
                        null,
                        payload.getStoreId(),
                        payload.getCameraId(),
                        payload.getMeasuredAt(),
                        peopleCount
                );

        peopleLogService.savePeopleLog(vo);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "saved", true,
                        "storeId", vo.getStore_id(),
                        "cameraId", vo.getCamera_id(),
                        "recordTime", vo.getRecord_time(),
                        "peopleCount", vo.getPeople_count()
                ));
    }
}
