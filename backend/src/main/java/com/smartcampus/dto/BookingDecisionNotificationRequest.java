package com.smartcampus.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BookingDecisionNotificationRequest {
    @NotNull
    private Long recipientUserId;

    @NotNull
    private Long bookingId;

    @NotNull
    private Boolean approved;

    @Size(max = 500)
    private String note;
}
