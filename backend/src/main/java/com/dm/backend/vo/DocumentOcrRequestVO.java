package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentOcrRequestVO {

    private String file_id;

    private String file_type;

    private String file_url;

    private String original_name;
}
