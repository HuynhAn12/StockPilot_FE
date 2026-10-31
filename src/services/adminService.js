import { apiClient } from '../lib/apiClient';

/**
 * Service API dành riêng cho Quản trị viên hệ thống (Admin).
 * Toàn bộ request đều qua apiClient để gắn Authorization token tự động.
 */

// Format UTC/ISO timestamp to Vietnam time (dd/MM/yyyy HH:mm)
export function formatVNDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    const vnTime = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const day = String(vnTime.getDate()).padStart(2, '0');
    const month = String(vnTime.getMonth() + 1).padStart(2, '0');
    const year = vnTime.getFullYear();
    const hours = String(vnTime.getHours()).padStart(2, '0');
    const minutes = String(vnTime.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return String(isoString);
  }
}

// Format start-of-day in VN timezone to ISO string
export function toVnStartOfDayISO(dateStr) {
  if (!dateStr) return undefined;
  // dateStr is YYYY-MM-DD
  return `${dateStr}T00:00:00.000+07:00`;
}

// Format end-of-day in VN timezone to ISO string
export function toVnEndOfDayISO(dateStr) {
  if (!dateStr) return undefined;
  // dateStr is YYYY-MM-DD
  return `${dateStr}T23:59:59.999+07:00`;
}

function cleanParams(params = {}) {
  const cleaned = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// ─── 2.1 Dashboard ────────────────────────────────────────────────────────
// GET /admin/dashboard
export async function apiGetAdminDashboard() {
  const { data } = await apiClient.get('/admin/dashboard');
  return data.data;
}

// ─── 2.2 Quản lý Người dùng ───────────────────────────────────────────────
// GET /admin/users?page&limit&search&role&isActive&storeId&order
export async function apiListAdminUsers(params = {}) {
  const { data } = await apiClient.get('/admin/users', { params: cleanParams(params) });
  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

// GET /admin/users/:id
export async function apiGetAdminUser(id) {
  const { data } = await apiClient.get(`/admin/users/${id}`);
  return data.data;
}

// POST /admin/users ({ fullName, email, password, actorPassword }): actorPassword là mật khẩu của admin đang thao tác
export async function apiCreateAdminUser(payload) {
  const { data } = await apiClient.post('/admin/users', {
    fullName: payload.fullName?.trim(),
    email: payload.email?.trim().toLowerCase(),
    password: payload.password,
    actorPassword: payload.actorPassword,
  });
  return data;
}

// POST /admin/users/:id/revoke-sessions ({ reason }): đăng xuất mọi thiết bị, không khóa tài khoản
export async function apiRevokeAdminUserSessions(id, reason) {
  const { data } = await apiClient.post(`/admin/users/${id}/revoke-sessions`, { reason });
  return data.data;
}

// POST /admin/users/:id/password-reset: gửi mã đặt lại mật khẩu qua email người dùng
export async function apiSendAdminPasswordReset(id) {
  const { data } = await apiClient.post(`/admin/users/${id}/password-reset`);
  return data.data;
}

// PATCH /admin/users/:id/status ({ isActive: boolean, reason?: string })
export async function apiUpdateAdminUserStatus(id, payload) {
  const { data } = await apiClient.patch(`/admin/users/${id}/status`, payload);
  return data;
}

// ─── 2.3 Quản lý Cửa hàng ─────────────────────────────────────────────────
// GET /admin/stores?page&limit&search&isActive&order
export async function apiListAdminStores(params = {}) {
  const { data } = await apiClient.get('/admin/stores', { params: cleanParams(params) });
  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    summary: data.summary || null,
  };
}

// GET /admin/stores/:id
export async function apiGetAdminStore(id) {
  const { data } = await apiClient.get(`/admin/stores/${id}`);
  return data.data;
}

// PATCH /admin/stores/:id/status ({ isActive: boolean, reason?: string })
export async function apiUpdateAdminStoreStatus(id, payload) {
  const { data } = await apiClient.patch(`/admin/stores/${id}/status`, payload);
  return data;
}

// ─── 2.4 Nhật ký kiểm toán ───────────────────────────────────────────────
// GET /admin/audit-logs?page&limit&storeId&userId&action&entityType&search&from&to
export async function apiListAdminAuditLogs(params = {}) {
  const { data } = await apiClient.get('/admin/audit-logs', { params: cleanParams(params) });
  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 },
  };
}

// GET /admin/audit-logs/export
export async function apiExportAdminAuditLogs(params = {}) {
  const res = await apiClient.get('/admin/audit-logs/export', {
    params: cleanParams(params),
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

// ─── 2.5 Giám sát AI Pilot ────────────────────────────────────────────────
// GET /admin/ai-usage?from&to
export async function apiGetAdminAiUsage(params = {}) {
  const { data } = await apiClient.get('/admin/ai-usage', { params: cleanParams(params) });
  return data.data;
}

// ─── 2.6 Trạng thái cấu hình hệ thống (Chỉ đọc) ──────────────────────────
// GET /admin/system/config-status
export async function apiGetAdminSystemConfig() {
  const { data } = await apiClient.get('/admin/system/config-status');
  return data.data;
}

// ─── 2.7 Khách hàng tiềm năng (Leads) ────────────────────────────────────
// GET /admin/leads?page&limit&status&search&order
export async function apiListAdminLeads(params = {}) {
  const { data } = await apiClient.get('/admin/leads', { params: cleanParams(params) });
  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    summary: data.summary || null,
  };
}

// GET /admin/leads/:id: thông tin đầy đủ + lịch sử chăm sóc
export async function apiGetAdminLead(id) {
  const { data } = await apiClient.get(`/admin/leads/${id}`);
  return data.data;
}

// PATCH /admin/leads/:id ({ status?, assigneeId? })
export async function apiUpdateAdminLead(id, patch) {
  const { data } = await apiClient.patch(`/admin/leads/${id}`, patch);
  return data.data;
}

// POST /admin/leads/:id/notes ({ type: NOTE|CALL|EMAIL|MEETING, body })
export async function apiAddAdminLeadNote(id, payload) {
  const { data } = await apiClient.post(`/admin/leads/${id}/notes`, payload);
  return data.data;
}

// PATCH /admin/leads/:id/status ({ status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'REJECTED' })
export async function apiUpdateAdminLeadStatus(id, payload) {
  const { data } = await apiClient.patch(`/admin/leads/${id}/status`, payload);
  return data;
}

// ─── 2.8 Sức khỏe & Cài đặt hệ thống ─────────────────────────────────────
// GET /admin/system/health
export async function apiGetAdminSystemHealth() {
  const { data } = await apiClient.get('/admin/system/health');
  return data.data;
}

// GET /admin/system/settings
export async function apiGetAdminSettings() {
  const { data } = await apiClient.get('/admin/system/settings');
  return data.data || [];
}

// PUT /admin/system/settings/:key ({ value })
export async function apiUpdateAdminSetting(key, value) {
  const { data } = await apiClient.put(`/admin/system/settings/${key}`, { value });
  return data.data;
}

// GET /public/platform-status: thông báo toàn hệ thống + trạng thái mở đăng ký (không cần đăng nhập)
export async function apiGetPlatformStatus() {
  const { data } = await apiClient.get('/public/platform-status');
  return data.data;
}

// PATCH /admin/users/:id ({ fullName }): admin chỉ sửa được tên hiển thị
export async function apiUpdateAdminUser(id, payload) {
  const { data } = await apiClient.patch(`/admin/users/${id}`, payload);
  return data.data;
}

// PATCH /admin/stores/:id ({ name?, phone?, address? }): mã cửa hàng (subdomain) không đổi được
export async function apiUpdateAdminStore(id, payload) {
  const { data } = await apiClient.patch(`/admin/stores/${id}`, payload);
  return data.data;
}
