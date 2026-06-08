package com.dm.backend.controller;

import com.dm.backend.service.ShiftService;
import com.dm.backend.vo.ShiftVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shift")
public class ShiftC {

    @Autowired
    private ShiftService shiftService;

    // =========================
    // [공통]
    // =========================

    // 근무표 단건 조회
    @GetMapping("/{id}")
    public ShiftVO getShift(
            @PathVariable String id
    ) {
        return shiftService.getShift(id);
    }


    // =========================
    // [관리자]
    // =========================

    // 경민 수정 6/2 16:15
    // 근무표 등록
    @PostMapping
    public void registerShift(
            @RequestBody ShiftVO shiftVO
    ) {
        shiftService.registerShift(shiftVO);
    }

    // 매장별 기간 조회
    @GetMapping
    public List<ShiftVO> getShiftList(
            @RequestParam String store_id,
            @RequestParam String start_date,
            @RequestParam String end_date
    ) {
        return shiftService.getShiftList(
                store_id,
                start_date,
                end_date
        );
    }

    // 근무표 수정
    @PutMapping
    public void updateShift(
            @RequestBody ShiftVO shiftVO
    ) {
        shiftService.updateShift(shiftVO);
    }

    // 근무표 삭제
    @DeleteMapping
    public void delShift(
            @RequestParam String id
    ) {
        shiftService.delShift(id);
    }

    // 고정 스케줄 기반 자동 생성
    @PostMapping("/fixed")
    public void generateAutomatedShifts(
            @RequestParam String store_id,
            @RequestParam String start_date,
            @RequestParam String end_date
    ) {
        shiftService.generateAutomatedShifts(
                store_id,
                start_date,
                end_date
        );
    }


    // =========================
    // [직원]
    // =========================

    // 내 근무표 조회
    @GetMapping("/staff")
    public List<ShiftVO> getMyShiftList(
            @RequestParam String user_id,
            @RequestParam String start_date,
            @RequestParam String end_date
    ) {
        return shiftService.getMyShiftList(
                user_id,
                start_date,
                end_date
        );
    }
}
