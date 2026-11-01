import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Plus, Trash2, MessageSquare, Sparkles,
  Mic, MicOff, Volume2, VolumeX,
  Copy, Check, ArrowRight, RefreshCw,
  Search, PanelLeftClose, PanelLeft, TrendingUp, AlertTriangle, Package, DollarSign, ShoppingCart, ArrowUpRight, Lightbulb, CheckCircle2,
  ArrowDown, RotateCcw
} from 'lucide-react';
import { useProductStore } from '../../components/store/productStore';
import { useAuthStore } from '../../store/authStore';
import { isStaff } from '../../config/permissions.config';
import { useAssistantChat, CURRENT_SESSION_ID } from '../../features/assistant/useAssistantChat';
import { useStickToBottom } from '../../features/assistant/useStickToBottom';
import { useTranslation } from '../../i18n/useTranslation';
import { AISourceBadge } from '../../components/assistant/AISourceBadge';
import { AISuggestionsPanel } from '../../components/assistant/AISuggestionsPanel';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';

function parseInlineMarkdown(text) {
  if (!text) return null;

  // Render <br> or <br/> tags as real HTML line breaks
  if (/<br\s*\/?>/i.test(text)) {
    const segments = text.split(/<br\s*\/?>/gi);
    return segments.map((seg, sIdx) => (
      <span key={sIdx}>
        {parseInlineMarkdown(seg)}
        {sIdx < segments.length - 1 && <br />}
      </span>
    ));
  }

  // Handle bold, code, SKU chips, and ASCII block bars
  const regex = /(\*\*.*?\*\*|`.*?`|\(SP\d+\)|[█▉▊▋▌▍▎▏■]+)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-[#1a1a1a]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="font-mono text-xs bg-[#eff6ff] text-blue-600 px-1.5 py-0.5 rounded border border-blue-200/80 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\(SP\d+\)$/.test(part)) {
      return (
        <span
          key={idx}
          className="font-mono text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200/80 font-bold ml-1 inline-block"
        >
          {part}
        </span>
      );
    }
    if (/^[█▉▊▋▌▍▎▏■]+$/.test(part)) {
      // Modern visual progress bar pill instead of raw black ASCII blocks
      const widthPx = Math.min(120, Math.max(20, part.length * 9));
      return (
        <span
          key={idx}
          className="inline-block h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 align-middle mx-1 shadow-2xs"
          style={{ width: `${widthPx}px` }}
        />
      );
    }
    return part;
  });
}

function renderRichMarkdown(text, isUser) {
  if (isUser) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  const rawLines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Check if this line starts a Markdown Table: "| col 1 | col 2 |" followed by "|---|---|"
    if (
      trimmed.startsWith('|') &&
      trimmed.endsWith('|') &&
      i + 1 < rawLines.length &&
      /^\|(\s*:?-+:?\s*\|)+$/.test(rawLines[i + 1].trim())
    ) {
      const headerRow = trimmed.slice(1, -1).split('|').map((c) => c.trim());
      const dividerRow = rawLines[i + 1].trim().slice(1, -1).split('|').map((c) => c.trim());
      const alignments = dividerRow.map((col) => {
        if (col.startsWith(':') && col.endsWith(':')) return 'center';
        if (col.endsWith(':')) return 'right';
        return 'left';
      });

      const tableRows = [];
      i += 2;
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        const rowCells = rawLines[i].trim().slice(1, -1).split('|').map((c) => c.trim());
        tableRows.push(rowCells);
        i++;
      }

      blocks.push({
        type: 'table',
        headers: headerRow,
        alignments,
        rows: tableRows,
      });
      continue;
    }

    blocks.push({
      type: 'line',
      line,
      trimmed,
    });
    i++;
  }

  return (
    <div className="ai-prose space-y-2 text-[#303233]">
      {blocks.map((block, idx) => {
        if (block.type === 'table') {
          return (
            <div key={idx} className="overflow-x-auto my-3 rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    {block.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className={`px-3.5 py-2.5 font-bold text-slate-800 ${
                          block.alignments[hIdx] === 'center'
                            ? 'text-center'
                            : block.alignments[hIdx] === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {parseInlineMarkdown(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-blue-50/40 transition-colors even:bg-slate-50/40"
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-3.5 py-2.5 text-slate-700 whitespace-nowrap sm:whitespace-normal ${
                            block.alignments[cIdx] === 'center'
                              ? 'text-center'
                              : block.alignments[cIdx] === 'right'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const { line, trimmed } = block;

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="my-2.5 border-t border-slate-200/80" />;
        }

        // Heading 3: ###
        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^###\s+/, '');
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-extrabold text-[#303233] mt-3.5 mb-1.5 flex items-center gap-1.5 tracking-tight border-b border-blue-100/70 pb-1"
            >
              {headingText}
            </h3>
          );
        }

        // Heading 2: ##
        if (trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^##\s+/, '');
          return (
            <h2
              key={idx}
              className="text-base sm:text-lg font-black text-[#303233] mt-4 mb-2 flex items-center gap-1.5"
            >
              {headingText}
            </h2>
          );
        }

        // Heading 1: #
        if (trimmed.startsWith('# ')) {
          const headingText = trimmed.replace(/^#\s+/, '');
          return (
            <h1
              key={idx}
              className="text-lg sm:text-xl font-black text-slate-900 mt-4 mb-2 flex items-center gap-1.5"
            >
              {headingText}
            </h1>
          );
        }

        // Callouts / Blockquotes (lines starting with 💡, ⚠️, *, >)
        const isBlockquote =
          trimmed.startsWith('💡') ||
          trimmed.startsWith('>') ||
          (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 5);

        if (isBlockquote) {
          const cleanQuote = trimmed.replace(/^>\s*/, '').replace(/^\*|\*$/g, '');
          return (
            <div
              key={idx}
              className="ai-blockquote border-l-4 border-blue-600 bg-[#f0f7ff] text-[#303233] px-3.5 py-2.5 rounded-r-xl my-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs font-medium"
            >
              {parseInlineMarkdown(cleanQuote)}
            </div>
          );
        }

        // Bullet / Numbered lines (e.g. 1. , - , • )
        const isNumbered = /^\d+\.\s+/.test(trimmed);
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ');

        if (isNumbered || isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 leading-relaxed text-xs sm:text-sm">
              <span className="font-bold text-blue-600 shrink-0 mt-0.5">
                {isNumbered ? trimmed.match(/^\d+\./)[0] : '•'}
              </span>
              <div className="flex-1">
                {parseInlineMarkdown(trimmed.replace(/^(\d+\.|\-|\•)\s+/, ''))}
              </div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="leading-relaxed text-xs sm:text-sm text-[#303233] m-0">
            {parseInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

export function AIAssistantPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const staffMode = isStaff(user?.role);
  const { products, fetchProducts } = useProductStore();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1280);

  const textareaRef = useRef(null);
  const copyTimerRef = useRef(null);

  const {
    sessions, activeSession, setActiveId, send, newChat, deleteChat,
    isSending, sendingSessionId, isHistoryLoading, isHistoryFetching, historyError, refetchHistory,
  } = useAssistantChat({ isEn });

  const [voiceInterimText, setVoiceInterimText] = useState('');

  const {
    isListening,
    isTranscribing,
    isSpeaking,
    speakingMessageId,
    autoSpeakEnabled,
    setAutoSpeakEnabled,
    voiceSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceAssistant();

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) {
        stopSpeaking();
      }
      setVoiceInterimText('');
      startListening({
        onInterim: (text) => {
          setVoiceInterimText(text);
        },
        onFinal: (finalText) => {
          setVoiceInterimText('');
          setInputMessage('');
          if (finalText.trim()) {
            handleSendMessage(finalText.trim());
          }
        },
        onError: (err) => {
          console.warn('Voice error:', err);
          setVoiceInterimText('');
        },
      });
    }
  };
  const activeChatId = activeSession.id;
  const isTyping = isSending && sendingSessionId === activeChatId;

  // Giờ hiển thị tính lúc render → đổi VI/EN chỉ định dạng lại, không gọi lại API.
  const messages = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
    const timeOf = (iso) => {
      const d = iso ? new Date(iso) : null;
      return d && !Number.isNaN(d.getTime()) ? fmt.format(d) : '';
    };
    return activeSession.turns.flatMap((turn) => {
      const timestamp = timeOf(turn.createdAt);
      const out = [{ id: `${turn.id}-q`, turnId: turn.id, sender: 'user', text: turn.question, timestamp, status: turn.status, error: turn.error }];
      if (turn.answer != null) {
        out.push({
          id: `${turn.id}-a`, sender: 'ai', text: turn.answer, timestamp,
          source: turn.source, fallbackReason: turn.fallbackReason, actionLinks: turn.actionLinks,
        });
      }
      return out;
    });
  }, [activeSession.turns, isEn]);

  const lastTurn = activeSession.turns[activeSession.turns.length - 1];

  // Chỉ phát âm thanh khi người dùng VỪA BẮT ĐẦU HỎI trong phiên hiện tại (không đọc lại lịch sử cũ khi vừa vào trang)
  const shouldSpeakNextResponseRef = useRef(false);
  const lastSpokenTurnIdRef = useRef(null);

  // Khi chuyển đoạn chat hoặc vừa vào trang, reset cờ và dừng phát âm cũ
  useEffect(() => {
    shouldSpeakNextResponseRef.current = false;
    stopSpeaking();
    if (lastTurn?.id) {
      lastSpokenTurnIdRef.current = lastTurn.id;
    }
  }, [activeChatId]);

  // Tự động phát âm thanh khi AI vừa trả lời xong câu hỏi người dùng vừa hỏi
  useEffect(() => {
    if (!lastTurn || !lastTurn.answer || lastTurn.status !== 'done') return;

    // Nếu người dùng chưa hỏi câu nào trong phiên làm việc này (vừa vào trang / load lịch sử)
    if (!shouldSpeakNextResponseRef.current) {
      lastSpokenTurnIdRef.current = lastTurn.id;
      return;
    }

    if (lastSpokenTurnIdRef.current === lastTurn.id) return;

    if (autoSpeakEnabled) {
      lastSpokenTurnIdRef.current = lastTurn.id;
      shouldSpeakNextResponseRef.current = false; // Đã đọc xong câu trả lời này
      speak(lastTurn.answer, `${lastTurn.id}-a`);
    }
  }, [lastTurn, autoSpeakEnabled, speak]);
  const { containerRef: feedRef, onScroll: onFeedScroll, scrollToBottom, stick, hasUnseen } = useStickToBottom({
    sessionKey: activeChatId,
    itemCount: messages.length,
    contentKey: `${messages.length}:${lastTurn?.id ?? ''}:${lastTurn?.status ?? ''}:${isTyping}`,
  });

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  // Fetch product list for entity matching
  useEffect(() => {
    if (!products.length) fetchProducts();
  }, []);

  // Chống gửi trùng lặp câu hỏi (duplicate voice submission guard)
  const lastSentTextRef = useRef('');
  const lastSentTimeRef = useRef(0);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend ?? inputMessage).trim();
    if (!text) return;

    // Ngăn chặn duplicate tin nhắn gửi dồn trong vòng 1.5 giây
    const now = Date.now();
    if (now - lastSentTimeRef.current < 1500) {
      const isVerySimilar =
        text === lastSentTextRef.current ||
        text.toLowerCase() === lastSentTextRef.current.toLowerCase();
      if (isVerySimilar) {
        return;
      }
    }
    lastSentTextRef.current = text;
    lastSentTimeRef.current = now;

    stick();
    shouldSpeakNextResponseRef.current = true;
    if (!send(text)) {
      shouldSpeakNextResponseRef.current = false;
      return;
    }
    setInputMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleRetry = (turnId, text) => {
    stick();
    shouldSpeakNextResponseRef.current = true;
    send(text, turnId);
  };

  const handleNewChat = () => {
    shouldSpeakNextResponseRef.current = false;
    stopSpeaking();
    newChat();
    setInputMessage('');
  };

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const handleCopy = async (msgId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const filteredChats = sessions.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickPrompts = staffMode ? [
    {
      icon: Package,
      color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
      title: isEn ? 'Low & Out of Stock Items' : 'Số lượng tồn & sắp hết',
      desc: isEn ? 'Which items are low in stock or completely out of stock?' : 'Mặt hàng nào còn ít hoặc đã hết tồn kho?',
      prompt: isEn ? 'Which items are low in stock or out of stock?' : 'Mặt hàng nào sắp hết trong kho và cần phát lệnh nhập gấp?',
    },
    {
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
      title: isEn ? 'Inventory Stocktake Flow' : 'Kiểm kê kho & quy trình',
      desc: isEn ? 'How to conduct stocktake and record physical variance?' : 'Làm sao để tạo phiếu kiểm kê và điều chỉnh kho?',
      prompt: isEn ? 'Guide me through the stocktaking audit workflow' : 'Hướng dẫn tôi cách kiểm kê và điều chỉnh tồn kho đúng quy trình',
    },
    {
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
      title: isEn ? 'Quick POS Checkout Guide' : 'Hướng dẫn bán hàng POS',
      desc: isEn ? 'Fast search, VietQR scans, and receipt printing at checkout' : 'Cách tìm kiếm nhanh và thanh toán đơn hàng cho khách',
      prompt: isEn ? 'How to search items and process VietQR on POS screen?' : 'Hướng dẫn cách quét mã VietQR và in hóa đơn tại quầy thu ngân',
    },
    {
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white',
      title: isEn ? 'Stock-In / Stock-Out Rules' : 'Quy trình nhập xuất kho',
      desc: isEn ? 'Record goods received from suppliers and damaged inventory' : 'Cách ghi nhận nhập hàng từ nhà cung cấp và xuất hàng',
      prompt: isEn ? 'How do I record supplier goods receipt and damaged item disposal?' : 'Cách nhập kho từ nhà cung cấp và xuất hủy hàng hỏng thế nào?',
    },
  ] : [
    {
      icon: Package,
      color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
      title: isEn ? 'Stockout & Low Stock Alerts' : 'Cảnh báo hết hàng & thiếu hàng',
      desc: isEn ? 'Which items are running out and require urgent replenishment?' : 'Mặt hàng nào sắp hết trong kho và cần phát lệnh nhập gấp?',
      prompt: isEn ? 'Which products are out of stock or below safe threshold?' : 'Mặt hàng nào sắp hết trong kho và cần nhập gấp?',
    },
    {
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
      title: isEn ? 'Top 5 Best Sellers This Week' : 'Top 5 bán chạy tuần này',
      desc: isEn ? 'Rank products with highest sales volume and revenue' : 'Xếp hạng các sản phẩm có doanh số và sản lượng tiêu thụ cao nhất',
      prompt: isEn ? 'What are the top 5 best selling products this week?' : 'Top 5 sản phẩm bán chạy nhất tuần này là gì?',
    },
    {
      icon: DollarSign,
      color: 'text-rose-600 bg-rose-50 group-hover:bg-rose-600 group-hover:text-white',
      title: isEn ? 'Low Margin or Loss-Making Goods' : 'Mặt hàng bán lỗ hoặc biên lợi nhuận thấp',
      desc: isEn ? 'Detect items priced near or below unit cost' : 'Phát hiện các sản phẩm có giá bán sát hoặc thấp hơn giá vốn',
      prompt: isEn ? 'Are there any products selling at a loss or with low margins?' : 'Có mặt hàng nào đang bán lỗ hoặc biên lợi nhuận thấp không?',
    },
    {
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
      title: isEn ? 'Restocking Plan & Budget' : 'Kế hoạch nhập hàng & dự toán',
      desc: isEn ? 'Suggested restock list with recommended quantity and cost' : 'Đề xuất danh sách SP cần nhập kèm số lượng và ngân sách dự kiến',
      prompt: isEn ? 'Propose an inventory replenishment plan and estimated purchase budget' : 'Đề xuất kế hoạch nhập hàng và dự toán chi phí cần chuẩn bị',
    },
    {
      icon: Sparkles,
      color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
      title: isEn ? 'Smart Price Optimization' : 'Gợi ý tối ưu giá bán',
      desc: isEn ? 'Strategies to increase margin or discount slow-movers' : 'Chiến lược tăng giá bảo toàn vốn hoặc giảm giá kích cầu xả kho',
      prompt: isEn ? 'Are there any price recommendations from Decision Engine today?' : 'Có đề xuất điều chỉnh giá bán nào hôm nay không?',
    },
    {
      icon: AlertTriangle,
      color: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white',
      title: isEn ? 'Tied Capital & Dead Stock Risk' : 'Rủi ro đọng vốn & hàng ứ đọng',
      desc: isEn ? 'Analyze high-stock, low-velocity products occupying capital' : 'Phân tích các sản phẩm tồn kho cao, vòng quay chậm chiếm dụng dòng tiền',
      prompt: isEn ? 'Analyze tied-up capital risks and dead stock in my warehouse' : 'Phân tích rủi ro đọng vốn và hàng ứ đọng trong kho',
    },
  ];

  return (
    <div className="ai-assistant-page-scoped relative flex h-[calc(100vh-84px)] -m-3 sm:-m-5 lg:-m-6 bg-[#fcfcfd] overflow-hidden">
      <style>{`
        .ai-assistant-page-scoped {
          --ifm-color-primary: #2563eb;
          --ifm-color-primary-dark: #1d4ed8;
          --ifm-color-primary-darker: #1e40af;
          --ifm-color-primary-darkest: #172554;
          --ifm-color-primary-light: #3b82f6;
          --font-ui: "SF Pro Text", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          --font-prose: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          --font-mono: "SF Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          --fs-paragraph: 15px;
          --lh-paragraph: 1.625;
          font-family: var(--font-ui);
          -webkit-font-smoothing: antialiased;
        }

        .ai-assistant-page-scoped .ai-prose {
          font-family: var(--font-prose);
          font-size: var(--fs-paragraph);
          line-height: var(--lh-paragraph);
          color: #303233;
        }

        .ai-assistant-page-scoped code, .ai-assistant-page-scoped .ai-code {
          font-family: var(--font-mono);
          font-size: 13px;
          background: #eff6ff;
          color: #2563eb;
          padding: 2px 6px;
          border-radius: 5px;
          border: 1px solid rgba(37, 99, 235, 0.16);
          font-weight: 600;
        }

        .ai-assistant-page-scoped .ai-blockquote {
          border-left: 4px solid #2563eb;
          background-color: #f0f7ff;
          color: #303233;
          padding: 10px 14px;
          border-radius: 0 10px 10px 0;
          margin: 10px 0;
          font-size: 13.5px;
          line-height: 1.6;
        }
      `}</style>

      {/* 1. LEFT SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? 'w-72 sm:w-80' : 'w-0'
        } transition-all duration-300 ease-in-out bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden z-20 shadow-sm`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isEn ? 'New Chat' : 'Đoạn chat mới'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isEn ? "Collapse sidebar" : "Thu nhỏ thanh lịch sử"}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-2.5 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? "Search chat history..." : "Tìm kiếm lịch sử chat..."}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-xs rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{isEn ? `Chat History (${filteredChats.length})` : `Lịch sử hội thoại (${filteredChats.length})`}</span>
            {isHistoryFetching && <RefreshCw className="w-3 h-3 animate-spin text-blue-600" aria-label={isEn ? 'Syncing' : 'Đang đồng bộ'} />}
          </div>

          {filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => setActiveId(chat.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveId(chat.id); } }}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/90 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="flex-1 truncate text-left">{chat.title}</span>

                {!chat.persisted && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title={isEn ? "Delete this chat" : "Xóa đoạn chat này"}
                    aria-label={isEn ? `Delete chat ${chat.title}` : `Xóa đoạn chat ${chat.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {filteredChats.length === 0 && !isHistoryLoading && (
            <div className="text-center py-8 text-xs text-slate-400">
              {isEn ? 'No chat history found' : 'Chưa có phiên trò chuyện nào'}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Pilot Live Sync</span>
        </div>
      </div>

      {/* 2. MAIN CHAT WORKSPACE */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">

        {/* Top Header Bar */}
        <div className="h-14 px-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title={isEn ? "Open history" : "Mở thanh lịch sử"}
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-xs sm:max-w-md">
                  {activeSession.title || (isEn ? 'AI Pilot Assistant' : 'Trợ lý AI Pilot')}
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="text-blue-600 font-bold">{isEn ? 'Real-time database' : 'Dữ liệu thời gian thực'}</span>
                  <span>•</span>
                  <span>{isEn ? 'Sync inventory, orders & costs' : 'Đồng bộ kho, đơn hàng & giá vốn'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSuggestionsOpen((open) => !open)}
              aria-pressed={suggestionsOpen}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                suggestionsOpen
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{isEn ? 'Suggestions' : 'Gợi ý'}</span>
            </button>
            <button
              type="button"
              onClick={handleNewChat}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>{isEn ? 'New Chat' : 'Đoạn chat mới'}</span>
            </button>
          </div>
        </div>

        {/* Messages Feed Area */}
        <div
          ref={feedRef}
          onScroll={onFeedScroll}
          role="log"
          aria-label={isEn ? 'Conversation' : 'Nội dung hội thoại'}
          className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-6 space-y-6"
        >
          <div className="max-w-3xl mx-auto w-full">

            {/* History loading skeleton (chỉ lần đầu; quay lại trang dùng cache nên không hiện) */}
            {isHistoryLoading && (
              <div className="space-y-5 py-2" aria-busy="true" aria-label={isEn ? 'Loading chat history' : 'Đang tải lịch sử chat'}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-slate-100" />
                    <div className="h-24 w-4/5 animate-pulse rounded-2xl bg-slate-100" />
                  </div>
                ))}
              </div>
            )}

            {historyError && activeChatId === CURRENT_SESSION_ID && (
              <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                <span>{historyError}</span>
                <button type="button" onClick={() => refetchHistory()} className="font-semibold underline cursor-pointer">
                  {isEn ? 'Try again' : 'Thử lại'}
                </button>
              </div>
            )}

            {/* Empty Chat State: Quick Prompts Grid */}
            {messages.length === 0 && !isHistoryLoading && (
              <div className="py-6 sm:py-10 flex flex-col items-center text-center animate-in fade-in duration-300">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Bot className="w-9 h-9" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                  {isEn ? 'Hello, I am AI Pilot' : 'Chào bạn, tôi là AI Pilot'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
                  {isEn
                    ? 'I directly analyze your warehouse inventory, revenue, and system decision engine to recommend accurate business decisions.'
                    : 'Tôi phân tích trực tiếp dữ liệu kho hàng, doanh thu thực tế và thuật toán cảnh báo của hệ thống để đưa ra quyết định kinh doanh chính xác.'}
                </p>

                {/* Prompt Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  {quickPrompts.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(card.prompt)}
                        className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group shadow-xs hover:shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${card.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                            {card.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal pl-9">
                          {card.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 my-5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%]`}>
                    <div
                      className={`p-4 text-xs sm:text-sm leading-relaxed rounded-2xl shadow-xs ${
                        isUser
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-xs font-medium shadow-blue-600/10'
                          : 'bg-white text-[#303233] rounded-tl-xs border border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      {renderRichMarkdown(msg.text, isUser)}

                      {/* Interactive Action Links returned by AI */}
                      {!isUser && msg.actionLinks && msg.actionLinks.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                          {msg.actionLinks.map((link, lIdx) => (
                            <button
                              key={lIdx}
                              type="button"
                              onClick={() => navigate(link.path || link.url)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                            >
                              <span>{link.label}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      {isUser && msg.status === 'pending' && (
                        <span className="text-slate-400">{isEn ? 'Sending…' : 'Đang gửi…'}</span>
                      )}
                      {isUser && msg.status === 'failed' && (
                        <span role="alert" className="flex flex-wrap items-center gap-1.5 text-rose-600">
                          <AlertTriangle className="w-3 h-3" aria-hidden />
                          <span title={msg.error}>{isEn ? 'Not sent' : 'Không gửi được'}</span>
                          <button
                            type="button"
                            onClick={() => handleRetry(msg.turnId, msg.text)}
                            disabled={isSending}
                            className="inline-flex items-center gap-1 font-semibold underline hover:text-rose-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <RotateCcw className="w-3 h-3" aria-hidden /> {isEn ? 'Retry' : 'Gửi lại'}
                          </button>
                        </span>
                      )}


                      {!isUser && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors ml-2 cursor-pointer"
                            title={isEn ? "Copy response" : "Sao chép câu trả lời"}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">{isEn ? 'Copied' : 'Đã sao chép'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{isEn ? 'Copy' : 'Sao chép'}</span>
                              </>
                            )}
                          </button>

                          {voiceSupported.tts && (
                            <button
                              type="button"
                              onClick={() => speak(msg.text, msg.id)}
                              className={`flex items-center gap-1 transition-colors ml-2 cursor-pointer ${
                                isSpeaking && speakingMessageId === msg.id
                                  ? 'text-blue-600 font-bold animate-pulse'
                                  : 'hover:text-blue-600 text-slate-400'
                              }`}
                              title={
                                isSpeaking && speakingMessageId === msg.id
                                  ? (isEn ? "Stop reading" : "Dừng đọc")
                                  : (isEn ? "Read aloud" : "Đọc câu trả lời bằng giọng nói")
                              }
                            >
                              {isSpeaking && speakingMessageId === msg.id ? (
                                <>
                                  <VolumeX className="w-3 h-3 text-blue-600" />
                                  <span className="text-blue-600 font-bold">{isEn ? 'Stop' : 'Dừng'}</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>{isEn ? 'Listen' : 'Đọc'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-3 my-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-500 font-semibold ml-2">
                    {isEn ? 'AI Pilot loading...' : 'AI Pilot loading...'}
                  </span>
                </div>
              </div>
            )}

          </div>

          {hasUnseen && (
            <div className="sticky bottom-0 flex justify-center pointer-events-none">
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" aria-hidden />
                {isEn ? 'New messages' : 'Tin mới'}
              </button>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-gradient-to-t from-white via-white to-white/80 border-t border-slate-100">
          <div className="max-w-3xl mx-auto w-full">
            {/* Voice Status Indicators */}
            {isListening && (
              <div className="flex flex-col gap-1.5 px-4 py-2.5 mb-2 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-700 shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-600"></span>
                  </span>
                  <span className="font-bold text-purple-700 text-[13px]">
                    {isEn ? "Listening..." : "Đang Lắng Nghe..."}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      stopListening();
                      setVoiceInterimText('');
                      setInputMessage('');
                    }}
                    className="ml-auto text-[11px] text-purple-600 hover:text-purple-800 underline cursor-pointer font-medium"
                  >
                    {isEn ? "Cancel" : "Hủy"}
                  </button>
                </div>
                {voiceInterimText && (
                  <p className="text-[12px] font-semibold text-purple-900 bg-white/80 px-2.5 py-1 rounded-lg border border-purple-200/60 italic">
                    "{voiceInterimText}"
                  </p>
                )}
              </div>
            )}



            {isSpeaking && (
              <div className="flex items-center gap-2 px-4 py-2 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-xs text-blue-800 shadow-sm">
                <Volume2 className="w-4 h-4 text-blue-600 animate-bounce" />
                <span className="font-semibold">
                  {isEn ? "AI Pilot is speaking the response..." : "AI Pilot đang trả lời bằng giọng nói..."}
                </span>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="ml-auto text-[11px] bg-white border border-blue-300 text-blue-700 px-2 py-0.5 rounded-lg font-bold hover:bg-blue-100 cursor-pointer"
                >
                  {isEn ? "Stop Speaking" : "Tắt tiếng"}
                </button>
              </div>
            )}

            <div className="relative bg-white border border-slate-300 rounded-3xl shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all p-2 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  staffMode
                    ? (isEn
                        ? "Ask AI Pilot about stock levels, low items, stocktake process... (Enter to send)"
                        : "Hỏi AI Pilot về số lượng tồn kho, mặt hàng sắp hết, quy trình kiểm kê... (Enter để gửi)")
                    : (isEn
                        ? "Ask AI Pilot about stock, tied capital, price optimization... (Enter to send)"
                        : "Hỏi AI Pilot về tồn kho, rủi ro đọng vốn, chiến lược giá bán... (Enter để gửi)")
                }
                className="flex-1 max-h-36 bg-transparent text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm px-3 py-1.5 resize-none focus:outline-none font-medium leading-relaxed"
              />

              {/* Nút bật/tắt tự động đọc giọng nói */}
              {voiceSupported.tts && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setAutoSpeakEnabled(!autoSpeakEnabled);
                  }}
                  aria-label={autoSpeakEnabled ? "Tắt tự động đọc giọng nói" : "Bật tự động đọc giọng nói"}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer mb-0.5 ${
                    autoSpeakEnabled
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 ring-1 ring-blue-300/60'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                  title={
                    autoSpeakEnabled
                      ? (isEn ? "Auto-speak answers: ON (Click to mute)" : "Tự động đọc giọng nói: Đang BẬT (Bấm để tắt)")
                      : (isEn ? "Auto-speak answers: OFF (Click to enable)" : "Tự động đọc giọng nói: Đang TẮT (Bấm để bật)")
                  }
                >
                  {autoSpeakEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}

              {/* Nút Micro thu âm giọng nói */}
              {voiceSupported.stt && (
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  disabled={isSending || isHistoryLoading || isTranscribing}
                  aria-label={isListening ? "Dừng nghe" : "Hỏi bằng giọng nói"}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer mb-0.5 relative ${
                    isListening
                      ? 'bg-purple-600 hover:bg-purple-700 text-white animate-pulse shadow-md shadow-purple-500/30 ring-2 ring-purple-400/50'
                      : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 active:scale-95'
                  }`}
                  title={
                    isListening
                      ? (isEn ? "Listening... Click to finish" : "Đang Lắng Nghe... Bấm để gửi")
                      : (isEn ? "Ask with voice (Groq Whisper AI)" : "Nhấn để nói (Tự động nhận diện Groq Whisper & Trả lời bằng giọng nói)")
                  }
                >
                  {isListening ? (
                    <>
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600"></span>
                      </span>
                      <Mic className="w-4 h-4 animate-bounce" />
                    </>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isSending || isHistoryLoading}
                aria-label={isEn ? "Send message" : "Gửi câu hỏi"}
                className="w-9 h-9 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-30 disabled:hover:bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed mb-0.5"
                title={isEn ? "Send message" : "Gửi câu hỏi"}
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 mt-2">
              {isEn
                ? 'AI Pilot responds automatically based on store data. You can click action buttons to navigate instantly.'
                : 'AI Pilot trả lời tự động dựa trên dữ liệu của cửa hàng. Bạn có thể bấm vào các nút điều hướng để thao tác ngay.'}
            </p>
          </div>
        </div>

      </div>

      {/* 3. SUGGESTED ACTIONS (overlay below xl, side column from xl) */}
      {suggestionsOpen && (
        <aside className="absolute xl:static inset-y-0 right-0 z-20 w-[min(20rem,100%)] shrink-0 border-l border-slate-200 shadow-xl xl:shadow-none">
          <AISuggestionsPanel isEn={isEn} onClose={() => setSuggestionsOpen(false)} />
        </aside>
      )}

    </div>
  );
}
