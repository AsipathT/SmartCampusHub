package com.smartcampus.service;

import com.smartcampus.model.entity.Notification;
import java.util.List;

public interface NotificationService {
    void createAsyncNotification(Long userId, String message, String type);
    List<Notification> getUserNotifications(Long userId);
    void markAsRead(Long notificationId);
    Long getUnreadCount(Long userId);
}
