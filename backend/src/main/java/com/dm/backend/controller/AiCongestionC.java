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

    // =========================
    // OpenCV 혼잡도 로그 저장
    // =========================
    @PostMapping
    public ResponseEntity<Map<String, Object>> saveCongestionLog(
            @RequestBody OpenCvCongestionPayloadVO payload
    ) {
        // OpenCV는 단건 감지(customerCount) 또는 집계(lastCustomerCount)를 보낼 수 있습니다.
        Integer peopleCount = payload.resolvePeopleCount();

        // 필수값 검증: 매장, 카메라, 측정시각, 인원 수가 모두 있어야 저장합니다.
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

        // OpenCV payload를 people_log 테이블 VO 형태로 변환합니다.
        PeopleLogVO vo =
                new PeopleLogVO(
                        null,
                        payload.getStoreId(),
                        payload.getCameraId(),
                        payload.getMeasuredAt(),
                        peopleCount
                );

        peopleLogService.savePeopleLog(vo);

        // 저장된 값을 프론트/디버깅에서 바로 확인할 수 있도록 반환합니다.
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
