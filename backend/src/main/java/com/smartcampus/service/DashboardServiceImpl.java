package com.smartcampus.service;

import com.smartcampus.dto.DashboardDto;
import com.smartcampus.model.entity.Booking;
import com.smartcampus.model.enums.BookingStatus;
import com.smartcampus.model.enums.ResourceStatus;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;

    @Override
    public DashboardDto getDashboardStats() {
        long totalResources = resourceRepository.count();
        long activeResources = resourceRepository.findAll().stream()
                .filter(r -> r.getStatus() == ResourceStatus.ACTIVE).count();
        long inactiveResources = totalResources - activeResources;

        List<Booking> allBookings = bookingRepository.findAll();
        long totalBookings = allBookings.size();
        long pendingBookings = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING).count();

        Map<String, Long> mostUsed = allBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getResource().getName(), Collectors.counting()));

        // Return top 5
        Map<String, Long> top5 = mostUsed.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        return DashboardDto.builder()
                .totalResources(totalResources)
                .activeResources(activeResources)
                .inactiveResources(inactiveResources)
                .totalBookings(totalBookings)
                .pendingBookings(pendingBookings)
                .mostUsedResources(top5)
                .build();
    }
}
