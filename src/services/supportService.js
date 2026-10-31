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

/**
 * JSON when there are no images, multipart (text fields + files[]) when there are.
 * apiClient defaults to application/json, which would make axios serialise FormData as JSON,
 * so multipart requests set their content type explicitly.
 */
function postWithImages(url, fields, files = []) {
  if (!files.length) return apiClient.post(url, fields);
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  files.forEach((file) => form.append('files', file));
  return apiClient.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export const MAX_SUPPORT_IMAGES = 3;
export const MAX_SUPPORT_IMAGE_BYTES = 5 * 1024 * 1024;
export const SUPPORT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export const SUPPORT_PRIORITY_LABELS = { LOW: 'Thấp', NORMAL: 'Bình thường', HIGH: 'Gấp' };

// ─── Cửa hàng ────────────────────────────────────────────────────────────
export async function apiListMyTickets(params = {}) {
  const { data } = await apiClient.get('/support/tickets', { params: clean(params) });
  return { data: data.data || [], pagination: data.pagination };
}

export async function apiCreateTicket({ subject, category, message }, files = []) {
  const { data } = await postWithImages('/support/tickets', { subject, category, message }, files);
  return data.data;
}

export async function apiGetMyUnreadCount() {
  const { data } = await apiClient.get('/support/unread-count');
  return data.data?.unread ?? 0;
}

/** Images are private: load them with the auth header and show them through an object URL. */
export async function apiFetchMyAttachment(id) {
  const { data } = await apiClient.get(`/support/attachments/${id}`, { responseType: 'blob' });
  return data;
}

export async function apiGetMyTicket(id) {
  const { data } = await apiClient.get(`/support/tickets/${id}`);
  return data.data;
}

export async function apiReplyMyTicket(id, body, files = []) {
  const { data } = await postWithImages(`/support/tickets/${id}/messages`, { body }, files);
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

export async function apiAdminReplyTicket(id, body, isInternal = false, files = []) {
  const { data } = await postWithImages(`/admin/support/tickets/${id}/messages`, { body, isInternal }, files);
  return data.data;
}

export async function apiAdminFetchAttachment(id) {
  const { data } = await apiClient.get(`/admin/support/attachments/${id}`, { responseType: 'blob' });
  return data;
}

export async function apiAdminUpdateTicket(id, patch) {
  const { data } = await apiClient.patch(`/admin/support/tickets/${id}`, patch);
  return data.data;
}
