import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Send, Plus, Trash2, MessageSquare, Sparkles,
  Copy, Check, ArrowRight, CornerDownLeft, RefreshCw,
  Search, PanelLeftClose, PanelLeft, Clock, ShieldCheck,
  TrendingUp, AlertTriangle, Package, DollarSign, ChevronRight,
  ExternalLink, BarChart3, ShoppingCart, ArrowUpRight
} from 'lucide-react';
import { useProductStore } from '../components/store/productStore';
import { useAuthStore } from '../store/authStore';
import { isStaff } from '../config/permissions.config';
import { apiChatWithAssistant, apiGetAssistantHistory } from '../services/analyticsService';

const STORAGE_KEY = 'stockpilot_ai_active_session_v2';

function parseInlineMarkdown(text) {
  if (!text) return null;
  const regex = /(\*\*.*?\*\*|`.*?`|\(SP\d+\))/g;
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
          className="font-mono text-xs bg-[#f9f9f9] text-[#a50064] px-1.5 py-0.5 rounded border border-slate-200/80 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\(SP\d+\)$/.test(part)) {
      return (
        <span
          key={idx}
          className="font-mono text-[11px] bg-pink-50 text-[#a50064] px-1.5 py-0.5 rounded border border-pink-200/80 font-bold ml-1 inline-block"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function renderRichMarkdown(text, isUser) {
  if (isUser) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  const lines = text.split('\n');
  return (
    <div className="ai-prose space-y-2 text-[#303233]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading 3: ###
        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^###\s+/, '');
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-extrabold text-[#303233] mt-3.5 mb-1.5 flex items-center gap-1.5 tracking-tight border-b border-pink-100/60 pb-1"
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
              className="ai-blockquote border-l-4 border-[#a50064] bg-[#fdf8fa] text-[#303233] px-3.5 py-2.5 rounded-r-xl my-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs font-medium"
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
              <span className="font-bold text-[#a50064] shrink-0 mt-0.5">
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

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('current');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch product list for entity matching
  useEffect(() => {
    if (!products.length) fetchProducts();
  }, []);

  // Load chat history from backend database on mount
  useEffect(() => {
    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const historyData = await apiGetAssistantHistory({ limit: 40 });
        if (Array.isArray(historyData) && historyData.length > 0) {
          // Group into chronological messages for current conversation
          const serverMessages = [];
          // History items come ordered desc, reverse them to be chronological
          const reversed = [...historyData].reverse();
          reversed.forEach((item, idx) => {
            const timeStr = item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              : '';
            if (item.questionText) {
              serverMessages.push({
                id: `hist-q-${item.id || idx}`,
                sender: 'user',
                text: item.questionText,
                timestamp: timeStr,
              });
            }
            if (item.responseText) {
              serverMessages.push({
                id: `hist-a-${item.id || idx}`,
                sender: 'ai',
                text: item.responseText,
                timestamp: timeStr,
                actionLinks: item.metadata?.actionLinks || [],
              });
            }
          });

          const initialSession = {
            id: 'current',
            title: 'Hội thoại gần nhất',
            createdAt: reversed[0]?.createdAt || new Date().toISOString(),
            messages: serverMessages,
          };
          setChats([initialSession]);
          setActiveChatId('current');
        } else {
          // If empty in database, create clean initial state
          setChats([
            {
              id: 'current',
              title: 'Phiên trò chuyện mới',
              createdAt: new Date().toISOString(),
              messages: [],
            },
          ]);
          setActiveChatId('current');
        }
      } catch (err) {
        console.error('Failed to load assistant history:', err);
        setChats([
          {
            id: 'current',
            title: 'Phiên trò chuyện mới',
            createdAt: new Date().toISOString(),
            messages: [],
          },
        ]);
        setActiveChatId('current');
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistory();
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isTyping]);

  // Adjust textarea height automatically
  const handleTextareaChange = (e) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Create New Chat
  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChatObj = {
      id: newId,
      title: 'Đoạn chat mới',
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setChats([newChatObj, ...chats]);
    setActiveChatId(newId);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // Delete Chat
  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    const updated = chats.filter((c) => c.id !== chatId);
    if (updated.length > 0) {
      setChats(updated);
      if (activeChatId === chatId) {
        setActiveChatId(updated[0].id);
      }
    } else {
      const fallbackId = `chat-${Date.now()}`;
      setChats([{ id: fallbackId, title: 'Đoạn chat mới', createdAt: new Date().toISOString(), messages: [] }]);
      setActiveChatId(fallbackId);
    }
  };

  // Send Message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    let currentId = activeChatId;
    let currentChat = chats.find((c) => c.id === currentId);

    // Client-side guard for staff querying financial data
    if (staffMode) {
      const financialKeywords = [
        'doanh thu', 'lãi', 'lợi nhuận', 'giá vốn', 'tiền vốn', 'vốn đọng',
        'revenue', 'profit', 'cost price', 'margin', 'cogs', 'tổng vốn',
      ];
      const isFinancialQuery = financialKeywords.some((kw) => text.toLowerCase().includes(kw));
      if (isFinancialQuery) {
        const staffRefusalMsg =
          'Xin lỗi, tài khoản Nhân viên chỉ được phép tra cứu số lượng tồn kho và nghiệp vụ vận hành. Vui lòng liên hệ Chủ cửa hàng để xem dữ liệu tài chính.';
        const botResponse = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: staffRefusalMsg,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          actionLinks: [],
        };
        setChats((prev) =>
          prev.map((c) => (c.id === currentId ? { ...c, messages: [...c.messages, userMessage, botResponse] } : c))
        );
        setInputMessage('');
        return;
      }
    }

    const newTitle = currentChat && currentChat.messages.length === 0
      ? (text.length > 28 ? text.slice(0, 28) + '...' : text)
      : currentChat?.title || 'Đoạn chat mới';

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === currentId) {
          return {
            ...c,
            title: newTitle,
            messages: [...c.messages, userMessage],
          };
        }
        return c;
      })
    );

    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsTyping(true);

    let aiReplyText = '';
    let actionLinks = [];

    try {
      const qLower = text.toLowerCase();
      const matched = (products || []).find(
        (p) => (p.name && qLower.includes(p.name.toLowerCase())) || (p.sku && qLower.includes(p.sku.toLowerCase()))
      );

      const res = await apiChatWithAssistant(text, matched?.stockItemId || matched?.id);
      aiReplyText = res?.answer || res?.summary || 'Đã ghi nhận yêu cầu và xử lý thành công.';
      actionLinks = res?.actionLinks || [];
    } catch (err) {
      console.error('Error contacting AI assistant:', err);
      aiReplyText = '⚠️ Không thể kết nối với dịch vụ AI Pilot. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.';
    }

    const aiMessage = {
      id: `msg-ai-${Date.now()}`,
      sender: 'ai',
      text: aiReplyText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      actionLinks,
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === currentId) {
          return {
            ...c,
            messages: [...c.messages, aiMessage],
          };
        }
        return c;
      })
    );

    setIsTyping(false);
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy message
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter chats by title
  const filteredChats = chats.filter((c) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick prompt cards tailored to User Role
  const quickPrompts = staffMode ? [
    {
      icon: Package,
      color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
      title: 'Cảnh báo hết hàng & thiếu hàng',
      desc: 'Mặt hàng nào sắp hết trong kho và cần phát lệnh nhập gấp?',
      prompt: 'Mặt hàng nào sắp hết trong kho và cần nhập gấp?',
    },
    {
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
      title: 'Top 5 bán chạy (số lượng)',
      desc: 'Xếp hạng các sản phẩm có sản lượng bán chạy nhất trong tuần',
      prompt: 'Top 5 sản phẩm bán chạy nhất tuần này theo số lượng là gì?',
    },
    {
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
      title: 'Quy trình tạo đơn POS',
      desc: 'Hướng dẫn thao tác tạo hóa đơn và thanh toán nhanh tại quầy',
      prompt: 'Hướng dẫn quy trình quét mã barcode và tạo đơn tại quầy POS',
    },
    {
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 group-hover:bg-rose-600 group-hover:text-white',
      title: 'Cận hạn & Ưu tiên xuất trước (FIFO)',
      desc: 'Danh sách các mặt hàng cận hạn sử dụng cần ưu tiên xuất trước',
      prompt: 'Mặt hàng nào cận hạn sử dụng cần ưu tiên xuất trước theo nguyên tắc FIFO?',
    },
    {
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white',
      title: 'Vị trí hàng hóa trong kho',
      desc: 'Tra cứu sơ đồ vị trí kệ và khu vực lưu trữ hàng hóa',
      prompt: 'Làm thế nào để kiểm tra vị trí lưu kho của các mặt hàng bánh kẹo và gia vị?',
    },
    {
      icon: Check,
      color: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white',
      title: 'Quy trình kiểm kê kho',
      desc: 'Quy trình lập phiếu kiểm đếm và điều chỉnh số lượng thực tế',
      prompt: 'Quy trình lập phiếu kiểm đếm và điều chỉnh số lượng tồn thực tế trong ca',
    },
  ] : [
    {
      icon: Package,
      color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
      title: 'Cảnh báo hết hàng & thiếu hàng',
      desc: 'Mặt hàng nào sắp hết trong kho và cần phát lệnh nhập gấp?',
      prompt: 'Mặt hàng nào sắp hết trong kho và cần nhập gấp?',
    },
    {
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
      title: 'Top 5 bán chạy tuần này',
      desc: 'Xếp hạng các sản phẩm có doanh số và sản lượng tiêu thụ cao nhất',
      prompt: 'Top 5 sản phẩm bán chạy nhất tuần này là gì?',
    },
    {
      icon: DollarSign,
      color: 'text-rose-600 bg-rose-50 group-hover:bg-rose-600 group-hover:text-white',
      title: 'Mặt hàng bán lỗ hoặc biên lợi nhuận thấp',
      desc: 'Phát hiện các sản phẩm có giá bán sát hoặc thấp hơn giá vốn',
      prompt: 'Có mặt hàng nào đang bán lỗ hoặc biên lợi nhuận thấp không?',
    },
    {
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
      title: 'Kế hoạch nhập hàng & dự toán',
      desc: 'Đề xuất danh sách SP cần nhập kèm số lượng và ngân sách dự kiến',
      prompt: 'Đề xuất kế hoạch nhập hàng và dự toán chi phí cần chuẩn bị',
    },
    {
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white',
      title: 'Gợi ý tối ưu giá bán',
      desc: 'Chiến lược tăng giá bảo toàn vốn hoặc giảm giá kích cầu xả kho',
      prompt: 'Có đề xuất điều chỉnh giá bán nào hôm nay không?',
    },
    {
      icon: AlertTriangle,
      color: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white',
      title: 'Rủi ro đọng vốn & hàng ứ đọng',
      desc: 'Phân tích các sản phẩm tồn kho cao, vòng quay chậm chiếm dụng dòng tiền',
      prompt: 'Phân tích rủi ro đọng vốn và hàng ứ đọng trong kho',
    },
  ];

  return (
    <div className="ai-assistant-page-scoped flex h-[calc(100vh-84px)] -m-3 sm:-m-5 lg:-m-6 bg-[#fcfcfd] overflow-hidden">
      <style>{`
        .ai-assistant-page-scoped {
          --ifm-color-primary: #a50064;
          --ifm-color-primary-dark: #95005a;
          --ifm-color-primary-darker: #8c0055;
          --ifm-color-primary-darkest: #740046;
          --ifm-color-primary-light: #b5006e;
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
          background: #f9f9f9;
          color: #a50064;
          padding: 2px 6px;
          border-radius: 5px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          font-weight: 600;
        }

        .ai-assistant-page-scoped .ai-blockquote {
          border-left: 4px solid #a50064;
          background-color: #fdf8fa;
          color: #303233;
          padding: 10px 14px;
          border-radius: 0 10px 10px 0;
          margin: 10px 0;
          font-size: 13.5px;
          line-height: 1.6;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR: CHAT HISTORY */}
      {/* ========================================================================= */}
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
            className="flex-1 py-2.5 px-3 bg-[#a50064] hover:bg-[#8c0055] active:bg-[#740046] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Đoạn chat mới</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Thu nhỏ thanh lịch sử"
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
              placeholder="Tìm kiếm lịch sử chat..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-xs rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#a50064] focus:border-[#a50064] transition-all"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Lịch sử hội thoại ({filteredChats.length})</span>
            {isLoadingHistory && <RefreshCw className="w-3 h-3 animate-spin text-[#a50064]" />}
          </div>

          {filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#fff0f6] text-[#a50064] font-bold border border-[#fbcfe8] shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#a50064]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="flex-1 truncate text-left">{chat.title}</span>

                <button
                  type="button"
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  title="Xóa đoạn chat này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {filteredChats.length === 0 && !isLoadingHistory && (
            <div className="text-center py-8 text-xs text-slate-400">
              Chưa có phiên trò chuyện nào
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Pilot Live Sync</span>
          </div>
          <span className="text-[10px] text-slate-400">MySQL Database</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CHAT WORKSPACE */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">

        {/* Top Header Bar */}
        <div className="h-14 px-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Mở thanh lịch sử"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-[#a50064] to-[#d82d8b] text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-xs sm:max-w-md">
                  {activeChat?.title || 'Trợ lý AI Pilot'}
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="text-[#a50064] font-bold">Dữ liệu thời gian thực</span>
                  <span>•</span>
                  <span>Đồng bộ kho, đơn hàng & giá vốn</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-[#fff0f6] hover:text-[#a50064] hover:border-[#fbcfe8] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#a50064]" />
              <span>Đoạn chat mới</span>
            </button>
          </div>
        </div>

        {/* Messages Feed Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-6">
          <div className="max-w-3xl mx-auto w-full">

            {/* Empty Chat State: Quick Prompts Grid */}
            {(!activeChat?.messages || activeChat.messages.length === 0) && (
              <div className="py-6 sm:py-10 flex flex-col items-center text-center animate-in fade-in duration-300">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-[#a50064] to-[#d82d8b] text-white flex items-center justify-center shadow-lg shadow-pink-500/25">
                    <Bot className="w-9 h-9" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                  Chào bạn, tôi là AI Pilot
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
                  Tôi phân tích trực tiếp dữ liệu kho hàng, doanh thu thực tế và thuật toán cảnh báo của hệ thống để đưa ra quyết định kinh doanh chính xác.
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
                        className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#fbcfe8] hover:bg-[#fff0f6]/50 transition-all text-left group shadow-xs hover:shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${card.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-[#a50064]">
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
            {activeChat?.messages?.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 my-5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-[#a50064] to-[#d82d8b] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%]`}>
                    <div
                      className={`p-4 text-xs sm:text-sm leading-relaxed rounded-2xl shadow-xs ${
                        isUser
                          ? 'bg-linear-to-r from-[#a50064] to-[#c1177c] text-white rounded-tr-xs font-medium shadow-pink-600/10'
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fff0f6] hover:bg-[#fce7f3] text-[#a50064] text-xs font-bold rounded-lg border border-[#fbcfe8] transition-colors cursor-pointer"
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

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="flex items-center gap-1 hover:text-[#a50064] transition-colors ml-2 cursor-pointer"
                          title="Sao chép câu trả lời"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
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
                <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-[#a50064] to-[#d82d8b] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#a50064] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#a50064] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#a50064] animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-500 font-semibold ml-2">AI Pilot đang truy vấn dữ liệu thực tế từ cơ sở dữ liệu...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-linear-to-t from-white via-white to-white/80 border-t border-slate-100">
          <div className="max-w-3xl mx-auto w-full">
            <div className="relative bg-white border border-slate-300 rounded-3xl shadow-sm focus-within:border-[#a50064] focus-within:ring-2 focus-within:ring-[#a50064]/20 transition-all p-2 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  staffMode
                    ? "Hỏi AI Pilot về số lượng tồn kho, mặt hàng sắp hết, quy trình kiểm kê... (Enter để gửi)"
                    : "Hỏi AI Pilot về tồn kho, rủi ro đọng vốn, chiến lược giá bán... (Enter để gửi)"
                }
                className="flex-1 max-h-36 bg-transparent text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm px-3 py-1.5 resize-none focus:outline-none font-medium leading-relaxed"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="w-9 h-9 rounded-2xl bg-[#a50064] hover:bg-[#8c0055] active:bg-[#740046] disabled:opacity-30 disabled:hover:bg-[#a50064] text-white flex items-center justify-center shrink-0 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed mb-0.5"
                title="Gửi câu hỏi"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 mt-2">
              AI Pilot trả lời tự động dựa trên dữ liệu thật của cửa hàng. Bạn có thể bấm vào các nút điều hướng để thao tác ngay.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
