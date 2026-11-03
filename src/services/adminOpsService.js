import { apiClient } from '../lib/apiClient';

/**
 * API cho các chức năng vận hành & bảo mật của Admin (backend: /api/v1/admin/ops, xem
 * backend/docs/ADMIN_OPS_API.md). Mọi request đi qua apiClient để tự gắn Authorization.
 * Backend trả `{ success, message?, data }` — các hàm dưới trả thẳng `data`.
 */

function clean(params = {}) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'ALL') out[key] = value;
  }
  return out;
}

const get = async (url, params) => (await apiClient.get(url, { params: clean(params) })).data.data;
const post = async (url, body) => (await apiClient.post(url, body)).data.data;
const put = async (url, body) => (await apiClient.put(url, body)).data.data;

// ─── Tác vụ nền (A2) ─────────────────────────────────────────────────────
export const apiGetOpsJobs = () => get('/admin/ops/jobs');
export const apiRunDecisionForStore = (storeId) => post(`/admin/ops/jobs/decision/stores/${storeId}/run`);

// ─── Bảo mật đăng nhập (A1) ──────────────────────────────────────────────
export const apiGetLoginFailures = (params) => get('/admin/ops/security/login-failures', params);
export const apiClearLoginLock = (accountKey, reason) =>
  post(`/admin/ops/security/accounts/${encodeURIComponent(accountKey)}/clear-lock`, { reason });

// ─── Thanh toán (A3) ─────────────────────────────────────────────────────
export const apiGetPaymentHealth = (params) => get('/admin/ops/payments/health', params);

// ─── Hỗ trợ SLA (B4) / Tăng trưởng (B3) / Dữ liệu (C1) ──────────────────
export const apiGetSupportSla = (params) => get('/admin/ops/support/sla', params);
export const apiGetGrowth = (params) => get('/admin/ops/growth', params);
export const apiGetRetentionReport = (params) => get('/admin/ops/data/retention', params);

// ─── Cài đặt vận hành & lịch sử (C4) ─────────────────────────────────────
export const apiGetOpsSettings = () => get('/admin/ops/settings');
export const apiUpdateOpsSetting = (key, value) => put(`/admin/ops/settings/${encodeURIComponent(key)}`, { value });
export const apiGetSettingHistory = (params) => get('/admin/ops/settings/history', params);
export const apiRestoreSetting = (auditId, reason) => post(`/admin/ops/settings/history/${auditId}/restore`, { reason });

// ─── Chuyển chủ cửa hàng (B5) ────────────────────────────────────────────
export const apiTransferStoreOwner = (storeId, payload) => post(`/admin/ops/stores/${storeId}/transfer-owner`, payload);

// ─── Thông báo (B2) ──────────────────────────────────────────────────────
export const apiBroadcastAnnouncement = (payload) => post('/admin/ops/announcements', payload);

// ─── Xác thực 2 lớp (C3) ─────────────────────────────────────────────────
export const apiGetTwoFactorStatus = () => get('/admin/ops/2fa');
export const apiStartTwoFactorSetup = (actorPassword) => post('/admin/ops/2fa/setup', { actorPassword });
export const apiEnableTwoFactor = (code) => post('/admin/ops/2fa/enable', { code });
export const apiDisableTwoFactor = (actorPassword, code) => post('/admin/ops/2fa/disable', { actorPassword, code });
export const apiResetTwoFactor = (userId, actorPassword, reason) =>
  post(`/admin/ops/2fa/users/${userId}/reset`, { actorPassword, reason });
