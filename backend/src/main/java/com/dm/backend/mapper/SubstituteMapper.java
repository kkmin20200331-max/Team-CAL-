package com.dm.backend.mapper;

import com.dm.backend.vo.SubstituteApplicationVO;
import com.dm.backend.vo.SubstituteHistoryVO;
import com.dm.backend.vo.SubstitutePostVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface SubstituteMapper {

    // =========================
    // [공통]
    // =========================

    // 모집글 목록 조회
    @Select("""
            SELECT *
            FROM substitute_post
            WHERE store_id = #{store_id}
            ORDER BY created_at DESC
            """)
    List<SubstitutePostVO> getPostList(String store_id);


    // =========================
    // [관리자]
    // =========================

    // 특정 모집글 지원자 목록 조회
    @Select("""
            SELECT *
            FROM substitute_application
            WHERE substitute_post_id = #{post_id}
            ORDER BY applied_at
            """)
    List<SubstituteApplicationVO> getApplicationList(
            String post_id
    );

    // 근무자 변경
    @Update("""
            UPDATE shift
            SET user_id = #{user_id}
            WHERE id = #{shift_id}
            """)
    void updateShiftUser(
            @Param("shift_id") String shift_id,
            @Param("user_id") String user_id
    );

    // 근무 상태 변경
    @Update("""
            UPDATE shift
            SET status = #{status}
            WHERE id = #{shift_id}
            """)
    void updateShiftStatus(
            @Param("shift_id") String shift_id,
            @Param("status") String status
    );

    // 대타 승인 이력 저장
    @Insert("""
            INSERT INTO substitute_history
            VALUES (
                #{id},
                #{shift_id},
                #{store_id},
                #{original_user_id},
                #{substitute_user_id},
                #{approved_by},
                #{approved_at}
            )
            """)
    void insertHistory(SubstituteHistoryVO historyVO);

    // 모집글 취소
    @Update("""
            UPDATE substitute_post
            SET status = 'CANCELLED',
                closed_at = SYSTIMESTAMP
            WHERE id = #{post_id}
            """)
    void cancelPost(String post_id);

    // 모집글에 연결된 shift 조회
    @Select("""
            SELECT shift_id
            FROM substitute_post
            WHERE id = #{post_id}
            """)
    String getShiftIdByPostId(String post_id);


    // =========================
    // [직원]
    // =========================

    // 모집글 생성
    @Insert("""
            INSERT INTO substitute_post
            VALUES(
                #{id},
                #{shift_id},
                #{store_id},
                #{requester_user_id},
                #{reason},
                #{status},
                #{created_at},
                #{closed_at}
            )
            """)
    void createPost(SubstitutePostVO postVO);

    // 대타 지원
    @Insert("""
            INSERT INTO substitute_application
            VALUES(
                #{id},
                #{substitute_post_id},
                #{applicant_user_id},
                #{message},
                #{status},
                #{applied_at}
            )
            """)
    void apply(SubstituteApplicationVO applicationVO);

    // 지원 단건 조회
    @Select("""
            SELECT *
            FROM substitute_application
            WHERE id = #{id}
            """)
    SubstituteApplicationVO getApplication(String id);

    // 지원 취소
    @Update("""
            UPDATE substitute_application
            SET status = 'CANCELLED'
            WHERE id = #{id}
            """)
    void cancelApplication(String id);

    // 내 지원 내역 조회
    @Select("""
            SELECT *
            FROM substitute_application
            WHERE applicant_user_id = #{user_id}
            ORDER BY applied_at DESC
            """)
    List<SubstituteApplicationVO> getMyApplications(
            @Param("user_id") String user_id
    );

    // 내 지원내역 상태별 조회
    @Select("""
            SELECT *
            FROM substitute_application
            WHERE applicant_user_id = #{user_id}
            AND status = #{status}
            ORDER BY applied_at DESC
            """)
    List<SubstituteApplicationVO> getMyApplicationsByStatus(
            @Param("user_id") String user_id,
            @Param("status") String status
    );

    // 내가 작성한 모집글 조회
    @Select("""
            SELECT *
            FROM substitute_post
            WHERE requester_user_id = #{user_id}
            ORDER BY created_at DESC
            """)
    List<SubstitutePostVO> getMyPosts(
            @Param("user_id") String user_id
    );

    // 내가 작성한 모집글 상태별 조회
    @Select("""
            SELECT *
            FROM substitute_post
            WHERE requester_user_id = #{user_id}
            AND status = #{status}
            ORDER BY created_at DESC
            """)
    List<SubstitutePostVO> getMyPostsByStatus(
            @Param("user_id") String user_id,
            @Param("status") String status
    );
}