import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '@/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token when available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server returned an error response
      return Promise.reject(error);
    }
    if (error.request) {
      // No response received — network / timeout
      return Promise.reject(
        new Error('Unable to connect to Stockies server. Please check your connection.')
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;
