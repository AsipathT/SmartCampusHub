package com.smartcampus.service;

import com.smartcampus.dto.FacilityRequestDTO;
import com.smartcampus.dto.FacilityResponseDTO;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.entity.Facility;
import com.smartcampus.model.enums.FacilityType;
import com.smartcampus.repository.FacilityRepository;
import com.smartcampus.repository.FacilitySpecifications;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;

@Service
@Transactional
public class FacilityServiceImpl implements FacilityService {

    private final FacilityRepository repository;

    public FacilityServiceImpl(FacilityRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FacilityResponseDTO> getAllFacilities(String location, FacilityType type, Integer capacity, Pageable pageable) {
        Page<Facility> facilities = repository.findAll(FacilitySpecifications.withFilters(location, type, capacity), pageable);
        return facilities.map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityResponseDTO getFacilityById(Long id) {
        Facility facility = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with ID: " + id));
        return mapToDTO(facility);
    }

    @Override
    public FacilityResponseDTO createFacility(FacilityRequestDTO dto) {
        validateAvailabilityTimes(dto.getAvailableFrom(), dto.getAvailableTo());
        Facility facility = new Facility();
        BeanUtils.copyProperties(dto, facility);
        Facility saved = repository.save(facility);
        return mapToDTO(saved);
    }

    @Override
    public FacilityResponseDTO updateFacility(Long id, FacilityRequestDTO dto) {
        Facility facility = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with ID: " + id));
        validateAvailabilityTimes(dto.getAvailableFrom(), dto.getAvailableTo());
        BeanUtils.copyProperties(dto, facility, "id", "isDeleted", "createdAt", "imageUrl");
        return mapToDTO(repository.save(facility));
    }

    @Override
    public void deleteFacility(Long id) {
        Facility facility = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with ID: " + id));
        facility.setDeleted(true);
        repository.save(facility);
    }

    @Override
    public String uploadImage(Long id, MultipartFile file) {
        Facility facility = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with ID: " + id));
        // Demonstrating logic. In production this pushes to AWS S3/Azure Blob.
        String dummyUrl = "/uploads/facilities/" + file.getOriginalFilename();
        facility.setImageUrl(dummyUrl);
        repository.save(facility);
        return dummyUrl;
    }

    private void validateAvailabilityTimes(LocalTime from, LocalTime to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("availableFrom time must be before availableTo time");
        }
    }

    private FacilityResponseDTO mapToDTO(Facility facility) {
        FacilityResponseDTO dto = new FacilityResponseDTO();
        BeanUtils.copyProperties(facility, dto);
        return dto;
    }
}
