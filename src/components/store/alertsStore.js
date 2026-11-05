/**
 * alertsStore.js — lấy cảnh báo từ backend API thật và đồng bộ với Decision Engine.
 */
import { create } from 'zustand';
import {
  apiGetAlerts,
  apiGetAlertStats,
  apiAcknowledgeAlert,
  apiResolveAlert,
  apiRecalculateAlerts,
} from '../../services/inventoryService';
import { useAuthStore } from './authStore';
import { canRunDecisionEngine } from '../../config/permissions.config';

const mayRunEngine = () => canRunDecisionEngine(useAuthStore.getState().user?.role);

export const useAlertsStore = create((set, get) => ({
  alerts: [],
  stats: {
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
    openCount: 0,
    acknowledgedCount: 0,
    resolvedCount: 0,
    totalCount: 0,
    activeCount: 0,
  },
  isLoading: false,
  isRecalculating: false,
  error: null,

  fetchAlerts: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const [data, statsData] = await Promise.allSettled([
        apiGetAlerts(params),
        apiGetAlertStats(),
      ]);

      let items = [];
      if (data.status === 'fulfilled') {
        const raw = data.value;
        items = Array.isArray(raw) ? raw : (raw.items || raw.data || []);
      }

      let stats = get().stats;
      if (statsData.status === 'fulfilled' && statsData.value) {
        stats = statsData.value;
      }

      set({ alerts: items, stats, isLoading: false });

      // If store has never run analysis and has 0 alerts, run a background recalculate (owner only: staff get 403)
      if (items.length === 0 && !get().isRecalculating && mayRunEngine()) {
        get().recalculate({ background: true });
      }
    } catch (err) {
      set({ error: err?.response?.data?.error?.message || 'Lỗi tải cảnh báo', isLoading: false });
    }
  },

  // Trigger Decision Engine → tạo/cập nhật alerts → sau đó fetch lại. Trả về false nếu phân tích thất bại.
  recalculate: async (options = {}) => {
    if (!mayRunEngine()) return false;
    if (!options.background) {
      set({ isRecalculating: true, error: null });
    }
    let analyzed = true;
    try {
      await apiRecalculateAlerts();
    } catch (err) {
      analyzed = false;
      console.warn('Recalculate warning:', err?.response?.data?.error?.message || err.message);
    }
    // Fetch lại dữ liệu mới nhất từ database
    try {
      const [data, statsData] = await Promise.allSettled([
        apiGetAlerts({}),
        apiGetAlertStats(),
      ]);

      let items = [];
      if (data.status === 'fulfilled') {
        const raw = data.value;
        items = Array.isArray(raw) ? raw : (raw.items || raw.data || []);
      }

      let stats = get().stats;
      if (statsData.status === 'fulfilled' && statsData.value) {
        stats = statsData.value;
      }

      set({ alerts: items, stats, isRecalculating: false });
    } catch (err) {
      set({ error: err?.response?.data?.error?.message || 'Lỗi tải cảnh báo', isRecalculating: false });
      return false;
    }
    return analyzed;
  },

  // acknowledgeAlert / resolveAlert ném lỗi API ra ngoài để trang báo đúng kết quả.
  acknowledgeAlert: async (id) => {
    const updated = await apiAcknowledgeAlert(id);
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED', ...updated } : a)),
      stats: {
        ...state.stats,
        openCount: Math.max(0, state.stats.openCount - 1),
        acknowledgedCount: state.stats.acknowledgedCount + 1,
      },
    }));
  },

  resolveAlert: async (id) => {
    await apiResolveAlert(id);
    set((state) => {
      const wasOpen = state.alerts.find((a) => a.id === id)?.status === 'OPEN';
      return {
        alerts: state.alerts.filter((a) => a.id !== id),
        stats: {
          ...state.stats,
          openCount: wasOpen ? Math.max(0, state.stats.openCount - 1) : state.stats.openCount,
          acknowledgedCount: wasOpen ? state.stats.acknowledgedCount : Math.max(0, state.stats.acknowledgedCount - 1),
          resolvedCount: state.stats.resolvedCount + 1,
          activeCount: Math.max(0, state.stats.activeCount - 1),
        },
      };
    });
  },

  dismissAlert: (id) => {
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }));
  },

  resetAlerts: () => {
    get().recalculate();
  },

  // Đếm từ /alerts/stats: danh sách chỉ là trang đầu (50 dòng, lẫn cả cảnh báo đã xử lý).
  getOpenCount: () => get().stats.openCount || 0,
}));
