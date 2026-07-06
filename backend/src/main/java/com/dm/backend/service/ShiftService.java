package com.dm.backend.service;

import com.dm.backend.mapper.FixedscheduleMapper;
import com.dm.backend.mapper.LeaveRequestMapper;
import com.dm.backend.mapper.PeopleLogMapper;
import com.dm.backend.mapper.ShiftMapper;
import com.dm.backend.mapper.StoreMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.vo.AiSchedulePreviewVO;
import com.dm.backend.vo.AiScheduleReasonVO;
import com.dm.backend.vo.AiScheduleRequestVO;
import com.dm.backend.vo.FixedscheduleVO;
import com.dm.backend.vo.LeaveRequestVO;
import com.dm.backend.vo.PeopleLogVO;
import com.dm.backend.vo.ShiftVO;
import com.dm.backend.vo.StoreMemberVo;
import com.dm.backend.vo.StoreVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ShiftService {

    @Autowired
    private ShiftMapper shiftMapper;

    @Autowired
    private FixedscheduleMapper fixedscheduleMapper;

    @Autowired
    private StoreMapper storeMapper;

    @Autowired
    private StoreMemberMapper storeMemberMapper;

    @Autowired
    private PeopleLogMapper peopleLogMapper;

    @Autowired
    private LeaveRequestMapper leaveRequestMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    @Value("${fastapi.base-url:http://127.0.0.1:8000}")
    private String fastApiBaseUrl;

    private final RestClient restClient = RestClient.builder().build();

    public ShiftVO getShift(
            String id
    ) {
        return shiftMapper.getShift(id);
    }

    public void registerShift(
            ShiftVO shiftVO
    ) {
        int conflict = shiftMapper.checkShiftConflict(
                shiftVO.getUser_id(),
                shiftVO.getWork_date(),
                shiftVO.getStart_at(),
                shiftVO.getEnd_at()
        );

        if (conflict > 0) {
            throw new RuntimeException("이미 해당 시간에 근무가 존재합니다.");
        }

        shiftMapper.registerShift(shiftVO);
    }

    @Transactional
    public List<ShiftVO> getShiftList(
            String store_id,
            String start_date,
            String end_date
    ) {
        String today = LocalDate.now().format(DATE_FORMATTER);
        String effectiveStart = start_date.compareTo(today) >= 0 ? start_date : today;
        if (effectiveStart.compareTo(end_date) <= 0) {
            materializeFixedShifts(store_id, effectiveStart, end_date);
        }
        return shiftMapper.getShiftList(
                store_id,
                start_date,
                end_date
        );
    }

    public void updateShift(
            ShiftVO shiftVO
    ) {
        int conflict = shiftMapper.checkShiftConflictForUpdate(
                shiftVO.getId(),
                shiftVO.getUser_id(),
                shiftVO.getWork_date(),
                shiftVO.getStart_at(),
                shiftVO.getEnd_at()
        );

        if (conflict > 0) {
            throw new RuntimeException("이미 해당 시간에 근무가 존재합니다.");
        }

        shiftMapper.updateShift(shiftVO);
    }

    public void delShift(
            String id
    ) {
        shiftMapper.delShift(id);
    }

    @Transactional
    public void delFutureShifts(
            String user_id,
            String store_id,
            String weekday,
            String from_date
    ) {
        shiftMapper.delFutureShiftsByWeekday(user_id, store_id, weekday, from_date);
        fixedscheduleMapper.deactivateFixedSchedule(user_id, store_id, weekday);
    }

    @Transactional
    public void generateAutomatedShifts(
            String store_id,
            String start_date,
            String end_date
    ) {
        AiScheduleRequestVO request = new AiScheduleRequestVO(
                store_id,
                start_date,
                end_date,
                null
        );
        request.setShifts(previewAiSchedule(request).getShifts());
        applyAiSchedule(request);
    }

    @Transactional
    public void applyFixedShifts(
            String store_id,
            String start_date,
            String end_date
    ) {
        materializeFixedShifts(store_id, start_date, end_date);
    }

    public AiSchedulePreviewVO previewAiSchedule(
            AiScheduleRequestVO request
    ) {
        String storeId = request.getStore_id();
        LocalDate startDate = LocalDate.parse(request.getStart_date(), DATE_FORMATTER);
        LocalDate endDate = LocalDate.parse(request.getEnd_date(), DATE_FORMATTER);

        StoreVo store = storeMapper.getStore(storeId);
        LocalTime openTime = parseTime(store != null ? store.getOpen_time() : null, LocalTime.of(9, 0));
        LocalTime closeTime = parseTime(store != null ? store.getClose_time() : null, LocalTime.of(20, 0));
        if (!closeTime.isAfter(openTime)) {
            closeTime = openTime.plusHours(8);
        }

        List<StoreMemberVo> members = storeMemberMapper.getStoreMembers(storeId).stream()
                .filter(member -> "APPROVED".equalsIgnoreCase(member.getApproval_status()))
                .filter(member -> !"ADMIN".equalsIgnoreCase(member.getMember_role()))
                .collect(Collectors.toList());
        List<FixedscheduleVO> fixedSchedules = fixedscheduleMapper.getFixedScheduleList(storeId).stream()
                .filter(schedule -> schedule.getActive() == null || "Y".equalsIgnoreCase(schedule.getActive()))
                .collect(Collectors.toList());
        List<ShiftVO> existingShifts = shiftMapper.getShiftList(
                storeId,
                request.getStart_date(),
                request.getEnd_date()
        );
        List<LeaveRequestVO> approvedLeaves = leaveRequestMapper.getApprovedLeaveRequestsForPeriod(
                storeId,
                request.getStart_date(),
                request.getEnd_date()
        );
        List<PeopleLogVO> peopleLogs = peopleLogMapper.getPeopleLogList(
                storeId,
                request.getStart_date() + " 00:00:00",
                request.getEnd_date() + " 23:59:59"
        );

        Map<String, ShiftVO> shiftsById = existingShifts.stream()
                .collect(Collectors.toMap(ShiftVO::getId, shift -> shift, (a, b) -> a));
        Map<LocalDate, Set<String>> leaveUsersByDate = buildLeaveUsersByDate(approvedLeaves, shiftsById);
        Map<String, Integer> demandByDateHour = buildDemandByDateHour(peopleLogs);
        Map<String, List<FixedscheduleVO>> fixedByUser = fixedSchedules.stream()
                .collect(Collectors.groupingBy(FixedscheduleVO::getUser_id));

        List<HourlyAssignment> assignments = new ArrayList<>();
        int conflictExcludedCount = 0;
        int newbieSoloAvoidedCount = 0;

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            String weekday = toWeekday(date);
            for (LocalTime hour = openTime.withMinute(0); hour.isBefore(closeTime); hour = hour.plusHours(1)) {
                LocalDate slotDate = date;
                LocalTime slotHour = hour;
                LocalTime slotHourEnd = hour.plusHours(1);
                LocalTime storeOpenTime = openTime;
                LocalTime storeCloseTime = closeTime;
                int customerCount = demandByDateHour.getOrDefault(date + "|" + hour.getHour(), 0);
                int neededStaff = customerCount == 0 ? 1 : Math.max(1, (int) Math.ceil(customerCount / 25.0));

                LocalDateTime slotStart = LocalDateTime.of(slotDate, slotHour);
                LocalDateTime slotEnd = slotStart.plusHours(1);
                Set<String> assignedThisHour = new HashSet<>();

                List<StoreMemberVo> candidates = members.stream()
                        .filter(member -> !leaveUsersByDate.getOrDefault(slotDate, Set.of()).contains(member.getUser_id()))
                        .filter(member -> isAvailable(
                                member,
                                fixedByUser.get(member.getUser_id()),
                                weekday,
                                slotHour,
                                slotHourEnd,
                                storeOpenTime,
                                storeCloseTime
                        ))
                        .sorted(candidateComparator(slotHour, storeCloseTime))
                        .collect(Collectors.toList());

                for (StoreMemberVo candidate : candidates) {
                    if (assignedThisHour.size() >= neededStaff) {
                        break;
                    }
                    if (hasConflict(existingShifts, candidate.getUser_id(), slotStart, slotEnd)
                            || hasHourlyConflict(assignments, candidate.getUser_id(), slotStart, slotEnd)) {
                        conflictExcludedCount++;
                        continue;
                    }
                    assignedThisHour.add(candidate.getUser_id());
                    assignments.add(new HourlyAssignment(candidate.getUser_id(), slotDate, slotHour, slotHourEnd));
                }

                if (assignedThisHour.size() == 1) {
                    String userId = assignedThisHour.iterator().next();
                    StoreMemberVo onlyMember = members.stream()
                            .filter(member -> member.getUser_id().equals(userId))
                            .findFirst()
                            .orElse(null);
                    if (onlyMember != null && "NEWBIE".equalsIgnoreCase(onlyMember.getUser_level())) {
                        StoreMemberVo support = candidates.stream()
                                .filter(member -> !member.getUser_id().equals(userId))
                                .filter(member -> !"NEWBIE".equalsIgnoreCase(member.getUser_level()))
                                .filter(member -> !hasConflict(existingShifts, member.getUser_id(), slotStart, slotEnd))
                                .filter(member -> !hasHourlyConflict(assignments, member.getUser_id(), slotStart, slotEnd))
                                .findFirst()
                                .orElse(null);
                        if (support != null) {
                            assignments.add(new HourlyAssignment(support.getUser_id(), slotDate, slotHour, slotHourEnd));
                            newbieSoloAvoidedCount++;
                        }
                    }
                }
            }
        }

        List<ShiftVO> generatedShifts = mergeAssignments(storeId, assignments);
        int closerCount = countCloserShifts(generatedShifts, members, closeTime);
        List<AiScheduleReasonVO> reasons = explainGeneratedShifts(
                store,
                generatedShifts,
                members,
                demandByDateHour,
                closeTime
        );

        return new AiSchedulePreviewVO(
                generatedShifts,
                reasons,
                generatedShifts.size(),
                closerCount,
                newbieSoloAvoidedCount,
                conflictExcludedCount
        );
    }

    @Transactional
    public void applyAiSchedule(
            AiScheduleRequestVO request
    ) {
        List<ShiftVO> shifts = request.getShifts();
        if (shifts == null || shifts.isEmpty()) {
            shifts = previewAiSchedule(request).getShifts();
        }

        for (ShiftVO shift : shifts) {
            if (shift.getId() == null || shift.getId().isBlank()) {
                shift.setId(newShiftId());
            }
            if (shift.getStore_id() == null || shift.getStore_id().isBlank()) {
                shift.setStore_id(request.getStore_id());
            }
            if (shift.getStatus() == null || shift.getStatus().isBlank()) {
                shift.setStatus("confirmed");
            }
            registerShift(shift);
        }
    }

    public List<ShiftVO> getMyShiftList(
            String user_id,
            String start_date,
            String end_date
    ) {
        return shiftMapper.getMyShiftList(
                user_id,
                start_date,
                end_date
        );
    }

    private Map<LocalDate, Set<String>> buildLeaveUsersByDate(
            List<LeaveRequestVO> approvedLeaves,
            Map<String, ShiftVO> shiftsById
    ) {
        Map<LocalDate, Set<String>> result = new HashMap<>();
        for (LeaveRequestVO leave : approvedLeaves) {
            ShiftVO shift = shiftsById.get(leave.getShift_id());
            if (shift == null || shift.getWork_date() == null) {
                continue;
            }
            LocalDate date = toLocalDate(shift.getWork_date());
            result.computeIfAbsent(date, ignored -> new HashSet<>()).add(leave.getUser_id());
        }
        return result;
    }

    private Map<String, Integer> buildDemandByDateHour(
            List<PeopleLogVO> peopleLogs
    ) {
        Map<String, Integer> result = new HashMap<>();
        for (PeopleLogVO log : peopleLogs) {
            if (log.getRecord_time() == null || log.getPeople_count() == null) {
                continue;
            }
            String key = log.getRecord_time().toLocalDate() + "|" + log.getRecord_time().getHour();
            result.merge(key, log.getPeople_count(), Math::max);
        }
        return result;
    }

    private boolean isAvailable(
            StoreMemberVo member,
            List<FixedscheduleVO> fixedSchedules,
            String weekday,
            LocalTime slotStart,
            LocalTime slotEnd,
            LocalTime openTime,
            LocalTime closeTime
    ) {
        if (fixedSchedules != null && !fixedSchedules.isEmpty()) {
            return fixedSchedules.stream()
                    .filter(schedule -> weekday.equalsIgnoreCase(schedule.getWeekday()))
                    .anyMatch(schedule -> overlaps(
                            parseTime(schedule.getStart_time(), openTime),
                            parseTime(schedule.getEnd_time(), closeTime),
                            slotStart,
                            slotEnd
                    ));
        }

        String availableDays = member.getAvailable_days();
        return availableDays == null
                || availableDays.isBlank()
                || availableDays.toUpperCase().contains(weekday);
    }

    private Comparator<StoreMemberVo> candidateComparator(
            LocalTime hour,
            LocalTime closeTime
    ) {
        boolean closingSlot = !hour.isBefore(closeTime.minusHours(2));
        return Comparator
                .comparingInt((StoreMemberVo member) -> levelRank(member.getUser_level(), closingSlot))
                .thenComparing(member -> member.getPay_amount() == null ? Integer.MAX_VALUE : member.getPay_amount())
                .thenComparing(StoreMemberVo::getUser_id);
    }

    private int levelRank(
            String userLevel,
            boolean closingSlot
    ) {
        String level = userLevel == null ? "" : userLevel.toUpperCase();
        if (closingSlot) {
            return switch (level) {
                case "CLOSER" -> 0;
                case "MANAGER" -> 1;
                case "REGULAR" -> 2;
                case "NEWBIE" -> 3;
                default -> 4;
            };
        }
        return switch (level) {
            case "REGULAR" -> 0;
            case "MANAGER" -> 1;
            case "CLOSER" -> 2;
            case "NEWBIE" -> 3;
            default -> 4;
        };
    }

    private boolean hasConflict(
            List<ShiftVO> shifts,
            String userId,
            LocalDateTime start,
            LocalDateTime end
    ) {
        return shifts.stream()
                .filter(shift -> userId.equals(shift.getUser_id()))
                .filter(shift -> !"cancelled".equalsIgnoreCase(shift.getStatus()))
                .filter(shift -> shift.getStart_at() != null && shift.getEnd_at() != null)
                .anyMatch(shift -> overlaps(
                        toLocalDateTime(shift.getStart_at()),
                        toLocalDateTime(shift.getEnd_at()),
                        start,
                        end
                ));
    }

    private boolean hasHourlyConflict(
            List<HourlyAssignment> assignments,
            String userId,
            LocalDateTime start,
            LocalDateTime end
    ) {
        return assignments.stream()
                .filter(assignment -> userId.equals(assignment.userId()))
                .anyMatch(assignment -> overlaps(
                        LocalDateTime.of(assignment.date(), assignment.start()),
                        LocalDateTime.of(assignment.date(), assignment.end()),
                        start,
                        end
                ));
    }

    private List<ShiftVO> mergeAssignments(
            String storeId,
            List<HourlyAssignment> assignments
    ) {
        List<ShiftVO> shifts = new ArrayList<>();
        Map<String, List<HourlyAssignment>> grouped = assignments.stream()
                .sorted(Comparator.comparing(HourlyAssignment::date)
                        .thenComparing(HourlyAssignment::userId)
                        .thenComparing(HourlyAssignment::start))
                .collect(Collectors.groupingBy(
                        assignment -> assignment.date() + "|" + assignment.userId(),
                        HashMap::new,
                        Collectors.toList()
                ));

        for (List<HourlyAssignment> group : grouped.values()) {
            group.sort(Comparator.comparing(HourlyAssignment::start));
            HourlyAssignment first = null;
            HourlyAssignment previous = null;
            for (HourlyAssignment assignment : group) {
                if (first == null) {
                    first = assignment;
                    previous = assignment;
                    continue;
                }
                if (previous.end().equals(assignment.start())) {
                    previous = assignment;
                    continue;
                }
                shifts.add(toShift(storeId, first, previous));
                first = assignment;
                previous = assignment;
            }
            if (first != null) {
                shifts.add(toShift(storeId, first, previous));
            }
        }

        shifts.sort(Comparator.comparing(ShiftVO::getWork_date)
                .thenComparing(ShiftVO::getStart_at)
                .thenComparing(ShiftVO::getUser_id));
        return shifts;
    }

    private ShiftVO toShift(
            String storeId,
            HourlyAssignment first,
            HourlyAssignment last
    ) {
        LocalDateTime start = LocalDateTime.of(first.date(), first.start());
        LocalDateTime end = LocalDateTime.of(last.date(), last.end());
        ShiftVO shift = new ShiftVO();
        shift.setId(newShiftId());
        shift.setStore_id(storeId);
        shift.setUser_id(first.userId());
        shift.setWork_date(toDate(first.date().atStartOfDay()));
        shift.setStart_at(toDate(start));
        shift.setEnd_at(toDate(end));
        shift.setStatus("confirmed");
        return shift;
    }

    private int countCloserShifts(
            List<ShiftVO> shifts,
            List<StoreMemberVo> members,
            LocalTime closeTime
    ) {
        Set<String> closerUserIds = members.stream()
                .filter(member -> "CLOSER".equalsIgnoreCase(member.getUser_level())
                        || "MANAGER".equalsIgnoreCase(member.getUser_level()))
                .map(StoreMemberVo::getUser_id)
                .collect(Collectors.toSet());

        return (int) shifts.stream()
                .filter(shift -> closerUserIds.contains(shift.getUser_id()))
                .filter(shift -> toLocalDateTime(shift.getEnd_at()).toLocalTime().equals(closeTime))
                .count();
    }

    private List<AiScheduleReasonVO> explainGeneratedShifts(
            StoreVo store,
            List<ShiftVO> shifts,
            List<StoreMemberVo> members,
            Map<String, Integer> demandByDateHour,
            LocalTime closeTime
    ) {
        List<Map<String, Object>> rows = shifts.stream()
                .map(shift -> buildExplainRow(shift, shifts, members, demandByDateHour, closeTime))
                .collect(Collectors.toList());
        List<AiScheduleReasonVO> fallback = rows.stream()
                .map(row -> new AiScheduleReasonVO(
                        String.valueOf(row.get("shiftId")),
                        fallbackReason(row)
                ))
                .collect(Collectors.toList());

        if (rows.isEmpty()) {
            return fallback;
        }

        try {
            Map<?, ?> response = restClient
                    .post()
                    .uri(openCvUrl("/api/v1/ai-schedules/explain"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "storeName", store != null ? store.getName() : "매장",
                            "generatedShifts", rows
                    ))
                    .retrieve()
                    .body(Map.class);

            Object reasonsValue = response != null ? response.get("reasons") : null;
            if (!(reasonsValue instanceof List<?> reasonRows)) {
                return fallback;
            }

            Map<String, String> fallbackById = fallback.stream()
                    .collect(Collectors.toMap(AiScheduleReasonVO::getShift_id, AiScheduleReasonVO::getReason));
            List<AiScheduleReasonVO> result = new ArrayList<>();
            for (Object reasonValue : reasonRows) {
                if (!(reasonValue instanceof Map<?, ?> reasonMap)) {
                    continue;
                }
                Object shiftIdValue = reasonMap.get("shiftId");
                if (shiftIdValue == null) {
                    shiftIdValue = reasonMap.get("shift_id");
                }
                String shiftId = shiftIdValue != null ? String.valueOf(shiftIdValue) : null;
                Object reason = reasonMap.get("reason");
                if (shiftId == null || reason == null) {
                    continue;
                }
                result.add(new AiScheduleReasonVO(shiftId, String.valueOf(reason)));
            }

            if (result.isEmpty()) {
                return fallback;
            }

            Set<String> returnedIds = result.stream()
                    .map(AiScheduleReasonVO::getShift_id)
                    .collect(Collectors.toSet());
            for (AiScheduleReasonVO fallbackReason : fallback) {
                if (!returnedIds.contains(fallbackReason.getShift_id())) {
                    result.add(new AiScheduleReasonVO(
                            fallbackReason.getShift_id(),
                            fallbackById.get(fallbackReason.getShift_id())
                    ));
                }
            }
            return result;
        } catch (RuntimeException e) {
            return fallback;
        }
    }

    private Map<String, Object> buildExplainRow(
            ShiftVO shift,
            List<ShiftVO> shifts,
            List<StoreMemberVo> members,
            Map<String, Integer> demandByDateHour,
            LocalTime closeTime
    ) {
        LocalDateTime start = toLocalDateTime(shift.getStart_at());
        LocalDateTime end = toLocalDateTime(shift.getEnd_at());
        StoreMemberVo member = members.stream()
                .filter(row -> row.getUser_id().equals(shift.getUser_id()))
                .findFirst()
                .orElse(null);

        int expectedPeopleCount = maxDemandForRange(start, end, demandByDateHour);
        int requiredStaff = expectedPeopleCount == 0 ? 1 : Math.max(1, (int) Math.ceil(expectedPeopleCount / 25.0));
        int assignedStaff = countGeneratedOverlaps(shifts, start, end);
        boolean closingTime = !end.toLocalTime().isBefore(closeTime.minusHours(2));
        boolean newbieSoloAvoided = hasNewbieWithSupport(shifts, members, start, end);

        Map<String, Object> row = new HashMap<>();
        row.put("shiftId", shift.getId());
        row.put("userId", shift.getUser_id());
        row.put("userLevel", member != null ? member.getUser_level() : null);
        row.put("workDate", start.toLocalDate().toString());
        row.put("startAt", formatDateTime(shift.getStart_at()));
        row.put("endAt", formatDateTime(shift.getEnd_at()));
        row.put("expectedPeopleCount", expectedPeopleCount);
        row.put("requiredStaff", requiredStaff);
        row.put("assignedStaff", assignedStaff);
        row.put("isClosingTime", closingTime);
        row.put("newbieSoloAvoided", newbieSoloAvoided);
        return row;
    }

    private String fallbackReason(
            Map<String, Object> row
    ) {
        String workDate = String.valueOf(row.get("workDate"));
        String startAt = String.valueOf(row.get("startAt")).substring(11, 16);
        String endAt = String.valueOf(row.get("endAt")).substring(11, 16);
        int expectedPeople = (Integer) row.get("expectedPeopleCount");
        int requiredStaff = (Integer) row.get("requiredStaff");
        Object userLevel = row.get("userLevel");
        boolean closingTime = Boolean.TRUE.equals(row.get("isClosingTime"));
        boolean newbieSoloAvoided = Boolean.TRUE.equals(row.get("newbieSoloAvoided"));

        List<String> parts = new ArrayList<>();
        parts.add(workDate + " " + startAt + "-" + endAt + "은 예상 고객 수 " + expectedPeople
                + "명 기준으로 " + requiredStaff + "명 배치가 필요합니다.");
        if (closingTime && ("CLOSER".equalsIgnoreCase(String.valueOf(userLevel))
                || "MANAGER".equalsIgnoreCase(String.valueOf(userLevel)))) {
            parts.add("마감 시간대라 " + userLevel + " 직원을 우선 배정했습니다.");
        }
        if (newbieSoloAvoided) {
            parts.add("신입 직원이 단독으로 근무하지 않도록 보조 인원을 함께 배치했습니다.");
        }
        return String.join(" ", parts);
    }

    private int maxDemandForRange(
            LocalDateTime start,
            LocalDateTime end,
            Map<String, Integer> demandByDateHour
    ) {
        int max = 0;
        for (LocalDateTime cursor = start; cursor.isBefore(end); cursor = cursor.plusHours(1)) {
            max = Math.max(max, demandByDateHour.getOrDefault(cursor.toLocalDate() + "|" + cursor.getHour(), 0));
        }
        return max;
    }

    private int countGeneratedOverlaps(
            List<ShiftVO> shifts,
            LocalDateTime start,
            LocalDateTime end
    ) {
        return (int) shifts.stream()
                .filter(row -> row.getStart_at() != null && row.getEnd_at() != null)
                .filter(row -> overlaps(toLocalDateTime(row.getStart_at()), toLocalDateTime(row.getEnd_at()), start, end))
                .map(ShiftVO::getUser_id)
                .distinct()
                .count();
    }

    private boolean hasNewbieWithSupport(
            List<ShiftVO> shifts,
            List<StoreMemberVo> members,
            LocalDateTime start,
            LocalDateTime end
    ) {
        Set<String> newbieIds = members.stream()
                .filter(row -> "NEWBIE".equalsIgnoreCase(row.getUser_level()))
                .map(StoreMemberVo::getUser_id)
                .collect(Collectors.toSet());
        Set<String> overlappingUserIds = shifts.stream()
                .filter(row -> row.getStart_at() != null && row.getEnd_at() != null)
                .filter(row -> overlaps(toLocalDateTime(row.getStart_at()), toLocalDateTime(row.getEnd_at()), start, end))
                .map(ShiftVO::getUser_id)
                .collect(Collectors.toSet());
        return overlappingUserIds.stream().anyMatch(newbieIds::contains) && overlappingUserIds.size() > 1;
    }

    private String toWeekday(
            LocalDate date
    ) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> "MON";
            case TUESDAY -> "TUE";
            case WEDNESDAY -> "WED";
            case THURSDAY -> "THU";
            case FRIDAY -> "FRI";
            case SATURDAY -> "SAT";
            case SUNDAY -> "SUN";
        };
    }

    private LocalTime parseTime(
            String value,
            LocalTime fallback
    ) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return LocalTime.parse(value.substring(0, 5));
    }

    private void materializeFixedShifts(
            String storeId,
            String startDateValue,
            String endDateValue
    ) {
        LocalDate startDate = LocalDate.parse(startDateValue, DATE_FORMATTER);
        LocalDate endDate = LocalDate.parse(endDateValue, DATE_FORMATTER);
        List<FixedscheduleVO> fixedSchedules = fixedscheduleMapper.getFixedScheduleList(storeId).stream()
                .filter(schedule -> schedule.getActive() == null || "Y".equalsIgnoreCase(schedule.getActive()))
                .collect(Collectors.toList());

        if (fixedSchedules.isEmpty()) {
            return;
        }

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            String weekday = toWeekday(date);
            for (FixedscheduleVO fixedSchedule : fixedSchedules) {
                if (!weekday.equalsIgnoreCase(fixedSchedule.getWeekday())) {
                    continue;
                }

                LocalTime startTime = parseTime(fixedSchedule.getStart_time(), LocalTime.of(9, 0));
                LocalTime endTime = parseTime(fixedSchedule.getEnd_time(), startTime.plusHours(1));
                LocalDateTime startAt = LocalDateTime.of(date, startTime);
                LocalDateTime endAt = LocalDateTime.of(date, endTime);

                ShiftVO shift = new ShiftVO();
                shift.setId(newFixedShiftId());
                shift.setStore_id(storeId);
                shift.setUser_id(fixedSchedule.getUser_id());
                shift.setWork_date(toDate(date.atStartOfDay()));
                shift.setStart_at(toDate(startAt));
                shift.setEnd_at(toDate(endAt));
                shift.setStatus("confirmed");

                int conflict = shiftMapper.checkShiftConflict(
                        shift.getUser_id(),
                        shift.getWork_date(),
                        shift.getStart_at(),
                        shift.getEnd_at()
                );
                if (conflict == 0) {
                    shiftMapper.registerShift(shift);
                }
            }
        }
    }

    private boolean overlaps(
            LocalTime startA,
            LocalTime endA,
            LocalTime startB,
            LocalTime endB
    ) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private boolean overlaps(
            LocalDateTime startA,
            LocalDateTime endA,
            LocalDateTime startB,
            LocalDateTime endB
    ) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private LocalDate toLocalDate(
            Date date
    ) {
        return Instant.ofEpochMilli(date.getTime()).atZone(ZoneId.systemDefault()).toLocalDate();
    }

    private LocalDateTime toLocalDateTime(
            Date date
    ) {
        return Instant.ofEpochMilli(date.getTime()).atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private Date toDate(
            LocalDateTime dateTime
    ) {
        return Date.from(dateTime.atZone(ZoneId.systemDefault()).toInstant());
    }

    private String formatDateTime(
            Date date
    ) {
        return toLocalDateTime(date).format(DATE_TIME_FORMATTER);
    }

    private String newShiftId() {
        return "AI_" + UUID.randomUUID().toString().replace("-", "").substring(0, 18);
    }

    private String newFixedShiftId() {
        return "FIX_" + UUID.randomUUID().toString().replace("-", "").substring(0, 17);
    }

    private String openCvUrl(String path) {
        String baseUrl = fastApiBaseUrl.endsWith("/")
                ? fastApiBaseUrl.substring(0, fastApiBaseUrl.length() - 1)
                : fastApiBaseUrl;
        return baseUrl + path;
    }

    private record HourlyAssignment(
            String userId,
            LocalDate date,
            LocalTime start,
            LocalTime end
    ) {
    }
}
