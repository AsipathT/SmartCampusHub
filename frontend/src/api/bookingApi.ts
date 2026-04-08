import api from './client';

export interface Booking {
  id?: number;
  resourceId: number;
  resourceName?: string;
  resourceLocation?: string;
  resourceType?: string;
  resourceCapacity?: number;

  userId: number;
  userName?: string;

  bookingDate: string;
  startTime: string;
  endTime: string;
  status?: string;
  purpose: string;

  expectedAttendees: number;
  rejectionReason?: string | null;
}

export interface BookingStatusUpdatePayload {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
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
  payload: BookingStatusUpdatePayload
): Promise<Booking> => {
  const response = await api.patch(`/bookings/${id}/status`, payload);
  return response.data;
};

export const cancelBooking = async (id: number): Promise<void> => {
  await api.patch(`/bookings/${id}/cancel`);
};