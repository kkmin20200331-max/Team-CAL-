package com.dm.backend.mapper;

import com.dm.backend.vo.UserVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface UserMapper {

    // 경민 수정 5/29 15:05
    // IN 추가
    @Select("SELECT * FROM users WHERE role = 'staff' and id IN (select user_id from store_member where approval_status = 'APPROVED' and store_id = #{store_id})")
    List<UserVo> getStaff(String store_id);

    // IN 추가
    @Select("select * from users where role = 'guest' and id IN (select user_id from store_member where approval_status = 'PENDING' and store_id = #{storeId})")
    List<UserVo> getGuest(String storeId);

    // 선민 수정 5/28 16:46
    @Insert("insert into users (id, username, password, name, phone, role, status) values (#{id}, #{username}, #{password}, #{name}, #{phone}, #{role}, #{status})")
    void registerUser(UserVo userVo);

    @Update("update users set username = #{username}, password = #{password}, name = #{name}, phone = #{phone} where id = #{id}")
    void approveStaff(UserVo userVo);

    @Delete("delete from users where id = #{id}")
    void delUser(String id);

    @Select("SELECT * FROM users WHERE username = #{username} AND password = #{password}")
    UserVo login(UserVo userVo);

    // 경민 수정 5/29 15:05
    @Update("UPDATE users SET role = 'STAFF' WHERE id = #{id}")
    void approveUser(String id);
}
