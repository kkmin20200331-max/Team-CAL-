package com.dm.backend.mapper;

import com.dm.backend.vo.LeaveRequestVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface LeaveRequestMapper {

    // =========================
    // [공통]
    // =========================

    // 휴무 신청 단건 조회
    @Select("""
            SELECT *
            FROM leave_request
            WHERE id = #{id}
            """)
    LeaveRequestVO getLeaveRequest(String id);


    // =========================
    // [관리자]
    // =========================

    // 매장별 승인 대기중(PENDING) 휴무 신청 목록 조회
    @Select("""
            SELECT lr.*
            FROM leave_request lr
            JOIN shift s
                ON lr.shift_id = s.id
            WHERE s.store_id = #{store_id}
            AND lr.status = 'PENDING'
            ORDER BY lr.requested_at DESC
            """)
    List<LeaveRequestVO> getLeaveRequestList(String store_id);

    // 휴무 신청 승인/거절 처리
    @Update("""
            UPDATE leave_request
            SET status = #{status},
                processed_at = SYSTIMESTAMP
            WHERE id = #{id}
            """)
    void updateLeaveStatus(
            @Param("id") String id,
            @Param("status") String status
    );

    // 승인 시 근무 상태를 공석(VACANT) 처리
    @Update("""
            UPDATE shift
            SET status = 'VACANT'
            WHERE id = #{shift_id}
            """)
    void updateShiftStatusVacant(String shift_id);

    // 승인 취소 시 근무 상태를 예정(SCHEDULED)으로 복구
    @Update("""
            UPDATE shift
            SET status = 'SCHEDULED'
            WHERE id = #{shift_id}
            AND status = 'VACANT'
            """)
    void rollbackShiftStatusScheduled(String shift_id);


    // =========================
    // [직원]
    // =========================

    // 휴무 신청 등록
    @Insert("""
            INSERT INTO leave_request
            (id, shift_id, user_id, reason, status)
            VALUES
            (#{id}, #{shift_id}, #{user_id}, #{reason}, 'PENDING')
            """)
    void registerLeaveRequest(LeaveRequestVO leaveRequestVO);

    // 휴무 신청 취소(CANCELLED)
    @Update("""
            UPDATE leave_request
            SET status = 'CANCELLED',
                processed_at = SYSTIMESTAMP
            WHERE id = #{id}
            """)
    void cancelLeaveRequest(String id);

    // 월별 휴무 신청 내역 전체 조회
    @Select("""
            SELECT lr.*
            FROM leave_request lr
            JOIN shift s
                ON lr.shift_id = s.id
            WHERE lr.user_id = #{user_id}
            AND EXTRACT(YEAR FROM s.work_date) = #{year}
            AND EXTRACT(MONTH FROM s.work_date) = #{month}
            ORDER BY s.work_date
            """)
    List<LeaveRequestVO> getMyLeaveRequests(
            @Param("user_id") String user_id,
            @Param("year") int year,
            @Param("month") int month
    );

    // 월별 휴무 신청 내역 상태별 조회
    @Select("""
            SELECT lr.*
            FROM leave_request lr
            JOIN shift s
                ON lr.shift_id = s.id
            WHERE lr.user_id = #{user_id}
            AND lr.status = #{status}
            AND EXTRACT(YEAR FROM s.work_date) = #{year}
            AND EXTRACT(MONTH FROM s.work_date) = #{month}
            ORDER BY s.work_date
            """)
    List<LeaveRequestVO> getMyLeaveRequestsByStatus(
            @Param("user_id") String user_id,
            @Param("year") int year,
            @Param("month") int month,
            @Param("status") String status
    );
}
