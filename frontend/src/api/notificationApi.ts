import api from './client';

export interface Notification {
  id: number;
  recipientUserId?: number;
  userId?: number;
  type: string;
  title?: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
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

export const getNotifications = async (
  userId: string | number,
  type?: string
): Promise<Notification[]> => {
  const response = await api.get('/notifications', { params: { userId, type } });
  return response.data;
};

export const markAsReadForUser = async (notificationId: number, userId: string | number): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/read`, null, { params: { userId } });
};

export const markAllAsRead = async (userId: string | number): Promise<void> => {
  await api.patch('/notifications/read-all', null, { params: { userId } });
};
