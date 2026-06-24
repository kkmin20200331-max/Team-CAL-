package com.dm.backend.service;

import com.dm.backend.mapper.PeopleLogMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.mapper.StoreMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.vo.AiInsightAnalyzeRequestVO;
import com.dm.backend.vo.PeopleLogVO;
import com.dm.backend.vo.ShiftVO;
import com.dm.backend.vo.StoreMemberVo;
import com.dm.backend.vo.StoreVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiInsightPayloadService {

    // =========================
    // 날짜 포맷
    // =========================
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    private final StoreMapper storeMapper;
    private final PeopleLogMapper peopleLogMapper;
    private final ShiftMapper shiftMapper;
    private final StoreMemberMapper storeMemberMapper;

    // =========================
    // AI 인사이트 요청 payload 생성
    // =========================
    public Map<String, Object> buildPayload(AiInsightAnalyzeRequestVO request) {
        // 매장 ID: 혼잡도 로그 조회용 store_id와 스케줄 조회용 shift_store_id를 분리해서 처리합니다.
        String storeId = request.getStore_id();
        String shiftStoreId = request.getShift_store_id() != null && !request.getShift_store_id().isBlank()
                ? request.getShift_store_id()
                : storeId;

        // 조회 기간: 날짜만 들어오면 하루 범위(00:00:00~23:59:59)로 정규화합니다.
        String date = resolveDate(request);
        String startDateTime = normalizeStartDate(request.getStart_date(), date);
        String endDateTime = normalizeEndDate(request.getEnd_date(), date);

        // Spring DB 원천 데이터 조회
        StoreVo store = storeMapper.getStore(storeId);
        List<PeopleLogVO> peopleLogs = peopleLogMapper.getPeopleLogList(storeId, startDateTime, endDateTime);
        List<ShiftVO> shifts = shiftMapper.getShiftList(shiftStoreId, date, date);
        List<StoreMemberVo> members = storeMemberMapper.getStoreMembers(shiftStoreId);

        // FastAPI가 요구하는 카메라 집계/current/staffSchedule 형태로 변환합니다.
        List<Map<String, Object>> cameraAggregates = buildCameraAggregates(peopleLogs, shifts);
        Map<String, Object> current = buildCurrent(peopleLogs);

        int totalVisitors = peopleLogs.stream()
                .map(PeopleLogVO::getPeople_count)
                .filter(count -> count != null)
                .mapToInt(Integer::intValue)
                .sum();
        int peakCustomerCount = cameraAggregates.stream()
                .map(row -> (Integer) row.get("maxCustomerCount"))
                .max(Integer::compareTo)
                .orElse(0);

        Map<String, Object> payload = new HashMap<>();
        // FastAPI AI 인사이트 스키마는 현재 숫자 storeId를 기대하므로 변환 실패 시 1로 fallback합니다.
        payload.put("storeId", parseStoreId(storeId));
        payload.put("storeName", store != null ? store.getName() : "Store " + storeId);
        payload.put("storeType", normalizeStoreType(store != null ? store.getType() : null));
        payload.put("storeTypeLabel", store != null ? store.getType() : null);
        payload.put("date", date);
        payload.put("current", current);
        payload.put("cameraAggregates", cameraAggregates);
        payload.put("historicalBaseline", Map.of(
                "sameDayAverageVisitors", Math.max(totalVisitors, 1),
                "averagePeakCustomerCount", Math.max(peakCustomerCount, 1)
        ));
        payload.put("pos", Map.of(
                "conversionRate", 0,
                "hourlyOrders", buildHourlyOrders()
        ));
        payload.put("staffSchedule", buildStaffSchedule(shifts));
        payload.put("externalFactors", Map.of(
                "source", "spring-db",
                "peopleLogCount", peopleLogs.size(),
                "shiftCount", shifts.size(),
                "storeMemberCount", members.size()
        ));
        return payload;
    }

    // =========================
    // 시간대별 카메라 집계 생성
    // =========================
    private List<Map<String, Object>> buildCameraAggregates(List<PeopleLogVO> peopleLogs, List<ShiftVO> shifts) {
        Map<Integer, PeopleLogVO> latestByHour = new HashMap<>();
        for (PeopleLogVO log : peopleLogs) {
            LocalDateTime recordTime = log.getRecord_time();
            if (recordTime == null) {
                continue;
            }
            int hour = recordTime.getHour();
            PeopleLogVO previous = latestByHour.get(hour);
            if (previous == null || recordTime.isAfter(previous.getRecord_time())) {
                latestByHour.put(hour, log);
            }
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (int hour = 9; hour <= 20; hour++) {
            int customerCount = 0;
            PeopleLogVO latest = latestByHour.get(hour);
            if (latest != null && latest.getPeople_count() != null) {
                customerCount = latest.getPeople_count();
            }

            int staffCount = countWorkingStaff(shifts, hour);
            Map<String, Object> row = new HashMap<>();
            row.put("time", String.format("%02d:00", hour));
            row.put("avgCustomerCount", customerCount);
            row.put("maxCustomerCount", customerCount);
            row.put("minCustomerCount", Math.max(0, customerCount - 2));
            row.put("lastCustomerCount", customerCount);
            row.put("workingStaffCount", staffCount);
            row.put("recommendedStaffCount", Math.max(1, (int) Math.ceil(customerCount / 25.0)));
            row.put("waitMinutes", Math.max(0, (int) Math.ceil(customerCount / 8.0)));
            rows.add(row);
        }
        return rows;
    }

    // =========================
    // 현재 혼잡도 요약 생성
    // =========================
    private Map<String, Object> buildCurrent(List<PeopleLogVO> peopleLogs) {
        int totalVisitors = peopleLogs.stream()
                .map(PeopleLogVO::getPeople_count)
                .filter(count -> count != null)
                .mapToInt(Integer::intValue)
                .sum();

        int currentCustomerCount = peopleLogs.stream()
                .filter(log -> log.getRecord_time() != null)
                .max(Comparator.comparing(PeopleLogVO::getRecord_time))
                .map(PeopleLogVO::getPeople_count)
                .orElse(0);

        return Map.of(
                "currentCustomerCount", currentCustomerCount,
                "todayTotalVisitors", totalVisitors,
                "conversionRate", 0,
                "processedFrames", 0,
                "confidenceAvg", 0
        );
    }

    // =========================
    // 시간대별 근무 인원 생성
    // =========================
    private List<Map<String, Object>> buildStaffSchedule(List<ShiftVO> shifts) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (int hour = 9; hour <= 20; hour++) {
            rows.add(Map.of(
                    "timeRange", String.format("%02d:00-%02d:00", hour, hour + 1),
                    "currentStaff", countWorkingStaff(shifts, hour)
            ));
        }
        return rows;
    }

    // =========================
    // POS 주문 데이터 기본값 생성
    // =========================
    private List<Map<String, Object>> buildHourlyOrders() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (int hour = 9; hour <= 20; hour++) {
            rows.add(Map.of(
                    "time", String.format("%02d:00", hour),
                    "orderCount", 0,
                    "conversionRate", 0
            ));
        }
        return rows;
    }

    // =========================
    // 특정 시간에 근무 중인 직원 수 계산
    // =========================
    private int countWorkingStaff(List<ShiftVO> shifts, int hour) {
        int hourStart = hour * 60;
        int hourEnd = hourStart + 60;
        return (int) shifts.stream()
                .filter(shift -> {
                    if (shift.getStart_at() == null || shift.getEnd_at() == null) {
                        return false;
                    }
                    int start = shift.getStart_at().getHours() * 60 + shift.getStart_at().getMinutes();
                    int end = shift.getEnd_at().getHours() * 60 + shift.getEnd_at().getMinutes();
                    return start < hourEnd && end > hourStart;
                })
                .map(ShiftVO::getUser_id)
                .distinct()
                .count();
    }

    // =========================
    // 요청 날짜 결정
    // =========================
    private String resolveDate(AiInsightAnalyzeRequestVO request) {
        if (request.getDate() != null && !request.getDate().isBlank()) {
            return request.getDate();
        }
        if (request.getStart_date() != null && request.getStart_date().length() >= 10) {
            return request.getStart_date().substring(0, 10);
        }
        return LocalDate.now().format(DATE_FORMATTER);
    }

    // =========================
    // 시작 시각 정규화
    // =========================
    private String normalizeStartDate(String value, String date) {
        if (value == null || value.isBlank()) {
            return date + " 00:00:00";
        }
        return value.length() == 10 ? value + " 00:00:00" : value;
    }

    // =========================
    // 종료 시각 정규화
    // =========================
    private String normalizeEndDate(String value, String date) {
        if (value == null || value.isBlank()) {
            return date + " 23:59:59";
        }
        return value.length() == 10 ? value + " 23:59:59" : value;
    }

    // =========================
    // FastAPI 인사이트용 storeId 변환
    // =========================
    private int parseStoreId(String storeId) {
        try {
            return Integer.parseInt(storeId);
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    // =========================
    // 업종 코드 정규화
    // =========================
    private String normalizeStoreType(String storeType) {
        if (storeType == null || storeType.isBlank()) {
            return "OTHER";
        }
        String upper = storeType.toUpperCase();
        if (upper.contains("CAFE") || upper.contains("COFFEE") || upper.contains("카페")) {
            return "CAFE";
        }
        return upper.replaceAll("[^A-Z0-9_]", "_");
    }
}
