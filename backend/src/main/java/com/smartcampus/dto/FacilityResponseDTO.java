package com.smartcampus.dto;

import com.smartcampus.model.enums.FacilityStatus;
import com.smartcampus.model.enums.FacilityType;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class FacilityResponseDTO {
    private Long id;
    private String name;
    private String description;
    private FacilityType type;
    private String location;
    private Integer capacity;
    private FacilityStatus status;
    private String imageUrl;
    private LocalTime availableFrom;
    private LocalTime availableTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
