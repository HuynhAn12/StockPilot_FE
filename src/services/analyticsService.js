import { apiClient } from '../lib/apiClient';

// GET /analytics/dashboard — tổng quan doanh thu, tồn kho
export async function apiGetAnalyticsSummary() {
  const { data } = await apiClient.get('/analytics/dashboard');
  return data.data;
}

// GET /historical-sales — lịch sử bán hàng (bảng historical_sales)
export async function apiGetHistoricalSales({ page = 1, limit = 50 } = {}) {
  const { data } = await apiClient.get('/historical-sales', { params: { page, limit } });
  return data.data || data;
}

// GET /recommendations — gợi ý giá (bảng pricing_recommendations)
export async function apiGetPricingRecommendations({ page = 1, limit = 50, status = '' } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  const { data } = await apiClient.get('/recommendations', { params });
  return data.data || data;
}

// PATCH /recommendations/:id/accept
export async function apiAcceptPricingRecommendation(id) {
  const { data } = await apiClient.patch(`/recommendations/${id}/accept`);
  return data.data;
}

// PATCH /recommendations/:id/reject
export async function apiRejectPricingRecommendation(id) {
  const { data } = await apiClient.patch(`/recommendations/${id}/reject`);
  return data.data;
}

// GET /notifications — thông báo (bảng notifications)
export async function apiGetNotifications({ page = 1, limit = 20 } = {}) {
  const { data } = await apiClient.get('/notifications', { params: { page, limit } });
  return data.data || data;
}

// POST /notifications/:id/read
export async function apiMarkNotificationRead(id) {
  const { data } = await apiClient.post(`/notifications/${id}/read`);
  return data.data;
}

// POST /notifications/read-all
export async function apiMarkAllNotificationsRead() {
  const { data } = await apiClient.post('/notifications/read-all');
  return data.data;
}

// GET /users — danh sách user (admin)
export async function apiGetUsers({ page = 1, limit = 50 } = {}) {
  const { data } = await apiClient.get('/users', { params: { page, limit } });
  return data.data || data;
}

// GET /export/products, /export/orders — xuất file
export async function apiExportProducts() {
  const response = await apiClient.get('/export/products', { responseType: 'blob' });
  return response.data;
}

export async function apiExportOrders() {
  const response = await apiClient.get('/export/orders', { responseType: 'blob' });
  return response.data;
}

export async function apiExportInventory() {
  const response = await apiClient.get('/export/inventory', { responseType: 'blob' });
  return response.data;
}

// GET /store-payment-config/payos
export async function apiGetPaymentConfig() {
  const { data } = await apiClient.get('/store-payment-config/payos');
  return data.data;
}

// PUT /store-payment-config/payos
export async function apiUpdatePaymentConfig(payload) {
  const { data } = await apiClient.put('/store-payment-config/payos', payload);
  return data.data;
}

// GET /audit-logs (bảng audit_logs)
export async function apiGetAuditLogs({ page = 1, limit = 50, entityType = 'ALL', search = '' } = {}) {
  const params = { page, limit };
  if (entityType && entityType !== 'ALL') params.entityType = entityType;
  if (search) params.search = search;
  const { data } = await apiClient.get('/audit-logs', { params });
  return data;
}

// AI Assistant APIs (bảng ai_interactions)
export async function apiGetAssistantOverview() {
  const { data } = await apiClient.get('/assistant/overview');
  return data.data;
}

export async function apiChatWithAssistant(question, stockItemId = null) {
  const { data } = await apiClient.post('/assistant/chat', { question, stockItemId });
  return data.data;
}

export async function apiGetAssistantHistory({ limit = 20 } = {}) {
  const { data } = await apiClient.get('/assistant/history', { params: { limit } });
  return data.data;
}

// Decision Engine Config (bảng engine_configs)
export async function apiGetDecisionConfig() {
  const { data } = await apiClient.get('/decision-engine/config');
  return data.data;
}

export async function apiUpdateDecisionConfig(payload) {
  const { data } = await apiClient.put('/decision-engine/config', payload);
  return data.data;
}

