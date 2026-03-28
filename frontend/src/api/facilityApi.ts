import axios from 'axios';
import { Facility, PageResponse } from '../types/facility';

const API = axios.create({ baseURL: 'http://localhost:8080/api/v1' });

API.interceptors.request.use((config) => {
    // Basic auth added for demo purposes matching backend
    const token = btoa('admin:admin'); // Base64 encoding for admin:admin
    config.headers.Authorization = `Basic ${token}`;
    return config;
});

export const getFacilities = async (page = 0, size = 10, filters = {}): Promise<PageResponse<Facility>> => {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString(), ...filters });
  const response = await API.get(`/facilities?${params.toString()}`);
  return response.data;
};

export const createFacility = async (data: Partial<Facility>): Promise<Facility> => {
  const response = await API.post('/facilities', data);
  return response.data;
};

export const uploadFacilityImage = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post(`/facilities/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
}
