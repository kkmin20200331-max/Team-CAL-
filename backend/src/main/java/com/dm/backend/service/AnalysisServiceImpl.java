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
        System.out.println("store : "
                + store.getName());

        System.out.println("peopleLogs size : "
                + peopleLogs.size());

        System.out.println("shifts size : "
                + shifts.size());

        System.out.println("storeMembers size : "
                + members.size());
        return new AiAnalysisVO(
                store,
                peopleLogs,
                shifts,
                members,
                start_date
        );
    }

    @Override
    public AiAnalysisResultVO runAnalysis(
            AnalysisRequestVO request
    ) {

        System.out.println("========== AI 분석 시작 ==========");
        System.out.println("store_id : "
                + request.getStore_id());

        System.out.println("start_date : "
                + request.getStart_date());

        System.out.println("end_date : "
                + request.getEnd_date());

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
        System.out.println("========== AI 응답 확인 ==========");

        System.out.println("summary : "
                + result.getSummary());

        System.out.println("insights : "
                + result.getInsights());

        System.out.println("scheduleRecommendations : "
                + result.getScheduleRecommendations());

        System.out.println("operationMetrics : "
                + result.getOperationMetrics());

        System.out.println("features : "
                + result.getFeatures());

        try {

            String resultJson =
                    objectMapper.writeValueAsString(
                            result
                    );
            System.out.println("저장될 JSON");

            System.out.println(resultJson);

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
            System.out.println("AI_ANALYSIS 저장 완료");
            System.out.println("========== AI 분석 종료 ==========");

        } catch (Exception e) {

            throw new RuntimeException("AI 분석 결과 저장 실패", e);
        }

        return result;
    }
}