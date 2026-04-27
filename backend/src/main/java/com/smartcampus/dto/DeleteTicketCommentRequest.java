package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeleteTicketCommentRequest {
    @NotNull
    private Long actorUserId;

    @NotBlank
    @Size(max = 100)
    private String actorRole;
}
