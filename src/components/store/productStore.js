/**
 * productStore.js — lấy dữ liệu từ backend API thật.
 * Không còn hardcode sản phẩm.
 */
import { create } from 'zustand';
import { apiGetProducts, apiGetCategories, apiCreateProduct, apiUpdateProduct, apiDeleteProduct } from '../../services/productService';

// ─── Categories matching Database & UI (Chính xác 7 danh mục chuẩn) ───
export const CATEGORIES = [
  { value: 'tpcn', id: 'tpcn', label: 'Thực phẩm', icon: '📦', color: 'emerald' },
  { value: 'drink', id: 'drink', label: 'Đồ uống', icon: '☕', color: 'blue' },
  { value: 'spice', id: 'spice', label: 'Gia vị & Đồ khô', icon: '🧂', color: 'amber' },
  { value: 'house', id: 'house', label: 'Đồ dùng gia đình', icon: '🧹', color: 'indigo' },
  { value: 'care', id: 'care', label: 'Chăm sóc cá nhân', icon: '🧴', color: 'pink' },
  { value: 'office', id: 'office', label: 'Đồ dùng văn phòng', icon: '📎', color: 'cyan' },
  { value: 'misc', id: 'misc', label: 'Tiêu dùng khác', icon: '🔋', color: 'slate' },
];

// Mapping các tên/mã cũ hoặc biến thể về 7 danh mục chính thức
export const CATEGORY_ALIASES = {
  'thuc-pham': 'tpcn',
  'do-an': 'tpcn',
  'do-uong': 'drink',
  'gia-vi': 'spice',
  'gia-dinh': 'house',
  'gia-dung': 'house',
  'ca-nhan': 'care',
  'van-phong': 'office',
  'tieu-dung': 'misc',
};

export function getCategoryCanonical(cat) {
  if (!cat) return 'misc';
  const c = String(cat).toLowerCase().trim();
  return CATEGORY_ALIASES[c] || c;
}

export const UNITS = ['Cái', 'Hộp', 'Chai', 'Túi', 'Kg', 'Gói', 'Thùng', 'Lọ', 'Cuộn', 'Đôi', 'Bộ', 'Tờ'];

function safeNum(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'object') {
    if (typeof val.toNumber === 'function') return val.toNumber();
    if (Array.isArray(val.d) && val.d.length > 0) {
      return Number(val.d[0]) * (val.s < 0 ? -1 : 1);
    }
    return 0;
  }
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export function normalizeProduct(p) {
  if (!p) return null;
  const si = p.stockItems?.[0] || {};
  const stockQty = si.balances?.reduce((sum, b) => sum + (b.quantity || 0), 0) ?? (p.stock || 0);
  const cost = safeNum(si.costPrice ?? p.costPrice);
  const sale = safeNum(si.sellingPrice ?? p.salePrice ?? p.price);
  const rawCat = p.category?.code?.toLowerCase() || (typeof p.category === 'string' ? p.category.toLowerCase() : '') || 'misc';
  const catCode = getCategoryCanonical(rawCat);
  const matchedCat = CATEGORIES.find(c => c.value === catCode);
  const catName = p.category?.name || matchedCat?.label || (typeof p.category === 'string' ? p.category : 'Khác');

  return {
    ...p,
    id: p.id,
    name: p.name,
    code: p.code || si.sku || `SP-${p.id}`,
    sku: si.sku || p.code || `SP-${p.id}`,
    barcode: si.barcode || p.barcode || p.code || '',
    stock: stockQty,
    costPrice: cost,
    salePrice: sale,
    price: sale,
    sellingPrice: sale,
    imageUrl: p.imageUrl || '',
    unit: p.unit || 'Cái',
    status: (p.isActive ?? true) ? 'active' : 'inactive',
    alertThreshold: si.minStockLevel || p.alertThreshold || 10,
    category: catCode,
    categoryLabel: catName,
    categoryName: catName,
    stockItems: p.stockItems || [],
  };
}

function broadcastProductChange(action, data) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('stockpilot_product_updated', { detail: { action, data } }));
    const bc = new BroadcastChannel('stockpilot_channel');
    bc.postMessage({ type: 'PRODUCTS_UPDATED', action, data });
    bc.close();
  } catch (_) {}
}

export const useProductStore = create((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 500, total: 0 },

  // ─── Load sản phẩm từ API ───
  fetchProducts: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGetProducts({ page: 1, limit: 500, ...params });
      const rawItems = Array.isArray(data) ? data : (data.items || data.data || []);
      const items = rawItems.map(normalizeProduct).filter(Boolean);
      // Sort products ascending from 1 onwards (SP1, SP2, SP3...)
      items.sort((a, b) => {
        const numA = parseInt(String(a.code || a.id).replace(/\D/g, ''), 10) || Number(a.id) || 0;
        const numB = parseInt(String(b.code || b.id).replace(/\D/g, ''), 10) || Number(b.id) || 0;
        return numA - numB;
      });
      set({
        products: items,
        isLoading: false,
        pagination: { total: data.total || items.length, page: data.page || 1, limit: data.limit || 500 }
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
    try { localStorage.removeItem('stockpilot_overrides'); } catch (_) {}
    set((state) => ({ products: [item, ...state.products] }));
    broadcastProductChange('CREATE', item);
    return item;
  },

  // ─── Cập nhật sản phẩm ───
  updateProduct: async (id, payload) => {
    try { localStorage.removeItem('stockpilot_overrides'); } catch (_) {}
    const updated = await apiUpdateProduct(id, payload);
    const normalized = normalizeProduct(updated);
    if (normalized) {
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? normalized : p)),
      }));
    } else {
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id
            ? {
                ...p,
                ...payload,
                name: payload.name ?? p.name,
                salePrice: payload.salePrice !== undefined ? Number(payload.salePrice) : p.salePrice,
                price: payload.salePrice !== undefined ? Number(payload.salePrice) : p.price,
                sellingPrice: payload.salePrice !== undefined ? Number(payload.salePrice) : p.sellingPrice,
                costPrice: payload.costPrice !== undefined ? Number(payload.costPrice) : p.costPrice,
                imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : p.imageUrl,
                stockItems: p.stockItems?.map((si) => ({
                  ...si,
                  sellingPrice: payload.salePrice !== undefined ? Number(payload.salePrice) : si.sellingPrice,
                  costPrice: payload.costPrice !== undefined ? Number(payload.costPrice) : si.costPrice,
                })),
              }
            : p
        ),
      }));
    }
    broadcastProductChange('UPDATE', { id, payload });
    return updated;
  },

  // ─── Xóa sản phẩm (optimistic) ───
  removeProduct: (id) => {
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
    broadcastProductChange('DELETE', { id });
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
