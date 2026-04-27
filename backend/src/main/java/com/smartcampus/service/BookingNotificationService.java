package com.smartcampus.service;

import com.smartcampus.model.entity.Notification;
import com.smartcampus.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingNotificationService {

    private final NotificationRepository notificationRepository;

    private static final List<String> BOOKING_TYPES = List.of(
            "BOOKING_CREATED",
            "BOOKING_APPROVED",
            "BOOKING_REJECTED",
            "BOOKING_CANCELLED"
    );

    public void createBookingNotification(Long userId, String message, String type) {
        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        System.out.println("✅ Booking notification saved for user " + userId + " | " + type);
    }

    public List<Notification> getBookingNotifications(Long userId) {
        return notificationRepository.findByUserIdAndTypeInOrderByCreatedAtDesc(userId, BOOKING_TYPES);
    }

    public Long getUnreadBookingCount(Long userId) {
        return notificationRepository.countByUserIdAndTypeInAndIsReadFalse(userId, BOOKING_TYPES);
    }

    public void markBookingNotificationAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }
}