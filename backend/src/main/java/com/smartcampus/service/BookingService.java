package com.smartcampus.service;

import com.smartcampus.dto.BookingDto;
import com.smartcampus.dto.BookingStatusUpdateRequest;

import java.util.List;

public interface BookingService {
    List<BookingDto> getAllBookings();
    List<BookingDto> getUserBookings(Long userId);
    BookingDto createBooking(BookingDto dto);
    BookingDto updateBookingStatus(Long id, BookingStatusUpdateRequest request);
    void cancelBooking(Long id);
}