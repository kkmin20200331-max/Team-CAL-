package com.dm.backend.vo;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenCvCongestionPayloadVO {

    // OpenCV payload의 storeId/store_id를 모두 Spring 내부 store_id로 사용합니다.
    @JsonAlias("store_id")
    private String storeId;

    // 카메라 식별자: CAM-001, IMAGE-UPLOAD 등
    @JsonAlias("camera_id")
    private String cameraId;

    // OpenCV 측정 시각
    @JsonAlias("measured_at")
    private LocalDateTime measuredAt;

    // 단건 프레임 감지 인원 수
    private Integer customerCount;

    // 집계 payload의 마지막 인원 수
    private Integer lastCustomerCount;

    // 단건/집계 payload 중 실제 people_log에 저장할 인원 수를 선택합니다.
    public Integer resolvePeopleCount() {
        if (lastCustomerCount != null) {
            return lastCustomerCount;
        }
        return customerCount;
    }
}
