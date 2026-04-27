package com.smartcampus.controller;

import com.smartcampus.dto.BookingDecisionNotificationRequest;
import com.smartcampus.dto.NotificationResponseDto;
import com.smartcampus.model.entity.Notification;
import com.smartcampus.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponseDto>> getNotifications(
            @RequestParam Long userId,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(notificationService.getUserNotificationsV2(userId, type));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long notificationId,
            @RequestParam(required = false) Long userId) {
        if (userId == null) {
            notificationService.markAsRead(notificationId);
        } else {
            notificationService.markAsRead(notificationId, userId);
        }
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Small safe integration point for Module B booking decisions.
     * Module B can call this endpoint after approve/reject without refactoring its logic.
     */
    @PostMapping("/booking-decision")
    public ResponseEntity<Void> createBookingDecisionNotification(
            @Valid @RequestBody BookingDecisionNotificationRequest request) {
        notificationService.createBookingDecisionNotification(
                request.getRecipientUserId(),
                request.getBookingId(),
                request.getApproved(),
                request.getNote()
        );
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
