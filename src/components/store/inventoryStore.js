/**
 * inventoryStore.js — quản lý kho: balances, movements, stock-takes, returns.
 */
import { create } from 'zustand'
import {
  apiGetInventoryBalances,
  apiGetInventoryMovements,
  apiStockIn,
  apiStockOut,
  apiAdjustStock,
  apiGetStockTakes,
  apiGetReturns,
  apiCreateReturn,
} from '../../services/inventoryService';

export const useInventoryStore = create((set, get) => ({
  // ─── Tồn kho hiện tại ───
  balances: [],
  // ─── Lịch sử nhập/xuất ───
  movements: [],
  // ─── Phiên kiểm kê (bảng stock_takes) ───
  stockTakeSessions: [],
  // ─── Đơn trả hàng (bảng return_orders) ───
  returns: [],

  isLoading: false,
  error: null,

  // ─── Lấy tồn kho (inventory_balances) ───
  fetchBalances: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGetInventoryBalances(params);
      const items = Array.isArray(data) ? data : (data.items || []);
      set({ balances: items, isLoading: false });
    } catch (err) {
      set({ error: err?.response?.data?.error?.message || 'Lỗi tải tồn kho', isLoading: false });
    }
  },

  // ─── Lấy lịch sử nhập/xuất (stock_movements) ───
  fetchMovements: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGetInventoryMovements(params);
      const items = Array.isArray(data) ? data : (data.items || []);
      set({ movements: items, isLoading: false });
    } catch (err) {
      set({ error: err?.response?.data?.error?.message || 'Lỗi tải lịch sử kho', isLoading: false });
    }
  },

  // ─── Lấy phiên kiểm kê (stock_takes) ───
  fetchStockTakes: async () => {
    try {
      const data = await apiGetStockTakes();
      const items = Array.isArray(data) ? data : (data.items || []);
      set({ stockTakeSessions: items });
    } catch (_) {}
  },

  // ─── Lấy đơn trả hàng (return_orders) ───
  fetchReturns: async () => {
    try {
      const data = await apiGetReturns();
      const items = Array.isArray(data) ? data : (data.items || []);
      set({ returns: items });
    } catch (_) {}
  },

  // ─── Nhập kho ───
  stockIn: async (payload) => {
    const result = await apiStockIn(payload);
    await get().fetchMovements();
    await get().fetchBalances();
    return result;
  },

  // ─── Xuất kho ───
  stockOut: async (payload) => {
    const result = await apiStockOut(payload);
    await get().fetchMovements();
    await get().fetchBalances();
    return result;
  },

  // ─── Kiểm kê / điều chỉnh (inventory/audit → stock_take_items) ───
  stockAdjustment: async (payload) => {
    const result = await apiAdjustStock(payload);
    await get().fetchMovements();
    await get().fetchBalances();
    return result;
  },

  // ─── Tạo đơn trả hàng ───
  createReturn: async (payload) => {
    const result = await apiCreateReturn(payload);
    await get().fetchReturns();
    return result;
  },
}));
