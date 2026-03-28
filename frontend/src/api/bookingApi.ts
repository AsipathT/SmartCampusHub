import api from './client';

export interface Booking {
  id?: number;
  resourceId: number;
  resourceName?: string;
  userId?: number;
  userName?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  purpose?: string;
}

export const createBooking = async (booking: Booking): Promise<Booking> => {
  const response = await api.post('/bookings', booking);
  return response.data;
};

export const getMyBookings = async (userId: number): Promise<Booking[]> => {
  const response = await api.get(`/bookings/user/${userId}`);
  return response.data;
};

export const getAllBookings = async (): Promise<Booking[]> => {
  const response = await api.get('/bookings');
  return response.data;
};

export const updateBookingStatus = async (id: number, status: string): Promise<Booking> => {
  const response = await api.put(`/bookings/${id}/status`, null, {
    params: { status }
  });
  return response.data;
};

export const cancelBooking = async (id: number): Promise<void> => {
  // We can just use updateBookingStatus to CANCELLED or DELETE
  // If the backend has delete, we use delete
  await api.delete(`/bookings/${id}`);
};
