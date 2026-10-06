import { apiClient } from '../lib/apiClient';

// GET /products?page=1&limit=50&search=&categoryId=
export async function apiGetProducts({ page = 1, limit = 100, search = '', categoryId = '' } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  if (categoryId) params.categoryId = categoryId;
  const { data } = await apiClient.get('/products', { params });
  return data.items || data.data || [];
}

// GET /products/:id
export async function apiGetProduct(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data;
}

// POST /products
export async function apiCreateProduct(payload) {
  let body = payload;
  let initialStock = 0;

  if (!payload.items) {
    const rawCode = payload.code || payload.sku || `SP-${Date.now()}`;
    const code = rawCode.toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
    const sku = (payload.sku || code).toUpperCase().trim();
    const cost = Number(payload.costPrice || 0);
    const price = Number(payload.salePrice || payload.price || 0);
    const minStock = Number(payload.alertThreshold || 5);
    const maxStock = Math.max(100, minStock * 10);
    initialStock = Number(payload.stock || 0);

    let catId = undefined;
    if (typeof payload.categoryId === 'number') {
      catId = payload.categoryId;
    } else if (payload.category) {
      const categories = await apiGetCategories().catch(() => []);
      const matched = (Array.isArray(categories) ? categories : []).find(
        (c) => c.code?.toLowerCase() === String(payload.category).toLowerCase() || c.id === Number(payload.category)
      );
      if (matched) catId = matched.id;
    }

    body = {
      name: payload.name.trim(),
      code,
      description: payload.description || undefined,
      categoryId: catId,
      items: [
        {
          sku,
          name: payload.name.trim(),
          barcode: payload.barcode || undefined,
          costPrice: cost,
          sellingPrice: price,
          minStockLevel: minStock,
          maxStockLevel: maxStock,
        },
      ],
    };
  }

  const { data } = await apiClient.post('/products', body);
  const created = data.data;

  // If initial stock was provided, perform initial stock-in
  if (initialStock > 0 && created?.stockItems?.[0]?.id) {
    try {
      const stockItemId = created.stockItems[0].id;
      const warehouseId = created.stockItems[0].balances?.[0]?.warehouseId || 3;
      await apiClient.post('/inventory/in', {
        warehouseId,
        stockItemId,
        quantity: initialStock,
        unitCost: Number(created.stockItems[0].costPrice || 0),
        reason: 'Khởi tạo tồn kho ban đầu',
      });
      if (created.stockItems[0].balances?.[0]) {
        created.stockItems[0].balances[0].quantity = initialStock;
      }
    } catch (e) {
      console.warn('Không thể khởi tạo tồn kho tự động:', e);
    }
  }

  return created;
}

// PUT /products/:id
export async function apiUpdateProduct(id, payload) {
  const { data } = await apiClient.put(`/products/${id}`, payload);
  return data.data;
}

// DELETE /products/:id
export async function apiDeleteProduct(id) {
  try {
    const { data } = await apiClient.delete(`/products/${id}`);
    return data;
  } catch (e) {
    try {
      const { data } = await apiClient.put(`/products/${id}`, { isActive: false });
      return data;
    } catch (_) {
      return null;
    }
  }
}

// ─── Categories ───
// GET /categories
export async function apiGetCategories() {
  const { data } = await apiClient.get('/categories');
  return data.data;
}

// POST /categories
export async function apiCreateCategory(payload) {
  const { data } = await apiClient.post('/categories', payload);
  return data.data;
}
