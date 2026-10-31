import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  Phone,
  MessageCircle,
  Mail,
  Store,
  Loader2,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  ExternalLink,
  PlusCircle,
  Copy,
  Check,
  UserPlus,
  X,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { usePolling } from '../../components/support/SupportChat';
import { useAuthStore } from '../../store/authStore';
import {
  apiListAdminLeads,
  apiGetAdminLead,
  apiUpdateAdminLead,
  apiAddAdminLeadNote,
  apiListAdminUsers,
  formatVNDateTime,
} from '../../services/adminService';
import { apiErrorMessage, formatRelativeTime } from './adminLabels';
import { adminStyles as ui } from './adminStyles';
import {
  PageHeader,
  Tabs,
  Toolbar,
  SearchInput,
  FilterSelect,
  FilterChips,
  TableCard,
  Th,
  Td,
  Checkbox,
  BulkActionBar,
  TableBody,
  EmptyState,
  Pagination,
  Badge,
  Avatar,
  RowMenu,
  Modal,
  Drawer,
  DetailList,
  Section,
  StatCard,
  useDebounced,
} from './components/AdminUI';

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS = {
  NEW: { label: 'Mới đăng ký', tone: 'info' },
  CONTACTED: { label: 'Đã liên hệ', tone: 'warning' },
  CONVERTED: { label: 'Đã chuyển đổi', tone: 'success' },
  REJECTED: { label: 'Không phù hợp', tone: 'neutral' },
};

const NOTE_TYPES = {
  CALL: { label: 'Cuộc gọi điện', tone: 'info' },
  EMAIL: { label: 'Email tư vấn', tone: 'info' },
  MEETING: { label: 'Gặp mặt / Demo', tone: 'purple' },
  NOTE: { label: 'Ghi chú nội bộ', tone: 'neutral' },
  STATUS: { label: 'Cập nhật hệ thống', tone: 'neutral' },
  RESUBMIT: { label: 'Gửi lại form', tone: 'warning' },
};

const NOTE_PLACEHOLDER = {
  CALL: 'Ghi chép kết quả cuộc gọi: Khách quan tâm tính năng gì, hẹn khi nào gọi lại…',
  EMAIL: 'Ghi chép nội dung email: Đã gửi bảng giá, tài liệu hướng dẫn…',
  MEETING: 'Ghi chép buổi demo: Khách cần thử máy in hóa đơn, quét mã vạch…',
  NOTE: 'Ghi chú nội bộ về khách hàng này…',
};

function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'neutral' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

function overdueDays(lead) {
  if (lead.status !== 'NEW') return null;
  const diff = Date.now() - new Date(lead.lastSubmittedAt || lead.createdAt).getTime();
  return diff < DAY_MS ? null : Math.max(1, Math.floor(diff / DAY_MS));
}

const zaloLink = (phone) => `https://zalo.me/${String(phone || '').replace(/\D/g, '')}`;

function registerLink(lead) {
  const params = new URLSearchParams();
  if (lead.fullName) params.set('fullName', lead.fullName);
  if (lead.phone) params.set('phone', lead.phone);
  if (lead.email) params.set('email', lead.email);
  if (lead.storeName) params.set('storeName', lead.storeName);
  return `/register?${params.toString()}`;
}

// ─── Modals ──────────────────────────────────────────────────────────────────
function ChangeStatusModal({ lead, onClose, onSaved }) {
  const { toast } = useToast();
  const [status, setStatus] = useState(lead.status);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await apiUpdateAdminLead(lead.id, { status });
      toast({ type: 'success', title: `Đã đổi trạng thái sang "${STATUS[status]?.label || status}"` });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: 'Không đổi được trạng thái', description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Cập nhật trạng thái Khách hàng"
      description={`Khách hàng: ${lead.fullName}. Lịch sử thay đổi được ghi nhận tự động vào dòng sự kiện.`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            Hủy
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || status === lead.status}
            className={ui.btnPrimary}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Lưu trạng thái
          </button>
        </>
      }
    >
      <fieldset className="space-y-2.5">
        <legend className="sr-only">Trạng thái xử lý</legend>
        {Object.entries(STATUS).map(([value, s]) => (
          <label
            key={value}
            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer text-[13px] transition-all ${
              status === value
                ? 'border-[#2563EB] bg-[#EFF4FF] text-[#0F172A] font-semibold shadow-2xs'
                : 'border-[#E2E8F0] text-[#475569] hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="leadStatus"
              value={value}
              checked={status === value}
              onChange={() => setStatus(value)}
              className="accent-[#2563EB] w-4 h-4 cursor-pointer"
            />
            <span>{s.label}</span>
          </label>
        ))}
      </fieldset>
    </Modal>
  );
}

function CreateStoreModal({ lead, onClose, onConverted }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}${registerLink(lead)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        type: 'success',
        title: 'Đã sao chép liên kết đăng ký',
        description: 'Gửi link này cho khách qua Zalo hoặc Email để hoàn tất đăng ký.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ type: 'warning', title: 'Hãy sao chép liên kết trong ô bên dưới' });
    }
  };

  const markConverted = async () => {
    setBusy(true);
    try {
      await onConverted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Tạo Cửa hàng cho Khách hàng"
      description="Gửi khách hàng liên kết đăng ký đã điền sẵn đầy đủ thông tin. Khách chỉ cần tự đặt mật khẩu để kích hoạt cửa hàng."
      onClose={onClose}
      busy={busy}
      width="max-w-lg"
      footer={
        <>
          {lead.status !== 'CONVERTED' && (
            <button type="button" onClick={markConverted} disabled={busy} className={ui.btnSecondary}>
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Đánh dấu đã chuyển đổi
            </button>
          )}
          <button type="button" onClick={copyLink} className={ui.btnPrimary}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Đã sao chép' : 'Sao chép liên kết'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <DetailList
          rows={[
            ['Họ tên', lead.fullName],
            ['Số điện thoại', lead.phone],
            ['Email', lead.email || 'Chưa cung cấp'],
            ['Tên cửa hàng dự kiến', lead.storeName || 'Chưa đặt tên'],
          ]}
        />

        <div>
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Liên kết kích hoạt sẵn</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className={`${ui.input} font-mono text-[12px] bg-slate-50`}
            />
            <button type="button" onClick={copyLink} className={`${ui.btnSecondary} shrink-0 px-3`} title="Sao chép">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <span className="block text-[12px] text-[#64748B] mt-1.5">
            Mở trên trình duyệt của khách hàng. Khách tự quản lý thông tin bảo mật của mình.
          </span>
        </div>
      </div>
    </Modal>
  );
}

// ─── Lead Detail Drawer ──────────────────────────────────────────────────────
function LeadDrawer({ leadId, admins, onClose, onChanged, focusNote, onOpenCreateStore }) {
  const { toast } = useToast();
  const [lead, setLead] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [noteType, setNoteType] = useState('CALL');
  const [noteBody, setNoteBody] = useState('');
  const [busy, setBusy] = useState('');
  const noteInputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLead(await apiGetAdminLead(leadId));
    } catch (err) {
      toast({ type: 'error', title: 'Không mở được thông tin khách hàng', description: apiErrorMessage(err) });
      onClose();
    }
  }, [leadId, toast, onClose]);

  useEffect(() => {
    setLead(null);
    load();
  }, [load]);

  useEffect(() => {
    if (focusNote && lead) {
      setTimeout(() => noteInputRef.current?.focus(), 150);
    }
  }, [focusNote, lead]);

  const update = async (patch, title) => {
    setBusy('update');
    try {
      setLead(await apiUpdateAdminLead(leadId, patch));
      toast({ type: 'success', title });
      onChanged();
    } catch (err) {
      toast({ type: 'error', title: 'Không cập nhật được', description: apiErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (noteBody.trim().length < 2) return;
    setBusy('note');
    try {
      setLead(await apiAddAdminLeadNote(leadId, { type: noteType, body: noteBody.trim() }));
      setNoteBody('');
      toast({ type: 'success', title: 'Đã lưu vào lịch sử chăm sóc' });
      onChanged();
    } catch (err) {
      toast({ type: 'error', title: 'Không lưu được ghi chú', description: apiErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const waiting = lead ? overdueDays(lead) : null;

  // Lắng nghe phím ESC để đóng hộp thoại
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
      {/* Backdrop mờ nền */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card đặt ở chính giữa màn hình */}
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10"
        role="dialog"
        aria-modal="true"
        aria-label={lead?.fullName || 'Chi tiết khách hàng'}
      >
        {/* Header Modal */}
        <div className="px-6 py-4.5 border-b border-[#F1F5F9] bg-[#FAFBFC] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
                  {lead?.fullName || 'Khách hàng tiềm năng'}
                </h3>
                {lead && <StatusBadge status={lead.status} />}
              </div>
              {lead && (
                <p className="mt-1 text-[13px] text-[#64748B]">
                  Đăng ký {formatVNDateTime(lead.createdAt)}
                  {lead.submissionCount > 1 && ` · Gửi lại form ${lead.submissionCount} lần`}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-tabs chuyển đổi chế độ xem */}
          <div className="flex gap-6 mt-3.5 border-t border-slate-200/60 pt-2.5">
            {[
              { key: 'overview', label: 'Tư vấn & Thao tác' },
              { key: 'timeline', label: 'Lịch sử chăm sóc', count: lead?.notes?.length },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDrawerTab(tab.key)}
                className={`pb-1 text-[14px] font-semibold border-b-2 cursor-pointer transition-colors ${
                  drawerTab === tab.key
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
                {tab.count != null && (
                  <span
                    className={`ml-2 px-1.5 py-0.2 rounded-full text-[11px] font-bold tabular-nums ${
                      drawerTab === tab.key ? 'bg-blue-100 text-[#2563EB]' : 'bg-slate-100 text-[#64748B]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!lead ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-5 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : drawerTab === 'overview' ? (
            <div className="space-y-6">
              {waiting && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-[13px] text-amber-900 shadow-2xs">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Quá hạn 24 giờ:</strong> Khách đã gửi yêu cầu được {waiting} ngày nhưng chưa có nhân viên liên hệ lại.
                  </span>
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <a
                  href={`tel:${lead.phone}`}
                  className={`${ui.btnSecondary} p-2.5 justify-center text-center`}
                  title="Gọi điện thoại"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Gọi điện</span>
                </a>
                <a
                  href={zaloLink(lead.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ui.btnSecondary} p-2.5 justify-center text-center`}
                  title="Mở Zalo chat"
                >
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  <span>Zalo</span>
                </a>
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}?subject=${encodeURIComponent('StockPilot - Tư vấn mở cửa hàng')}`}
                    className={`${ui.btnSecondary} p-2.5 justify-center text-center`}
                    title="Gửi email"
                  >
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span>Email</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className={`${ui.btnSecondary} p-2.5 justify-center opacity-40`}
                    title="Không có email"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenCreateStore(lead)}
                  className={`${ui.btnSecondary} p-2.5 justify-center text-center`}
                  title="Tạo link đăng ký"
                >
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>Tạo shop</span>
                </button>
              </div>

              <DetailList
                rows={[
                  ['Số điện thoại', <span className="font-semibold text-[#0F172A]">{lead.phone}</span>],
                  ['Email', lead.email || 'Chưa cung cấp'],
                  ['Tên cửa hàng dự kiến', lead.storeName || 'Chưa xác định'],
                  ['Ngành hàng kinh doanh', lead.industry || 'Chưa xác định'],
                  [
                    'Liên hệ gần nhất',
                    lead.lastContactedAt ? formatVNDateTime(lead.lastContactedAt) : 'Chưa từng liên hệ',
                  ],
                ]}
              />

              <Section title="Lời nhắn từ khách hàng">
                <p className="whitespace-pre-wrap rounded-xl border border-[#E2E8F0] bg-slate-50/70 p-4 text-[13px] text-[#334155] leading-relaxed shadow-2xs">
                  {lead.note || 'Khách không để lại lời nhắn thêm.'}
                </p>
              </Section>

              {/* Phụ trách & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                <div>
                  <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Trạng thái xử lý</label>
                  <select
                    value={lead.status}
                    disabled={busy === 'update'}
                    onChange={(e) => update({ status: e.target.value }, 'Đã cập nhật trạng thái')}
                    className={ui.select}
                  >
                    {Object.entries(STATUS).map(([value, s]) => (
                      <option key={value} value={value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Người phụ trách</label>
                  <select
                    value={lead.assignee?.id ?? ''}
                    disabled={busy === 'update'}
                    onChange={(e) =>
                      update({ assigneeId: e.target.value ? Number(e.target.value) : null }, 'Đã chuyển người phụ trách')
                    }
                    className={ui.select}
                  >
                    <option value="">Chưa giao việc</option>
                    {admins.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Ghi Chú Nhanh */}
              <Section title="Ghi nhận hoạt động chăm sóc">
                <form onSubmit={addNote} className="space-y-3">
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Hình thức tương tác">
                    {['CALL', 'EMAIL', 'MEETING', 'NOTE'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={noteType === type}
                        onClick={() => setNoteType(type)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer transition-all ${
                          noteType === type
                            ? 'border-[#2563EB] bg-[#EFF4FF] text-[#2563EB] shadow-2xs'
                            : 'border-[#CBD5E1] text-[#475569] hover:bg-slate-50'
                        }`}
                      >
                        {NOTE_TYPES[type]?.label || type}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={noteInputRef}
                    rows={3}
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    maxLength={2000}
                    placeholder={NOTE_PLACEHOLDER[noteType]}
                    className={ui.input}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-[#64748B]">
                      {lead.status === 'NEW' && noteType !== 'NOTE'
                        ? 'Khách sẽ tự động chuyển sang trạng thái "Đã liên hệ".'
                        : 'Nhấn Lưu để ghi vào lịch sử'}
                    </span>
                    <button
                      type="submit"
                      disabled={busy === 'note' || noteBody.trim().length < 2}
                      className={ui.btnPrimary}
                    >
                      {busy === 'note' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <Send className="w-3.5 h-3.5" />
                      Lưu hoạt động
                    </button>
                  </div>
                </form>
              </Section>

              {/* Danh sách ghi chú & hoạt động gần nhất */}
              {lead.notes && lead.notes.length > 0 && (
                <Section
                  title={
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-[#0F172A]">Hoạt động & ghi chú gần nhất</span>
                      <button
                        type="button"
                        onClick={() => setDrawerTab('timeline')}
                        className="text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer flex items-center gap-1"
                      >
                        Xem toàn bộ ({lead.notes.length}) →
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-2.5">
                    {lead.notes.slice(0, 3).map((n) => {
                      const T = NOTE_TYPES[n.type] || NOTE_TYPES.NOTE;
                      return (
                        <div
                          key={n.id}
                          className={`p-3.5 rounded-xl border text-[13px] transition-all ${
                            n.type === 'NOTE'
                              ? 'bg-amber-50/50 border-amber-200/80'
                              : 'bg-slate-50/70 border-slate-200/80'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <Badge tone={T.tone} dot={false}>
                                {T.label}
                              </Badge>
                              <span className="font-semibold text-[#0F172A] text-[12px]">
                                {n.author?.fullName || 'Hệ thống'}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#94A3B8]">
                              {formatRelativeTime(n.createdAt) || formatVNDateTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-[#334155] leading-relaxed">
                            {n.body}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-[14px] font-bold text-[#0F172A]">Dòng thời gian tương tác</h4>
              {!lead.notes?.length ? (
                <p className="p-8 text-center text-[#64748B] text-[13px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa có hoạt động nào được ghi lại. Hãy thực hiện cuộc gọi hoặc gửi email đầu tiên!
                </p>
              ) : (
                <ol className="relative border-l border-slate-200 ml-3 space-y-5">
                  {lead.notes.map((n) => {
                    const T = NOTE_TYPES[n.type] || NOTE_TYPES.NOTE;
                    return (
                      <li key={n.id} className="pl-5 relative">
                        <span
                          className="absolute -left-1.75 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#2563EB]"
                          aria-hidden="true"
                        />
                        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                            <div className="flex items-center gap-2">
                              <Badge tone={T.tone} dot={false}>
                                {T.label}
                              </Badge>
                              <span className="font-semibold text-[#0F172A]">{n.author?.fullName || 'Hệ thống'}</span>
                            </div>
                            <span className="text-[#94A3B8]" title={formatVNDateTime(n.createdAt)}>
                              {formatRelativeTime(n.createdAt) || formatVNDateTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-[13px] text-[#334155] leading-relaxed pt-1">{n.body}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trang Chính ─────────────────────────────────────────────────────────────
export function AdminLeadsPage() {
  const { toast } = useToast();
  const { user: me } = useAuthStore();
  const [params, setParams] = useSearchParams();

  const status = params.get('status') || '';
  const assignee = params.get('assignee') || '';
  const overdue = params.get('overdue') === 'true';
  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 20;
  const openLeadId = Number(params.get('lead')) || null;

  const [search, setSearch] = useState(params.get('q') || '');
  const debouncedSearch = useDebounced(search);

  const [sortKey, setSortKey] = useState('lastSubmittedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const [leads, setLeads] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [focusNote, setFocusNote] = useState(false);
  const [dialog, setDialog] = useState(null); // { type: 'status' | 'store', lead }

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  const updateParams = (changes, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if ((params.get('q') || '') !== debouncedSearch) updateParams({ q: debouncedSearch });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = params.get('q') || '';
  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setIsLoading(true);
      try {
        const res = await apiListAdminLeads({
          page,
          limit,
          search: query,
          status: overdue ? '' : status,
          overdue: overdue ? 'true' : '',
          assigneeId: assignee && assignee !== 'none' ? assignee : '',
          unassigned: assignee === 'none' ? 'true' : '',
        });
        setLeads(res.data);
        setPagination(res.pagination);
        setSummary(res.summary);
        setError('');
      } catch (err) {
        if (!silent) setError(apiErrorMessage(err));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [page, limit, query, status, overdue, assignee]
  );

  useEffect(() => {
    load();
  }, [load]);

  usePolling(() => load({ silent: true }), 30000);

  useEffect(() => {
    apiListAdminUsers({ role: 'ADMIN', isActive: 'true', limit: 100 })
      .then((res) => setAdmins(res.data || []))
      .catch(() => setAdmins([]));
  }, []);

  const openLead = (id, withNote = false) => {
    setFocusNote(withNote);
    updateParams({ lead: String(id) }, false);
  };

  const markConverted = async (lead) => {
    try {
      await apiUpdateAdminLead(lead.id, { status: 'CONVERTED' });
      toast({ type: 'success', title: 'Đã đánh dấu đã chuyển đổi thành công' });
      setDialog(null);
      load({ silent: true });
    } catch (err) {
      toast({ type: 'error', title: 'Không cập nhật được', description: apiErrorMessage(err) });
    }
  };

  const assignToMe = async (lead) => {
    try {
      await apiUpdateAdminLead(lead.id, { assigneeId: me.id });
      toast({ type: 'success', title: `Bạn đã nhận phụ trách ${lead.fullName}` });
      load({ silent: true });
    } catch (err) {
      toast({ type: 'error', title: 'Không nhận được khách', description: apiErrorMessage(err) });
    }
  };

  // Sorting
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedLeads = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    const sorted = [...leads];
    sorted.sort((a, b) => {
      if (sortKey === 'fullName') {
        const nA = a.fullName || '';
        const nB = b.fullName || '';
        return sortDirection === 'asc' ? nA.localeCompare(nB, 'vi') : nB.localeCompare(nA, 'vi');
      }
      if (sortKey === 'lastSubmittedAt') {
        const tA = a.lastSubmittedAt ? new Date(a.lastSubmittedAt).getTime() : 0;
        const tB = b.lastSubmittedAt ? new Date(b.lastSubmittedAt).getTime() : 0;
        return sortDirection === 'asc' ? tA - tB : tB - tA;
      }
      if (sortKey === 'lastContactedAt') {
        const tA = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
        const tB = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
        return sortDirection === 'asc' ? tA - tB : tB - tA;
      }
      return 0;
    });
    return sorted;
  }, [leads, sortKey, sortDirection]);

  // Bulk Actions
  const isAllSelected = sortedLeads.length > 0 && selectedIds.length === sortedLeads.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < sortedLeads.length;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(sortedLeads.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const actionsFor = (lead) => [
    { label: 'Xem chi tiết & tư vấn', icon: ExternalLink, onClick: () => openLead(lead.id) },
    { label: 'Ghi lại cuộc gọi / hẹn gặp', icon: PlusCircle, onClick: () => openLead(lead.id, true) },
    {
      label: 'Nhận phụ trách khách này',
      icon: UserPlus,
      onClick: () => assignToMe(lead),
      hidden: lead.assignee?.id === me?.id,
    },
    { label: 'Đổi trạng thái xử lý', icon: RefreshCw, onClick: () => setDialog({ type: 'status', lead }) },
    {
      label: 'Nhắn qua Zalo',
      icon: MessageCircle,
      onClick: () => window.open(zaloLink(lead.phone), '_blank', 'noopener,noreferrer'),
    },
    {
      label: 'Tạo cửa hàng cho khách',
      icon: Store,
      onClick: () => setDialog({ type: 'store', lead }),
      hidden: lead.status === 'REJECTED',
    },
  ];

  const assigneeOptions = [
    { value: '', label: 'Mọi người phụ trách' },
    { value: 'none', label: 'Chưa giao việc' },
    ...admins.map((a) => ({ value: String(a.id), label: a.id === me?.id ? `${a.fullName} (bạn)` : a.fullName })),
  ];

  const chips = [
    overdue && { key: 'overdue', label: 'Chờ quá 24 giờ', onRemove: () => updateParams({ overdue: '' }) },
    assignee && {
      key: 'assignee',
      label: assigneeOptions.find((o) => o.value === assignee)?.label || 'Người phụ trách',
      onRemove: () => updateParams({ assignee: '' }),
    },
  ].filter(Boolean);

  const clearFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title="Khách hàng tiềm năng (Leads CRM)"
        description="Quản lý khách để lại thông tin tư vấn mở cửa hàng từ Landing Page. Hãy liên hệ trong 24 giờ đầu để đạt tỷ lệ chốt cao nhất."
        badge={<Badge tone="neutral">{summary?.total ?? 0} khách</Badge>}
        actions={
          <button type="button" onClick={() => load()} disabled={isLoading} className={ui.btnSecondary}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        }
      >
        <Tabs
          value={overdue ? '' : status}
          onChange={(v) => {
            setSelectedIds([]);
            updateParams({ status: v, overdue: '' });
          }}
          tabs={[
            { value: '', label: 'Tất cả khách', count: summary?.total },
            ...Object.entries(STATUS).map(([value, s]) => ({
              value,
              label: s.label,
              count: summary?.[value],
            })),
          ]}
        />
      </PageHeader>

      {/* 4 Thẻ KPI CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng khách tư vấn"
          value={summary?.total ?? 0}
          subtitle="Tất cả lead từ Landing Page"
          icon={UserCheck}
          iconBg="bg-blue-50 text-[#2563EB] border-blue-100"
          loading={isLoading}
        />
        <StatCard
          title="Khách mới cần gọi"
          value={summary?.NEW ?? 0}
          subtitle="Chưa được liên hệ lần nào"
          icon={Phone}
          iconBg="bg-amber-50 text-amber-700 border-amber-100"
          alert={(summary?.NEW ?? 0) > 0}
          loading={isLoading}
        />
        <StatCard
          title="Chờ quá 24 giờ (SLA)"
          value={summary?.waitingOver24h ?? 0}
          subtitle="Nguy cơ mất khách hàng"
          icon={Clock}
          iconBg="bg-red-50 text-red-600 border-red-100"
          alert={(summary?.waitingOver24h ?? 0) > 0}
          loading={isLoading}
        />
        <StatCard
          title="Đã chuyển đổi thành shop"
          value={summary?.CONVERTED ?? 0}
          subtitle={`Tỷ lệ chuyển đổi ${summary?.total ? Math.round((summary.CONVERTED / summary.total) * 100) : 0}%`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
          loading={isLoading}
        />
      </div>

      {/* SLA Alert Box */}
      {summary?.waitingOver24h > 0 && !overdue && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-200 bg-red-50/50 text-[13px] text-red-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>
              <strong>Cảnh báo thời gian phản hồi:</strong> Đang có <span className="font-bold underline">{summary.waitingOver24h}</span> khách hàng đã chờ hơn 24 giờ mà chưa được nhân viên gọi tư vấn.
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateParams({ overdue: 'true', status: '' })}
            className={`${ui.btnDanger} px-3 py-1.5 text-[12px] self-start sm:self-center`}
          >
            Lọc danh sách quá hạn ngay
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="space-y-3">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo họ tên, số điện thoại, email, tên shop…"
            className="w-full lg:w-80"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Người phụ trách"
              value={assignee}
              onChange={(v) => updateParams({ assignee: v })}
              options={assigneeOptions}
              className="max-w-55"
            />
            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#334155] cursor-pointer shadow-2xs hover:border-[#94A3B8]">
              <input
                type="checkbox"
                checked={overdue}
                onChange={(e) => updateParams({ overdue: e.target.checked ? 'true' : '', status: '' })}
                className="accent-[#2563EB] w-4 h-4 cursor-pointer"
              />
              Chờ quá 24 giờ
            </label>
          </div>
        </Toolbar>
        <FilterChips chips={chips} onClearAll={clearFilters} />
      </div>

      {/* Bảng Khách hàng */}
      <TableCard
        footer={
          !error &&
          pagination?.total > 0 && (
            <Pagination
              pagination={pagination}
              onPage={(p) => updateParams({ page: String(p) }, false)}
              onLimitChange={(l) => updateParams({ limit: String(l) }, true)}
              disabled={isLoading}
              unit="khách"
            />
          )
        }
      >
        <table className="w-full min-w-237.5">
          <thead>
            <tr>
              <th className="w-10 px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] text-center">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleSelectAll}
                  aria-label="Chọn tất cả khách"
                />
              </th>
              <Th sortKey="fullName" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                Khách hàng
              </Th>
              <Th>Cửa hàng dự kiến</Th>
              <Th>Lời nhắn của khách</Th>
              <Th sortKey="lastSubmittedAt" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                Thời điểm đăng ký
              </Th>
              <Th sortKey="lastContactedAt" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                Liên hệ gần nhất
              </Th>
              <Th>Phụ trách</Th>
              <Th>Trạng thái</Th>
              <th className="w-12 px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <TableBody
            loading={isLoading}
            error={error}
            onRetry={() => load()}
            columns={9}
            empty={
              sortedLeads.length === 0 && (
                <EmptyState
                  title={chips.length || query || status ? 'Không có khách phù hợp bộ lọc' : 'Chưa có khách hàng tiềm năng'}
                  description={
                    chips.length || query || status
                      ? 'Hãy thử thay đổi từ khóa hoặc bỏ bớt các điều kiện lọc.'
                      : 'Khi người dùng điền form tư vấn trên trang chủ, thông tin sẽ tự động xuất hiện tại đây.'
                  }
                  action={
                    chips.length || query ? (
                      <button type="button" onClick={clearFilters} className={ui.btnSecondary}>
                        Xóa bộ lọc
                      </button>
                    ) : null
                  }
                />
              )
            }
          >
            {sortedLeads.map((lead) => {
              const waiting = overdueDays(lead);
              const isSelected = selectedIds.includes(lead.id);

              return (
                <tr
                  key={lead.id}
                  onClick={() => openLead(lead.id)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                >
                  <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => handleSelectRow(lead.id, checked)}
                      aria-label={`Chọn ${lead.fullName}`}
                    />
                  </td>
                  <Td>
                    <div>
                      <p className="font-bold text-[#0F172A] flex items-center gap-1.5 flex-wrap">
                        {lead.fullName}
                        {lead.submissionCount > 1 && (
                          <span
                            className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200"
                            title="Số lần gửi lại form"
                          >
                            ×{lead.submissionCount} lần
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-[#2563EB] font-mono font-medium mt-0.5">{lead.phone}</p>
                    </div>
                  </Td>
                  <Td>
                    <p className="font-semibold text-[#1E293B] truncate max-w-45">
                      {lead.storeName || <span className="text-[#94A3B8]">—</span>}
                    </p>
                    {lead.industry && (
                      <p className="text-[11px] text-[#64748B] truncate max-w-45 mt-0.5">{lead.industry}</p>
                    )}
                  </Td>
                  <Td className="max-w-55">
                    <span className="line-clamp-2 text-[#475569] text-[12px] leading-relaxed" title={lead.note || ''}>
                      {lead.note || <span className="text-[#94A3B8] italic">Không có lời nhắn</span>}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <p
                      className={`font-semibold ${waiting ? 'text-red-700' : 'text-[#0F172A]'}`}
                      title={formatVNDateTime(lead.lastSubmittedAt)}
                    >
                      {formatRelativeTime(lead.lastSubmittedAt) || formatVNDateTime(lead.lastSubmittedAt)}
                    </p>
                    {waiting && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 mt-0.5">
                        <Clock className="w-2.5 h-2.5" /> Chờ {waiting} ngày
                      </span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {lead.lastContactedAt ? (
                      <div>
                        <p className="font-medium text-[#0F172A]">
                          {formatRelativeTime(lead.lastContactedAt) || formatVNDateTime(lead.lastContactedAt)}
                        </p>
                        {lead._count?.notes > 0 && (
                          <p className="text-[11px] text-[#64748B]">{lead._count.notes} lần tương tác</p>
                        )}
                        {lead.notes?.[0] && (
                          <div
                            className="mt-1 max-w-50 truncate text-[11px] text-[#475569] bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80"
                            title={`${NOTE_TYPES[lead.notes[0].type]?.label || 'Ghi chú'}: ${lead.notes[0].body}`}
                          >
                            <span className="font-semibold text-[#0F172A] mr-1">
                              {NOTE_TYPES[lead.notes[0].type]?.label || 'Ghi chú'}:
                            </span>
                            <span>{lead.notes[0].body}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#94A3B8] italic">Chưa liên hệ</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {lead.assignee ? (
                      <span className="inline-flex items-center gap-2 font-medium text-[#334155]">
                        <Avatar name={lead.assignee.fullName} size={26} tone="brand" />
                        {lead.assignee.fullName}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8] italic">Chưa giao việc</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={lead.status} />
                  </Td>
                  <Td align="right">
                    <RowMenu items={actionsFor(lead)} label={`Thao tác với ${lead.fullName}`} />
                  </Td>
                </tr>
              );
            })}
          </TableBody>
        </table>
      </TableCard>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={[
          {
            label: 'Nhận phụ trách các lead này',
            icon: UserPlus,
            variant: 'primary',
            onClick: async () => {
              try {
                await Promise.all(selectedIds.map((id) => apiUpdateAdminLead(id, { assigneeId: me.id })));
                toast({
                  type: 'success',
                  title: 'Đã nhận phụ trách',
                  description: `Bạn đã nhận phụ trách ${selectedIds.length} khách hàng được chọn.`,
                });
                setSelectedIds([]);
                load({ silent: true });
              } catch (err) {
                toast({ type: 'error', title: 'Không hoàn tất được thao tác', description: apiErrorMessage(err) });
              }
            },
          },
        ]}
      />

      {/* Drawer Chi Tiết Lead */}
      {openLeadId && (
        <LeadDrawer
          leadId={openLeadId}
          admins={admins}
          focusNote={focusNote}
          onClose={() => {
            setFocusNote(false);
            updateParams({ lead: '' }, false);
          }}
          onChanged={() => load({ silent: true })}
          onOpenCreateStore={(lead) => setDialog({ type: 'store', lead })}
        />
      )}

      {/* Dialogs */}
      {dialog?.type === 'status' && (
        <ChangeStatusModal
          lead={dialog.lead}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load({ silent: true });
          }}
        />
      )}

      {dialog?.type === 'store' && (
        <CreateStoreModal
          lead={dialog.lead}
          onClose={() => setDialog(null)}
          onConverted={() => markConverted(dialog.lead)}
        />
      )}
    </div>
  );
}

export default AdminLeadsPage;
