package com.smartcampus.service;

import com.smartcampus.dto.FacilityRequestDTO;
import com.smartcampus.dto.FacilityResponseDTO;
import com.smartcampus.model.enums.FacilityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface FacilityService {
    Page<FacilityResponseDTO> getAllFacilities(String location, FacilityType type, Integer capacity, Pageable pageable);
    FacilityResponseDTO getFacilityById(Long id);
    FacilityResponseDTO createFacility(FacilityRequestDTO dto);
    FacilityResponseDTO updateFacility(Long id, FacilityRequestDTO dto);
    void deleteFacility(Long id);
    String uploadImage(Long id, MultipartFile file);
}
