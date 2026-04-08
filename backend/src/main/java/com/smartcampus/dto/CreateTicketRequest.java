package com.smartcampus.dto;

import com.smartcampus.model.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequest {
    @NotBlank
    @Size(max = 200)
    private String location;

    @NotBlank
    @Size(max = 100)
    private String category;

    @NotBlank
    @Size(max = 3000)
    private String description;

    @NotNull
    private TicketPriority priority;

    @NotBlank
    @Size(max = 255)
    private String preferredContactDetails;

    @NotNull
    private Long reporterUserId;
}
