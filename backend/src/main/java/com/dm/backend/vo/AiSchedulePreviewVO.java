package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiSchedulePreviewVO {
    private List<ShiftVO> shifts;
    private List<AiScheduleReasonVO> reasons;
    private Integer total_count;
    private Integer closer_count;
    private Integer newbie_solo_avoided_count;
    private Integer conflict_excluded_count;
}
