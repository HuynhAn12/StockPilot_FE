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
export async function apiLogin({ email, password }) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  const raw = data.data;
  return {
    user: normalizeUser({ ...raw.user, store: raw.store }),
    token: raw.tokens.accessToken,
    refreshToken: raw.tokens.refreshToken,
  };
}

// POST /auth/register
export async function apiRegister({ fullName, email, password, storeName, storeCode, phone, address }) {
  const { data } = await apiClient.post('/auth/register', {
    fullName, email, password, storeName, storeCode, phone, address,
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
export async function apiForgotPassword({ email }) {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
}

// POST /auth/reset-password
export async function apiResetPassword({ token, newPassword }) {
  const { data } = await apiClient.post('/auth/reset-password', { token, newPassword });
  return data;
}

export { getApiError };
