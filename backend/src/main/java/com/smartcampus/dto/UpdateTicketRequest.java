package com.smartcampus.dto;

import com.smartcampus.model.enums.TicketPriority;
import com.smartcampus.model.enums.TicketStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTicketRequest {
    @Size(max = 200)
    private String location;

    @Size(max = 100)
    private String category;

    @Size(max = 3000)
    private String description;

    private TicketPriority priority;

    @Size(max = 255)
    private String preferredContactDetails;

    private TicketStatus status;

    @Size(max = 1000)
    private String rejectionReason;

    @Size(max = 3000)
    private String resolutionNotes;
}
