package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoardVO {

    private String id;

    private String store_id;

    private String name;

    private String created_by;

    private Date created_at;
}