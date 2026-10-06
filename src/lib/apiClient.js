/**
 * Axios API client với interceptor tự động gắn token và refresh khi hết hạn.
 * Pure JavaScript — không dùng TypeScript types.
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─── Request Interceptor: gắn access token vào mọi request ───
apiClient.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('stockpilot-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (_) {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: tự động refresh khi 401 ───
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Bỏ qua refresh khi chính request auth bị lỗi (login/register sai mật khẩu)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const stored = localStorage.getItem('stockpilot-auth');
        const parsed = stored ? JSON.parse(stored) : null;
        const refreshToken = parsed?.state?.refreshToken;

        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        // Cập nhật token trong localStorage
        if (parsed?.state) {
          parsed.state.token = newAccessToken;
          parsed.state.refreshToken = newRefreshToken;
          localStorage.setItem('stockpilot-auth', JSON.stringify(parsed));
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth và redirect về login
        localStorage.removeItem('stockpilot-auth');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Helper lấy error message từ response ───
export function getApiError(error) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Đã có lỗi xảy ra'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Đã có lỗi xảy ra';
}
