import api from './client';
import { Resource, PageResponse } from '../types/resource';

const mapTypeToFacilityType = (type: string): string => {
  if (!type) return 'OTHERS';
  const t = type.toLowerCase();
  if (t.includes('hall')) return 'LECTURE_HALL';
  if (t.includes('lab')) return 'LAB';
  if (t.includes('libr')) return 'LIBRARY';
  if (t.includes('sport')) return 'SPORTS_ARENA';
  return 'OTHERS';
};

const mapToResource = (facility: any): Resource => ({
  id: facility.id,
  name: facility.name,
  description: facility.description,
  type: facility.type,
  capacity: facility.capacity,
  location: facility.location,
  status: facility.status,
  availabilityTime: `${facility.availableFrom || '08:00'} - ${facility.availableTo || '20:00'}`,
  availableFrom: facility.availableFrom,
  availableTo: facility.availableTo,
  imageUrl: facility.imageUrl
});

export const getResources = async (
  page = 0,
  size = 10,
  search = '',
  typeId?: number | null,
  status?: string,
  sortBy = 'id',
  sortDirection = 'asc'
): Promise<PageResponse<Resource>> => {
  const params: Record<string, any> = { page, size, sortBy, sortDirection };
  if (search)  params.search = search;
  if (typeId)  params.typeId = typeId;
  if (status && status !== 'ALL') params.status = status;

  const response = await api.get('/resources', { params });
  return {
    ...response.data,
    content: response.data.content ? response.data.content.map(mapToResource) : [],
  };
};

export const getResourceById = async (id: number | string): Promise<Resource> => {
  const response = await api.get(`/resources/${id}`);
  return mapToResource(response.data);
};

export const createResource = async (resource: Partial<Resource>): Promise<Resource> => {
  // Prefer direct availableFrom/availableTo; fall back to splitting availabilityTime
  const from = resource.availableFrom ?? (resource.availabilityTime?.split(' - ')[0]?.trim() ?? '08:00');
  const to   = resource.availableTo   ?? (resource.availabilityTime?.split(' - ')[1]?.trim() ?? '20:00');
  const facilityData = {
    ...resource,
    type: resource.type ? mapTypeToFacilityType(resource.type) : 'OTHERS',
    availableFrom: from,
    availableTo: to,
  };
  const response = await api.post('/resources', facilityData);
  return mapToResource(response.data);
};

export const updateResource = async (id: number | string, resource: Partial<Resource>): Promise<Resource> => {
  const from = resource.availableFrom ?? (resource.availabilityTime?.split(' - ')[0]?.trim() ?? '08:00');
  const to   = resource.availableTo   ?? (resource.availabilityTime?.split(' - ')[1]?.trim() ?? '20:00');
  const facilityData = {
    ...resource,
    type: resource.type ? mapTypeToFacilityType(resource.type) : 'OTHERS',
    availableFrom: from,
    availableTo: to,
  };
  const response = await api.put(`/resources/${id}`, facilityData);
  return mapToResource(response.data);
};

export const deleteResource = async (id: number | string): Promise<void> => {
  await api.delete(`/resources/${id}`);
};

export const patchResourceStatus = async (id: number | string, status: string): Promise<Resource> => {
  const response = await api.patch(`/resources/${id}/status`, { status });
  return mapToResource(response.data);
};

export const uploadResourceImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('image', file);
  const response = await api.post('/resources/upload', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.imageUrl;
};
