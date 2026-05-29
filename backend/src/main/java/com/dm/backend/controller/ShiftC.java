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
    //근무표 등록
    @PostMapping
    public void registerShift(@RequestBody ShiftVO shiftVO){
        shiftService.registerShift(shiftVO);
    }

    // 근무표 조회 (달력 UI용 기간별 전체 조회 - store_id, start_date, end_date 필요) 관리자용
    @GetMapping
    public List<ShiftVO> getShiftList(@RequestParam String store_id,
                                      @RequestParam String start_date,
                                      @RequestParam String end_date) {
        return shiftService.getShiftList(store_id, start_date, end_date);
    }
    //직원용 기간 내 근무 조회
    @GetMapping("/staff")
    public List<ShiftVO> getMyShiftList(
            @RequestParam String user_id,
            @RequestParam String start_date,
            @RequestParam String end_date
    ){
        return shiftService.getMyShiftList(
                user_id,
                start_date,
                end_date
        );
    }

    // 근무 수정
    @PutMapping
    public void updateShift(@RequestBody ShiftVO shiftVo) {
        shiftService.updateShift(shiftVo);
    }

    // 근무 삭제 id 필요
    @DeleteMapping
    public void delShift(@RequestParam String id) {
        shiftService.delShift(id);
    }

    // 직원 개인 근무표 조회
    // 예시: GET /api/shift/user?user_id=USR_xxx&start_date=2026-05-01&end_date=2026-05-31
    @GetMapping("/staff")
    public List<ShiftVO> getShiftListByUser(@RequestParam String user_id,
                                            @RequestParam String start_date,
                                            @RequestParam String end_date) {
        return shiftService.getShiftListByUser(user_id, start_date, end_date);
    }

    // [핵심] 고정 스케줄 패턴을 이용한 특정 기간 근무표 일괄 자동 생성 엔진 호출
    // URI 예시: POST /api/shift/fixed?store_id=가게ID&start_date=2026-06-01&end_date=2026-06-30
    @PostMapping("/fixed")
    public void generateAutomatedShifts(@RequestParam String store_id,
                                        @RequestParam String start_date,
                                        @RequestParam String end_date) {
        shiftService.generateAutomatedShifts(store_id, start_date, end_date);
    }
}
