package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PeopleLogVO {

    private Long id;

    private String store_id;

    private String camera_id;

    private LocalDateTime record_time;

    private Integer people_count;

}