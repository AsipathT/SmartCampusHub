package com.smartcampus.dto;

import com.smartcampus.model.enums.ResourceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDto {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotBlank(message = "Type name is required")
    private String type; // Using type name to map

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Capacity is required")
    private Integer capacity;

    private ResourceStatus status;
    
    private String imageUrl;

    @NotBlank(message = "Start time is required")
    private String availableFrom;

    @NotBlank(message = "End time is required")
    private String availableTo;
}
