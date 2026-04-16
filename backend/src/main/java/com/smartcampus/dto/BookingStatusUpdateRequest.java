package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status;

    private String rejectionReason;
}
