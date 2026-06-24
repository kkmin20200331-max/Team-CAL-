package com.dm.backend.mapper;

import com.dm.backend.vo.UserVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface UserMapper {

    // =========================
    // [공통]
    // =========================

    // 중복 체크용 카운트
    @Select("SELECT COUNT(*) FROM users WHERE username = #{username}")
    int countByUsername(String username);

    // 중복 체크용 카운트
    @Select("SELECT COUNT(*) FROM users WHERE name = #{name}")
    int countByName(String name);

    @Select("SELECT COUNT(*) FROM users WHERE phone = #{phone}")
    int countByPhone(String phone);

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

    // 승인된 직원 목록 조회
    @Select("SELECT * FROM users WHERE role = 'STAFF' and id IN (select user_id from store_member where approval_status = 'APPROVED' and store_id = #{store_id})")
    List<UserVo> getStaff(String store_id);

    // 승인 대기 직원 목록 조회
    @Select("select * from users where id IN (select user_id from store_member where approval_status = 'PENDING' and store_id = #{storeId})")
    List<UserVo> getPendingStaff(String storeId);

    // 직원 승인
    @Update("UPDATE users SET role = 'STAFF' WHERE id = #{id}")
    void approveUser(String id);

    // 프로필 이미지 URL 업데이트
    @Update("UPDATE users SET profile_image = #{profile_image} WHERE id = #{id}")
    void updateProfileImage(@Param("id") String id, @Param("profile_image") String profileImage);

    // 계정 상태 변경
    @Update("UPDATE users SET status = #{status} WHERE id = #{id}")
    void updateUserStatus(@Param("id") String id, @Param("status") String status);
}
