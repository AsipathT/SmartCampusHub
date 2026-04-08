package com.smartcampus.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TicketAttachmentDto {
    private Long id;
    private String originalFileName;
    private String contentType;
    private Long fileSizeBytes;
    private String fileUrl;
}
