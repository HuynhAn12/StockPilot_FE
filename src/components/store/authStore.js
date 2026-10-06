import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiLogin, apiLogout, apiGetMe, getApiError } from '../../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

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
        } catch (_) {}
        set({ user: null, token: null, refreshToken: null });
      },

      // ─── Lấy thông tin user hiện tại từ server ───
      fetchMe: async () => {
        try {
          const user = await apiGetMe();
          set({ user });
          return user;
        } catch (err) {
          set({ user: null, token: null, refreshToken: null });
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
    }
  )
);
