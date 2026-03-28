package com.smartcampus.service;

import com.smartcampus.dto.BookingDto;
import com.smartcampus.model.entity.Booking;
import com.smartcampus.model.entity.Resource;
import com.smartcampus.model.entity.User;
import com.smartcampus.model.enums.BookingStatus;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.ValidationException;
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
        return bookingRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<BookingDto> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId).stream().map(this::mapToDto).collect(Collectors.toList());
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

        if (start.isBefore(resource.getAvailableFrom()) || end.isAfter(resource.getAvailableTo())) {
            log.warn("Booking time {} - {} outside available hours {} - {}", start, end, resource.getAvailableFrom(), resource.getAvailableTo());
            throw new ValidationException("Booking time falls outside of resource available hours");
        }

        boolean isOverlapping = bookingRepository.existsOverlappingBooking(resource.getId(), dto.getBookingDate(), start, end);
        if (isOverlapping) {
            log.warn("Overlapping booking requested for resourceId: {} on date: {}", resource.getId(), dto.getBookingDate());
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
                .build();

        booking = bookingRepository.save(booking);
        return mapToDto(booking);
    }

    @Override
    public BookingDto updateBookingStatus(Long id, String status) {
        log.info("Updating booking ID: {} to status: {}", id, status);
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));
        booking.setStatus(BookingStatus.valueOf(status.toUpperCase()));
        booking = bookingRepository.save(booking);
        return mapToDto(booking);
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
                .build();
    }
}
