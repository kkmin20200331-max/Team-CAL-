package com.dm.backend.mapper;

import com.dm.backend.vo.StoreVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface StoreMapper {

    @Insert("insert into store values(#{id}, #{name}, #{address}, #{capacity}, #{open_time}, #{close_time})")
    void registerStore(StoreVo storeVo);


    // 경민 수정 5/29 15:00
    // store_member JOIN으로 해당 관리자의 매장만 조회
    @Select("SELECT s.* FROM store s " +
            "JOIN store_member sm ON s.id = sm.store_id " +
            "WHERE sm.user_id = #{user_id} AND sm.member_role = 'ADMIN'")
    List<StoreVo> getStoreList(String user_id);
    @Select("select * from store where id = #{id}")
    StoreVo getStore(String id);

//    @Select("select * from store where user_id = #{user_id}")
//    List<StoreVo> getStoreList(String user_id);

    @Update("update store set name = #{name} and address = #{address} and capacity = #{capacity} and open_time = #{open_time} and close_time = #{close_time} where id = #{id}")
    void updateStore(StoreVo storeVo);

    @Delete("delete from store where id = #{id}")
    void delStore(String id);

    // 경민 수정 5/29 18:00
    @Select("SELECT * FROM store")
    List<StoreVo> getAllStores();

    // 경민 추가 6/2 15:38
    // 직원 소속 매장 조회
    @Select("SELECT s.* FROM store s JOIN store_member sm ON s.id = sm.store_id WHERE sm.user_id = #{user_id} AND sm.approval_status = 'APPROVED'")
    StoreVo getStoreByUserId(String user_id);

}
