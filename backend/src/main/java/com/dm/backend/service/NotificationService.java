package com.dm.backend.service;

import com.dm.backend.mapper.NotificationMapper;
import com.dm.backend.vo.NotificationVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationMapper notificationMapper;

    public void createNotification(NotificationVO vo) {
        notificationMapper.createNotification(vo);
    }

    public List<NotificationVO> getNotifications(String user_id) {
        return notificationMapper.getNotifications(user_id);
    }

    public void markAsRead(String id) {
        notificationMapper.markAsRead(id);
    }

    public void markAllAsRead(String user_id) {
        notificationMapper.markAllAsRead(user_id);
    }

    public int countUnread(String user_id) {
        return notificationMapper.countUnread(user_id);
    }
}
