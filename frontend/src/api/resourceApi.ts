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

export const getResources = async (page = 0, size = 10, search = '', type = ''): Promise<PageResponse<Resource>> => {
  // Using params dynamically for backend filter capabilities
  const params: Record<string, string | number> = { page, size };
  if (search) params.search = search;
  if (type) params.type = type;

  const response = await api.get('/resources', { params });
  return {
    ...response.data,
    content: response.data.content ? response.data.content.map(mapToResource) : []
  };
};

export const getResourceById = async (id: number | string): Promise<Resource> => {
  const response = await api.get(`/resources/${id}`);
  return mapToResource(response.data);
};

export const createResource = async (resource: Partial<Resource>): Promise<Resource> => {
  const times = resource.availabilityTime ? resource.availabilityTime.split(' - ') : ['08:00', '20:00'];
  const facilityData = {
    ...resource,
    type: resource.type ? mapTypeToFacilityType(resource.type) : 'OTHERS',
    availableFrom: times[0].trim(),
    availableTo: times[1].trim(),
  };
  const response = await api.post('/resources', facilityData);
  return mapToResource(response.data);
};

export const updateResource = async (id: number | string, resource: Partial<Resource>): Promise<Resource> => {
  const times = resource.availabilityTime ? resource.availabilityTime.split(' - ') : ['08:00', '20:00'];
  const facilityData = {
    ...resource,
    type: resource.type ? mapTypeToFacilityType(resource.type) : 'OTHERS',
    availableFrom: times[0].trim(),
    availableTo: times[1].trim(),
  };
  const response = await api.put(`/resources/${id}`, facilityData);
  return mapToResource(response.data);
};

export const deleteResource = async (id: number | string): Promise<void> => {
  await api.delete(`/resources/${id}`);
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
