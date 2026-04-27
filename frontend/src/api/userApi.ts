import api from './client';

export interface UserDto {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getUsers = async (): Promise<UserDto[]> => {
  const res = await api.get<UserDto[]>('/users');
  return res.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export type UserRole = 'ADMIN' | 'USER' | 'LECTURER' | 'MAINTENANCE_STAFF';

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export const createUser = async (payload: CreateUserPayload): Promise<UserDto> => {
  const res = await api.post<UserDto>('/users', payload);
  return res.data;
};

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  role?: UserRole;
  profileImage?: string;
  password?: string;
  confirmPassword?: string;
}

export const updateUser = async (id: number, payload: UpdateUserPayload): Promise<UserDto> => {
  const res = await api.put<UserDto>(`/users/${id}`, payload);
  return res.data;
};
