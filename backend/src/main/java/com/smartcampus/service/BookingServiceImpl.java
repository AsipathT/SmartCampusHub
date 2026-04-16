package com.smartcampus.service;

import com.smartcampus.dto.BookingDto;
import com.smartcampus.dto.BookingStatusUpdateRequest;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.ValidationException;
import com.smartcampus.model.entity.Booking;
import com.smartcampus.model.entity.Resource;
import com.smartcampus.model.entity.User;
import com.smartcampus.model.enums.BookingStatus;
import com.smartcampus.model.enums.ResourceStatus;
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
    private final BookingNotificationService bookingNotificationService;

    @Override
    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<BookingDto> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public BookingDto createBooking(BookingDto dto) {
        Resource resource = resourceRepository.findById(dto.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ValidationException("User not found"));

        LocalTime start = parseTime(dto.getStartTime(), "Invalid start time format");
        LocalTime end = parseTime(dto.getEndTime(), "Invalid end time format");

        if (!start.isBefore(end)) {
            throw new ValidationException("Start time must be before end time");
        }

        if (resource.getStatus() == ResourceStatus.OUT_OF_SERVICE) {
            throw new ValidationException("Selected resource is currently out of service");
        }

        if (start.isBefore(resource.getAvailableFrom()) || end.isAfter(resource.getAvailableTo())) {
            throw new ValidationException(
                    "Booking time must be within resource availability: "
                            + resource.getAvailableFrom() + " to " + resource.getAvailableTo()
            );
        }

        if (dto.getExpectedAttendees() == null || dto.getExpectedAttendees() < 1) {
            throw new ValidationException("Expected attendees must be at least 1");
        }

        if (resource.getCapacity() != null && dto.getExpectedAttendees() > resource.getCapacity()) {
            throw new ValidationException("Expected attendees cannot exceed resource capacity");
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
                .purpose(dto.getPurpose().trim())
                .expectedAttendees(dto.getExpectedAttendees())
                .rejectionReason(null)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

bookingNotificationService.createBookingNotification(
        user.getId(),
        "Your booking request for \"" + resource.getName() + "\" on " + savedBooking.getBookingDate()
                + " has been submitted and is pending approval.",
        "BOOKING_CREATED"
);

return mapToDto(savedBooking);
    }

    @Override
    public BookingDto updateBookingStatus(Long id, BookingStatusUpdateRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Booking not found"));

        BookingStatus newStatus;
        try {
            newStatus = BookingStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid booking status");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ValidationException("Only pending bookings can be approved or rejected");
        }

        if (newStatus != BookingStatus.APPROVED && newStatus != BookingStatus.REJECTED) {
            throw new ValidationException("Only APPROVED or REJECTED status is allowed here");
        }

        if (newStatus == BookingStatus.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
                throw new ValidationException("Rejection reason is required when rejecting a booking");
            }
            booking.setRejectionReason(request.getRejectionReason().trim());
        } else {
            booking.setRejectionReason(null);
        }

        booking.setStatus(newStatus);
        Booking savedBooking = bookingRepository.save(booking);

        Long userId = booking.getUser().getId();
        String resourceName = booking.getResource().getName();
        String bookingDate = String.valueOf(booking.getBookingDate());

        if (newStatus == BookingStatus.APPROVED) {
            bookingNotificationService.createBookingNotification(
                    userId,
                    "Your booking for \"" + resourceName + "\" on " + bookingDate + " has been approved.",
                    "BOOKING_APPROVED"
            );
        } else if (newStatus == BookingStatus.REJECTED) {
            bookingNotificationService.createBookingNotification(
                    userId,
                    "Your booking for \"" + resourceName + "\" on " + bookingDate
                            + " was rejected. Reason: " + booking.getRejectionReason(),
                    "BOOKING_REJECTED"
            );
        }

        return mapToDto(savedBooking);
    }

    @Override
    public void cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Booking not found"));

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ValidationException("Only approved bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        bookingNotificationService.createBookingNotification(
                booking.getUser().getId(),
                "Your booking for \"" + booking.getResource().getName() + "\" on "
                        + booking.getBookingDate() + " has been cancelled.",
                "BOOKING_CANCELLED"
        );
    }

    private LocalTime parseTime(String time, String message) {
        try {
            return LocalTime.parse(time);
        } catch (Exception e) {
            throw new ValidationException(message);
        }
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
                .resourceCapacity(booking.getResource().getCapacity())
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
                .expectedAttendees(booking.getExpectedAttendees())
                .rejectionReason(booking.getRejectionReason())
                .build();
    }
}