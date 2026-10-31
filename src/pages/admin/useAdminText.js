import { useCallback } from 'react';
import { useUIStore } from '../../components/store/uiStore';

/**
 * Song ngữ cho khu Admin: `t('Tiếng Việt', 'English')` trả chuỗi theo ngôn ngữ đang chọn.
 * Chuỗi nằm ngay cạnh JSX để dễ đọc; component tự render lại khi đổi ngôn ngữ.
 */
export function useAdminText() {
  const language = useUIStore((state) => state.language) || 'vi';
  const isEn = language === 'en';
  const t = useCallback((vi, en) => (isEn ? en : vi), [isEn]);
  return { t, isEn, language };
}

/** Ngôn ngữ hiện tại cho các hàm định dạng không phải component. */
export function currentAdminLang() {
  try {
    return useUIStore.getState()?.language || 'vi';
  } catch {
    return 'vi';
  }
}
