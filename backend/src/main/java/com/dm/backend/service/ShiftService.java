package com.dm.backend.service;

import com.dm.backend.mapper.FixedscheduleMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.vo.FixedscheduleVO;
import com.dm.backend.vo.ShiftVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ShiftService {
    @Autowired
    private ShiftMapper shiftmapper;
    @Autowired
    private FixedscheduleMapper fixedscheduleMapper;

    public void registerShift(ShiftVO shiftVO) {
        shiftmapper.registerShift(shiftVO);
    }

    public List<ShiftVO> getShiftList(String store_id, String start_date, String end_date) {
        return shiftmapper.getShiftList(store_id, start_date, end_date);
    }

    public ShiftVO getShift(String id) {
        return shiftmapper.getShift(id);
    }

    public void updateShift(ShiftVO shiftVO) {
        shiftmapper.updateShift(shiftVO);
    }

    public void delShift(String id) {
        shiftmapper.delShift(id);
    }
    @Transactional
    public void generateAutomatedShifts(String store_id, String start_date, String end_date) {
        // 1. 매장의 고정 스케줄 패턴 리스트 가져오기
        List<FixedscheduleVO> patterns = fixedscheduleMapper.getFixedScheduleList(store_id);

        LocalDate start = LocalDate.parse(start_date);
        LocalDate end = LocalDate.parse(end_date);

        // 2. 자바 라이브러리(Stream API)로 시작일부터 종료일까지의 날짜 목록을 깔끔하게 생성
        List<LocalDate> dateList = start.datesUntil(end.plusDays(1)).collect(Collectors.toList());

        // 3. 날짜 목록을 돌면서 패턴과 매칭
        for (LocalDate date : dateList) {
            // 요일 계산을 단 한 줄로 처리 (예: "MON", "TUE"...)
            String currentWeekday = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.US).toUpperCase();

            for (FixedscheduleVO pattern : patterns) {
                if ("Y".equalsIgnoreCase(pattern.getActive()) && pattern.getWeekday().equalsIgnoreCase(currentWeekday)) {

                    // 자바의 LocalTime, LocalDateTime 라이브러리를 쓰면 복잡한 try-catch나 SimpleDateFormat이 필요 없습니다.
                    LocalTime startTime = LocalTime.parse(pattern.getStart_time());
                    LocalTime endTime = LocalTime.parse(pattern.getEnd_time());

                    LocalDateTime startAt = LocalDateTime.of(date, startTime);
                    LocalDateTime endAt = LocalDateTime.of(date, endTime);

                    // 퇴근 시간이 출근 시간보다 빠르면 익일(다음날) 퇴근으로 처리
                    if (endAt.isBefore(startAt)) {
                        endAt = endAt.plusDays(1);
                    }

                    // VO 세팅 (MyBatis가 LocalDateTime도 자동으로 Oracle TIMESTAMP로 매핑해줍니다)
                    ShiftVO shiftVo = new ShiftVO();
                    shiftVo.setId("SHF_" + UUID.randomUUID().toString().substring(0, 15));
                    shiftVo.setStore_id(store_id);
                    shiftVo.setUser_id(pattern.getUser_id());

                    // Date 타입 변환 (만약 VO 필드가 여전히 java.util.Date라면 아래처럼 변환, LocalDateTime 형태라면 바로 대입 가능)
                    shiftVo.setWork_date(Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant()));
                    shiftVo.setStart_at(Date.from(startAt.atZone(ZoneId.systemDefault()).toInstant()));
                    shiftVo.setEnd_at(Date.from(endAt.atZone(ZoneId.systemDefault()).toInstant()));
                    shiftVo.setStatus("SCHEDULED");

                    // DB 저장
                    shiftmapper.registerShift(shiftVo);
                }
            }
        }
    }
}
