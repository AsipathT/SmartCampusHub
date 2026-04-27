package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddTicketCommentRequest {
    @NotNull
    private Long authorUserId;

    @NotBlank
    @Size(max = 100)
    private String authorRole;

    @NotBlank
    @Size(max = 2000)
    private String content;
}
