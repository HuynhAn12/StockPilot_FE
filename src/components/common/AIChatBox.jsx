import { useState, useRef, useEffect } from 'react';
import {
  Bot, X, Send, Sparkles, RefreshCw, AlertTriangle,
  Package, DollarSign, ArrowRight, CheckCircle2,
  ChevronDown, Minimize2, MessageSquare, Zap
} from 'lucide-react';
import { useProductStore } from '../store/productStore';

export function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { products } = useProductStore();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initial messages
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI Pilot của StockPilot 🤖. Tôi có thể giúp bạn kiểm tra mặt hàng sắp hết kho, phân tích rủi ro đọng vốn, hoặc đề xuất giá bán tối ưu. Bạn muốn tra cứu gì hôm nay?',
      timestamp: 'Vừa xong',
      suggestions: [
        'Hàng nào sắp hết kho?',
        'Cảnh báo rủi ro đọng vốn',
        'Tổng quan tồn kho hôm nay',
        'Đề xuất tối ưu giá bán'
      ]
    }
  ]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  // Generate intelligent response based on current real store data
  const generateAIResponse = (userQuestion) => {
    const q = userQuestion.toLowerCase();
    const productList = products || [];

    // 1. Quản lý hết hàng / sắp hết
    if (q.includes('hết') || q.includes('sắp hết') || q.includes('thiếu hàng') || q.includes('tồn thấp')) {
      const lowStock = productList.filter(p => p.stock <= (p.alertThreshold || 10));
      if (lowStock.length > 0) {
        const items = lowStock.slice(0, 4).map(p => `• **${p.name}**: chỉ còn **${p.stock} ${p.unit || 'sản phẩm'}** (ngưỡng báo động: ${p.alertThreshold || 10})`).join('\n');
        return `⚠️ **Phát hiện ${lowStock.length} sản phẩm sắp hết trong kho:**\n\n${items}\n\n💡 **Khuyến nghị AI Pilot:** Bạn nên liên hệ nhà cung cấp để lên đơn nhập hàng bổ sung trong 48h tới nhằm tránh gián đoạn bán hàng!`;
      } else {
        return `✅ **Tuyệt vời!** Hiện tại không có mặt hàng nào dưới ngưỡng an toàn. Tất cả ${productList.length} sản phẩm đều đang duy trì mức tồn kho ổn định.`;
      }
    }

    // 2. Rủi ro đọng vốn / tồn dư
    if (q.includes('đọng vốn') || q.includes('tồn dư') || q.includes('chậm bán') || q.includes('tồn kho cao')) {
      const highStock = [...productList].sort((a, b) => (b.stock * b.costPrice) - (a.stock * a.costPrice)).slice(0, 3);
      if (highStock.length > 0) {
        const items = highStock.map(p => `• **${p.name}**: tồn **${p.stock} ${p.unit}** (giá trị vốn giam: ~${((p.stock * p.costPrice) / 1000).toLocaleString('vi-VN')}k đ)`).join('\n');
        return `📊 **Phân tích rủi ro đọng vốn:**\n\nCác mặt hàng đang giữ tỷ trọng vốn tồn kho lớn nhất:\n${items}\n\n💡 **Gợi ý từ AI:** Cân nhắc tạo chương trình Combo giảm giá 5-10% hoặc Flash Sale cuối tuần để giải phóng dòng tiền nhanh!`;
      }
    }

    // 3. Tổng quan kho hàng
    if (q.includes('tổng quan') || q.includes('tình hình') || q.includes('doanh thu') || q.includes('bao nhiêu sản phẩm')) {
      const totalStock = productList.reduce((acc, p) => acc + (p.stock || 0), 0);
      const totalValue = productList.reduce((acc, p) => acc + ((p.stock || 0) * (p.costPrice || 0)), 0);
      return `📈 **Báo cáo nhanh kho hàng:**\n\n• Tổng số mã sản phẩm: **${productList.length} mã**\n• Tổng số lượng tồn: **${totalStock.toLocaleString('vi-VN')} đơn vị**\n• Tổng giá trị vốn kho: **${(totalValue / 1000000).toFixed(1)} triệu VNĐ**\n• Sức khỏe kho hàng: **94/100 (Tốt)**\n\nBạn có muốn xem chi tiết nhóm hàng nào không?`;
    }

    // 4. Giá bán & Lợi nhuận
    if (q.includes('giá') || q.includes('lợi nhuận') || q.includes('biên lợi nhuận') || q.includes('tối ưu')) {
      return `💰 **Đề xuất chiến lược giá bán:**\n\n• **Nhóm Đồ ăn & Thực phẩm:** Biên lợi nhuận hiện tại đạt ~19%. Đang có thể nâng giá bán nhẹ 2-3% cho các dòng bánh nhập khẩu.\n• **Nhóm Nước ngọt & Nước ép:** Tỷ lệ quay vòng nhanh, nên giữ nguyên giá niêm yết để duy trì lượng khách quen.\n\n*Hệ thống chỉ gợi ý — Chủ shop toàn quyền quyết định mức giá!*`;
    }

    // 5. Chào hỏi
    if (q.includes('chào') || q.includes('hello') || q.includes('hi') || q.includes('ơi')) {
      return `Chào bạn! Tôi luôn sẵn sàng 24/7 đồng hành cùng cửa hàng của bạn. Bạn muốn tôi kiểm tra kho hàng, tìm kiếm sản phẩm hay phân tích giá bán?`;
    }

    // Default intelligent answer
    return `Tôi đã ghi nhận câu hỏi: "*${userQuestion}*".\n\nHiện tại kho của bạn đang vận hành với **${productList.length} sản phẩm**. Theo dữ liệu thời gian thực, luồng hàng nhập xuất diễn ra bình thường.\n\nBạn có thể thử hỏi tôi các lệnh nhanh:\n• *"Hàng nào sắp hết kho?"*\n• *"Cảnh báo đọng vốn"*`;
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking and reply
    await new Promise((r) => setTimeout(r, 650));

    const replyText = generateAIResponse(text);
    const aiMsg = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Hàng nào sắp hết kho?',
        'Tổng quan tồn kho hôm nay',
        'Cảnh báo rủi ro đọng vốn'
      ]
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: 'Cuộc trò chuyện đã được làm mới. Bạn cần AI Pilot hỗ trợ tra cứu số liệu kho hàng nào?',
        timestamp: 'Vừa xong',
        suggestions: [
          'Hàng nào sắp hết kho?',
          'Cảnh báo rủi ro đọng vốn',
          'Tổng quan tồn kho hôm nay'
        ]
      }
    ]);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* FLOATING CHAT BOX POPUP */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[360px] sm:w-[410px] h-[550px] max-h-[82vh] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.06)] border border-slate-200/80 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-blue-700 rounded-full animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-none">Trợ lý AI Pilot</h3>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-white/25 text-white">
                    StockPilot
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 font-medium mt-0.5">
                  Tư vấn kho hàng & Tối ưu giá bán
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                title="Làm mới cuộc trò chuyện"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                title="Đóng chatbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[88%]">
                  {msg.sender === 'ai' && (
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mb-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3 text-xs leading-relaxed rounded-2xl shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs font-medium'
                        : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/80'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {msg.text.split('\n').map((line, i) => {
                        // Simple bold markdown parser
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <span key={i} className="block min-h-[1.2em]">
                            {parts.map((p, idx) => {
                              if (p.startsWith('**') && p.endsWith('**')) {
                                return <strong key={idx} className={msg.sender === 'user' ? 'text-white font-bold' : 'text-slate-900 font-bold'}>{p.slice(2, -2)}</strong>;
                              }
                              return p;
                            })}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Suggestions Pills from AI */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-8">
                    {msg.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        className="text-[11px] font-semibold bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-full px-2.5 py-1 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs px-3 py-2 flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="px-3 py-1.5 bg-slate-100/70 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            <span className="text-slate-400 font-bold shrink-0 text-[10px] uppercase">Gợi ý:</span>
            <button
              type="button"
              onClick={() => handleSendMessage('Hàng nào sắp hết kho?')}
              className="text-slate-700 hover:text-blue-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0 cursor-pointer"
            >
              Hết kho?
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Cảnh báo rủi ro đọng vốn')}
              className="text-slate-700 hover:text-blue-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0 cursor-pointer"
            >
              Đọng vốn?
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Tổng quan tồn kho hôm nay')}
              className="text-slate-700 hover:text-blue-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0 cursor-pointer"
            >
              Tổng quan
            </button>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi AI về tồn kho, giá bán, nhập hàng..."
                className="flex-1 bg-slate-100 text-slate-900 placeholder:text-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all font-medium"
              />

              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30 transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Gửi tin nhắn (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING PILL BUTTON (Matching user screenshot: [ 🤖 Hỏi Trợ lý AI 🟢 ]) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 cursor-pointer select-none active:scale-95 ${
            isOpen
              ? 'bg-slate-900 text-white shadow-slate-900/30 ring-2 ring-slate-800'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-500/30 hover:scale-105'
          }`}
          title={isOpen ? 'Đóng Trợ lý AI' : 'Mở Trợ lý AI StockPilot'}
        >
          {isOpen ? (
            <>
              <X className="w-4 h-4 text-white" />
              <span className="text-xs font-bold">Đóng Trợ lý AI</span>
            </>
          ) : (
            <>
              <Bot className="w-4 h-4 animate-bounce group-hover:animate-none" />
              <span className="text-xs font-bold">Hỏi Trợ lý AI</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-blue-600 shadow-xs" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
