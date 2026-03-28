import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token
api.interceptors.request.use((config) => {
  // Match Spring Security httpBasic by using basic auth credentials admin:admin
  const basicAuthToken = btoa('admin:admin');
  if (config.headers) {
    config.headers.Authorization = `Basic ${basicAuthToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
