/**
 * uploadService.js
 * Upload ảnh qua Backend Node.js → Cloudinary
 * Luồng: Frontend → Backend (POST /api/v1/upload/image) → Cloudinary → URL trả về
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Lấy access token từ localStorage (cùng cách apiClient dùng)
 */
function getAuthToken() {
  try {
    const stored = localStorage.getItem('stockpilot-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token || null;
    }
  } catch (_) {}
  return null;
}

/**
 * Upload một file ảnh qua Backend lên Cloudinary
 * @param {File} file - File ảnh từ input hoặc drag & drop
 * @returns {Promise<string>} URL ảnh trên Cloudinary (https://...)
 */
export async function uploadImageToCloudinary(file, _options = {}) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('File không hợp lệ. Chỉ chấp nhận ảnh (jpg, png, webp...)');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Ảnh quá lớn. Kích thước tối đa là 10MB');
  }

  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập để tải ảnh lên.');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // KHÔNG đặt Content-Type — để browser tự thêm boundary cho multipart/form-data
    },
    body: formData,
  });

  if (!response.ok) {
    let errMsg = `Upload thất bại (HTTP ${response.status})`;
    try {
      const err = await response.json();
      errMsg = err?.error?.message || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const data = await response.json();

  if (!data.success || !data.data?.url) {
    throw new Error('Backend không trả về URL ảnh hợp lệ');
  }

  return data.data.url;
}

/**
 * Upload từ base64 string — chuyển sang File rồi upload qua backend
 * @param {string} base64DataUrl - Chuỗi data:image/...;base64,...
 * @returns {Promise<string>} URL ảnh trên Cloudinary
 */
export async function uploadBase64ToCloudinary(base64DataUrl, options = {}) {
  // Chuyển base64 thành File object
  const res = await fetch(base64DataUrl);
  const blob = await res.blob();
  const file = new File([blob], 'upload.jpg', { type: blob.type || 'image/jpeg' });
  return uploadImageToCloudinary(file, options);
}
