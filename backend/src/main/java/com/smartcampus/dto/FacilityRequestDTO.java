package com.smartcampus.dto;

import com.smartcampus.model.enums.FacilityStatus;
import com.smartcampus.model.enums.FacilityType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalTime;

@Data
public class FacilityRequestDTO {
    @NotBlank(message = "Facility name is required")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    private String name;

    private String description;

    @NotNull(message = "Facility type is required")
    private FacilityType type;

    @NotBlank(message = "Location cannot be blank")
    private String location;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotNull(message = "Status is required")
    private FacilityStatus status;

    @NotNull(message = "Starting availability time is required")
    private LocalTime availableFrom;

    @NotNull(message = "Ending availability time is required")
    private LocalTime availableTo;
}
