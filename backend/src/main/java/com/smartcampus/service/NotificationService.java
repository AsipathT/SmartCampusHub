package com.smartcampus.service;

import com.smartcampus.dto.NotificationResponseDto;
import com.smartcampus.model.entity.Notification;
import java.util.List;

public interface NotificationService {
    void createAsyncNotification(Long userId, String message, String type);
    void createAsyncNotification(Long userId, String type, String title, String message, String relatedEntityType, Long relatedEntityId);
    void createBookingDecisionNotification(Long recipientUserId, Long bookingId, boolean approved, String note);
    void createTicketStatusChangeNotification(Long recipientUserId, Long ticketId, String status);
    void createTicketCommentNotification(Long recipientUserId, Long ticketId, String commentPreview);
    List<Notification> getUserNotifications(Long userId);
    List<NotificationResponseDto> getUserNotificationsV2(Long userId, String type);
    void markAsRead(Long notificationId);
    void markAsRead(Long notificationId, Long userId);
    void markAllAsRead(Long userId);
    Long getUnreadCount(Long userId);
}
