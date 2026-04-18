package com.smartcampus.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeleteTicketRequest {
    @NotNull
    private Long actorUserId;
}
