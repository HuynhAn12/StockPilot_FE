import { apiClient } from '../lib/apiClient';

// Mỗi lần xem trước tạo một job; commit dùng jobId + Idempotency-Key để bấm lại không nhập trùng.

// POST /import/preview ({ items, mode }) → { jobId, totalRows, validRows, invalidRows, warningRows, issues, previewItems }
export async function apiPreviewProductImport(items, mode = 'CREATE_ONLY') {
  const { data } = await apiClient.post('/import/preview', { items, mode });
  return data;
}

// POST /import/commit ({ jobId })
export async function apiCommitProductImport(jobId) {
  const { data } = await apiClient.post('/import/commit', { jobId }, { headers: { 'Idempotency-Key': `import-${jobId}` } });
  return data;
}

// POST /historical-sales/preview ({ rows }) — tối đa 5.000 dòng mỗi lần
export async function apiPreviewSalesImport(rows) {
  const { data } = await apiClient.post('/historical-sales/preview', { rows });
  return data.data;
}

// POST /historical-sales/commit ({ jobId })
export async function apiCommitSalesImport(jobId) {
  const { data } = await apiClient.post('/historical-sales/commit', { jobId }, { headers: { 'Idempotency-Key': `sales-${jobId}` } });
  return data.data;
}
