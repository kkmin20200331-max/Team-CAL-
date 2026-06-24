package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileVO {

    private String id;

    private String user_id;

    private String store_id;

    private String file_type;

    private String original_name;

    private String storage_path;

    private Long file_size;

    private String mime_type;

    private String status;

    private String ocr_status;

    private Date expiry_date;

    private String notes;

    private String extracted_data;

    private Date created_at;

    private Date updated_at;

    // SELECT 시 JOIN으로 채워지는 필드 (DB 컬럼 아님)
    private String user_name;
}
