package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenCvAggregateVO {

    private String cameraId;

    private LocalDateTime measuredAt;

    private Integer lastCustomerCount;

    private String status;

}