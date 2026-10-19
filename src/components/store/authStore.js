import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiLogin, apiLogout, apiGetMe, getApiError } from '../../services/authService';

// Đọc đồng bộ từ localStorage ngay khi khởi tạo store để tránh flash hoặc redirect nhầm ra login khi F5
const getInitialStoredAuth = () => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('stockpilot-auth') : null;
    if (!raw) return { user: null, token: null, refreshToken: null };
    const parsed = JSON.parse(raw);
    const state = parsed?.state || {};
    return {
      user: state.user || null,
      token: state.token || null,
      refreshToken: state.refreshToken || null,
    };
  } catch {
    return { user: null, token: null, refreshToken: null };
  }
};

const initialAuth = getInitialStoredAuth();

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: initialAuth.user,
      token: initialAuth.token,
      refreshToken: initialAuth.refreshToken,
      isHydrated: true,
      isLoading: false,
      error: null,

      setHydrated: (val) => set({ isHydrated: val }),

      // ─── Đăng nhập thật qua API ───
      login: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token, refreshToken } = await apiLogin({ email, password });
          set({ user, token, refreshToken, isLoading: false, error: null });
          return { success: true, user };
        } catch (err) {
          const message = getApiError(err);
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // ─── Đăng xuất ───
      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) await apiLogout({ refreshToken });
        } catch {}
        try {
          localStorage.removeItem('stockpilot_pos_scanner_code');
        } catch {}
        set({ user: null, token: null, refreshToken: null });
      },

      // ─── Lấy thông tin user hiện tại từ server ───
      fetchMe: async () => {
        try {
          const user = await apiGetMe();
          if (user) {
            set({ user });
          }
          return user;
        } catch (err) {
          // Chỉ xóa phiên nếu thực sự là 401 unauthenticated
          if (err?.response?.status === 401) {
            set({ user: null, token: null, refreshToken: null });
          }
          return null;
        }
      },

      // ─── Cập nhật token sau khi refresh ───
      setToken: (token, refreshToken) => set({ token, refreshToken }),

      // ─── Xóa state ───
      clearUser: () => set({ user: null, token: null, refreshToken: null }),

      // ─── Getter tiện ích ───
      get currentRole() { return get().user?.role || null; },
      get isAuthenticated() { return !!get().user && !!get().token; },
    }),
    {
      name: 'stockpilot-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated?.(true);
        }
      },
    }
  )
);

// Lắng nghe sự kiện token refresh từ apiClient để đồng bộ state trong bộ nhớ
if (typeof window !== 'undefined') {
  window.addEventListener('stockpilot-auth-refresh', (e) => {
    const { token, refreshToken } = e.detail || {};
    if (token) {
      useAuthStore.getState().setToken(token, refreshToken);
    }
  });
}