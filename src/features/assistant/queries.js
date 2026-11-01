import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../components/store/authStore';
import { apiGetAssistantHistory, apiGetAssistantSuggestions } from '../../services/analyticsService';

export const HISTORY_LIMIT = 40;

// Khóa cache gắn với user + cửa hàng: dữ liệu chat chủ shop có thể chứa giá vốn/lợi nhuận.
export const assistantKeys = {
  all: (userId, storeId) => ['assistant', userId, storeId],
  history: (userId, storeId) => ['assistant', userId, storeId, 'history'],
  suggestions: (userId, storeId) => ['assistant', userId, storeId, 'suggestions'],
};

export function useAssistantScope() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const storeId = useAuthStore((s) => s.user?.storeId ?? null);
  return { userId, storeId };
}

/**
 * Một lượt chat = 1 câu hỏi + 1 câu trả lời.
 * @typedef {{ id: string, question: string, answer: string|null, source?: string, fallbackReason?: string,
 *   actionLinks: Array<{label: string, url?: string, path?: string}>, createdAt: string,
 *   status: 'done'|'pending'|'failed', error?: string }} ChatTurn
 */
const toTurn = (row) => ({
  id: `h-${row.id}`,
  question: row.questionText || '',
  answer: row.responseText ?? null,
  source: row.source,
  actionLinks: [],
  createdAt: row.createdAt,
  status: 'done',
});

export function useAssistantHistory() {
  const { userId, storeId } = useAssistantScope();
  return useQuery({
    queryKey: assistantKeys.history(userId, storeId),
    queryFn: async ({ signal }) => {
      const rows = await apiGetAssistantHistory({ limit: HISTORY_LIMIT, signal });
      // API trả mới nhất trước; khung chat cần cũ nhất trước.
      return (Array.isArray(rows) ? rows : []).filter((r) => r.questionText).reverse().map(toTurn);
    },
    enabled: userId != null,
  });
}

export function useAssistantSuggestions() {
  const { userId, storeId } = useAssistantScope();
  return useQuery({
    queryKey: assistantKeys.suggestions(userId, storeId),
    queryFn: ({ signal }) => apiGetAssistantSuggestions({ signal }),
    enabled: userId != null,
    staleTime: 60_000,
    // Endpoint xếp hạng bằng luật (không gọi AI, không tốn hạn mức) → làm mới khi quay lại tab là rẻ.
    refetchOnWindowFocus: true,
  });
}
