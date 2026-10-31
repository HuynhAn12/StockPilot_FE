import { apiClient, getApiError } from '../lib/apiClient';

// ─── Mapping Role: backend → frontend ───
export const ROLE_MAP = {
  SHOP_OWNER: 'store_owner',
  WAREHOUSE_STAFF: 'warehouse_staff',
  ADMIN: 'admin',
};

export const ROLE_MAP_REVERSE = {
  store_owner: 'SHOP_OWNER',
  warehouse_staff: 'WAREHOUSE_STAFF',
  admin: 'ADMIN',
};

export function normalizeUser(user) {
  return {
    ...user,
    role: ROLE_MAP[user.role] || user.role,
    name: user.fullName,
    storeName: user.store?.name || '',
    storeCode: user.store?.code || '',
  };
}

// POST /auth/login
export async function apiLogin({ email, password, otpCode }) {
  // otpCode: mã 2FA (6 số) hoặc mã khôi phục — chỉ gửi khi admin đã bật xác thực 2 lớp
  const { data } = await apiClient.post('/auth/login', { email, password, ...(otpCode ? { otpCode } : {}) });
  const raw = data.data;
  return {
    user: normalizeUser({ ...raw.user, store: raw.store }),
    token: raw.tokens.accessToken,
    refreshToken: raw.tokens.refreshToken,
  };
}

// POST /auth/send-register-otp
export async function apiSendRegisterOtp({ fullName, email, storeCode }) {
  const { data } = await apiClient.post('/auth/send-register-otp', {
    fullName, email, storeCode,
  });
  return data;
}

// POST /auth/register
export async function apiRegister({ fullName, email, password, storeName, storeCode, phone, address, otp }) {
  const { data } = await apiClient.post('/auth/register', {
    fullName, email, password, storeName, storeCode, phone, address, otp,
  });
  const raw = data.data;
  return {
    user: normalizeUser({ ...raw.user, store: raw.store }),
    token: raw.tokens.accessToken,
    refreshToken: raw.tokens.refreshToken,
  };
}

// POST /auth/logout
export async function apiLogout({ refreshToken }) {
  await apiClient.post('/auth/logout', { refreshToken });
}

// GET /auth/me
export async function apiGetMe() {
  const { data } = await apiClient.get('/auth/me');
  return normalizeUser(data.data);
}

// POST /auth/forgot-password
export async function apiForgotPassword({ email, phone }) {
  const payload = {};
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  const { data } = await apiClient.post('/auth/forgot-password', payload);
  return data;
}

// POST /auth/verify-otp
export async function apiVerifyOtp({ email, phone, otp }) {
  const payload = { otp };
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  const { data } = await apiClient.post('/auth/verify-otp', payload);
  return data;
}

// POST /auth/reset-password
export async function apiResetPassword({ token, email, phone, otp, newPassword }) {
  const payload = { newPassword };
  if (token) payload.token = token;
  if (email && otp) {
    payload.email = email;
    payload.otp = otp;
  }
  if (phone && otp) {
    payload.phone = phone;
    payload.otp = otp;
  }
  const { data } = await apiClient.post('/auth/reset-password', payload);
  return data;
}

export { getApiError };
