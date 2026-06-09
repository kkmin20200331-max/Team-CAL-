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

    @JsonAlias("store_id")
    private String storeId;

    @JsonAlias("camera_id")
    private String cameraId;

    @JsonAlias("measured_at")
    private LocalDateTime measuredAt;

    private Integer customerCount;

    private Integer lastCustomerCount;

    public Integer resolvePeopleCount() {
        if (lastCustomerCount != null) {
            return lastCustomerCount;
        }
        return customerCount;
    }
}
