package com.dm.backend.mapper;

import com.dm.backend.vo.UserVo;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM users WHERE role = 'staff' and id = (select user_id from store_member where approval_status = 'APPROVED' and store_id = #{store_id})")
    List<UserVo> getStaff(String store_id);

     @Select("select * from users where role = 'guest' and id = (select user_id from store_member where approval_status = 'PENDING' and store_id = #{storeId})")
    List<UserVo> getGuest(String storeId);

     @Insert("insert into users  values (#{id}, #{username}, #{password}, #{name}, #{phone}, #{role}, #{status})")
    void registerUser(UserVo userVo);
}
