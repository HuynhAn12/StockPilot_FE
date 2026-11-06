// API Service module for StockPilot
function normalizeApiUrl(raw) {
  // 1. Nếu có VITE_API_URL được truyền vào
  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    let url = raw.trim().replace(/\/+$/, '');
    if (!url.endsWith('/api/v1')) {
      url = url.endsWith('/api') ? `${url}/v1` : `${url}/api/v1`;
    }

    // Tự động thích ứng nếu môi trường chạy khác với biến build tĩnh
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

      // Đang truy cập bằng domain (stockpilot.name.vn) nhưng bundle chứa localhost -> tự chuyển sang domain hiện tại
      if (!isLocalHost && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        return `${window.location.origin}/api/v1`;
      }

      // Đang chạy ở localhost nhưng bundle chứa domain ngoài -> tự chuyển về localhost:5000
      if (isLocalHost && (url.includes('stockpilot.name.vn') || url.includes('onrender.com'))) {
        return 'http://localhost:5000/api/v1';
      }
    }
    return url;
  }

  // 2. Không có biến môi trường -> tự động phát hiện theo URL trình duyệt
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, port, origin } = window.location;
    // Chạy dev server local (vite dev port 5173 / 5174)
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && (port === '5173' || port === '5174')) {
      return 'http://localhost:5000/api/v1';
    }
    // Chạy qua Nginx hoặc Domain trực tiếp
    return `${origin}/api/v1`;
  }

  return 'http://localhost:5000/api/v1';
}

const API_BASE_URL = normalizeApiUrl(import.meta.env?.VITE_API_URL);

/**
 * Common request helper with authorization header
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('stockpilot_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth endpoints
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    getProfile: () => request('/auth/me'),
  },

  // Product endpoints
  products: {
    getAll: (params = '') => request(`/products${params ? `?${params}` : ''}`),
    getById: (id) => request(`/products/${id}`),
    create: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  },

  // Dashboard endpoints
  dashboard: {
    getStats: () => request('/dashboard/stats'),
    getProductionMetrics: () => request('/dashboard/production'),
  },
};

export default api;
