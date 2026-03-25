package com.smartcampus.repository;

import com.smartcampus.model.entity.Facility;
import com.smartcampus.model.enums.FacilityType;
import org.springframework.data.jpa.domain.Specification;

public class FacilitySpecifications {
    public static Specification<Facility> withFilters(String location, FacilityType type, Integer minCapacity) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (location != null && !location.trim().isEmpty()) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%"));
            }
            if (type != null) {
                predicate = cb.and(predicate, cb.equal(root.get("type"), type));
            }
            if (minCapacity != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            }
            return predicate;
        };
    }
}
