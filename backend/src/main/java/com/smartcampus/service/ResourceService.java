package com.smartcampus.service;

import com.smartcampus.dto.PageResponse;
import com.smartcampus.dto.ResourceDto;
import org.springframework.web.multipart.MultipartFile;

public interface ResourceService {
    PageResponse<ResourceDto> getAllResources(int page, int size, String search, Long typeId);
    ResourceDto getResourceById(Long id);
    ResourceDto createResource(ResourceDto resourceDto);
    ResourceDto updateResource(Long id, ResourceDto resourceDto);
    void deleteResource(Long id);
    String uploadImage(MultipartFile file);
}
