package com.dm.backend.controller;

import com.dm.backend.service.NotificationService;
import com.dm.backend.vo.NotificationVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notification")
public class NotificationC {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public List<NotificationVO> getNotifications(@RequestParam String user_id) {
        return notificationService.getNotifications(user_id);
    }

    @PostMapping
    public void createNotification(@RequestBody NotificationVO vo) {
        notificationService.createNotification(vo);
    }

    @PutMapping("/read")
    public void markAsRead(@RequestParam String id) {
        notificationService.markAsRead(id);
    }

    @PutMapping("/read-all")
    public void markAllAsRead(@RequestParam String user_id) {
        notificationService.markAllAsRead(user_id);
    }

    @GetMapping("/unread-count")
    public Map<String, Integer> countUnread(@RequestParam String user_id) {
        return Map.of("count", notificationService.countUnread(user_id));
    }
}
