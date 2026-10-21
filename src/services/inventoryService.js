import { apiClient } from '../lib/apiClient';

// GET /inventory/balances (tồn kho hiện tại)
// Backend trả về { success, items, pagination }
export async function apiGetInventoryBalances({ page = 1, limit = 500, productId = '' } = {}) {
  const params = { page, limit };
  if (productId) params.productId = productId;
  const { data } = await apiClient.get('/inventory/balances', { params });
  return data.items || data.data || data || [];
}

// GET /inventory/movements (lịch sử nhập/xuất)
// Backend trả về { success, items, pagination }
export async function apiGetInventoryMovements({ page = 1, limit = 50 } = {}) {
  const params = { page, limit };
  const { data } = await apiClient.get('/inventory/movements', { params });
  return data.items || data.data || data || [];
}

// POST /inventory/inflow (nhập kho)
export async function apiStockIn(payload) {
  const { data } = await apiClient.post('/inventory/inflow', payload);
  return data.data;
}

// POST /inventory/outflow (xuất kho)
export async function apiStockOut(payload) {
  const { data } = await apiClient.post('/inventory/outflow', payload);
  return data.data;
}

// POST /inventory/audit (kiểm kê / điều chỉnh)
export async function apiAdjustStock(payload) {
  const { data } = await apiClient.post('/inventory/audit', payload);
  return data.data;
}

// GET /stock-takes (danh sách phiên kiểm kê)
export async function apiGetStockTakes({ page = 1, limit = 20 } = {}) {
  const { data } = await apiClient.get('/stock-takes', { params: { page, limit } });
  return data.data || data;
}

// GET /stock-takes/:id
export async function apiGetStockTakeById(id) {
  const { data } = await apiClient.get(`/stock-takes/${id}`);
  return data.data;
}

// GET /returns (đơn trả hàng)
export async function apiGetReturns({ page = 1, limit = 20 } = {}) {
  const { data } = await apiClient.get('/returns', { params: { page, limit } });
  return data.data || data;
}

// POST /returns (tạo đơn trả hàng)
export async function apiCreateReturn(payload) {
  const { data } = await apiClient.post('/returns', payload);
  return data.data;
}

// GET /alerts
export async function apiGetAlerts({ page = 1, limit = 50, status = '', type = '' } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  if (type) params.type = type;
  const { data } = await apiClient.get('/alerts', { params });
  return data.data || data;
}

// GET /alerts/stats
export async function apiGetAlertStats() {
  const { data } = await apiClient.get('/alerts/stats');
  return data.data || data;
}

// POST /decision-engine/recalculate — chạy lại Decision Engine để tạo/cập nhật alerts
export async function apiRecalculateAlerts() {
  const { data } = await apiClient.post('/decision-engine/recalculate');
  return data.data;
}

// POST /alerts/:id/acknowledge (backend dùng POST không phải PATCH)
export async function apiAcknowledgeAlert(id) {
  const { data } = await apiClient.post(`/alerts/${id}/acknowledge`);
  return data.data;
}

// POST /alerts/:id/resolve
export async function apiResolveAlert(id) {
  const { data } = await apiClient.post(`/alerts/${id}/resolve`);
  return data.data;
}

// GET /assistant/sku/:stockItemId
export async function apiExplainSku(stockItemId) {
  const { data } = await apiClient.get(`/assistant/sku/${stockItemId}`);
  return data.data;
}
