import { apiClient } from '../../lib/apiClient';

// GET /tax-support/revenue-threshold — ngưỡng doanh thu hóa đơn điện tử (chỉ chủ shop).
export async function apiGetRevenueThreshold({ signal } = {}) {
  const { data } = await apiClient.get('/tax-support/revenue-threshold', { signal });
  return data.data;
}

// GET /tax-support/revenue-book/preview — tổng tiền & số dòng của sổ trước khi tải.
export async function apiPreviewRevenueBook(params, { signal } = {}) {
  const { data } = await apiClient.get('/tax-support/revenue-book/preview', { params, signal });
  return data.data;
}

/**
 * GET /tax-support/revenue-book → tải file CSV sổ doanh thu. Trả về tên file đã lưu.
 * Lỗi từ server (blob) được đọc lại thành JSON để hiện đúng thông báo.
 */
export async function apiDownloadRevenueBook(params) {
  try {
    const response = await apiClient.get('/tax-support/revenue-book', { params, responseType: 'blob' });
    const disposition = response.headers?.['content-disposition'] || '';
    const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] || 'so-doanh-thu.csv';
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return fileName;
  } catch (err) {
    const blob = err?.response?.data;
    if (blob instanceof Blob) {
      try {
        err.response.data = JSON.parse(await blob.text());
      } catch {
        /* giữ nguyên lỗi gốc */
      }
    }
    throw err;
  }
}
