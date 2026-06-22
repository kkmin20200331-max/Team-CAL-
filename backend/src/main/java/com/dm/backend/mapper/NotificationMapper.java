package com.dm.backend.mapper;

import com.dm.backend.vo.NotificationVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface NotificationMapper {

    @Insert("""
        INSERT INTO NOTIFICATION (ID, USER_ID, STORE_ID, TYPE, TITLE, CONTENT, REF_ID, IS_READ, CREATED_AT)
        VALUES (#{id}, #{user_id}, #{store_id}, #{type}, #{title}, #{content}, #{ref_id}, 'N', CURRENT_TIMESTAMP)
    """)
    void createNotification(NotificationVO vo);

    @Select("""
        SELECT * FROM NOTIFICATION
        WHERE USER_ID = #{user_id}
        ORDER BY CREATED_AT DESC
        FETCH FIRST 50 ROWS ONLY
    """)
    List<NotificationVO> getNotifications(String user_id);

    @Update("""
        UPDATE NOTIFICATION SET IS_READ = 'Y' WHERE ID = #{id}
    """)
    void markAsRead(String id);

    @Update("""
        UPDATE NOTIFICATION SET IS_READ = 'Y' WHERE USER_ID = #{user_id}
    """)
    void markAllAsRead(String user_id);

    @Select("""
        SELECT COUNT(*) FROM NOTIFICATION WHERE USER_ID = #{user_id} AND IS_READ = 'N'
    """)
    int countUnread(String user_id);
}
