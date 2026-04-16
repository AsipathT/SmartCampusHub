import api from './client';

export interface Notification {
  id: number;
  message: string;
  type: string;
  userId: number;
  read: boolean;
  createdAt: string;
}

export const getUserNotifications = async (userId: string | number): Promise<Notification[]> => {
  const response = await api.get(`/notifications/user/${userId}`);
  return response.data;
};

export const getUnreadCount = async (userId: string | number): Promise<number> => {
  const response = await api.get(`/notifications/user/${userId}/unread-count`);
  return response.data;
};

export const markAsRead = async (notificationId: number): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/read`);
};
