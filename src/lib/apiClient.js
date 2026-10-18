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
  timeout: 45000,
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
let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Không can thiệp nếu không có config hoặc request auth bị lỗi (login/register)
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          const stored = localStorage.getItem('stockpilot-auth');
          const parsed = stored ? JSON.parse(stored) : null;
          const refreshToken = parsed?.state?.refreshToken;

          if (!refreshToken) {
            throw new Error('NO_REFRESH_TOKEN');
          }

          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { timeout: 20000 });
          const newAccessToken = data.data.accessToken;
          const newRefreshToken = data.data.refreshToken;

          // Cập nhật token trong localStorage
          if (parsed?.state) {
            parsed.state.token = newAccessToken;
            parsed.state.refreshToken = newRefreshToken;
            localStorage.setItem('stockpilot-auth', JSON.stringify(parsed));
          }

          // Bắn sự kiện cập nhật authStore trong bộ nhớ
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('stockpilot-auth-refresh', {
                detail: { token: newAccessToken, refreshToken: newRefreshToken },
              })
            );
          }

          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          return newAccessToken;
        })()
          .catch((refreshError) => {
            const status = refreshError.response?.status;
            // Chỉ xóa phiên và chuyển về login khi refreshToken thực sự không hợp lệ hoặc hết hạn (401 / 403)
            // Tuyệt đối không đăng xuất khi gặp lỗi mạng, timeout, hoặc lỗi 500 / 429 tạm thời!
            if (status === 401 || status === 403 || refreshError.message === 'NO_REFRESH_TOKEN') {
              console.warn('[StockPilot Auth] Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Điều hướng về /login.');
              localStorage.removeItem('stockpilot-auth');
              if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            } else {
              console.warn('[StockPilot Auth] Refresh token gặp lỗi tạm thời (mạng/timeout/server):', refreshError.message);
            }
            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const token = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (err) {
        return Promise.reject(err);
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
