import api from './client';

export interface Booking {
  id?: number;
  resourceId: number;
  resourceName?: string;
  resourceLocation?: string;
  resourceType?: string;
  userId: number;
  userName?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status?: string;
  purpose?: string;
}

export const getAllBookings = async (): Promise<Booking[]> => {
  const response = await api.get('/bookings');
  return response.data;
};

export const getMyBookings = async (userId: number): Promise<Booking[]> => {
  const response = await api.get(`/bookings/user/${userId}`);
  return response.data;
};

export const createBooking = async (payload: Booking): Promise<Booking> => {
  const response = await api.post('/bookings', payload);
  return response.data;
};

export const updateBookingStatus = async (
  id: number,
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'CANCELLED'
): Promise<Booking> => {
  const response = await api.patch(`/bookings/${id}/status`, null, {
    params: { status },
  });
  return response.data;
};

export const cancelBooking = async (id: number): Promise<void> => {
  await api.patch(`/bookings/${id}/cancel`);
};