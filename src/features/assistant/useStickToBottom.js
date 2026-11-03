import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const NEAR_BOTTOM_PX = 120;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Giữ khung chat ở cuối như các app chat:
 * - Đổi phiên / dữ liệu vừa có lần đầu → nhảy thẳng xuống cuối trước khi vẽ (không thấy cuộn).
 * - Có nội dung mới → chỉ cuộn mượt nếu người dùng đang ở gần cuối; đang đọc tin cũ thì hiện nút "Tin mới".
 * Chỉ cuộn khung chat, không kéo cả trang như scrollIntoView.
 *
 * @param {string} sessionKey   đổi khi chuyển phiên chat
 * @param {number} itemCount    số tin đang hiển thị
 * @param {string} contentKey   đổi mỗi khi nội dung cuối thay đổi (tin mới, trạng thái gửi…)
 */
export function useStickToBottom({ sessionKey, itemCount, contentKey }) {
  const containerRef = useRef(null);
  const nearBottomRef = useRef(true);
  const prevRef = useRef({ sessionKey: null, itemCount: 0, contentKey: null });
  const [hasUnseen, setHasUnseen] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
    nearBottomRef.current = true;
    setHasUnseen(false);
  }, []);

  /** Gọi trước khi gửi tin của chính người dùng: luôn bám xuống cuối. */
  const stick = useCallback(() => { nearBottomRef.current = true; }, []);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    nearBottomRef.current = near;
    if (near) setHasUnseen(false);
  }, []);

  useLayoutEffect(() => {
    const prev = prevRef.current;
    prevRef.current = { sessionKey, itemCount, contentKey };

    const isFirstContent = sessionKey !== prev.sessionKey || (prev.itemCount === 0 && itemCount > 0);
    if (isFirstContent) {
      scrollToBottom(false);
      return;
    }
    if (contentKey === prev.contentKey) return;
    if (nearBottomRef.current) scrollToBottom(true);
    else setHasUnseen(true);
  }, [sessionKey, itemCount, contentKey, scrollToBottom]);

  return { containerRef, onScroll, scrollToBottom, stick, hasUnseen };
}
