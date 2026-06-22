package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiScheduleRequestVO {
    private String store_id;
    private String start_date;
    private String end_date;
    private List<ShiftVO> shifts;
}
