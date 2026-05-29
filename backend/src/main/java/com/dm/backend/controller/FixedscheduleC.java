package com.dm.backend.controller;

import com.dm.backend.service.FixedscheduleService;
import com.dm.backend.vo.FixedscheduleVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fixedschedule")
public class FixedscheduleC {

    @Autowired
    private FixedscheduleService fixedscheduleService;

    // =========================
    // [공통]
    // =========================

    // 고정 스케줄 단건 조회
    @GetMapping("/{id}")
    public FixedscheduleVO getFixedSchedule(
            @PathVariable String id
    ) {
        return fixedscheduleService.getFixedSchedule(id);
    }


    // =========================
    // [관리자]
    // =========================

    // 고정 스케줄 등록
    @PostMapping
    public void registerFixedschedule(
            @RequestBody FixedscheduleVO fixedscheduleVO
    ) {
        fixedscheduleService.registerFixedschedule(
                fixedscheduleVO
        );
    }

    // 매장별 고정 스케줄 조회
    @GetMapping
    public List<FixedscheduleVO> getFixedScheduleList(
            @RequestParam String store_id
    ) {
        return fixedscheduleService.getFixedScheduleList(
                store_id
        );
    }

    // 고정 스케줄 수정
    @PutMapping
    public void updateFixedSchedule(
            @RequestBody FixedscheduleVO fixedscheduleVO
    ) {
        fixedscheduleService.updateFixedSchedule(
                fixedscheduleVO
        );
    }

    // 고정 스케줄 삭제
    @DeleteMapping
    public void delFixedSchedule(
            @RequestParam String id
    ) {
        fixedscheduleService.delFixedSchedule(id);
    }
}



