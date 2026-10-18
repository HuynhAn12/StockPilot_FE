import { apiClient } from '../lib/apiClient';

/**
 * Tạo đơn bán hàng trực tiếp tại quầy POS
 * POST /api/v1/pos/sales
 * @param {Object} payload { warehouseId, customerName, customerPhone, discountAmount, taxAmount, note, paymentMethod, items }
 */
export async function apiCreatePosSale(payload) {
  const idempotencyKey = `pos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const { data } = await apiClient.post('/pos/sales', payload, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
  return data.data; // { order, payment, warehouse, receipt }
}

export async function apiGetPosProducts({ search = '', categoryId = '' } = {}) {
  const params = { page: 1, limit: 500 };
  if (search) params.search = search;
  if (categoryId) params.categoryId = categoryId;
  const { data } = await apiClient.get('/products', { params });
  return data.items || data.data || [];
}

/**
 * Tạo link và mã VietQR PayOS
 * POST /api/v1/pos/payos/create-link
 */
export async function apiCreatePayosLink(payload) {
  const { data } = await apiClient.post('/pos/payos/create-link', payload);
  return data.data;
}

/**
 * Kiểm tra trạng thái thanh toán đơn PayOS
 * GET /api/v1/pos/payos/status/:orderCode
 */
export async function apiCheckPayosStatus(orderCode) {
  const { data } = await apiClient.get(`/pos/payos/status/${orderCode}`);
  return data.data;
}

/**
 * Tạo yêu cầu thanh toán mã QR Ví MoMo
 * POST /api/v1/pos/momo/create-payment
 */
export async function apiCreateMomoPayment(payload) {
  const { data } = await apiClient.post('/pos/momo/create-payment', payload);
  return data.data;
}

/**
 * Kiểm tra trạng thái thanh toán MoMo
 * GET /api/v1/pos/momo/status/:momoOrderId
 */
export async function apiCheckMomoStatus(momoOrderId) {
  const { data } = await apiClient.get(`/pos/momo/status/${momoOrderId}`);
  return data.data;
}

/**
 * Lấy cấu hình Ví MoMo nhận tiền của cửa hàng
 * GET /api/v1/pos/momo/config
 */
export async function apiGetMomoConfig() {
  const { data } = await apiClient.get('/pos/momo/config');
  return data.data;
}

/**
 * Lưu cấu hình Ví MoMo nhận tiền của cửa hàng
 * POST /api/v1/pos/momo/config
 */
export async function apiSaveMomoConfig(payload) {
  const { data } = await apiClient.post('/pos/momo/config', payload);
  return data.data;
}

/**
 * Xác nhận thanh toán MoMo thành công (dành cho mô phỏng / xác nhận nhanh)
 * POST /api/v1/pos/momo/confirm-success/:momoOrderId
 */
export async function apiConfirmMomoSuccess(momoOrderId) {
  const { data } = await apiClient.post(`/pos/momo/confirm-success/${momoOrderId}`);
  return data.data;
}


