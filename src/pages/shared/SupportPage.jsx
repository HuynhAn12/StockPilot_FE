import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Send, Loader2, LifeBuoy, ArrowLeft, Clock } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import {
  apiListMyTickets,
  apiCreateTicket,
  apiGetMyTicket,
  apiReplyMyTicket,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
} from '../../services/supportService';
import { formatVNDateTime } from '../../services/adminService';
import { apiErrorMessage, formatRelativeTime } from '../admin/adminLabels';
import { adminStyles as ui } from '../admin/adminStyles';

const STATUS_STYLE = {
  OPEN: ui.badgeAmber,
  IN_PROGRESS: ui.badgeBlue,
  WAITING_STORE: ui.badgeRed,
  RESOLVED: ui.badgeGray,
};

export function StatusBadge({ status }) {
  return <span className={`${ui.badge} ${STATUS_STYLE[status] || ui.badgeGray}`}>{SUPPORT_STATUS_LABELS[status] || status}</span>;
}

export function MessageThread({ messages, viewerIsAdmin }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <div className="space-y-3">
      {messages.map((m) => {
        const mine = viewerIsAdmin ? m.fromAdmin : !m.fromAdmin;
        return (
          <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13px] border ${
                m.isInternal
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : mine
                  ? 'bg-blue-50 border-blue-100 text-[#1E3A8A]'
                  : 'bg-white border-[#E5E7EB] text-[#334155]'
              }`}
            >
              <div className="text-[11px] text-[#64748B] mb-1">
                {m.isInternal ? 'Ghi chú nội bộ · ' : ''}
                {m.author?.fullName || (m.fromAdmin ? 'Đội hỗ trợ' : 'Cửa hàng')} · {formatVNDateTime(m.createdAt)}
              </div>
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

export function SupportPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);

  const presetCategory = searchParams.get('new');
  const [creating, setCreating] = useState(Boolean(presetCategory));
  const [form, setForm] = useState({ subject: '', category: presetCategory || '', message: '' });

  const loadList = useCallback(async () => {
    try {
      const res = await apiListMyTickets({ limit: 50 });
      setTickets(res.data);
    } catch (err) {
      toast({ type: 'error', title: 'Không tải được yêu cầu hỗ trợ', description: apiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadTicket = useCallback(
    async (id) => {
      try {
        setTicket(await apiGetMyTicket(id));
      } catch (err) {
        toast({ type: 'error', title: 'Không mở được yêu cầu', description: apiErrorMessage(err) });
      }
    },
    [toast]
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    const id = Number(searchParams.get('ticket'));
    if (id) setSelectedId(id);
  }, [searchParams]);

  useEffect(() => {
    if (selectedId) {
      setTicket(null);
      loadTicket(selectedId);
    }
  }, [selectedId, loadTicket]);

  const openTicket = (id) => {
    setCreating(false);
    setSelectedId(id);
    setSearchParams({ ticket: String(id) });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const created = await apiCreateTicket(form);
      toast({ type: 'success', title: 'Đã gửi yêu cầu hỗ trợ', description: 'Bạn sẽ nhận thông báo khi đội hỗ trợ trả lời.' });
      setForm({ subject: '', category: '', message: '' });
      await loadList();
      openTicket(created.id);
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được yêu cầu', description: apiErrorMessage(err) });
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setIsSending(true);
    try {
      await apiReplyMyTicket(selectedId, reply.trim());
      setReply('');
      await Promise.all([loadTicket(selectedId), loadList()]);
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được tin nhắn', description: apiErrorMessage(err) });
    } finally {
      setIsSending(false);
    }
  };

  const showDetail = creating || selectedId;

  return (
    <div className={ui.pageContainer}>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.pageTitle}>Hỗ trợ</h1>
          <p className={ui.pageDesc}>Gửi câu hỏi hoặc báo lỗi cho đội ngũ StockPilot. Bạn sẽ nhận thông báo khi có phản hồi.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setSelectedId(null);
            setSearchParams({});
          }}
          className={ui.btnPrimary}
        >
          <Plus className="w-3.5 h-3.5" />
          Gửi yêu cầu mới
        </button>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-4 items-start">
        {/* Danh sách */}
        <div className={`${ui.card} overflow-hidden ${showDetail ? 'hidden lg:block' : ''}`}>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <LifeBuoy className="w-8 h-8 mx-auto text-[#CBD5E1]" />
              <p className="mt-2 text-[#334155] font-medium">Chưa có yêu cầu nào</p>
              <p className="text-[13px] text-[#64748B]">Gặp khó khăn khi dùng StockPilot? Gửi yêu cầu, chúng tôi sẽ giúp.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#E5E7EB]">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openTicket(t.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 cursor-pointer ${selectedId === t.id ? 'bg-blue-50/60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium text-[#334155] line-clamp-1">{t.subject}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-[12px] text-[#64748B] mt-0.5">
                      #{t.id} · {SUPPORT_CATEGORY_LABELS[t.category]} · {formatRelativeTime(t.lastMessageAt) || formatVNDateTime(t.lastMessageAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chi tiết / tạo mới */}
        <div className={`${ui.card} ${showDetail ? '' : 'hidden lg:block'}`}>
          {creating ? (
            <form onSubmit={handleCreate} className="p-5 space-y-3.5">
              <h2 className="text-[15px] font-semibold text-[#334155]">Yêu cầu hỗ trợ mới</h2>
              <label className="block">
                <span className="block text-[13px] font-medium text-[#334155] mb-1">Bạn cần hỗ trợ về</span>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={ui.select}>
                  <option value="" disabled>
                    Chọn loại yêu cầu
                  </option>
                  {Object.entries(SUPPORT_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium text-[#334155] mb-1">Tiêu đề</span>
                <input
                  required
                  minLength={5}
                  maxLength={200}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Ví dụ: Cần chuyển 500 sản phẩm từ KiotViet"
                  className={ui.input}
                />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium text-[#334155] mb-1">Mô tả chi tiết</span>
                <textarea
                  required
                  rows={6}
                  maxLength={5000}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Mô tả bạn đang làm gì, thấy lỗi gì, ở trang nào. Không gửi mật khẩu hay khóa API."
                  className={ui.input}
                />
              </label>
              {form.category === 'DATA_IMPORT' && (
                <p className="text-[12px] text-[#64748B] bg-slate-50 border border-[#E5E7EB] rounded-lg p-2.5">
                  Mẹo: bạn có thể tự nhập ngay ở trang <a href="/import" className="text-[#2563EB] hover:underline">Nhập dữ liệu</a>. Nếu bị lỗi, mô tả lỗi
                  và tên file ở đây.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCreating(false)} className={ui.btnSecondary}>
                  Hủy
                </button>
                <button type="submit" disabled={isSending} className={ui.btnPrimary}>
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          ) : selectedId && ticket ? (
            <div className="flex flex-col max-h-[calc(100vh-220px)]">
              <div className="px-5 py-4 border-b border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setSearchParams({});
                  }}
                  className="lg:hidden mb-2 inline-flex items-center gap-1 text-[13px] text-[#64748B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Danh sách
                </button>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[15px] font-semibold text-[#334155]">{ticket.subject}</h2>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  #{ticket.id} · {SUPPORT_CATEGORY_LABELS[ticket.category]} · gửi {formatVNDateTime(ticket.createdAt)}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/60">
                <MessageThread messages={ticket.messages} viewerIsAdmin={false} />
              </div>
              <form onSubmit={handleReply} className="p-4 border-t border-[#E5E7EB] space-y-2">
                {ticket.status === 'RESOLVED' && (
                  <p className="text-[12px] text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Yêu cầu đã được giải quyết. Gửi thêm tin nhắn sẽ mở lại yêu cầu.
                  </p>
                )}
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Nhập tin nhắn"
                    maxLength={5000}
                    className={ui.input}
                  />
                  <button type="submit" disabled={isSending || reply.trim().length < 2} className={`${ui.btnPrimary} self-end`}>
                    {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Gửi
                  </button>
                </div>
              </form>
            </div>
          ) : selectedId ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-[13px] text-[#64748B]">Chọn một yêu cầu bên trái để xem trao đổi.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupportPage;
