import { apiClient } from '../lib/apiClient';

// GET /orders — backend trả { success, items, pagination, metrics, timeframeCounts }
export async function apiGetOrders({ page = 1, limit = 50, status = '', search = '', from = '', to = '' } = {}) {
  const params = { page, limit };
  if (status && status !== 'ALL') params.status = status;
  if (search && search.trim()) params.search = search.trim();
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get('/orders', { params });
  return {
    items: data.items || data.data || [],
    pagination: data.pagination || { page: 1, limit, total: 0, totalPages: 1 },
    metrics: data.metrics || null,
    timeframeCounts: data.timeframeCounts || null,
  };
}

// GET /orders/:id — backend trả { success, data: order }
export async function apiGetOrder(id) {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data.data || data;
}

// POST /orders
export async function apiCreateOrder(payload) {
  const { data } = await apiClient.post('/orders', payload, {
    headers: { 'Idempotency-Key': `order-${Date.now()}-${Math.random()}` },
  });
  return data.data;
}

// POST /orders/:id/confirm
export async function apiConfirmOrder(id) {
  const { data } = await apiClient.post(`/orders/${id}/confirm`, {}, {
    headers: { 'Idempotency-Key': `confirm-${id}-${Date.now()}` },
  });
  return data.data;
}

// POST /orders/:id/fulfill
export async function apiFulfillOrder(id) {
  const { data } = await apiClient.post(`/orders/${id}/fulfill`);
  return data.data;
}

// POST /orders/:id/cancel
export async function apiCancelOrder(id, { reason = 'Khách hủy đơn' } = {}) {
  const cancelReason = (typeof reason === 'string' && reason.trim()) ? reason.trim() : 'Khách hủy đơn';
  const { data } = await apiClient.post(`/orders/${id}/cancel`, { cancelReason }, {
    headers: { 'Idempotency-Key': `cancel-${id}-${Date.now()}` },
  });
  return data.data;
}
