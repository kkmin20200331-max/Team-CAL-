package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResultVO {

    private Map<String,Object> summary;

    private List<Map<String,Object>> insights;

    private List<Map<String,Object>> scheduleRecommendations;

    private Map<String,Object> operationMetrics;

    private Map<String,Object> features;
}