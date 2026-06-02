package com.dm.backend.mapper;

import com.dm.backend.vo.StoreMemberVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface StoreMemberMapper {

    // 경민 수정 5/29 17:36(and -> ,)
    @Insert("INSERT INTO store_member (id, store_id, user_id, member_role, user_level, approval_status) " +
            "VALUES (#{id}, #{store_id}, #{user_id}, 'STAFF', 'NEWBIE', 'PENDING')")
    void approveRegister(StoreMemberVo storeMemberVo);

    // 경민 수정 5/29 17:36(and -> ,)
    // 직원 등급 변경
//    @Update("update store_member set approval_status = #{approval_status}, member_role = #{member_role}, user_level = #{user_level} where id = #{id}")
//    void updateStoreMember(StoreMemberVo storeMemberVo);

    // 직원 승인 (user_id + store_id 기준)
    @Update("UPDATE store_member SET approval_status = 'APPROVED', member_role = 'STAFF' WHERE user_id = #{user_id} AND store_id = #{store_id}")
    void updateStoreMember(StoreMemberVo storeMemberVo);
}
