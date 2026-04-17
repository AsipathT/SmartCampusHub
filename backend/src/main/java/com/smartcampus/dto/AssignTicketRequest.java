package com.smartcampus.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AssignTicketRequest {
    @NotNull
    private Long assignedStaffId;

    @NotNull
    private Long actorUserId;

    @NotNull
    @Size(min = 2, max = 40)
    private String actorRole;
}
