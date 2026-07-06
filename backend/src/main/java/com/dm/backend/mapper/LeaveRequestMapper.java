package com.dm.backend.mapper;

import com.dm.backend.vo.LeaveRequestVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface LeaveRequestMapper {

    // =========================
    // 공통
    // =========================

    @Select("""
            SELECT * FROM leave_request
            WHERE id = #{id}
            """)
    LeaveRequestVO getLeaveRequest(String id);

    // =========================
    // 관리자
    // =========================

    @Select("""
            SELECT lr.*
            FROM leave_request lr
            JOIN shift s ON lr.shift_id = s.id
            WHERE s.store_id = #{store_id}
            AND lr.status = 'PENDING'
            ORDER BY lr.requested_at DESC
            """)
    List<LeaveRequestVO> getLeaveRequestList(String store_id);

    @Update("""
            UPDATE leave_request
            SET status = #{status},
                processed_at = SYSTIMESTAMP
            WHERE id = #{id}
            """)
    void updateLeaveStatus(@Param("id") String id,
                           @Param("status") String status);

    @Update("""
            UPDATE shift
            SET status = 'VACANT'
            WHERE id = #{shift_id}
            """)
    void updateShiftStatusVacant(String shift_id);

    @Update("""
            UPDATE shift
            SET status = 'LEAVE_PENDING'
            WHERE id = #{shift_id}
            """)
    void updateShiftStatusLeavePending(String shift_id);

    @Update("""
            UPDATE shift
            SET status = 'SCHEDULED'
            WHERE id = #{shift_id}
            AND status IN ('VACANT', 'LEAVE_PENDING')
            """)
    void rollbackShiftStatusScheduled(String shift_id);

    // =========================
    // 직원
    // =========================

    @Insert("""
            INSERT INTO leave_request
            (id, shift_id, user_id, reason, status)
            VALUES
            (#{id}, #{shift_id}, #{user_id}, #{reason}, 'PENDING')
            """)
    void registerLeaveRequest(LeaveRequestVO leaveRequestVO);

    @Update("""
            UPDATE leave_request
            SET status = 'CANCELLED',
                processed_at = SYSTIMESTAMP
            WHERE id = #{id}
            """)
    void cancelLeaveRequest(String id);

    @Select("""
            SELECT lr.*
            FROM leave_request lr
            JOIN shift s ON lr.shift_id = s.id
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

    @Select("""
            SELECT lr.*
            FROM leave_request lr
            JOIN shift s ON lr.shift_id = s.id
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
    // =========================
    // 선민 수정 (2026-07-06): s.work_date가 시간 정보를 가질 때 범위 조회(특히 단일일자 조회)에서 배제되는 현상을 막기 위해 TRUNC 추가
    // [AI 스케줄용 - 승인된 휴무 조회]
    // =========================
    @Select("""
        SELECT lr.*
        FROM leave_request lr
        JOIN shift s
            ON lr.shift_id = s.id
        WHERE s.store_id = #{store_id}
        AND lr.status = 'APPROVED'
        AND TRUNC(s.work_date) >= TO_DATE(#{start_date}, 'YYYY-MM-DD')
        AND TRUNC(s.work_date) <= TO_DATE(#{end_date}, 'YYYY-MM-DD')
        ORDER BY s.work_date
        """)
    List<LeaveRequestVO> getApprovedLeaveRequestsForPeriod(
            @Param("store_id") String store_id,
            @Param("start_date") String start_date,
            @Param("end_date") String end_date
    );
}