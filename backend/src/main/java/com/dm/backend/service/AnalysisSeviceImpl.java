package com.dm.backend.service;

import com.dm.backend.mapper.PeopleLogMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.mapper.StoreMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnalysisServiceImpl implements AnalysisService {

    @Autowired
    private StoreMapper storeMapper;

    @Autowired
    private ShiftMapper shiftMapper;

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    @Autowired
    private PeopleLogMapper peopleLogMapper;

    @Override
    public AiAnalysisVO buildAnalysisData(
            String store_id,
            String start_date,
            String end_date
    ) {

        StoreVo store =
                storeMapper.getStore(store_id);

        List<PeopleLogVO> peopleLogs =
                peopleLogMapper.getPeopleLogList(
                        store_id,
                        start_date,
                        end_date
                );

        List<ShiftVO> shifts =
                shiftMapper.getShiftList(
                        store_id,
                        start_date,
                        end_date
                );

        List<StoreMemberVo> members =
                storeMemberMapper.getStoreMembers(
                        store_id
                );

        return new AiAnalysisVO(
                store,
                peopleLogs,
                shifts,
                members
        );
    }
}