package com.smartcampus.service;

import com.smartcampus.dto.PageResponse;
import com.smartcampus.dto.ResourceDto;
import com.smartcampus.model.entity.Resource;
import com.smartcampus.model.entity.ResourceType;
import com.smartcampus.model.enums.ResourceStatus;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.ResourceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceTypeRepository resourceTypeRepository;

    @Override
    public PageResponse<ResourceDto> getAllResources(int page, int size, String search, Long typeId) {
        Pageable pageable = PageRequest.of(page, size);

        org.springframework.data.jpa.domain.Specification<Resource> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            if (search != null && !search.trim().isEmpty()) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), likePattern),
                        cb.like(cb.lower(root.get("location")), likePattern)
                ));
            }
            if (typeId != null) {
                predicates.add(cb.equal(root.get("type").get("id"), typeId));
            }
            predicates.add(cb.equal(root.get("isDeleted"), false)); // Respect the logic that previously used a SQL restrict or needs to exclude deleted
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Resource> resources = resourceRepository.findAll(spec, pageable);
        List<ResourceDto> content = resources.getContent().stream().map(this::mapToDto).collect(Collectors.toList());
        return new PageResponse<>(content, resources.getNumber(), resources.getSize(),
                resources.getTotalElements(), resources.getTotalPages(), resources.isLast());
    }

    @Override
    public ResourceDto getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        return mapToDto(resource);
    }

    @Override
    public ResourceDto createResource(ResourceDto dto) {
        ResourceType type = resourceTypeRepository.findByName(dto.getType())
                .orElseGet(() -> {
                    ResourceType newType = new ResourceType();
                    newType.setName(dto.getType());
                    return resourceTypeRepository.save(newType);
                });

        Resource resource = Resource.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .type(type)
                .location(dto.getLocation())
                .capacity(dto.getCapacity())
                .status(dto.getStatus() != null ? dto.getStatus() : ResourceStatus.ACTIVE)
                .imageUrl(dto.getImageUrl())
                .availableFrom(LocalTime.parse(dto.getAvailableFrom()))
                .availableTo(LocalTime.parse(dto.getAvailableTo()))
                .isDeleted(false)
                .build();
        
        resource = resourceRepository.save(resource);
        return mapToDto(resource);
    }

    @Override
    public ResourceDto updateResource(Long id, ResourceDto dto) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        ResourceType type = resourceTypeRepository.findByName(dto.getType())
                .orElseGet(() -> {
                    ResourceType newType = new ResourceType();
                    newType.setName(dto.getType());
                    return resourceTypeRepository.save(newType);
                });

        resource.setName(dto.getName());
        resource.setDescription(dto.getDescription());
        resource.setType(type);
        resource.setLocation(dto.getLocation());
        resource.setCapacity(dto.getCapacity());
        if (dto.getStatus() != null) {
            resource.setStatus(dto.getStatus());
        }
        resource.setImageUrl(dto.getImageUrl());
        resource.setAvailableFrom(LocalTime.parse(dto.getAvailableFrom()));
        resource.setAvailableTo(LocalTime.parse(dto.getAvailableTo()));

        resource = resourceRepository.save(resource);
        return mapToDto(resource);
    }

    @Override
    public void deleteResource(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        resource.setDeleted(true);
        resourceRepository.save(resource);
    }

    private ResourceDto mapToDto(Resource resource) {
        return ResourceDto.builder()
                .id(resource.getId())
                .name(resource.getName())
                .description(resource.getDescription())
                .type(resource.getType().getName())
                .location(resource.getLocation())
                .capacity(resource.getCapacity())
                .status(resource.getStatus())
                .imageUrl(resource.getImageUrl())
                .availableFrom(resource.getAvailableFrom().toString())
                .availableTo(resource.getAvailableTo().toString())
                .build();
    }
}
