package com.dm.backend.mapper;

import com.dm.backend.vo.LeaveRequestVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface LeaveRequestMapper {

    // 1. 알바생의 휴무 신청 등록 (id, shift_id, user_id, reason, status만 바인딩, requested_at은 DEFAULT 작동)
    @Insert("INSERT INTO leave_request (id, shift_id, user_id, reason, status) " +
            "VALUES (#{id}, #{shift_id}, #{user_id}, #{reason}, 'PENDING')")
    void registerLeaveRequest(LeaveRequestVO leaveRequestVO);

    // 2. 매장별 대기 중(PENDING)인 휴무 신청 내역 최신순 조회
    @Select("SELECT lr.* FROM leave_request lr " +
            "JOIN shift s ON lr.shift_id = s.id " +
            "WHERE s.store_id = #{store_id} AND lr.status = 'PENDING' " +
            "ORDER BY lr.requested_at DESC")
    List<LeaveRequestVO> getLeaveRequestList(String store_id);

    // 3. 단건 조회 (상태 변경 처리를 위해 데이터를 가져올 때 사용)
    @Select("SELECT * FROM leave_request WHERE id = #{id}")
    LeaveRequestVO getLeaveRequest(String id);

    // 4. 휴무 신청 상태 및 처리일시 업데이트 (processed_at에 SYSTIMESTAMP 반영)
    @Update("UPDATE leave_request " +
            "SET status = #{status}, processed_at = SYSTIMESTAMP " +
            "WHERE id = #{id}")
    void updateLeaveStatus(String id, String status);

    // 5. [연동 쿼리] 휴무 승인 시 대상 근무(SHIFT)의 상태를 'VACANT'(공석)으로 변경
    @Update("UPDATE shift SET status = 'VACANT' WHERE id = #{shift_id}")
    void updateShiftStatusVacant(String shift_id);

    // [추가] 1. 휴무 신청 데이터 삭제 (취소 시 로그를 남기지 않고 삭제하는 정책)
    @Delete("DELETE FROM leave_request WHERE id = #{id}")
    void deleteLeaveRequest(String id);

    // [추가] 2. 이미 승인된 휴무를 취소할 경우, 공석(VACANT)이었던 근무를 다시 예정(SCHEDULED) 상태로 원복
    @Update("UPDATE shift SET status = 'SCHEDULED' WHERE id = #{shift_id}")
    void rollbackShiftStatusScheduled(String shift_id);
}
