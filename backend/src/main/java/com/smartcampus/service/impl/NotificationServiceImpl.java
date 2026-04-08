package com.smartcampus.service.impl;

import com.smartcampus.dto.NotificationResponseDto;
import com.smartcampus.model.entity.Notification;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

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
        createAsyncNotification(userId, type, "Notification", message, null, null);
    }

    @Async
    @Override
    public void createAsyncNotification(Long userId, String type, String title, String message, String relatedEntityType, Long relatedEntityId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    @Override
    public void createBookingDecisionNotification(Long recipientUserId, Long bookingId, boolean approved, String note) {
        String statusWord = approved ? "approved" : "rejected";
        String title = approved ? "Booking Approved" : "Booking Rejected";
        String message = "Your booking #" + bookingId + " was " + statusWord + "."
                + ((note != null && !note.isBlank()) ? " " + note.trim() : "");
        createAsyncNotification(recipientUserId, "BOOKING_" + (approved ? "APPROVED" : "REJECTED"), title, message, "BOOKING", bookingId);
    }

    @Override
    public void createTicketStatusChangeNotification(Long recipientUserId, Long ticketId, String status) {
        String normalized = status == null ? "UPDATED" : status.toUpperCase();
        String prettyStatus = normalized.replace("_", " ");
        createAsyncNotification(
                recipientUserId,
                "TICKET_STATUS_CHANGED",
                "Ticket Status Updated",
                "Your ticket #" + ticketId + " is now " + prettyStatus + ".",
                "TICKET",
                ticketId
        );
    }

    @Override
    public void createTicketCommentNotification(Long recipientUserId, Long ticketId, String commentPreview) {
        String suffix = (commentPreview != null && !commentPreview.isBlank())
                ? " " + commentPreview.trim()
                : "";
        createAsyncNotification(
                recipientUserId,
                "TICKET_NEW_COMMENT",
                "New Comment on Ticket",
                "A new comment was added to ticket #" + ticketId + "." + suffix,
                "TICKET",
                ticketId
        );
    }

    @Override
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<NotificationResponseDto> getUserNotificationsV2(Long userId, String type) {
        List<Notification> rows = (type == null || type.isBlank())
                ? notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                : notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type.trim().toUpperCase());
        return rows.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (notification.getUserId().equals(userId)) {
                notification.setRead(true);
                notificationRepository.save(notification);
            } else {
                throw new IllegalArgumentException("Notification does not belong to this user");
            }
        });
    }

    @Override
    public void markAllAsRead(Long userId) {
        List<Notification> rows = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        rows.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(rows);
    }

    @Override
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    private NotificationResponseDto toDto(Notification notification) {
        return NotificationResponseDto.builder()
                .id(notification.getId())
                .recipientUserId(notification.getUserId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
