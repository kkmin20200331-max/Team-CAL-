package com.dm.backend.mapper;

import com.dm.backend.vo.StoreMemberVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface StoreMemberMapper {

    // =========================
    // [공통]
    // =========================

    // 급여 기준 조회
    @Select("""
            SELECT pay_type, pay_amount
            FROM store_member
            WHERE user_id = #{user_id}
            AND store_id = #{store_id}
            """)
    StoreMemberVo getPayInfo(
            @Param("user_id") String user_id,
            @Param("store_id") String store_id
    );


    // =========================
    // [직원]
    // =========================

    // 매장 근무 신청
    @Insert("""
            insert into store_member
            values (
                #{id},
                #{store_id},
                #{user_id},
                #{member_role},
                #{user_level},
                #{approval_status},
                #{pay_type},
                #{pay_amount}
            )
            """)
    void approveRegister(StoreMemberVo storeMemberVo);

    // 신청 여부 확인
    @Select("""
            SELECT COUNT(*)
            FROM store_member
            WHERE store_id = #{store_id}
            AND user_id = #{user_id}
            AND approval_status IN ('PENDING','APPROVED')
            """)
    int existsMember(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id
    );


    // =========================
    // [관리자]
    // =========================

    // 경민 수정 5/29 17:36 - 직원 승인 (user_id + store_id 기준으로 APPROVED 처리)
    @Update("UPDATE store_member SET approval_status = 'APPROVED', member_role = 'STAFF' WHERE user_id = #{user_id} AND store_id = #{store_id}")
    void updateStoreMember(StoreMemberVo storeMemberVo);

    // 직원 삭제 / 매장 직원 제거
    @Delete("delete from store_member where store_id = #{store_id} and user_id = #{user_id}")
    void deleteStoreMember(
            @Param("store_id") String store_id,
            @Param("user_id") String user_id
    );

    //ai분석에 필요한 매장 직원 정보 조회
    @Select("""
            SELECT * FROM store_member
            WHERE store_id = #{store_id}
            """)
    List<StoreMemberVo> getStoreMembers(String storeId);
}
