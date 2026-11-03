import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiChatWithAssistant } from '../../services/analyticsService';
import { assistantKeys, useAssistantHistory, useAssistantScope } from './queries';

export const CURRENT_SESSION_ID = 'current';

const errorMessage = (err, fallback) =>
  err?.response?.data?.error?.message || err?.message || fallback;

/**
 * Phiên "current" = lịch sử thật trên server (cache TanStack Query, còn nguyên khi rời trang).
 * "Đoạn chat mới" = phiên tạm phía trình duyệt; câu hỏi vẫn được server lưu nên lần tải sau
 * chúng xuất hiện trong phiên "current".
 */
export function useAssistantChat({ isEn }) {
  const queryClient = useQueryClient();
  const { userId, storeId } = useAssistantScope();
  const historyKey = assistantKeys.history(userId, storeId);
  const history = useAssistantHistory();

  const [localSessions, setLocalSessions] = useState([]);
  const [activeId, setActiveId] = useState(CURRENT_SESSION_ID);
  const tempSeq = useRef(0);

  const updateTurns = useCallback((sessionId, updater) => {
    if (sessionId === CURRENT_SESSION_ID) {
      queryClient.setQueryData(historyKey, (old) => updater(old ?? []));
      return;
    }
    setLocalSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, turns: updater(s.turns) } : s)));
  }, [queryClient, historyKey]);

  const mutation = useMutation({
    mutationFn: ({ text }) => apiChatWithAssistant(text),
    onMutate: async ({ text, sessionId, turnId }) => {
      // Không để lần tải lại lịch sử đang chạy ghi đè tin vừa thêm.
      if (sessionId === CURRENT_SESSION_ID) await queryClient.cancelQueries({ queryKey: historyKey });
      const turn = { id: turnId, question: text, answer: null, actionLinks: [], createdAt: new Date().toISOString(), status: 'pending' };
      updateTurns(sessionId, (turns) => [...turns.filter((t) => t.id !== turnId), turn]);
      if (sessionId !== CURRENT_SESSION_ID) {
        setLocalSessions((prev) => prev.map((s) =>
          s.id === sessionId && s.untitled ? { ...s, untitled: false, title: text.length > 30 ? `${text.slice(0, 30)}…` : text } : s));
      }
    },
    onSuccess: (res, { sessionId, turnId }) => {
      updateTurns(sessionId, (turns) => turns.map((t) => (t.id !== turnId ? t : {
        ...t,
        status: 'done',
        answer: res?.answer || (isEn ? 'No answer was returned. Please try again.' : 'Chưa nhận được câu trả lời. Vui lòng thử lại.'),
        source: res?.source,
        fallbackReason: res?.fallbackReason,
        actionLinks: res?.actionLinks || [],
      })));
      // Lượt chat ở phiên tạm đã vào DB → đánh dấu lịch sử cũ, lần mở trang sau sẽ tải lại.
      if (sessionId !== CURRENT_SESSION_ID) queryClient.invalidateQueries({ queryKey: historyKey, refetchType: 'none' });
    },
    onError: (err, { sessionId, turnId }) => {
      const error = errorMessage(err, isEn ? 'Network error' : 'Lỗi mạng');
      updateTurns(sessionId, (turns) => turns.map((t) => (t.id === turnId ? { ...t, status: 'failed', error } : t)));
    },
  });

  const sessions = useMemo(() => {
    const currentTurns = history.data ?? [];
    const current = {
      id: CURRENT_SESSION_ID,
      title: currentTurns.length
        ? (isEn ? 'Latest Conversation' : 'Hội thoại gần nhất')
        : (isEn ? 'New Chat Session' : 'Phiên trò chuyện mới'),
      turns: currentTurns,
      persisted: true,
    };
    const locals = localSessions.map((s) => (s.untitled ? { ...s, title: isEn ? 'New Chat Session' : 'Phiên trò chuyện mới' } : s));
    return [...locals, current];
  }, [history.data, localSessions, isEn]);

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[sessions.length - 1];
  const isHistoryLoading = activeSession.id === CURRENT_SESSION_ID && history.isPending;

  const send = useCallback((text, retryTurnId) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending || isHistoryLoading) return false;
    tempSeq.current += 1;
    mutation.mutate({ text: trimmed, sessionId: activeSession.id, turnId: retryTurnId ?? `tmp-${Date.now()}-${tempSeq.current}` });
    return true;
  }, [mutation, activeSession.id, isHistoryLoading]);

  const newChat = useCallback(() => {
    const id = `chat-${Date.now()}`;
    setLocalSessions((prev) => [{ id, title: '', untitled: true, createdAt: new Date().toISOString(), turns: [] }, ...prev]);
    setActiveId(id);
  }, []);

  const deleteChat = useCallback((sessionId) => {
    // Chỉ xóa được phiên tạm; lịch sử trên server không có API xóa.
    if (sessionId === CURRENT_SESSION_ID) return;
    setLocalSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setActiveId((prev) => (prev === sessionId ? CURRENT_SESSION_ID : prev));
  }, []);

  return {
    sessions,
    activeSession,
    setActiveId,
    send,
    newChat,
    deleteChat,
    isSending: mutation.isPending,
    sendingSessionId: mutation.isPending ? mutation.variables?.sessionId : null,
    isHistoryLoading,
    isHistoryFetching: history.isFetching,
    historyError: history.isError ? errorMessage(history.error, isEn ? 'Could not load chat history' : 'Không tải được lịch sử chat') : null,
    refetchHistory: history.refetch,
  };
}
