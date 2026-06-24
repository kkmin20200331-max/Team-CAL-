package com.dm.backend.mapper;

import com.dm.backend.vo.AdminApplicationVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface AdminApplicationMapper {

    // =========================
    // 관리자 가입 신청 등록
    // =========================
    @Insert("""
        INSERT INTO admin_application (
            id,
            user_id,
            store_name,
            store_address,
            store_type,
            capacity,
            open_time,
            close_time,
            business_number,
            status
        )
        VALUES (
            #{id},
            #{user_id},
            #{store_name},
            #{store_address},
            #{store_type},
            #{capacity},
            #{open_time},
            #{close_time},
            #{business_number},
            NVL(#{status}, 'PENDING')
        )
    """)
    void insertApplication(AdminApplicationVo application);

    // =========================
    // 관리자 가입 신청 목록 조회
    // =========================
    @Select("""
        SELECT
            aa.*,
            u.name AS user_name,
            u.username AS username,
            u.phone AS phone
        FROM admin_application aa
        JOIN users u
          ON u.id = aa.user_id
        WHERE aa.status = #{status}
        ORDER BY aa.created_at DESC
    """)
    List<AdminApplicationVo> getApplicationsByStatus(String status);

    // =========================
    // 관리자 가입 신청 단건 조회
    // =========================
    @Select("""
        SELECT *
        FROM admin_application
        WHERE id = #{id}
    """)
    AdminApplicationVo getApplicationById(String id);

    // =========================
    // 관리자 가입 신청 승인 처리
    // =========================
    @Update("""
        UPDATE admin_application
        SET
            status = 'APPROVED',
            reviewed_at = SYSTIMESTAMP,
            reviewed_by = #{reviewed_by}
        WHERE id = #{id}
    """)
    void approveApplication(
            @Param("id") String id,
            @Param("reviewed_by") String reviewedBy
    );

    // =========================
    // 관리자 가입 신청 거절 처리
    // =========================
    @Update("""
        UPDATE admin_application
        SET
            status = 'REJECTED',
            reject_reason = #{reject_reason},
            reviewed_at = SYSTIMESTAMP,
            reviewed_by = #{reviewed_by}
        WHERE id = #{id}
    """)
    void rejectApplication(
            @Param("id") String id,
            @Param("reject_reason") String rejectReason,
            @Param("reviewed_by") String reviewedBy
    );
}
