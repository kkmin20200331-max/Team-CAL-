package com.dm.backend.service;

import com.dm.backend.mapper.*;
import com.dm.backend.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

@Service
public class AnalysisServiceImpl implements AnalysisService {

    private final ObjectMapper objectMapper =
            new ObjectMapper();

    @Autowired
    private StoreMapper storeMapper;

    @Autowired
    private ShiftMapper shiftMapper;

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    @Autowired
    private PeopleLogMapper peopleLogMapper;

    @Autowired
    private AnalysisAiService analysisAiService;

    @Autowired
    private AiAnalysisMapper aiAnalysisMapper;



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
    @Override
    public AiAnalysisResultVO runAnalysis(
            AnalysisRequestVO request
    ) {

        AiAnalysisVO analysisData =
                buildAnalysisData(
                        request.getStore_id(),
                        request.getStart_date(),
                        request.getEnd_date()
                );

        AiAnalysisResultVO result =
                analysisAiService.requestAnalysis(
                        analysisData
                );

        try {

            String resultJson =
                    objectMapper.writeValueAsString(
                            result
                    );

            AiAnalysisDbVO saveVO =
                    new AiAnalysisDbVO(
                            null,
                            request.getStore_id(),
                            "CUSTOM",
                            java.sql.Date.valueOf(
                                    request.getStart_date()
                            ),
                            java.sql.Date.valueOf(
                                    request.getEnd_date()
                            ),
                            resultJson,
                            null
                    );

            aiAnalysisMapper.saveAnalysis(
                    saveVO
            );

        } catch (Exception e) {

            throw new RuntimeException("AI 분석 결과 저장 실패", e);
        }

        return result;
    }
}