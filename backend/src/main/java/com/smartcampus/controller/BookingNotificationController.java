package com.smartcampus.controller;

import com.smartcampus.model.entity.Notification;
import com.smartcampus.service.BookingNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/booking-notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BookingNotificationController {

    private final BookingNotificationService bookingNotificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserBookingNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingNotificationService.getBookingNotifications(userId));
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingNotificationService.getUnreadBookingCount(userId));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId) {
        bookingNotificationService.markBookingNotificationAsRead(notificationId);
        return ResponseEntity.ok().build();
    }
}
