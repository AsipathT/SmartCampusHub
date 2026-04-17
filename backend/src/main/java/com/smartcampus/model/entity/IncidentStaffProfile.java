package com.smartcampus.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "incident_staff_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentStaffProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false, length = 255)
    private String qualification;

    @Column(nullable = false)
    private Integer yearsOfExperience;

    @Column(nullable = false, length = 600)
    private String specialistSkills;

    @Column(nullable = false, length = 40)
    private String contactNumber;

    @Column(nullable = false, length = 600)
    private String supportedCategories;
}
