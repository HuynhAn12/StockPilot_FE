import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../components/store/authStore';
import { isOwner } from '../../config/permissions.config';
import { apiGetRevenueThreshold, apiPreviewRevenueBook } from './api';

function useScope() {
  const user = useAuthStore((s) => s.user);
  return { userId: user?.id ?? null, storeId: user?.storeId ?? null, owner: isOwner(user?.role) };
}

export const taxSupportKeys = {
  threshold: (userId, storeId) => ['tax-support', userId, storeId, 'threshold'],
  bookPreview: (userId, storeId, params) => ['tax-support', userId, storeId, 'book-preview', params],
};

/** Chỉ chủ shop mới gọi (doanh thu là dữ liệu tài chính; BE cũng chặn nhân viên). */
export function useRevenueThreshold() {
  const { userId, storeId, owner } = useScope();
  return useQuery({
    queryKey: taxSupportKeys.threshold(userId, storeId),
    queryFn: ({ signal }) => apiGetRevenueThreshold({ signal }),
    enabled: owner && userId != null,
    staleTime: 5 * 60_000,
  });
}

export function useRevenueBookPreview(params) {
  const { userId, storeId, owner } = useScope();
  return useQuery({
    queryKey: taxSupportKeys.bookPreview(userId, storeId, params),
    queryFn: ({ signal }) => apiPreviewRevenueBook(params, { signal }),
    enabled: owner && userId != null,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}
