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
    @Update("update store_member set approval_status = #{approval_status}, member_role = #{member_role}, user_level = #{user_level} where id = #{id}")
    void updateStoreMember(StoreMemberVo storeMemberVo);
}
