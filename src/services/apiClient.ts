import axios from 'axios';

// Get base URL from env or use /api relative path
const baseURL = import.meta.env.VITE_API_URL || '/api';
const ACCESS_TOKEN_KEY = 'poise_access_token';

export const setAccessToken = (token?: string | null) => {
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Crucial for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
        refreshRequest ??= apiClient.post<{ accessToken: string }>('/auth/refresh').then(({ data }) => {
          setAccessToken(data.accessToken);
        });
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
