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

      // If store has never run analysis and has 0 alerts, run a background recalculate
      if (items.length === 0 && !get().isRecalculating) {
        get().recalculate({ background: true });
      }
    } catch (err) {
      set({ error: err?.response?.data?.error?.message || 'Lỗi tải cảnh báo', isLoading: false });
    }
  },

  // Trigger Decision Engine → tạo/cập nhật alerts → sau đó fetch lại
  recalculate: async (options = {}) => {
    if (!options.background) {
      set({ isRecalculating: true, error: null });
    }
    try {
      await apiRecalculateAlerts();
    } catch (err) {
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
    }
  },

  acknowledgeAlert: async (id) => {
    try {
      const updated = await apiAcknowledgeAlert(id);
      set((state) => {
        const updatedAlerts = state.alerts.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED', ...updated } : a));
        return {
          alerts: updatedAlerts,
          stats: {
            ...state.stats,
            openCount: Math.max(0, state.stats.openCount - 1),
            acknowledgedCount: state.stats.acknowledgedCount + 1,
          },
        };
      });
    } catch (_) {}
  },

  resolveAlert: async (id) => {
    try {
      await apiResolveAlert(id);
      set((state) => {
        const remaining = state.alerts.filter((a) => a.id !== id);
        return {
          alerts: remaining,
          stats: {
            ...state.stats,
            openCount: Math.max(0, state.stats.openCount - 1),
            resolvedCount: state.stats.resolvedCount + 1,
            activeCount: Math.max(0, state.stats.activeCount - 1),
          },
        };
      });
    } catch (_) {}
  },

  dismissAlert: (id) => {
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }));
  },

  resetAlerts: () => {
    get().recalculate();
  },

  getOpenCount: () => {
    return get().alerts.filter((a) =>
      a.status === 'OPEN' || a.status === 'open' || !a.status
    ).length;
  },
}));
