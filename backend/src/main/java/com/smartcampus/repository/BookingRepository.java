package com.smartcampus.repository;

import com.smartcampus.model.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    @Query("""
        SELECT COUNT(b) > 0
        FROM Booking b
        WHERE b.resource.id = :resourceId
        AND b.bookingDate = :bookingDate
        AND b.status IN ('PENDING', 'APPROVED')
        AND (b.startTime < :endTime AND b.endTime > :startTime)
    """)
    boolean existsOverlappingBooking(
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
}
