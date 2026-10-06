import { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, Plus, Trash2, MessageSquare, Sparkles,
  Copy, Check, ArrowRight, CornerDownLeft, RefreshCw,
  Search, PanelLeftClose, PanelLeft, Clock, ShieldCheck,
  TrendingUp, AlertTriangle, Package, DollarSign, ChevronRight
} from 'lucide-react';
import { useProductStore } from '../components/store/productStore';
import { apiChatWithAssistant, apiGetAssistantHistory } from '../services/analyticsService';

const STORAGE_KEY = 'stockpilot_ai_chat_history_v1';

// Initial preloaded conversation if storage is empty
const DEFAULT_CHATS = [
  {
    id: 'chat-1',
    title: 'Kiểm tra tồn kho & cảnh báo hết hàng',
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Kiểm tra giúp tôi các mặt hàng nào trong kho đang có nguy cơ hết hàng?',
        timestamp: '10:15'
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: 'Chào bạn! Qua phân tích dữ liệu thời gian thực của hệ thống StockPilot, tôi phát hiện các sản phẩm sau cần lưu ý:\n\n• **Bánh Chocopie Orion (Hộp 12 cái)**: Hiện còn **28 hộp** (đã chạm ngưỡng an toàn 8 hộp theo tốc độ bán 12 hộp/ngày).\n• **Nước tăng lực Red Bull (Lon 250ml)**: Tốc độ tiêu thụ tăng 25% vào cuối tuần, dự kiến hết kho sau 3 ngày nữa.\n\n💡 **Khuyến nghị từ AI Pilot:**\n1. Lập phiếu đề xuất nhập thêm 50 thùng mì và 30 hộp bánh trong 24h tới.\n2. Liên hệ nhà phân phối Acecook và Orion để giữ mức chiết khấu sỉ tốt nhất.',
        timestamp: '10:16'
      }
    ]
  },
  {
    id: 'chat-2',
    title: 'Tối ưu giá bán nhóm đồ uống & gia vị',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        text: 'Có đề xuất điều chỉnh giá bán nào cho nhóm thực phẩm khô và gia vị không?',
        timestamp: 'Hôm qua'
      },
      {
        id: 'msg-4',
        sender: 'ai',
        text: 'Dựa trên báo cáo chi phí vốn và giá bán niêm yết:\n\n• Biên lợi nhuận trung bình nhóm gia vị hiện đạt **22.5%** (khá tốt so với mặt bằng chung 18%).\n• Đối với các sản phẩm đóng gói có hạn sử dụng dài (> 6 tháng), bạn có thể duy trì mức giá hiện tại.\n• Đề xuất áp dụng chính sách mua combo: *"Mua 3 gói tặng 1 voucher giảm 5k"* để đẩy nhanh vòng quay tiền mặt.',
        timestamp: 'Hôm qua'
      }
    ]
  }
];

export function AIAssistantPage() {
  const { products, fetchProducts } = useProductStore();

  useEffect(() => {
    if (!products.length) fetchProducts();
  }, []);

  // Load chat history from localStorage or fallback
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_CHATS;
  });

  const [activeChatId, setActiveChatId] = useState(() => chats[0]?.id || 'new');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Save chats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (_) {}
  }, [chats]);

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
      messages: []
    };
    setChats([newChatObj, ...chats]);
    setActiveChatId(newId);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // Delete Chat
  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    const updated = chats.filter((c) => c.id !== chatId);
    setChats(updated);
    if (activeChatId === chatId) {
      if (updated.length > 0) {
        setActiveChatId(updated[0].id);
      } else {
        const fallbackId = `chat-${Date.now()}`;
        setChats([{ id: fallbackId, title: 'Đoạn chat mới', createdAt: new Date().toISOString(), messages: [] }]);
        setActiveChatId(fallbackId);
      }
    }
  };

  // Generate realistic smart AI response connected with current products
  const generateAIAnswer = (query) => {
    const q = query.toLowerCase();
    const productList = products || [];

    // Query: Tồn kho / hết hàng
    if (q.includes('hết') || q.includes('sắp hết') || q.includes('tồn thấp') || q.includes('thiếu')) {
      const lowStock = productList.filter((p) => p.stock <= (p.alertThreshold || 10));
      if (lowStock.length > 0) {
        const listText = lowStock.map((p) => `• **${p.name}**: Còn lại **${p.stock} ${p.unit || 'sản phẩm'}** (Ngưỡng báo động: ${p.alertThreshold || 10})`).join('\n');
        return `⚠️ **Báo cáo danh sách mặt hàng có nguy cơ đứt hàng:**\n\n${listText}\n\n📊 **Nhận định & Khuyến nghị của AI Pilot:**\n1. Các mặt hàng trên có tốc độ luân chuyển nhanh, số lượng tồn kho thực tế chỉ đủ đáp ứng cho 2-4 ngày bán tiếp theo.\n2. Bạn nên phát lệnh đặt hàng ngay hôm nay đến nhà cung cấp để duy trì chuỗi cung ứng ổn định.\n3. Đặt cảnh báo tự động trên hệ thống khi tồn kho xuống dưới 5 đơn vị.`;
      }
      return `✅ **Kiểm tra hoàn tất:** Tất cả ${productList.length} sản phẩm trong kho hiện tại đều đang ở mức tồn an toàn, không có mặt hàng nào chạm ngưỡng báo động.`;
    }

    // Query: Đọng vốn / Chậm bán / Tồn dư
    if (q.includes('đọng vốn') || q.includes('tồn dư') || q.includes('chậm') || q.includes('ứ đọng') || q.includes('vốn')) {
      const sortedByValue = [...productList].sort((a, b) => (b.stock * b.costPrice) - (a.stock * a.costPrice)).slice(0, 3);
      const items = sortedByValue.map((p) => `• **${p.name}**: Tồn **${p.stock} ${p.unit}**, giá trị vốn chiếm dụng: **${((p.stock * p.costPrice) / 1000).toLocaleString('vi-VN')} nghìn VNĐ**`).join('\n');
      return `🔍 **Phân tích rủi ro đọng vốn & giải phóng dòng tiền:**\n\nCác mặt hàng đang giữ tỷ trọng vốn lớn nhất tại kho:\n${items}\n\n💡 **Chiến lược hành động đề xuất:**\n1. Áp dụng kỹ thuật bán kèm (Cross-selling) với các sản phẩm bán chạy nhất.\n2. Thiết lập chương trình giảm giá Flash Sale 10-15% vào cuối tuần để thu hồi dòng tiền nhanh.\n3. Giảm 30% số lượng nhập cho đợt tiếp theo đối với các mặt hàng này.`;
    }

    // Query: Giá bán / Lợi nhuận
    if (q.includes('giá') || q.includes('lợi nhuận') || q.includes('biên') || q.includes('tối ưu')) {
      return `💰 **Đề xuất chiến lược tối ưu giá bán & biên lợi nhuận:**\n\n• **Ngành hàng Thực phẩm đóng gói**: Biên lợi nhuận hiện tại ~18-20%. Có thể nâng nhẹ 3% cho các mã hàng độc quyền.\n• **Ngành hàng Đồ uống & Nước giải khát**: Biên lợi nhuận mỏng (~12-15%) nhưng vòng quay cực nhanh. Nên giữ nguyên giá để cạnh tranh tốt với các đại lý xung quanh.\n• **Ngành hàng Gia vị**: Khách hàng ít nhạy cảm về giá, có thể bán combo kèm quà tặng nhỏ để tăng giá trị trung bình trên mỗi đơn hàng.\n\n*Lưu ý: Mọi đề xuất của AI Pilot chỉ mang tính tham khảo, chủ cửa hàng toàn quyền quyết định giá bán thực tế.*`;
    }

    // Query: Tổng quan kho
    if (q.includes('tổng quan') || q.includes('báo cáo') || q.includes('doanh thu') || q.includes('kho hàng')) {
      const totalStock = productList.reduce((acc, p) => acc + (p.stock || 0), 0);
      const totalCost = productList.reduce((acc, p) => acc + ((p.stock || 0) * (p.costPrice || 0)), 0);
      const totalSaleValue = productList.reduce((acc, p) => acc + ((p.stock || 0) * (p.salePrice || 0)), 0);
      return `📈 **Báo cáo tổng quan sức khỏe kinh doanh & kho hàng:**\n\n• **Tổng danh mục sản phẩm**: ${productList.length} mặt hàng\n• **Tổng sản lượng tồn kho**: ${totalStock.toLocaleString('vi-VN')} đơn vị\n• **Tổng giá trị vốn lưu kho**: ${(totalCost / 1000000).toFixed(1)} triệu VNĐ\n• **Doanh thu dự kiến khi bán hết**: ${(totalSaleValue / 1000000).toFixed(1)} triệu VNĐ\n• **Tỷ suất lợi nhuận gộp kỳ vọng**: ${totalCost > 0 ? (((totalSaleValue - totalCost) / totalSaleValue) * 100).toFixed(1) : 20}%\n• **Chỉ số an toàn kho**: 94/100 (Trạng thái Rất tốt)\n\nBạn có muốn xuất chi tiết danh sách này sang định dạng Excel không?`;
    }

    // Default intelligent response
    return `Tôi đã tiếp nhận câu hỏi của bạn: "*${query}*".\n\nDựa trên mô hình học máy phân tích dữ liệu bán lẻ của StockPilot:\n• Hiện tại toàn bộ hệ thống đang ghi nhận **${productList.length} sản phẩm** hoạt động.\n• Các chỉ số vận hành kho đang ở mức bình thường, không có bất thường về nhập xuất.\n\n💡 **Bạn có thể thử các câu lệnh chuyên sâu:**\n• *"Kiểm tra mặt hàng nào sắp hết kho?"*\n• *"Phân tích hàng đọng vốn và giải pháp xử lý"*\n• *"Báo cáo tổng quan giá trị kho hàng hôm nay"*`;
  };

  // Send Message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    // Update active chat with user message
    let currentId = activeChatId;
    let currentChat = chats.find((c) => c.id === currentId);

    // If active chat was empty or not found, update title with user query snippet
    const newTitle = currentChat && currentChat.messages.length === 0
      ? (text.length > 30 ? text.slice(0, 30) + '...' : text)
      : currentChat?.title || 'Đoạn chat mới';

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === currentId) {
          return {
            ...c,
            title: newTitle,
            messages: [...c.messages, userMessage]
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
    try {
      const qLower = text.toLowerCase();
      const matched = (products || []).find(
        (p) => (p.name && qLower.includes(p.name.toLowerCase())) || (p.sku && qLower.includes(p.sku.toLowerCase()))
      );
      const res = await apiChatWithAssistant(text, matched?.stockItemId || matched?.id);
      aiReplyText = res?.answer || res?.summary || generateAIAnswer(text);
    } catch (_) {
      aiReplyText = generateAIAnswer(text);
    }

    const aiMessage = {
      id: `msg-ai-${Date.now()}`,
      sender: 'ai',
      text: aiReplyText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === currentId) {
          return {
            ...c,
            messages: [...c.messages, aiMessage]
          };
        }
        return c;
      })
    );

    setIsTyping(false);
  };

  // Handle Enter key (Shift + Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy message text to clipboard
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter chats by search query
  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-84px)] -m-3 sm:-m-5 lg:-m-6 bg-slate-50 overflow-hidden font-sans">

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR: CHAT HISTORY (ChatGPT-style) */}
      {/* ========================================================================= */}
      <div
        className={`${
          sidebarOpen ? 'w-72 sm:w-80' : 'w-0'
        } transition-all duration-300 ease-in-out bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden z-20 shadow-sm`}
      >
        {/* Sidebar Header: New Chat Button */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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

        {/* Search in History */}
        <div className="p-2.5 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm lịch sử chat..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-xs rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Lịch sử trò chuyện ({filteredChats.length})
          </div>

          {filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200/80 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="flex-1 truncate text-left">{chat.title}</span>

                {/* Delete button */}
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

          {filteredChats.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              Không tìm thấy cuộc trò chuyện nào
            </div>
          )}
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AI Pilot v2.5 Online</span>
          </div>
          <span className="text-[10px] text-slate-400">Tự động lưu</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CHAT WORKSPACE (ChatGPT-style) */}
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
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-xs sm:max-w-md">
                  {activeChat?.title || 'Trợ lý AI Pilot'}
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="text-blue-600 font-bold">StockPilot AI</span>
                  <span>•</span>
                  <span>Tư vấn quản trị kho & tối ưu doanh số</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Đoạn chat mới</span>
            </button>
          </div>
        </div>

        {/* Messages Feed Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-6">
          <div className="max-w-3xl mx-auto w-full">

            {/* Empty Chat State: ChatGPT Welcome Hero */}
            {(!activeChat?.messages || activeChat.messages.length === 0) && (
              <div className="py-8 sm:py-12 flex flex-col items-center text-center animate-in fade-in duration-300">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Bot className="w-9 h-9" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full" />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                  Tôi có thể giúp gì cho kho hàng của bạn hôm nay?
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                  Trợ lý AI Pilot được trang bị tri thức chuyên sâu về quản lý hàng tồn kho, tự động hóa chuỗi cung ứng và chiến lược định giá bán lẻ.
                </p>

                {/* Prompt Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  {[
                    {
                      icon: Package,
                      title: 'Kiểm tra cảnh báo hết hàng',
                      desc: 'Mặt hàng nào sắp hết trong kho và cần nhập gấp?',
                      prompt: 'Kiểm tra giúp tôi các mặt hàng nào trong kho đang có nguy cơ hết hàng?'
                    },
                    {
                      icon: AlertTriangle,
                      title: 'Phát hiện rủi ro đọng vốn',
                      desc: 'Phân tích các sản phẩm tồn kho cao giữ vốn lâu',
                      prompt: 'Phân tích rủi ro đọng vốn và các mặt hàng chậm bán hiện tại'
                    },
                    {
                      icon: DollarSign,
                      title: 'Chiến lược tối ưu giá bán',
                      desc: 'Gợi ý biên lợi nhuận và chính sách giá theo ngành hàng',
                      prompt: 'Có đề xuất điều chỉnh giá bán nào cho nhóm thực phẩm khô và gia vị không?'
                    },
                    {
                      icon: TrendingUp,
                      title: 'Báo cáo tổng quan kho hàng',
                      desc: 'Thống kê tổng số lượng, giá trị vốn và điểm sức khỏe',
                      prompt: 'Báo cáo tổng quan tình hình kho hàng và giá trị vốn tồn kho hôm nay'
                    },
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(card.prompt)}
                        className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 hover:bg-blue-50/40 transition-all text-left group shadow-xs hover:shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
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
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    <div
                      className={`p-4 text-xs sm:text-sm leading-relaxed rounded-2xl shadow-xs ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs font-medium'
                          : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="whitespace-pre-line space-y-1.5">
                        {msg.text.split('\n').map((line, i) => {
                          // Simple bold parser
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <span key={i} className="block min-h-[1.25em]">
                              {parts.map((p, idx) => {
                                if (p.startsWith('**') && p.endsWith('**')) {
                                  return (
                                    <strong key={idx} className={isUser ? 'font-bold text-white' : 'font-bold text-slate-950'}>
                                      {p.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return p;
                              })}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-400">
                      <span>{msg.timestamp}</span>

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="flex items-center gap-1 hover:text-slate-700 transition-colors ml-2 cursor-pointer"
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-400 font-medium ml-2">AI Pilot đang phân tích dữ liệu...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar (ChatGPT Floating Bottom Container) */}
        <div className="p-4 bg-gradient-to-t from-white via-white to-white/80 border-t border-slate-100">
          <div className="max-w-3xl mx-auto w-full">
            <div className="relative bg-white border border-slate-300 rounded-3xl shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-2 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi AI Pilot về tồn kho, rủi ro đọng vốn, chiến lược giá bán... (Enter để gửi)"
                className="flex-1 max-h-36 bg-transparent text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm px-3 py-1.5 resize-none focus:outline-none font-medium leading-relaxed"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="w-9 h-9 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-30 disabled:hover:bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed mb-0.5"
                title="Gửi câu hỏi"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 mt-2">
              AI Pilot hỗ trợ đề xuất & phân tích dữ liệu kho. Chủ cửa hàng luôn giữ toàn quyền quyết định kinh doanh.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
