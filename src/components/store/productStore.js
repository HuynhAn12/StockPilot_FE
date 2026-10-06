/**
 * productStore.js — lấy dữ liệu từ backend API thật.
 * Không còn hardcode sản phẩm.
 */
import { create } from 'zustand';
import { apiGetProducts, apiGetCategories, apiCreateProduct, apiUpdateProduct, apiDeleteProduct } from '../../services/productService';

// ─── Categories matching Database & UI ───
export const CATEGORIES = [
  { value: 'tpcn', id: 'tpcn', label: 'Thực phẩm', icon: '🍞', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'drink', id: 'drink', label: 'Đồ uống', icon: '☕', color: 'bg-blue-100 text-blue-700' },
  { value: 'spice', id: 'spice', label: 'Gia vị & Đồ khô', icon: '🧂', color: 'bg-amber-100 text-amber-700' },
  { value: 'house', id: 'house', label: 'Đồ dùng gia đình', icon: '🧹', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'care', id: 'care', label: 'Chăm sóc cá nhân', icon: '🧴', color: 'bg-pink-100 text-pink-700' },
  { value: 'misc', id: 'misc', label: 'Tiêu dùng khác', icon: '🔋', color: 'bg-slate-100 text-slate-700' },
  // Legacy aliases
  { value: 'thuc-pham', id: 'thuc-pham', label: 'Thực phẩm', icon: '🍞', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'do-an', id: 'do-an', label: 'Đồ ăn', icon: '🍞', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'do-uong', id: 'do-uong', label: 'Đồ uống', icon: '☕', color: 'bg-blue-100 text-blue-700' },
  { value: 'gia-vi', id: 'gia-vi', label: 'Gia vị', icon: '🧂', color: 'bg-orange-100 text-orange-700' },
  { value: 'gia-dinh', id: 'gia-dinh', label: 'Gia dụng', icon: '🧹', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'ca-nhan', id: 'ca-nhan', label: 'Cá nhân', icon: '🧴', color: 'bg-pink-100 text-pink-700' },
];

export const UNITS = ['Cái', 'Hộp', 'Chai', 'Túi', 'Kg', 'Gói', 'Thùng', 'Lọ', 'Cuộn', 'Đôi', 'Bộ', 'Tờ'];

export function normalizeProduct(p) {
  if (!p) return null;
  const si = p.stockItems?.[0] || {};
  const stockQty = si.balances?.reduce((sum, b) => sum + (b.quantity || 0), 0) ?? (p.stock || 0);
  const cost = Number(si.costPrice ?? p.costPrice ?? 0);
  const sale = Number(si.sellingPrice ?? p.salePrice ?? p.price ?? 0);
  const catCode = p.category?.code?.toLowerCase() || (typeof p.category === 'string' ? p.category.toLowerCase() : '') || 'misc';
  const catName = p.category?.name || (typeof p.category === 'string' ? p.category : 'Khác');

  let overrides = {};
  try {
    const allOverrides = JSON.parse(localStorage.getItem('stockpilot_overrides') || '{}');
    overrides = allOverrides[p.id] || {};
  } catch (_) {}

  return {
    ...p,
    id: p.id,
    name: overrides.name || p.name,
    code: p.code || si.sku || `SP-${p.id}`,
    sku: si.sku || p.code || `SKU-${p.id}`,
    barcode: si.barcode || p.barcode || p.code || '',
    stock: stockQty,
    costPrice: overrides.costPrice !== undefined ? overrides.costPrice : cost,
    salePrice: overrides.salePrice !== undefined ? overrides.salePrice : sale,
    price: overrides.salePrice !== undefined ? overrides.salePrice : sale,
    sellingPrice: overrides.salePrice !== undefined ? overrides.salePrice : sale,
    imageUrl: overrides.imageUrl || p.imageUrl || '',
    unit: p.unit || 'Cái',
    status: (p.isActive ?? true) ? 'active' : 'inactive',
    alertThreshold: si.minStockLevel || p.alertThreshold || 10,
    category: catCode,
    categoryLabel: catName,
    categoryName: catName,
    stockItems: p.stockItems || [],
  };
}

export const useProductStore = create((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 100, total: 0 },

  // ─── Load sản phẩm từ API ───
  fetchProducts: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGetProducts({ page: 1, limit: 100, ...params });
      const rawItems = Array.isArray(data) ? data : (data.items || data.data || []);
      const items = rawItems.map(normalizeProduct).filter(Boolean);
      set({
        products: items,
        isLoading: false,
        pagination: { total: data.total || items.length, page: data.page || 1, limit: data.limit || 100 }
      });
    } catch (err) {
      set({ error: err?.response?.data?.error?.message || 'Lỗi tải sản phẩm', isLoading: false });
    }
  },

  // ─── Load categories từ API ───
  fetchCategories: async () => {
    try {
      const data = await apiGetCategories();
      const items = Array.isArray(data) ? data : (data.items || []);
      set({ categories: items });
    } catch (_) {}
  },

  // ─── Thêm sản phẩm ───
  addProduct: async (payload) => {
    const data = await apiCreateProduct(payload);
    const item = normalizeProduct(data) || data;
    set((state) => ({ products: [item, ...state.products] }));
    return item;
  },

  // ─── Cập nhật sản phẩm ───
  updateProduct: async (id, payload) => {
    try {
      await apiUpdateProduct(id, payload);
    } catch (_) {}
    try {
      const allOverrides = JSON.parse(localStorage.getItem('stockpilot_overrides') || '{}');
      allOverrides[id] = { ...(allOverrides[id] || {}), ...payload };
      localStorage.setItem('stockpilot_overrides', JSON.stringify(allOverrides));
    } catch (_) {}
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id
          ? {
              ...p,
              ...payload,
              price: payload.salePrice !== undefined ? payload.salePrice : p.price,
              sellingPrice: payload.salePrice !== undefined ? payload.salePrice : p.sellingPrice,
            }
          : p
      ),
    }));
  },

  // ─── Xóa sản phẩm (optimistic) ───
  removeProduct: (id) => {
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
  },

  // ─── Aliases tương thích với code cũ ───
  deleteProduct: async (id) => {
    get().removeProduct(id);
    try {
      await apiDeleteProduct(id);
    } catch (e) {
      console.warn('Lỗi khi xóa sản phẩm từ backend:', e);
    }
  },

  toggleProductStatus: (id) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id
          ? {
              ...p,
              isActive: !p.isActive,
              status: p.status === 'active' ? 'inactive' : 'active',
            }
          : p
      ),
    }));
  },

  resetToDefault: () => {
    get().fetchProducts();
  },
}));
