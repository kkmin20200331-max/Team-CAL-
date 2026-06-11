package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisVO {

    private StoreVo store;

    private List<PeopleLogVO> peopleLogs;

    private List<ShiftVO> shifts;

    private List<StoreMemberVo> storeMembers;

    private String analysisDate;

}
