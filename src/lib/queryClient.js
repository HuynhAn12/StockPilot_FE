import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../components/store/authStore';

const shouldRetry = (failureCount, error) => {
  const status = error?.response?.status;
  // Lỗi phía client (400/401/403/404/422...) thử lại cũng vô ích.
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 2;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Đa cửa hàng: đổi tài khoản hoặc đăng xuất thì xóa sạch cache, tránh shop sau thấy dữ liệu shop trước.
useAuthStore.subscribe((state, prev) => {
  const nextKey = `${state.user?.id ?? ''}:${state.user?.storeId ?? ''}`;
  const prevKey = `${prev.user?.id ?? ''}:${prev.user?.storeId ?? ''}`;
  if (nextKey !== prevKey) queryClient.clear();
});
