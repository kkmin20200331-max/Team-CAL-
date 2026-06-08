package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResultVO {

    private String peakTime;

    private Integer recommendedStaff;

    private Integer averagePeople;

    private String congestionLevel;

    private String summary;
}