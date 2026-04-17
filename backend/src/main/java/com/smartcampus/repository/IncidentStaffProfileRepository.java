package com.smartcampus.repository;

import com.smartcampus.model.entity.IncidentStaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IncidentStaffProfileRepository extends JpaRepository<IncidentStaffProfile, Long> {
    Optional<IncidentStaffProfile> findByUserId(Long userId);
}
