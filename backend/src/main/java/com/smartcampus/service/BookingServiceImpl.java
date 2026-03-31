package com.smartcampus.service;

import com.smartcampus.dto.BookingDto;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.ValidationException;
import com.smartcampus.model.entity.Booking;
import com.smartcampus.model.entity.Resource;
import com.smartcampus.model.entity.User;
import com.smartcampus.model.enums.BookingStatus;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    @Override
    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingDto> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public BookingDto createBooking(BookingDto dto) {
        log.info("Creating booking for resourceId: {} by userId: {}", dto.getResourceId(), dto.getUserId());

        Resource resource = resourceRepository.findById(dto.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + dto.getResourceId()));

        Long userId = dto.getUserId() != null ? dto.getUserId() : 1L;
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        LocalTime start = LocalTime.parse(dto.getStartTime());
        LocalTime end = LocalTime.parse(dto.getEndTime());

        if (!start.isBefore(end)) {
            throw new ValidationException("Start time must be before end time");
        }

        if (start.isBefore(resource.getAvailableFrom()) || end.isAfter(resource.getAvailableTo())) {
            throw new ValidationException("Booking time falls outside of resource available hours");
        }

        boolean isOverlapping = bookingRepository.existsOverlappingBooking(
                resource.getId(),
                dto.getBookingDate(),
                start,
                end
        );

        if (isOverlapping) {
            throw new BookingConflictException("Resource is already booked for this time slot");
        }

        Booking booking = Booking.builder()
                .resource(resource)
                .user(user)
                .bookingDate(dto.getBookingDate())
                .startTime(start)
                .endTime(end)
                .status(BookingStatus.PENDING)
                .purpose(dto.getPurpose())
                .rejectionReason(null)
                .build();

        return mapToDto(bookingRepository.save(booking));
    }

    @Override
    public BookingDto updateBookingStatus(Long id, String status, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        BookingStatus newStatus;
        try {
            newStatus = BookingStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid booking status: " + status);
        }

        if (newStatus == BookingStatus.REJECTED && (reason == null || reason.trim().isEmpty())) {
            throw new ValidationException("Rejection reason is required when rejecting a booking");
        }

        booking.setStatus(newStatus);

        if (newStatus == BookingStatus.REJECTED) {
            booking.setRejectionReason(reason.trim());
        } else {
            booking.setRejectionReason(null);
        }

        return mapToDto(bookingRepository.save(booking));
    }

    @Override
    public BookingDto cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ValidationException("Only approved bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return mapToDto(bookingRepository.save(booking));
    }

    @Override
    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    private BookingDto mapToDto(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .resourceId(booking.getResource().getId())
                .resourceName(booking.getResource().getName())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getUsername())
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime().toString())
                .endTime(booking.getEndTime().toString())
                .status(booking.getStatus().name())
                .purpose(booking.getPurpose())
                .rejectionReason(booking.getRejectionReason())
                .build();
    }
}