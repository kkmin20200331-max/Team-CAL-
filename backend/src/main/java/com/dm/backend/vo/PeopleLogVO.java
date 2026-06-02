package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PeopleLogVO {

    private Long id;

    private String storeId;

    private Date recordTime;

    private Integer peopleCount;
}