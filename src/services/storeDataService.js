import { apiClient } from '../lib/apiClient';

/**
 * Chủ cửa hàng tải bản sao dữ liệu cửa hàng (GET /api/v1/store-data/export → file JSON).
 * Trả về tên file đã lưu. Lỗi từ server (blob) được đọc lại thành JSON để hiện thông báo đúng.
 */
export async function apiDownloadStoreDataExport() {
  try {
    const response = await apiClient.get('/store-data/export', { responseType: 'blob' });
    const disposition = response.headers?.['content-disposition'] || '';
    const match = /filename="([^"]+)"/.exec(disposition);
    const fileName = match?.[1] || `stockpilot-du-lieu-${new Date().toISOString().slice(0, 10)}.json`;

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
        const parsed = JSON.parse(await blob.text());
        err.response.data = parsed;
      } catch {
        /* giữ nguyên lỗi gốc */
      }
    }
    throw err;
  }
}
