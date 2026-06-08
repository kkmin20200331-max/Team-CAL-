package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenCvResponseVO {

    private Boolean available;

    private OpenCvAggregateVO aggregate;

}