package com.smartcampus.service;

import com.smartcampus.dto.BookingDto;

import java.util.List;

public interface BookingService {
    List<BookingDto> getAllBookings();
    List<BookingDto> getUserBookings(Long userId);
    BookingDto createBooking(BookingDto dto);
    BookingDto updateBookingStatus(Long id, String status);
    void cancelBooking(Long id);
}
