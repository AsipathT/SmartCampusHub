package com.smartcampus.service;

import com.smartcampus.dto.BookingDto;
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
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    @Override
    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAll().stream().map(this::mapToDto).toList();
    }

    @Override
    public List<BookingDto> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId).stream().map(this::mapToDto).toList();
    }

    @Override
    public BookingDto createBooking(BookingDto dto) {
        Resource resource = resourceRepository.findById(dto.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ValidationException("User not found"));

        LocalTime start = LocalTime.parse(dto.getStartTime());
        LocalTime end = LocalTime.parse(dto.getEndTime());

        if (!start.isBefore(end)) {
            throw new ValidationException("Start time must be before end time");
        }

        boolean overlapping = bookingRepository.existsOverlappingBooking(
                resource.getId(),
                dto.getBookingDate(),
                start,
                end
        );

        if (overlapping) {
            throw new ValidationException("Selected slot is already booked");
        }

        Booking booking = Booking.builder()
                .resource(resource)
                .user(user)
                .bookingDate(dto.getBookingDate())
                .startTime(start)
                .endTime(end)
                .status(BookingStatus.PENDING)
                .purpose(dto.getPurpose())
                .build();

        return mapToDto(bookingRepository.save(booking));
    }

    @Override
    public BookingDto updateBookingStatus(Long id, String status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Booking not found"));

        try {
            booking.setStatus(BookingStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid booking status");
        }

        return mapToDto(bookingRepository.save(booking));
    }

    @Override
    public void cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    private BookingDto mapToDto(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .resourceId(booking.getResource().getId())
                .resourceName(booking.getResource().getName())
                .resourceLocation(booking.getResource().getLocation())
                .resourceType(
                        booking.getResource().getType() != null
                                ? booking.getResource().getType().getName()
                                : null
                )
                .userId(booking.getUser().getId())
                .userName(
                        booking.getUser().getFullName() != null && !booking.getUser().getFullName().isBlank()
                                ? booking.getUser().getFullName()
                                : booking.getUser().getUsername()
                )
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime().toString())
                .endTime(booking.getEndTime().toString())
                .status(booking.getStatus().name())
                .purpose(booking.getPurpose())
                .build();
    }
}