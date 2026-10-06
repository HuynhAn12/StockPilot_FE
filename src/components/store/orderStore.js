/**
 * orderStore.js — lấy dữ liệu từ backend API thật.
 */
import { create } from 'zustand';
import {
  apiGetOrders,
  apiCreateOrder,
  apiConfirmOrder,
  apiFulfillOrder,
  apiCancelOrder,
} from '../../services/orderService';

export const useOrderStore = create((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  // ─── Load danh sách đơn hàng ───
  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGetOrders(params);
      const items = Array.isArray(data) ? data : (data.items || data.data || []);
      set({ orders: items, isLoading: false });
    } catch (err) {
      set({ error: err?.response?.data?.error?.message || 'Lỗi tải đơn hàng', isLoading: false });
    }
  },

  // ─── Tạo đơn hàng ───
  createOrder: async (orderData) => {
    const order = await apiCreateOrder(orderData);
    set((state) => ({ orders: [order, ...state.orders] }));
    return order;
  },

  // ─── Xác nhận đơn hàng (DRAFT → CONFIRMED) ───
  confirmOrder: async (id) => {
    const updated = await apiConfirmOrder(id);
    set((state) => ({
      orders: state.orders.map((o) => o.id === id ? { ...o, ...updated } : o),
    }));
    return updated;
  },

  // ─── Xuất kho (CONFIRMED → FULFILLED) ───
  fulfillOrder: async (id) => {
    const updated = await apiFulfillOrder(id);
    set((state) => ({
      orders: state.orders.map((o) => o.id === id ? { ...o, ...updated } : o),
    }));
    return updated;
  },

  // ─── Hủy đơn hàng ───
  cancelOrder: async (id, { reason = '' } = {}) => {
    const updated = await apiCancelOrder(id, { reason });
    set((state) => ({
      orders: state.orders.map((o) => o.id === id ? { ...o, ...updated } : o),
    }));
    return updated;
  },

  // ─── Cập nhật status (legacy compat) ───
  updateOrderStatus: async (id, newStatus) => {
    if (newStatus === 'FULFILLED') return get().fulfillOrder(id);
    if (newStatus === 'CANCELED' || newStatus === 'CANCELLED') return get().cancelOrder(id);
    if (newStatus === 'CONFIRMED') return get().confirmOrder(id);
  },
}));
