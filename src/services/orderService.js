import { apiClient } from '../lib/apiClient';

// GET /orders
export async function apiGetOrders({ page = 1, limit = 50, status = '', search = '' } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  if (search) params.search = search;
  const { data } = await apiClient.get('/orders', { params });
  return data.data;
}

// GET /orders/:id
export async function apiGetOrder(id) {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data.data;
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
export async function apiCancelOrder(id, { reason = '' } = {}) {
  const { data } = await apiClient.post(`/orders/${id}/cancel`, { reason }, {
    headers: { 'Idempotency-Key': `cancel-${id}-${Date.now()}` },
  });
  return data.data;
}
