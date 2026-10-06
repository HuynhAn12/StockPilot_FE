/**
 * alertsStore.js — lấy cảnh báo từ backend API thật.
 */
import { create } from 'zustand';
import { apiGetAlerts, apiAcknowledgeAlert, apiResolveAlert } from '../../services/inventoryService';

export const useAlertsStore = create((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,

  fetchAlerts: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGetAlerts(params);
      const items = Array.isArray(data) ? data : (data.items || data.data || []);
      set({ alerts: items, isLoading: false });
    } catch (err) {
      set({ error: err?.response?.data?.error?.message || 'Lỗi tải cảnh báo', isLoading: false });
    }
  },

  acknowledgeAlert: async (id) => {
    try {
      const updated = await apiAcknowledgeAlert(id);
      set((state) => ({
        alerts: state.alerts.map((a) => a.id === id ? { ...a, status: 'ACKNOWLEDGED', ...updated } : a),
      }));
    } catch (_) {}
  },

  resolveAlert: async (id) => {
    try {
      await apiResolveAlert(id);
      set((state) => ({
        alerts: state.alerts.filter((a) => a.id !== id),
      }));
    } catch (_) {}
  },

  // ─── Aliases tương thích ───
  dismissAlert: (id) => {
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }));
  },

  resetAlerts: () => {
    get().fetchAlerts();
  },

  // ─── Đếm số cảnh báo đang mở (Sidebar badge) ───
  getOpenCount: () => {
    return get().alerts.filter((a) =>
      a.status === 'OPEN' || a.status === 'open' || !a.status
    ).length;
  },
}));
