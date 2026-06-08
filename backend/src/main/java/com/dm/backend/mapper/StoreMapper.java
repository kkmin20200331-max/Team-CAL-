package com.dm.backend.mapper;

import com.dm.backend.vo.StoreVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface StoreMapper {

    // =========================
    // [관리자]
    // =========================

    // 가게 등록
    @Insert("insert into store values(#{id}, #{name}, #{address}, #{capacity}, #{open_time}, #{close_time})")
    void registerStore(StoreVo storeVo);

    // 내가 관리하는 가게 목록 조회
    @Select("""
        SELECT s.*
        FROM store s
        JOIN store_member sm
            ON s.id = sm.store_id
        WHERE sm.user_id = #{user_id}
        AND sm.member_role = 'ADMIN'
        """)
    List<StoreVo> getStoreList(String user_id);

    // 가게 정보 수정
    @Update("update store set name = #{name}, address = #{address}, capacity = #{capacity}, open_time = #{open_time}, close_time = #{close_time} where id = #{id}")
    void updateStore(StoreVo storeVo);

    // 가게 삭제
    @Delete("delete from store where id = #{id}")
    void delStore(String id);


    // =========================
    // [공통]
    // =========================

    // 가게 단건 조회
    @Select("select * from store where id = #{id}")
    StoreVo getStore(String id);

    // 경민 수정 5/29 18:00 - 전체 매장 조회
    @Select("SELECT * FROM store")
    List<StoreVo> getAllStores();

    // 경민 추가 6/2 15:38 - 직원 소속 매장 조회
    @Select("SELECT s.* FROM store s JOIN store_member sm ON s.id = sm.store_id WHERE sm.user_id = #{user_id} AND sm.approval_status = 'APPROVED'")
    StoreVo getStoreByUserId(String user_id);
}
