import { apiClient } from '../lib/apiClient';

function clean(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

export const SUPPORT_CATEGORY_LABELS = {
  DATA_IMPORT: 'Nhập dữ liệu (KiotViet, Excel)',
  PAYMENT: 'Thanh toán, PayOS',
  ACCOUNT: 'Tài khoản, đăng nhập',
  BUG: 'Báo lỗi phần mềm',
  HOW_TO: 'Hướng dẫn sử dụng',
  OTHER: 'Khác',
};

export const SUPPORT_STATUS_LABELS = {
  OPEN: 'Chờ hỗ trợ',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_STORE: 'Chờ cửa hàng phản hồi',
  RESOLVED: 'Đã giải quyết',
};

export const SUPPORT_PRIORITY_LABELS = { LOW: 'Thấp', NORMAL: 'Bình thường', HIGH: 'Gấp' };

// ─── Cửa hàng ────────────────────────────────────────────────────────────
export async function apiListMyTickets(params = {}) {
  const { data } = await apiClient.get('/support/tickets', { params: clean(params) });
  return { data: data.data || [], pagination: data.pagination };
}

export async function apiCreateTicket(payload) {
  const { data } = await apiClient.post('/support/tickets', payload);
  return data.data;
}

export async function apiGetMyTicket(id) {
  const { data } = await apiClient.get(`/support/tickets/${id}`);
  return data.data;
}

export async function apiReplyMyTicket(id, body) {
  const { data } = await apiClient.post(`/support/tickets/${id}/messages`, { body });
  return data.data;
}

// ─── Admin ───────────────────────────────────────────────────────────────
export async function apiAdminListTickets(params = {}) {
  const { data } = await apiClient.get('/admin/support/tickets', { params: clean(params) });
  return { data: data.data || [], pagination: data.pagination, summary: data.summary };
}

export async function apiAdminGetTicket(id) {
  const { data } = await apiClient.get(`/admin/support/tickets/${id}`);
  return data.data;
}

export async function apiAdminReplyTicket(id, body, isInternal = false) {
  const { data } = await apiClient.post(`/admin/support/tickets/${id}/messages`, { body, isInternal });
  return data.data;
}

export async function apiAdminUpdateTicket(id, patch) {
  const { data } = await apiClient.patch(`/admin/support/tickets/${id}`, patch);
  return data.data;
}
