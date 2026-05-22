package com.dm.backend.mapper;

import com.dm.backend.vo.StoreMemberVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface StoreMemberMapper {


    @Insert("insert into store_member values (#{id}, #{store_id}, #{user_id},'guest','NEWBIE', 'pending')")
    void approveRegister(StoreMemberVo storeMemberVo);

    @Update("update store_member set approval_status = #{approval_status} and member_role = #{member_role} and user_level = #{user_level} where id = #{id}")
    void updateStoreMember(StoreMemberVo storeMemberVo);
}
