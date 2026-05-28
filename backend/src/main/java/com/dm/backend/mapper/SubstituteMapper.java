package com.dm.backend.mapper;

import com.dm.backend.vo.SubstituteApplicationVO;
import com.dm.backend.vo.SubstituteHistoryVO;
import com.dm.backend.vo.SubstitutePostVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface SubstituteMapper {

    @Insert("""
                insert into substitute_post
                values(
                    #{id},
                    #{shift_id},
                    #{store_id},
                    #{requester_user_id},
                    #{reason},
                    #{status},
                    #{created_at},
                    #{closed_at}
                )
            """)
    void createPost(SubstitutePostVO postVO);

    @Select("""
                select *
                from substitute_post
                where store_id = #{store_id}
                order by created_at desc
            """)
    List<SubstitutePostVO> getPostList(String store_id);

    @Insert("""
                insert into substitute_application
                values(
                    #{id},
                    #{substitute_post_id},
                    #{applicant_user_id},
                    #{message},
                    #{status},
                    #{applied_at}
                )
            """)
    void apply(SubstituteApplicationVO applicationVO);

    @Select("""
                select *
                from substitute_application
                where substitute_post_id = #{postId}
            """)
    List<SubstituteApplicationVO> getApplicationList(String post_id);

    @Update("""
                update shift
                set status = #{status}
                where id = #{shift_id}
            """)
    void updateShiftStatus(
            @Param("shiftId") String shift_id,
            @Param("status") String status
    );

    @Update("""
                update shift
                set user_id = #{user_id}
                where id = #{shift_id}
            """)
    void updateShiftUser(
            @Param("shift_id") String shift_id,
            @Param("user_id") String user_id
    );

    @Insert("""
                insert into substitute_history
                values(
                    #{id},
                    #{shift_id},
                    #{store_id},
                    #{original_user_id},
                    #{substitute_user_id},
                    #{approved_by},
                    #{approved_at}
                )
            """)
    void insertHistory(SubstituteHistoryVO historyVO);

    @Update("""
                update substitute_application
                set status = 'CANCELLED'
                where id = #{id}
            """)
    void cancelApplication(String id);

    @Select("""
                select *
                from substitute_application
                where applicant_user_id = #{user_id}
                order by applied_at desc
            """)
    List<SubstituteApplicationVO> getMyApplications(String user_id);

    // 모집글에 연결된 shift 조회
    @Select("""
        select shift_id
        from substitute_post
        where id = #{post_id}
    """)
    String getShiftIdByPostId(
            String post_id
    );

    // 모집글 취소
    @Update("""
        update substitute_post
        set status = 'CANCELLED',
            closed_at = systimestamp
        where id = #{post_id}
    """)
    void cancelPost(
            String post_id
    );


}