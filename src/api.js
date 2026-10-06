// API Service module for StockPilot
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

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
