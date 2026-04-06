package com.smartcampus.service.impl;

import com.smartcampus.model.entity.Notification;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * @Async processes this method in a separate background thread!
     * This improves system performance by unblocking the main web request thread.
     */
    @Async
    @Override
    public void createAsyncNotification(Long userId, String message, String type) {
        try {
            // Simulate a heavy operation (e.g. sending APNS/FCM push or email)
            Thread.sleep(500);
            
            Notification notification = Notification.builder()
                    .userId(userId)
                    .message(message)
                    .type(type)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
            
            System.out.println("✅ ASYNC: Notification saved for user " + userId + " - " + message);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Override
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Override
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}
