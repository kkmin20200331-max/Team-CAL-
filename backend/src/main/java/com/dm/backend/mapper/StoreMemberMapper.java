package com.dm.backend.mapper;

import com.dm.backend.vo.StoreVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface StoreMemberMapper {

    @Insert("insert into store values (#{id}, #{name}, #{address}, #{capacity}, #{open_time}, #{close_time})")
    void registerStore(StoreVo storeVo);

    @Select("select * from store where id = (select store_id from store_member where user_id = #{userId})")
    List<StoreVo> getStoreList(String userId);

    @Select("select * from store where id = #{id}")
    StoreVo getStore(String id);

    @Update("update store set name = #{name} and address = #{address} and capacity = #{capacity} and open_time = #{open_time} and close_time = #{close_time} where id = #{id}")
    void updateStore(StoreVo storeVo);

    @Delete("delete from store where id = #{id}")
    void delStore(String id);
}
