package com.smartcampus.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IncidentAssigneeOptionDto {
    private Long userId;
    private String fullName;
    private Integer age;
    private String qualification;
    private Integer yearsOfExperience;
    private String specialistSkills;
    private String contactNumber;
    private String supportedCategories;
}
