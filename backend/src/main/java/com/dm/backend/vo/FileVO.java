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

    private String file_type;

    private String original_name;

    private String storage_path;

    private Long file_size;

    private String mime_type;

    private Date created_at;

    private Date updated_at;
}