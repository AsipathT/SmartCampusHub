import api from './client';
import { Resource, PageResponse } from '../types/resource';

export const getResources = async (page = 0, size = 10, search = '', type = ''): Promise<PageResponse<Resource>> => {
  // Using params dynamically for backend filter capabilities
  const params: Record<string, string | number> = { page, size };
  if (search) params.search = search;
  if (type) params.type = type;

  const response = await api.get('/resources', { params });
  return response.data;
};

export const getResourceById = async (id: number | string): Promise<Resource> => {
  const response = await api.get(`/resources/${id}`);
  return response.data;
};

export const createResource = async (resource: Partial<Resource>): Promise<Resource> => {
  const response = await api.post('/resources', resource);
  return response.data;
};

export const updateResource = async (id: number | string, resource: Partial<Resource>): Promise<Resource> => {
  const response = await api.put(`/resources/${id}`, resource);
  return response.data;
};

export const deleteResource = async (id: number | string): Promise<void> => {
  await api.delete(`/resources/${id}`);
};
