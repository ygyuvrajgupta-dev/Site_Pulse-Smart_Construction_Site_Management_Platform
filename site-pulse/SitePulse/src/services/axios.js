import axios from 'axios';
import API_BASE_URL from '@/config/api';

/**
 * Axios instance with pre-configured base URL and interceptors.
 * Provides centralized HTTP configuration for all API calls.
 */
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Request interceptor.
 * Attaches the JWT access token to every request.
 */
apiClient.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch {
        // Invalid user data in localStorage
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor.
 * Handles common error scenarios globally.
 * - 401: Unauthorized → clear auth state
 * - 403: Forbidden
 * - 500: Server error
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401: {
          // Demo sessions have no real JWT and must not be logged out.
          let isDemo = false;
          try {
            const stored = JSON.parse(localStorage.getItem('user') || 'null');
            isDemo = Boolean(stored && stored.demo);
          } catch {
            isDemo = false;
          }

          if (!isDemo) {
            // Session expired or invalid token
            localStorage.removeItem('user');
            localStorage.removeItem('redirectAfterLogin');
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
          break;
        }
        case 403: {
          // Forbidden — user doesn't have permission
          console.error('Access denied:', error.response.data?.message);
          break;
        }
        case 500: {
          // Server error
          console.error('Server error:', error.response.data?.message);
          break;
        }
        default:
          break;
      }
    } else if (error.request) {
      // Network error — no response received
      console.error('Network error: Unable to reach the server');
    }

    return Promise.reject(error);
  }
);

export default apiClient;