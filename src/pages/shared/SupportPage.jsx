import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Send, Loader2, LifeBuoy, ArrowLeft, CheckCircle2, ImagePlus } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { MessageThread, Composer, PendingImages, useImagePicker, usePolling } from '../../components/support/SupportChat';
import {
  apiListMyTickets,
  apiCreateTicket,
  apiGetMyTicket,
  apiReplyMyTicket,
  apiFetchMyAttachment,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_IMAGE_TYPES,
} from '../../services/supportService';
import { formatVNDateTime } from '../../services/adminService';
import { apiErrorMessage, formatRelativeTime } from '../admin/adminLabels';
import { adminStyles as ui } from '../admin/adminStyles';

const POLL_MS = 10000;

const STATUS_STYLE = {
  OPEN: ui.badgeAmber,
  IN_PROGRESS: ui.badgeBlue,
  WAITING_STORE: ui.badgeRed,
  RESOLVED: ui.badgeGray,
};

/** What the store should understand from each status. */
const STORE_STATUS_HINT = {
  OPEN: 'Đội hỗ trợ đã nhận yêu cầu và sẽ trả lời sớm.',
  IN_PROGRESS: 'Đội hỗ trợ đang xử lý yêu cầu của bạn.',
  WAITING_STORE: 'Đội hỗ trợ đang chờ bạn phản hồi.',
  RESOLVED: 'Yêu cầu đã được giải quyết. Gửi thêm tin nhắn sẽ mở lại yêu cầu.',
};

export function StatusBadge({ status }) {
  return <span className={`${ui.badge} ${STATUS_STYLE[status] || ui.badgeGray} whitespace-nowrap`}>{SUPPORT_STATUS_LABELS[status] || status}</span>;
}

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'WAITING_STORE', label: 'Cần bạn trả lời' },
  { value: 'OPEN', label: 'Đang chờ' },
  { value: 'RESOLVED', label: 'Đã xong' },
];

function NewTicketForm({ initialCategory, onCreated, onCancel }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ subject: '', category: initialCategory || '', message: '' });
  const [sending, setSending] = useState(false);
  const fileInput = useRef(null);
  const images = useImagePicker((msg) => toast({ type: 'warning', title: 'Không thêm được ảnh', description: msg }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const created = await apiCreateTicket(form, images.files);
      toast({ type: 'success', title: 'Đã gửi yêu cầu hỗ trợ', description: 'Bạn sẽ nhận thông báo khi đội hỗ trợ trả lời.' });
      onCreated(created.id);
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được yêu cầu', description: apiErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
      <div>
        <h2 className="text-[16px] font-semibold text-[#334155]">Yêu cầu hỗ trợ mới</h2>
        <p className="text-[13px] text-[#64748B] mt-0.5">Mô tả càng rõ, đội hỗ trợ xử lý càng nhanh. Không gửi mật khẩu, mã OTP hay khóa API.</p>
      </div>
      <div>
        <span className="block text-[13px] font-medium text-[#334155] mb-1.5">Bạn cần hỗ trợ về</span>
        <div className="grid sm:grid-cols-3 gap-2">
          {Object.entries(SUPPORT_CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm({ ...form, category: value })}
              className={`text-left px-3 py-2 rounded-lg border text-[13px] cursor-pointer ${
                form.category === value ? 'border-[#3B82F6] ring-1 ring-[#3B82F6] bg-blue-50/50 text-[#1D4ED8]' : 'border-[#E5E7EB] text-[#475569] hover:border-[#93C5FD]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="block text-[13px] font-medium text-[#334155] mb-1">Tiêu đề</span>
        <input
          required
          minLength={5}
          maxLength={200}
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Ví dụ: Không in được hóa đơn sau khi thanh toán VietQR"
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
          onPaste={images.onPaste}
          placeholder={'Bạn đang làm gì, ở trang nào, thấy thông báo lỗi gì?\nCó thể dán ảnh chụp màn hình bằng Ctrl+V.'}
          className={ui.input}
        />
      </label>
      <div className="space-y-2">
        <PendingImages files={images.files} onRemove={images.remove} />
        <button type="button" onClick={() => fileInput.current?.click()} className={ui.btnSecondary} disabled={images.files.length >= 3}>
          <ImagePlus className="w-3.5 h-3.5" /> Đính kèm ảnh chụp màn hình
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={SUPPORT_IMAGE_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            images.add(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="text-[12px] text-[#94A3B8]">Tối đa 3 ảnh, mỗi ảnh ≤ 5 MB. Ảnh chỉ bạn và đội hỗ trợ xem được.</p>
      </div>
      {form.category === 'DATA_IMPORT' && (
        <p className="text-[12px] text-[#64748B] bg-slate-50 border border-[#E5E7EB] rounded-lg p-2.5">
          Mẹo: bạn có thể tự nhập ở trang <a href="/import" className="text-[#2563EB] hover:underline">Nhập dữ liệu</a>. Nếu bị lỗi, mô tả lỗi và tên phần mềm cũ ở đây.
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className={ui.btnSecondary}>
          Hủy
        </button>
        <button type="submit" disabled={sending || !form.category} className={ui.btnPrimary}>
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Gửi yêu cầu
        </button>
      </div>
    </form>
  );
}

export function SupportPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [ticket, setTicket] = useState(null);

  const selectedId = Number(searchParams.get('ticket')) || null;
  const presetCategory = searchParams.get('new');
  const creating = searchParams.has('new');

  const loadList = useCallback(async () => {
    try {
      const res = await apiListMyTickets({ limit: 50, status: filter });
      setTickets(res.data);
    } catch (err) {
      toast({ type: 'error', title: 'Không tải được yêu cầu hỗ trợ', description: apiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast]);

  const loadTicket = useCallback(async (id) => {
    try {
      setTicket(await apiGetMyTicket(id));
    } catch (err) {
      toast({ type: 'error', title: 'Không mở được yêu cầu', description: apiErrorMessage(err) });
    }
  }, [toast]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    setTicket(null);
    if (selectedId) loadTicket(selectedId).then(loadList);
  }, [selectedId, loadTicket]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live updates while the page is open.
  usePolling(() => {
    loadList();
    if (selectedId) loadTicket(selectedId);
  }, POLL_MS);

  const openTicket = (id) => setSearchParams({ ticket: String(id) });

  const handleReply = async (body, files) => {
    try {
      await apiReplyMyTicket(selectedId, body, files);
      await Promise.all([loadTicket(selectedId), loadList()]);
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được tin nhắn', description: apiErrorMessage(err) });
      throw err;
    }
  };

  const showDetail = creating || selectedId;

  return (
    <div className={ui.pageContainer}>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.pageTitle}>Hỗ trợ</h1>
          <p className={ui.pageDesc}>Trao đổi với đội ngũ StockPilot. Tin nhắn mới tự hiện, bạn cũng nhận thông báo khi có phản hồi.</p>
        </div>
        <button type="button" onClick={() => setSearchParams({ new: '' })} className={ui.btnPrimary}>
          <Plus className="w-3.5 h-3.5" />
          Gửi yêu cầu mới
        </button>
      </div>

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-4 items-stretch lg:h-[calc(100vh-200px)] lg:min-h-[520px]">
        {/* Danh sách */}
        <aside className={`${ui.card} flex flex-col overflow-hidden ${showDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-2 border-b border-[#E5E7EB] flex gap-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`px-2.5 py-1 rounded-md text-[12px] whitespace-nowrap cursor-pointer ${filter === f.value ? 'bg-slate-100 text-[#334155] font-medium' : 'text-[#64748B] hover:text-[#334155]'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center">
                <LifeBuoy className="w-8 h-8 mx-auto text-[#CBD5E1]" />
                <p className="mt-2 text-[#334155] font-medium">{filter ? 'Không có yêu cầu nào ở mục này' : 'Chưa có yêu cầu nào'}</p>
                {!filter && <p className="text-[13px] text-[#64748B]">Gặp khó khăn khi dùng StockPilot? Gửi yêu cầu, chúng tôi sẽ giúp.</p>}
              </div>
            ) : (
              <ul className="divide-y divide-[#E5E7EB]">
                {tickets.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => openTicket(t.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 cursor-pointer border-l-2 ${selectedId === t.id ? 'bg-blue-50/60 border-[#3B82F6]' : 'border-transparent'}`}
                    >
                      <div className="flex items-start gap-2">
                        {t.unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#3B82F6] shrink-0" aria-label="Có phản hồi mới" />}
                        <p className={`flex-1 text-[13px] line-clamp-2 ${t.unread ? 'font-semibold text-[#0F172A]' : 'font-medium text-[#334155]'}`}>{t.subject}</p>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <StatusBadge status={t.status} />
                        <span className="text-[11px] text-[#94A3B8]">{formatRelativeTime(t.lastMessageAt) || formatVNDateTime(t.lastMessageAt)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Chi tiết */}
        <section className={`${ui.card} flex flex-col overflow-hidden min-h-[480px] ${showDetail ? 'flex' : 'hidden lg:flex'}`}>
          {creating ? (
            <NewTicketForm
              key={presetCategory}
              initialCategory={presetCategory}
              onCancel={() => setSearchParams({})}
              onCreated={(id) => {
                loadList();
                openTicket(id);
              }}
            />
          ) : selectedId && ticket ? (
            <>
              <header className="px-5 py-3.5 border-b border-[#E5E7EB]">
                <button type="button" onClick={() => setSearchParams({})} className="lg:hidden mb-2 inline-flex items-center gap-1 text-[13px] text-[#64748B]">
                  <ArrowLeft className="w-3.5 h-3.5" /> Danh sách
                </button>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold text-[#334155]">{ticket.subject}</h2>
                    <p className="text-[12px] text-[#64748B] mt-0.5">
                      #{ticket.id} · {SUPPORT_CATEGORY_LABELS[ticket.category]} · gửi {formatVNDateTime(ticket.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className={`mt-2 text-[12px] flex items-center gap-1.5 ${ticket.status === 'WAITING_STORE' ? 'text-[#B91C1C]' : 'text-[#64748B]'}`}>
                  {ticket.status === 'RESOLVED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {STORE_STATUS_HINT[ticket.status]}
                </p>
              </header>
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/70">
                <MessageThread messages={ticket.messages} viewerIsAdmin={false} fetchAttachment={apiFetchMyAttachment} />
              </div>
              <Composer
                onSend={handleReply}
                placeholder={ticket.status === 'RESOLVED' ? 'Gửi tin nhắn để mở lại yêu cầu' : 'Nhập tin nhắn cho đội hỗ trợ'}
                onError={(msg) => toast({ type: 'warning', title: 'Không thêm được ảnh', description: msg })}
              />
            </>
          ) : selectedId ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <LifeBuoy className="w-10 h-10 text-[#CBD5E1]" />
              <p className="mt-3 text-[14px] text-[#334155] font-medium">Chọn một yêu cầu để xem trao đổi</p>
              <p className="text-[13px] text-[#64748B]">hoặc gửi yêu cầu mới nếu bạn cần giúp đỡ.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SupportPage;
