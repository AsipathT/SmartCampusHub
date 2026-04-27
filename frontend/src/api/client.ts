import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

type RequestWithSkipAuth = Parameters<typeof api.interceptors.request.use>[0] extends (
  arg: infer T
) => any
  ? T & { skipAuth?: boolean }
  : { skipAuth?: boolean };

// Attach JWT Bearer token from localStorage on every request
api.interceptors.request.use((config: RequestWithSkipAuth) => {
  const token = localStorage.getItem('token');
  if (token && config.headers && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// On 401, clear stale session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
