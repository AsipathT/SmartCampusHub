package com.smartcampus.dto;

import com.smartcampus.model.enums.TicketPriority;
import com.smartcampus.model.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
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

    @Size(max = 120)
    private String contactName;

    @Size(max = 40)
    private String contactNumber;

    private Double pinLatitude;

    private Double pinLongitude;

    private TicketStatus status;

    @NotNull
    private Long actorUserId;

    @Size(max = 30)
    private String actorRole;

    @Size(max = 1000)
    private String rejectionReason;

    @Size(max = 3000)
    private String resolutionNotes;
}
