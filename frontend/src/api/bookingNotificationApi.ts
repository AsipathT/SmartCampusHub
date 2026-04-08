import api from './client';

export interface BookingNotification {
  id: number;
  message: string;
  type: string;
  userId: number;
  read: boolean;
  createdAt: string;
}

export const getBookingNotifications = async (
  userId: string | number
): Promise<BookingNotification[]> => {
  const response = await api.get(`/booking-notifications/user/${userId}`);
  return response.data;
};

export const getUnreadBookingNotificationCount = async (
  userId: string | number
): Promise<number> => {
  const response = await api.get(`/booking-notifications/user/${userId}/unread-count`);
  return response.data;
};

export const markBookingNotificationAsRead = async (
  notificationId: number
): Promise<void> => {
  await api.patch(`/booking-notifications/${notificationId}/read`);
};