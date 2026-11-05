import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bot, X, Send, Sparkles, RefreshCw, ArrowUpRight, Mic, Volume2, VolumeX } from 'lucide-react';
import { StockPilotAILogo } from './StockPilotAILogo';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { useTranslation } from '../../i18n/useTranslation';
import { apiChatWithAssistant } from '../../services/analyticsService';
import { AISourceBadge } from '../assistant/AISourceBadge';
import { assistantKeys, useAssistantScope } from '../../features/assistant/queries';

const FOLLOW_UPS = {
  vi: ['Hàng nào sắp hết kho?', 'Tổng quan tồn kho hôm nay', 'Cảnh báo rủi ro đọng vốn'],
  en: ['Which items are low in stock?', "Today's inventory summary", 'Overstock & capital risk alert'],
};

const nowLabel = (isEn) => new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' });

function renderChatMessage(text, isUser) {
  if (isUser) {
    return <span>{text}</span>;
  }

  const rawLines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

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

  const parseInline = (str) => {
    if (!str) return null;
    if (/<br\s*\/?>/i.test(str)) {
      const segs = str.split(/<br\s*\/?>/gi);
      return segs.map((s, sIdx) => (
        <span key={sIdx}>
          {parseInline(s)}
          {sIdx < segs.length - 1 && <br />}
        </span>
      ));
    }

    const parts = str.split(/(\*\*.*?\*\*|`.*?`|[█▉▊▋▌▍▎▏■]+)/g);
    return parts.map((p, idx) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={idx} className="font-bold text-slate-900">{p.slice(2, -2)}</strong>;
      }
      if (p.startsWith('`') && p.endsWith('`')) {
        return <code key={idx} className="bg-blue-50 text-blue-600 px-1 rounded">{p.slice(1, -1)}</code>;
      }
      if (/^[█▉▊▋▌▍▎▏■]+$/.test(p)) {
        const widthPx = Math.min(80, Math.max(15, p.length * 7));
        return (
          <span
            key={idx}
            className="inline-block h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 align-middle mx-1 shadow-2xs"
            style={{ width: `${widthPx}px` }}
          />
        );
      }
      return p;
    });
  };

  return (
    <div className="space-y-1.5">
      {blocks.map((block, idx) => {
        if (block.type === 'table') {
          return (
            <div key={idx} className="overflow-x-auto my-2 rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-[11px] text-left border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    {block.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className={`px-2.5 py-1.5 font-bold ${
                          block.alignments[hIdx] === 'center'
                            ? 'text-center'
                            : block.alignments[hIdx] === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {parseInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-blue-50/30">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-2.5 py-1.5 whitespace-nowrap ${
                            block.alignments[cIdx] === 'center'
                              ? 'text-center'
                              : block.alignments[cIdx] === 'right'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {parseInline(cell)}
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
        if (!trimmed) return <div key={idx} className="h-1" />;
        if (trimmed === '---' || trimmed === '***') return <hr key={idx} className="my-1.5 border-t border-slate-200" />;

        const isHeading = /^#{1,6}\s+/.test(trimmed);
        if (isHeading) {
          const headingText = trimmed.replace(/^#{1,6}\s+/, '');
          return <div key={idx} className="font-bold text-slate-900 mt-2 mb-1">{parseInline(headingText)}</div>;
        }

        return (
          <div key={idx} className="leading-relaxed">
            {parseInline(line)}
          </div>
        );
      })}
    </div>
  );
}

export function AIChatBox() {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  const [voiceInterimText, setVoiceInterimText] = useState('');

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
          setInputValue('');
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
  const [, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId, storeId } = useAssistantScope();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initial messages
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome-1',
        sender: 'ai',
        text: isEn
          ? "Hello! I am your StockPilot AI Assistant 🤖. I can help check low-stock items, analyze dead inventory risks, or recommend optimal pricing. What would you like to explore today?"
          : 'Xin chào! Tôi là Trợ lý AI Pilot của StockPilot 🤖. Tôi có thể giúp bạn kiểm tra mặt hàng sắp hết kho, phân tích rủi ro đọng vốn, hoặc đề xuất giá bán tối ưu. Bạn muốn tra cứu gì hôm nay?',
        timestamp: isEn ? 'Just now' : 'Vừa xong',
        suggestions: isEn
          ? [
              'Which items are low in stock?',
              'Overstock & capital risk alert',
              'Inventory summary today',
              'Price optimization advice'
            ]
          : [
              'Hàng nào sắp hết kho?',
              'Cảnh báo rủi ro đọng vốn',
              'Tổng quan tồn kho hôm nay',
              'Đề xuất tối ưu giá bán'
            ]
      }
    ]);
  }, [isEn]);

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

  const lastSentTextRef = useRef('');
  const lastSentTimeRef = useRef(0);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (isTyping) return;

    // Ngăn duplicate tin nhắn gửi dồn trong vòng 1.5 giây
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

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: nowLabel(isEn)
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // The backend answers from Decision Engine data (AI, or the rule-based fallback) and applies role limits.
    let aiMsg;
    try {
      const response = await apiChatWithAssistant(text);
      // Cùng một lịch sử với trang Trợ lý AI: trang đang mở thì tải lại ngay, không thì lần mở sau.
      queryClient.invalidateQueries({ queryKey: assistantKeys.history(userId, storeId) });
      aiMsg = {
        id: `ai-${response.id || Date.now()}`,
        sender: 'ai',
        text: response.answer || (isEn ? 'No answer was returned. Please try again.' : 'Chưa nhận được câu trả lời. Vui lòng thử lại.'),
        timestamp: nowLabel(isEn),
        source: response.source,
        fallbackReason: response.fallbackReason,
        actionLinks: response.actionLinks || [],
        suggestions: FOLLOW_UPS[isEn ? 'en' : 'vi']
      };
    } catch (err) {
      aiMsg = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: isEn
          ? `**Could not reach the assistant.** ${err?.response?.data?.error?.message || err?.message || 'Network error'}`
          : `**Không kết nối được trợ lý.** ${err?.response?.data?.error?.message || err?.message || 'Lỗi mạng'}`,
        timestamp: nowLabel(isEn)
      };
    } finally {
      setIsTyping(false);
    }
    setMessages((prev) => [...prev, aiMsg]);

    // Tự động phát âm thanh ngay lập tức
    if (autoSpeakEnabled && aiMsg.text) {
      speak(aiMsg.text, aiMsg.id);
    }
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
        text: isEn
          ? 'Conversation cleared. What would you like AI Pilot to look up?'
          : 'Cuộc trò chuyện đã được làm mới. Bạn cần AI Pilot hỗ trợ tra cứu số liệu kho hàng nào?',
        timestamp: isEn ? 'Just now' : 'Vừa xong',
        suggestions: FOLLOW_UPS[isEn ? 'en' : 'vi']
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
                <StockPilotAILogo size="w-9 h-9 rounded-2xl" className="border border-white/20 shadow-md" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-blue-700 rounded-full animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-none">
                    {isEn ? 'AI Pilot Assistant' : 'Trợ lý AI Pilot'}
                  </h3>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-white/25 text-white">
                    StockPilot
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 font-medium mt-0.5">
                  {isEn ? 'Smart Inventory & Pricing Advisor' : 'Tư vấn kho hàng & Tối ưu giá bán'}
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
                    <StockPilotAILogo size="w-6 h-6 rounded-lg" className="shrink-0 mb-1" />
                  )}

                  <div
                    className={`p-3 text-xs leading-relaxed rounded-2xl shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs font-medium'
                        : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/80'
                    }`}
                  >
                    <div>
                      {renderChatMessage(msg.text, msg.sender === 'user')}
                    </div>

                    {msg.actionLinks && msg.actionLinks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.actionLinks.map((link, lIdx) => (
                          <button
                            key={lIdx}
                            type="button"
                            onClick={() => {
                              navigate(link.path || link.url);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          >
                            <span>{link.label}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}

                  {msg.sender === 'ai' && voiceSupported.tts && (
                    <button
                      type="button"
                      onClick={() => speak(msg.text, msg.id || msg.timestamp)}
                      className="hover:text-blue-600 text-slate-400 ml-1 p-0.5 cursor-pointer inline-flex items-center gap-0.5"
                      title={isSpeaking && speakingMessageId === (msg.id || msg.timestamp) ? (isEn ? "Stop" : "Dừng đọc") : (isEn ? "Read" : "Đọc bằng giọng nói")}
                    >
                      {isSpeaking && speakingMessageId === (msg.id || msg.timestamp) ? (
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
                <StockPilotAILogo size="w-6 h-6 rounded-lg" className="shrink-0 animate-pulse" />
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
            <span className="text-slate-400 font-bold shrink-0 text-[10px] uppercase">
              {isEn ? 'Hints:' : 'Gợi ý:'}
            </span>
            <button
              type="button"
              onClick={() => handleSendMessage(isEn ? 'Which items are low in stock?' : 'Hàng nào sắp hết kho?')}
              className="text-slate-700 hover:text-blue-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0 cursor-pointer"
            >
              {isEn ? 'Low Stock?' : 'Hết kho?'}
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage(isEn ? 'Overstock & capital risk alert' : 'Cảnh báo rủi ro đọng vốn')}
              className="text-slate-700 hover:text-blue-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0 cursor-pointer"
            >
              {isEn ? 'Dead Stock?' : 'Đọng vốn?'}
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage(isEn ? "Today's inventory summary" : 'Tổng quan tồn kho hôm nay')}
              className="text-slate-700 hover:text-blue-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0 cursor-pointer"
            >
              {isEn ? 'Summary' : 'Tổng quan'}
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
                placeholder={
                  isListening
                    ? (voiceInterimText ? `"${voiceInterimText}"` : (isEn ? 'Listening...' : 'Đang Lắng Nghe...'))
                    : (isEn ? 'Ask AI about inventory, pricing, stock levels...' : 'Hỏi AI về tồn kho, giá bán, nhập hàng...')
                }
                className={`flex-1 text-slate-900 placeholder:text-purple-600 text-xs px-3.5 py-2.5 rounded-xl border focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all font-medium ${
                  isListening ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-300/30 font-semibold text-purple-700' : 'bg-slate-100 border-slate-200'
                }`}
              />

              {voiceSupported.tts && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setAutoSpeakEnabled(!autoSpeakEnabled);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    autoSpeakEnabled
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                  title={autoSpeakEnabled ? 'Tự động đọc giọng nói: BẬT' : 'Tự động đọc giọng nói: TẮT'}
                >
                  {autoSpeakEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}

              {voiceSupported.stt && (
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  disabled={isTyping || isTranscribing}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer relative ${
                    isListening
                      ? 'bg-purple-600 hover:bg-purple-700 text-white animate-pulse shadow-md shadow-purple-500/30 ring-2 ring-purple-400/50'
                      : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600'
                  }`}
                  title={isListening ? 'Đang Lắng Nghe... Bấm để gửi' : 'Hỏi bằng giọng nói (Groq Whisper AI)'}
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30 transition-all cursor-pointer disabled:cursor-not-allowed"
                title={isEn ? 'Send message (Enter)' : 'Gửi tin nhắn (Enter)'}
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
      <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer select-none active:scale-95 ${
            isOpen
              ? 'bg-slate-900 text-white shadow-slate-900/30 ring-2 ring-slate-800'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-500/25 hover:scale-102'
          }`}
          title={
            isOpen
              ? (isEn ? 'Close AI Assistant' : 'Đóng Trợ lý AI')
              : (isEn ? 'Open StockPilot AI Assistant' : 'Mở Trợ lý AI StockPilot')
          }
        >
          {isOpen ? (
            <>
              <X className="w-4 h-4 text-white" />
              <span className="text-xs font-bold">{isEn ? 'Close' : 'Đóng'}</span>
            </>
          ) : (
            <>
              <StockPilotAILogo size="w-4 h-4 rounded-sm" />
              <span className="text-xs font-bold">{isEn ? 'Ask AI Assistant' : 'Hỏi Trợ lý AI'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-blue-600 shadow-xs" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
