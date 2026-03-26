package com.smartcampus.controller;

import com.smartcampus.dto.FacilityRequestDTO;
import com.smartcampus.dto.FacilityResponseDTO;
import com.smartcampus.model.enums.FacilityType;
import com.smartcampus.service.FacilityService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/facilities")
@CrossOrigin(origins = "*") // Update for production
public class FacilityController {
    
    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Page<FacilityResponseDTO>> getFacilities(
            @RequestParam(name = "location", required = false) String location,
            @RequestParam(name = "type", required = false) FacilityType type,
            @RequestParam(name = "capacity", required = false) Integer capacity,
            Pageable pageable) {
        return ResponseEntity.ok(facilityService.getAllFacilities(location, type, capacity, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<FacilityResponseDTO> getFacility(@PathVariable("id") Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityResponseDTO> createFacility(@Valid @RequestBody FacilityRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facilityService.createFacility(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityResponseDTO> updateFacility(
            @PathVariable("id") Long id, 
            @Valid @RequestBody FacilityRequestDTO dto) {
        return ResponseEntity.ok(facilityService.updateFacility(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFacility(@PathVariable("id") Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(
            @PathVariable("id") Long id, 
            @RequestParam("file") MultipartFile file) {
        String url = facilityService.uploadImage(id, file);
        return ResponseEntity.ok(Map.of(
            "message", "Upload successful", 
            "imageUrl", url
        ));
    }
}
