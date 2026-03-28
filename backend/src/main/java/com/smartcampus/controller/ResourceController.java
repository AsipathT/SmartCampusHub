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
@CrossOrigin(origins = "http://localhost:5173")
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<PageResponse<ResourceDto>> getAllResources(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "typeId", required = false) Long typeId) {
        return ResponseEntity.ok(resourceService.getAllResources(page, size, search, typeId));
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
