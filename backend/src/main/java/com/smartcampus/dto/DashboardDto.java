package com.smartcampus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDto {
    private long totalResources;
    private long activeResources;
    private long inactiveResources;
    private long totalBookings;
    private long pendingBookings;
    private Map<String, Long> mostUsedResources;
}
