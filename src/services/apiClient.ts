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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle auth errors etc.
    if (error.response?.status === 401) {
      // Potentially emit an event or trigger a logout side-effect if needed
    }
    return Promise.reject(error);
  }
);
