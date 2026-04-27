package com.smartcampus.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponseDto {
    private Long id;
    private Long recipientUserId;
    private String type;
    private String title;
    private String message;
    private String relatedEntityType;
    private Long relatedEntityId;
    private boolean read;
    private LocalDateTime createdAt;
}
