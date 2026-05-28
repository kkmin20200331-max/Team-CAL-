package com.dm.backend.mapper;

import com.dm.backend.vo.SubstituteRequestVO;
import com.dm.backend.vo.SubstituteApplyVO;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface SubstituteMapper {

    @Insert("INSERT INTO SUBSTITUTE_REQUEST (id, shift_id, work_date, start_at, end_at, pay_rate, status, created_at) " +
            "VALUES (#{id}, #{shift_id}, #{work_date}, #{start_at}, #{end_at}, #{pay_rate}, #{status}, CURRENT_TIMESTAMP)")
    void insertRequest(SubstituteRequestVO request);

    @Select("SELECT * FROM SUBSTITUTE_REQUEST WHERE status = 'OPEN' ORDER BY created_at DESC")
    List<SubstituteRequestVO> selectOpenRequests();

    @Select("SELECT * FROM SUBSTITUTE_APPLY WHERE substitute_request_id = #{substitute_request_id} ORDER BY applied_at ASC")
    List<SubstituteApplyVO> selectAppliesByRequestId(@Param("substitute_request_id") String substitute_request_id);

    @Insert("INSERT INTO SUBSTITUTE_APPLY (id, substitute_request_id, applicant_user_id, status, applied_at) " +
            "VALUES (#{id}, #{substitute_request_id}, #{applicant_user_id}, 'APPLIED', CURRENT_TIMESTAMP)")
    void insertApply(SubstituteApplyVO apply);

    @Update("UPDATE SUBSTITUTE_APPLY SET status = #{status} WHERE id = #{id}")
    void updateApplyStatus(@Param("id") String id, @Param("status") String status);

    @Update("UPDATE SUBSTITUTE_REQUEST SET status = #{status} WHERE id = #{id}")
    void updateRequestStatus(@Param("id") String id, @Param("status") String status);
}