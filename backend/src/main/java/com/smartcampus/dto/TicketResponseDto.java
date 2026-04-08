package com.smartcampus.dto;

import com.smartcampus.model.enums.TicketPriority;
import com.smartcampus.model.enums.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TicketResponseDto {
    private Long id;
    private String location;
    private String category;
    private String description;
    private TicketPriority priority;
    private String preferredContactDetails;
    private TicketStatus status;
    private String rejectionReason;
    private String resolutionNotes;
    private Long reporterUserId;
    private Long assignedStaffId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long attachmentCount;
    private long commentCount;
    private List<TicketAttachmentDto> attachments;
    private List<TicketCommentDto> comments;
}
