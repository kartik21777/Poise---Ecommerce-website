import axios from 'axios';

// Get base URL from env or use /api relative path
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Crucial for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshRequest: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        refreshRequest ??= apiClient.post('/auth/refresh').then(() => undefined);
        await refreshRequest;
        return apiClient(originalRequest);
      } catch {
        // The original 401 is more useful to callers than a refresh failure.
      } finally {
        refreshRequest = null;
      }
    }

    return Promise.reject(error);
  }
);
