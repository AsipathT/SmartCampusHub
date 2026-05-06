package com.smartcampus.controller;

import com.smartcampus.dto.PageResponse;
import com.smartcampus.dto.ResourceDto;
import com.smartcampus.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<PageResponse<ResourceDto>> getAllResources(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "sortDirection", defaultValue = "asc") String sortDirection) {
        return ResponseEntity.ok(resourceService.getAllResources(page, size, search, type, status, sortBy, sortDirection));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceDto> getResourceById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PostMapping
    public ResponseEntity<ResourceDto> createResource(@Valid @RequestBody ResourceDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceDto> updateResource(@PathVariable("id") Long id, @Valid @RequestBody ResourceDto dto) {
        return ResponseEntity.ok(resourceService.updateResource(id, dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceDto> patchResourceStatus(
            @PathVariable("id") Long id,
            @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(resourceService.patchStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable("id") Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/upload")
    public ResponseEntity<java.util.Map<String, String>> uploadImage(@RequestParam("image") MultipartFile image) {
        String imageUrl = resourceService.uploadImage(image);
        return ResponseEntity.ok(java.util.Map.of("imageUrl", imageUrl));
    }
}
