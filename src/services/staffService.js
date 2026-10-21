import { apiClient } from '../lib/apiClient';

/**
 * Lấy danh sách nhân viên của cửa hàng
 */
export async function apiGetStaffList({ page = 1, limit = 50 } = {}) {
  const { data } = await apiClient.get('/users', { params: { page, limit } });
  return data.items || data.data || [];
}

/**
 * Thêm nhân viên mới
 */
export async function apiCreateStaff(payload) {
  const { data } = await apiClient.post('/users', {
    fullName: payload.fullName.trim(),
    email: payload.email.toLowerCase().trim(),
    password: payload.password,
  });
  return data.data;
}

/**
 * Cập nhật thông tin nhân viên (họ tên, email, mật khẩu, trạng thái hoạt động)
 */
export async function apiUpdateStaff(id, payload) {
  const body = {};
  if (payload.fullName !== undefined) body.fullName = payload.fullName.trim();
  if (payload.email !== undefined && payload.email) body.email = payload.email.toLowerCase().trim();
  if (payload.password !== undefined && payload.password) body.password = payload.password;
  if (payload.isActive !== undefined) body.isActive = Boolean(payload.isActive);

  const { data } = await apiClient.patch(`/users/${id}`, body);
  return data.data;
}

/**
 * Xóa nhân viên khỏi hệ thống
 */
export async function apiDeleteStaff(id) {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
}
