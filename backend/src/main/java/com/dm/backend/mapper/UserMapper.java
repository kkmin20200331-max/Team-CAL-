package com.dm.backend.mapper;

import com.dm.backend.vo.UserVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface UserMapper {

    // =========================
    // [공통]
    // =========================

    // 회원가입
    @Insert("insert into users (id, username, password, name, phone, role, status) values (#{id}, #{username}, #{password}, #{name}, #{phone}, #{role}, #{status})")
    void registerUser(UserVo userVo);

    // 로그인
    @Select("SELECT * FROM users WHERE username = #{username} AND password = #{password}")
    UserVo login(UserVo userVo);

    // 개인정보 수정
    @Update("update users set username = #{username}, password = #{password}, name = #{name}, phone = #{phone} where id = #{id}")
    void approveStaff(UserVo userVo);

    // 회원 삭제
    @Delete("delete from users where id = #{id}")
    void delUser(String id);


    // =========================
    // [관리자]
    // =========================

    // 경민 수정 5/29 15:05 - 승인된 직원 목록 조회 (대문자 STAFF)
    @Select("SELECT * FROM users WHERE role = 'STAFF' and id IN (select user_id from store_member where approval_status = 'APPROVED' and store_id = #{store_id})")
    List<UserVo> getStaff(String store_id);

    // 승인 대기 직원 목록 조회 (대문자 GUEST)
    @Select("select * from users where role = 'GUEST' and id IN (select user_id from store_member where approval_status = 'PENDING' and store_id = #{storeId})")
    List<UserVo> getGuest(String storeId);

    // 직원 승인 (GUEST → STAFF)
    @Update("UPDATE users SET role = 'STAFF' WHERE id = #{id}")
    void approveUser(String id);

}
