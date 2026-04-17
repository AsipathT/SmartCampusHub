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

    /**
     * Priority chosen by the reporting user. Required by the PAF assignment
     * specification (Module C: "Users can create incident tickets ... with
     * category, description, priority, and preferred contact details").
     */
    @NotNull
    private TicketPriority priority;

    @NotBlank
    @Size(max = 120)
    private String contactName;

    @NotBlank
    @Size(max = 40)
    private String contactNumber;

    @NotNull
    private Double pinLatitude;

    @NotNull
    private Double pinLongitude;

    @NotNull
    private Long reporterUserId;
}
