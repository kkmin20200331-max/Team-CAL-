package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisDbVO {

    private Long id;

    private String store_id;

    private String analysis_type;

    private Date analysis_start_date;

    private Date analysis_end_date;

    private String result_json;

    private Date created_at;
}