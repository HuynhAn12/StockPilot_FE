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

/**
 * Lấy danh sách hàng hóa phục vụ bán hàng POS
 * GET /api/v1/products?limit=200
 */
export async function apiGetPosProducts({ search = '', categoryId = '' } = {}) {
  const params = { page: 1, limit: 100 };
  if (search) params.search = search;
  if (categoryId) params.categoryId = categoryId;
  const { data } = await apiClient.get('/products', { params });
  return data.items || data.data || [];
}
