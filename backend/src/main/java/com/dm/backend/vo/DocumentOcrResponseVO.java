package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentOcrResponseVO {

    private String file_id;

    private String ocr_status;

    private String status;

    private String expiry_date;

    private String notes;

    private Map<String, String> extracted_data;
}
