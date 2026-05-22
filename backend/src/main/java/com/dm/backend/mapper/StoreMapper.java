package com.dm.backend.mapper;

import com.dm.backend.vo.StoreVo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface StoreMapper {




    void approveRegister(StoreVo storeVo);
}
