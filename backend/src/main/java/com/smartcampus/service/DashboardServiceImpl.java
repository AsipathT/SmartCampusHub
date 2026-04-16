package com.smartcampus.service;

import com.smartcampus.dto.DashboardDto;
import com.smartcampus.model.enums.ResourceStatus;
import com.smartcampus.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ResourceRepository resourceRepository;

    @Override
    public DashboardDto getDashboardStats() {
        long totalResources = resourceRepository.count();
        long activeResources = resourceRepository.findAll().stream()
                .filter(r -> r.getStatus() == ResourceStatus.ACTIVE).count();
        long inactiveResources = totalResources - activeResources;

        return DashboardDto.builder()
                .totalResources(totalResources)
                .activeResources(activeResources)
                .inactiveResources(inactiveResources)
                .build();
    }
}
