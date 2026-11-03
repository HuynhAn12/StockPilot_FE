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
  DetailList,
  Section,
  StatCard,
  useDebounced,
} from './components/AdminUI';
import { useAdminText } from './useAdminText';

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS = {
  NEW: { label: 'Mới đăng ký', en: 'New', tone: 'info' },
  CONTACTED: { label: 'Đã liên hệ', en: 'Contacted', tone: 'warning' },
  CONVERTED: { label: 'Đã chuyển đổi', en: 'Converted', tone: 'success' },
  REJECTED: { label: 'Không phù hợp', en: 'Not a fit', tone: 'neutral' },
};

const NOTE_TYPES = {
  CALL: { label: 'Cuộc gọi', en: 'Call', tone: 'info' },
  EMAIL: { label: 'Email', en: 'Email', tone: 'info' },
  MEETING: { label: 'Gặp mặt / Demo', en: 'Meeting / demo', tone: 'purple' },
  NOTE: { label: 'Ghi chú nội bộ', en: 'Internal note', tone: 'neutral' },
  STATUS: { label: 'Cập nhật hệ thống', en: 'System update', tone: 'neutral' },
  RESUBMIT: { label: 'Gửi lại form', en: 'Form resubmitted', tone: 'warning' },
};

const NOTE_PLACEHOLDER = {
  CALL: ['Kết quả cuộc gọi: khách quan tâm tính năng gì, hẹn gọi lại khi nào…', 'Call outcome: which features they care about, when to call back…'],
  EMAIL: ['Nội dung email: đã gửi bảng giá, tài liệu hướng dẫn…', 'Email summary: pricing sent, guides shared…'],
  MEETING: ['Buổi demo: khách cần thử máy in hóa đơn, quét mã vạch…', 'Demo notes: they want to try the receipt printer, barcode scanning…'],
  NOTE: ['Ghi chú nội bộ về khách hàng này…', 'Internal note about this lead…'],
};

function StatusBadge({ status }) {
  const { t } = useAdminText();
  const s = STATUS[status] || { label: status, en: status, tone: 'neutral' };
  return <Badge tone={s.tone}>{t(s.label, s.en)}</Badge>;
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
  const { t } = useAdminText();
  const { toast } = useToast();
  const [status, setStatus] = useState(lead.status);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await apiUpdateAdminLead(lead.id, { status });
      const label = STATUS[status] ? t(STATUS[status].label, STATUS[status].en) : status;
      toast({ type: 'success', title: t(`Đã đổi trạng thái sang "${label}"`, `Status changed to "${label}"`) });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: t('Không đổi được trạng thái', 'Could not change the status'), description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t('Cập nhật trạng thái Khách hàng', 'Update lead status')}
      description={t(
        `Khách hàng: ${lead.fullName}. Thay đổi được tự ghi vào lịch sử chăm sóc.`,
        `Lead: ${lead.fullName}. The change is logged in the activity history.`
      )}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            {t('Hủy', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || status === lead.status}
            className={ui.btnPrimary}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            {t('Lưu trạng thái', 'Save status')}
          </button>
        </>
      }
    >
      <fieldset className="space-y-2.5">
        <legend className="sr-only">{t('Trạng thái xử lý', 'Status')}</legend>
        {Object.entries(STATUS).map(([value, s]) => (
          <label
            key={value}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border cursor-pointer text-[13px] transition-colors ${
              status === value
                ? 'border-blue-600 bg-blue-50 text-slate-900 font-medium ring-1 ring-blue-600'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="leadStatus"
              value={value}
              checked={status === value}
              onChange={() => setStatus(value)}
              className="accent-blue-600 w-4 h-4 cursor-pointer"
            />
            <span>{t(s.label, s.en)}</span>
          </label>
        ))}
      </fieldset>
    </Modal>
  );
}

function CreateStoreModal({ lead, onClose, onConverted }) {
  const { t } = useAdminText();
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
        title: t('Đã sao chép liên kết đăng ký', 'Sign-up link copied'),
        description: t('Gửi link này cho khách qua Zalo hoặc Email để hoàn tất đăng ký.', 'Send it to the lead via Zalo or email to finish signing up.'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ type: 'warning', title: t('Hãy sao chép liên kết trong ô bên dưới', 'Copy the link from the box below') });
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
      title={t('Tạo Cửa hàng cho Khách hàng', 'Create a store for this lead')}
      description={t('Gửi khách hàng liên kết đăng ký đã điền sẵn đầy đủ thông tin. Khách chỉ cần tự đặt mật khẩu để kích hoạt cửa hàng.', 'Send the lead a prefilled sign-up link. They only need to set a password to activate the store.')}
      onClose={onClose}
      busy={busy}
      width="max-w-lg"
      footer={
        <>
          {lead.status !== 'CONVERTED' && (
            <button type="button" onClick={markConverted} disabled={busy} className={ui.btnSecondary}>
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              {t('Đánh dấu đã chuyển đổi', 'Mark as converted')}
            </button>
          )}
          <button type="button" onClick={copyLink} className={ui.btnPrimary}>
            {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            {copied ? t('Đã sao chép', 'Copied') : t('Sao chép liên kết', 'Copy link')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <DetailList
          rows={[
            [t('Họ tên', 'Name'), lead.fullName],
            [t('Số điện thoại', 'Phone'), lead.phone],
            ['Email', lead.email || t('Chưa cung cấp', 'Not provided')],
            [t('Tên cửa hàng dự kiến', 'Planned store name'), lead.storeName || t('Chưa đặt tên', 'Not named')],
          ]}
        />

        <div>
          <label htmlFor="register-link" className="block text-[13px] font-medium text-slate-700 mb-1.5">
            {t('Liên kết đăng ký đã điền sẵn', 'Prefilled sign-up link')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="register-link"
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className={`${ui.input} font-mono text-[12px] bg-slate-50`}
            />
            <button
              type="button"
              onClick={copyLink}
              className={`${ui.btnSecondary} shrink-0 px-3`}
              title={t('Sao chép', 'Copy')}
              aria-label={t('Sao chép liên kết', 'Copy link')}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          <span className="block text-[12px] text-slate-500 mt-1.5">
            {t('Mở trên trình duyệt của khách hàng. Khách tự quản lý thông tin bảo mật của mình.', 'Open it in the lead\'s browser. They keep control of their own credentials.')}
          </span>
        </div>
      </div>
    </Modal>
  );
}

// ─── Lead Detail Drawer ──────────────────────────────────────────────────────
function LeadDrawer({ leadId, admins, onClose, onChanged, focusNote, onOpenCreateStore }) {
  const { t, isEn } = useAdminText();
  const noteLabel = (type) => {
    const n = NOTE_TYPES[type] || NOTE_TYPES.NOTE;
    return t(n.label, n.en);
  };
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
      toast({ type: 'error', title: t('Không mở được thông tin khách hàng', 'Could not open the lead'), description: apiErrorMessage(err) });
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
      toast({ type: 'error', title: t('Không cập nhật được', 'Could not update'), description: apiErrorMessage(err) });
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
      toast({ type: 'success', title: t('Đã lưu vào lịch sử chăm sóc', 'Added to the history') });
      onChanged();
    } catch (err) {
      toast({ type: 'error', title: t('Không lưu được ghi chú', 'Could not save the note'), description: apiErrorMessage(err) });
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
        className="fixed inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card đặt ở chính giữa màn hình */}
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col overflow-hidden z-10"
        role="dialog"
        aria-modal="true"
        aria-label={lead?.fullName || t('Chi tiết khách hàng', 'Lead details')}
      >
        {/* Header Modal */}
        <div className="px-5 pt-4 border-b border-slate-200 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-[16px] font-semibold text-slate-900">
                  {lead?.fullName || t('Khách hàng tiềm năng', 'Lead')}
                </h3>
                {lead && <StatusBadge status={lead.status} />}
              </div>
              {lead && (
                <p className="mt-1 text-[13px] text-slate-500">
                  {t('Đăng ký ', 'Signed up ')}
                  <span className="tabular-nums">{formatVNDateTime(lead.createdAt)}</span>
                  {lead.submissionCount > 1 && t(` · Gửi lại form ${lead.submissionCount} lần`, ` · Submitted ${lead.submissionCount} times`)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label={t('Đóng', 'Close')}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Sub-tabs chuyển đổi chế độ xem */}
          <div className="flex gap-5 mt-3" role="tablist">
            {[
              { key: 'overview', label: t('Tư vấn & thao tác', 'Follow-up') },
              { key: 'timeline', label: t('Lịch sử chăm sóc', 'Activity history'), count: lead?.notes?.length },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={drawerTab === tab.key}
                onClick={() => setDrawerTab(tab.key)}
                className={`pb-2.5 -mb-px text-[13px] font-medium border-b-2 cursor-pointer transition-colors ${
                  drawerTab === tab.key ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {tab.count != null && (
                  <span
                    className={`ml-1.5 px-1.5 rounded text-[11px] font-medium tabular-nums ${
                      drawerTab === tab.key ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
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
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {!lead ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-5 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : drawerTab === 'overview' ? (
            <div className="space-y-6">
              {waiting && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-300 bg-amber-50 text-[13px] text-amber-900" role="status">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>
                    {t(
                      `Quá 24 giờ: khách đã chờ ${waiting} ngày mà chưa được liên hệ.`,
                      `Over 24 hours: this lead has waited ${waiting} days without contact.`
                    )}
                  </span>
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <a
                  href={`tel:${lead.phone}`}
                  className={`${ui.btnSecondary} justify-center`}
                >
                  <Phone className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span>{t('Gọi điện', 'Call')}</span>
                </a>
                <a
                  href={zaloLink(lead.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ui.btnSecondary} justify-center`}
                >
                  <MessageCircle className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span>Zalo</span>
                </a>
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}?subject=${encodeURIComponent('StockPilot - Tư vấn mở cửa hàng')}`}
                    className={`${ui.btnSecondary} justify-center`}
                  >
                    <Mail className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    <span>Email</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className={`${ui.btnSecondary} justify-center`}
                    title={t('Khách chưa cung cấp email', 'No email provided')}
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    <span>Email</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenCreateStore(lead)}
                  className={`${ui.btnSecondary} justify-center`}
                >
                  <Store className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span>{t('Tạo cửa hàng', 'Create store')}</span>
                </button>
              </div>

              <DetailList
                rows={[
                  [t('Số điện thoại', 'Phone'), <span key="phone" className="tabular-nums">{lead.phone}</span>],
                  ['Email', lead.email || t('Chưa cung cấp', 'Not provided')],
                  [t('Tên cửa hàng dự kiến', 'Planned store name'), lead.storeName || t('Chưa xác định', 'Not set')],
                  [t('Ngành hàng', 'Industry'), lead.industry || t('Chưa xác định', 'Not set')],
                  [
                    t('Liên hệ gần nhất', 'Last contact'),
                    lead.lastContactedAt ? formatVNDateTime(lead.lastContactedAt) : t('Chưa từng liên hệ', 'Never contacted'),
                  ],
                ]}
              />

              <Section title={t('Lời nhắn từ khách hàng', 'Message from the lead')}>
                <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700 leading-relaxed">
                  {lead.note || t('Khách không để lại lời nhắn thêm.', 'The lead left no message.')}
                </p>
              </Section>

              {/* Phụ trách & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-status" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                    {t('Trạng thái xử lý', 'Status')}
                  </label>
                  <select
                    id="lead-status"
                    value={lead.status}
                    disabled={busy === 'update'}
                    onChange={(e) => update({ status: e.target.value }, t('Đã cập nhật trạng thái', 'Status updated'))}
                    className={ui.select}
                  >
                    {Object.entries(STATUS).map(([value, s]) => (
                      <option key={value} value={value}>
                        {t(s.label, s.en)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="lead-assignee" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                    {t('Người phụ trách', 'Assignee')}
                  </label>
                  <select
                    id="lead-assignee"
                    value={lead.assignee?.id ?? ''}
                    disabled={busy === 'update'}
                    onChange={(e) =>
                      update({ assigneeId: e.target.value ? Number(e.target.value) : null }, t('Đã chuyển người phụ trách', 'Assignee changed'))
                    }
                    className={ui.select}
                  >
                    <option value="">{t('Chưa giao việc', 'Unassigned')}</option>
                    {admins.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Ghi Chú Nhanh */}
              <Section title={t('Ghi nhận hoạt động chăm sóc', 'Log an activity')}>
                <form onSubmit={addNote} className="space-y-3">
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('Hình thức tương tác', 'Activity type')}>
                    {['CALL', 'EMAIL', 'MEETING', 'NOTE'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={noteType === type}
                        onClick={() => setNoteType(type)}
                        className={`h-7 px-2.5 rounded-md text-[12px] font-medium border cursor-pointer transition-colors ${
                          noteType === type
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {noteLabel(type)}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={noteInputRef}
                    rows={3}
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    maxLength={2000}
                    placeholder={NOTE_PLACEHOLDER[noteType]?.[isEn ? 1 : 0]}
                    aria-label={t('Nội dung ghi chú', 'Note')}
                    className={ui.input}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-slate-500">
                      {lead.status === 'NEW' && noteType !== 'NOTE'
                        ? t('Khách sẽ tự chuyển sang "Đã liên hệ".', 'The lead will move to "Contacted" automatically.')
                        : t('Nhấn Lưu để ghi vào lịch sử.', 'Save to add it to the history.')}
                    </span>
                    <button
                      type="submit"
                      disabled={busy === 'note' || noteBody.trim().length < 2}
                      className={ui.btnPrimary}
                    >
                      {busy === 'note' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Send className="w-3.5 h-3.5" aria-hidden="true" />}
                      {t('Lưu hoạt động', 'Save activity')}
                    </button>
                  </div>
                </form>
              </Section>

              {/* Danh sách ghi chú & hoạt động gần nhất */}
              {lead.notes && lead.notes.length > 0 && (
                <Section
                  title={
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-slate-900">{t('Hoạt động gần nhất', 'Latest activity')}</span>
                      <button
                        type="button"
                        onClick={() => setDrawerTab('timeline')}
                        className="text-[12px] font-medium text-blue-700 hover:underline underline-offset-2 cursor-pointer"
                      >
                        {t(`Xem toàn bộ (${lead.notes.length})`, `View all (${lead.notes.length})`)} →
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
                          className={`px-4 py-3 rounded-lg border text-[13px] ${
                            n.type === 'NOTE' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <Badge tone={T.tone} dot={false}>
                                {t(T.label, T.en)}
                              </Badge>
                              <span className="font-semibold text-slate-900 text-[12px]">
                                {n.author?.fullName || t('Hệ thống', 'System')}
                              </span>
                            </div>
                            <span className="text-[12px] text-slate-500 tabular-nums">
                              {formatRelativeTime(n.createdAt) || formatVNDateTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
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
              <h4 className="text-[13px] font-semibold text-slate-900">{t('Dòng thời gian', 'Timeline')}</h4>
              {!lead.notes?.length ? (
                <p className="p-8 text-center text-slate-500 text-[13px] bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  {t('Chưa có hoạt động nào được ghi lại. Hãy thực hiện cuộc gọi hoặc gửi email đầu tiên!', 'No activity yet. Log the first call or email.')}
                </p>
              ) : (
                <ol className="relative border-l border-slate-200 ml-3 space-y-5">
                  {lead.notes.map((n) => {
                    const T = NOTE_TYPES[n.type] || NOTE_TYPES.NOTE;
                    return (
                      <li key={n.id} className="pl-5 relative">
                        <span
                          className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-white border-2 border-blue-600"
                          aria-hidden="true"
                        />
                        <div className="px-4 py-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                            <div className="flex items-center gap-2">
                              <Badge tone={T.tone} dot={false}>
                                {t(T.label, T.en)}
                              </Badge>
                              <span className="font-semibold text-slate-900">{n.author?.fullName || t('Hệ thống', 'System')}</span>
                            </div>
                            <span className="text-slate-500 tabular-nums" title={formatVNDateTime(n.createdAt)}>
                              {formatRelativeTime(n.createdAt) || formatVNDateTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-[13px] text-slate-700 leading-relaxed pt-1">{n.body}</p>
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
  const { t, isEn } = useAdminText();
  const locale = isEn ? 'en-US' : 'vi-VN';
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
      toast({ type: 'success', title: t('Đã đánh dấu đã chuyển đổi thành công', 'Marked as converted') });
      setDialog(null);
      load({ silent: true });
    } catch (err) {
      toast({ type: 'error', title: t('Không cập nhật được', 'Could not update'), description: apiErrorMessage(err) });
    }
  };

  const assignToMe = async (lead) => {
    try {
      await apiUpdateAdminLead(lead.id, { assigneeId: me.id });
      toast({ type: 'success', title: t(`Bạn đã nhận phụ trách ${lead.fullName}`, `You now own ${lead.fullName}`) });
      load({ silent: true });
    } catch (err) {
      toast({ type: 'error', title: t('Không nhận được khách', 'Could not assign the lead'), description: apiErrorMessage(err) });
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
        return sortDirection === 'asc' ? nA.localeCompare(nB, locale) : nB.localeCompare(nA, locale);
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
  }, [leads, sortKey, sortDirection, locale]);

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
    { label: t('Xem chi tiết', 'View details'), icon: ExternalLink, onClick: () => openLead(lead.id) },
    { label: t('Ghi lại cuộc gọi / hẹn gặp', 'Log a call / meeting'), icon: PlusCircle, onClick: () => openLead(lead.id, true) },
    {
      label: t('Nhận phụ trách', 'Assign to me'),
      icon: UserPlus,
      onClick: () => assignToMe(lead),
      hidden: lead.assignee?.id === me?.id,
    },
    { label: t('Đổi trạng thái', 'Change status'), icon: RefreshCw, onClick: () => setDialog({ type: 'status', lead }) },
    {
      label: t('Nhắn qua Zalo', 'Message on Zalo'),
      icon: MessageCircle,
      onClick: () => window.open(zaloLink(lead.phone), '_blank', 'noopener,noreferrer'),
    },
    {
      label: t('Tạo cửa hàng cho khách', 'Create store for lead'),
      icon: Store,
      onClick: () => setDialog({ type: 'store', lead }),
      hidden: lead.status === 'REJECTED',
    },
  ];

  const noteTypeLabel = (type) => {
    const n = NOTE_TYPES[type];
    return n ? t(n.label, n.en) : t('Ghi chú', 'Note');
  };

  const assigneeOptions = [
    { value: '', label: t('Mọi người phụ trách', 'All assignees') },
    { value: 'none', label: t('Chưa giao việc', 'Unassigned') },
    ...admins.map((a) => ({ value: String(a.id), label: a.id === me?.id ? `${a.fullName} ${t('(bạn)', '(you)')}` : a.fullName })),
  ];

  const chips = [
    overdue && { key: 'overdue', label: t('Chờ quá 24 giờ', 'Waiting over 24h'), onRemove: () => updateParams({ overdue: '' }) },
    assignee && {
      key: 'assignee',
      label: assigneeOptions.find((o) => o.value === assignee)?.label || t('Người phụ trách', 'Assignee'),
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
        title={t('Khách hàng tiềm năng (Leads CRM)', 'Leads')}
        description={t('Quản lý khách để lại thông tin tư vấn mở cửa hàng từ Landing Page. Hãy liên hệ trong 24 giờ đầu để đạt tỷ lệ chốt cao nhất.', 'People who asked for a consultation on the home page. Contact them within 24 hours for the best conversion.')}
        badge={
          <Badge tone="neutral" dot={false}>
            {t(`${summary?.total ?? 0} khách`, `${summary?.total ?? 0} leads`)}
          </Badge>
        }
        actions={
          <button type="button" onClick={() => load()} disabled={isLoading} className={ui.btnSecondary}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('Làm mới', 'Refresh')}
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
            { value: '', label: t('Tất cả', 'All'), count: summary?.total },
            ...Object.entries(STATUS).map(([value, s]) => ({
              value,
              label: t(s.label, s.en),
              count: summary?.[value],
            })),
          ]}
        />
      </PageHeader>

      {/* 4 Thẻ KPI CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('Tổng khách tư vấn', 'Total leads')}
          value={summary?.total ?? 0}
          subtitle={t('Từ form trên trang chủ', 'From the home page form')}
          icon={UserCheck}
          iconBg="bg-slate-100 text-slate-600"
          loading={isLoading}
        />
        <StatCard
          title={t('Khách mới cần gọi', 'New, to call')}
          value={summary?.NEW ?? 0}
          subtitle={t('Chưa được liên hệ lần nào', 'Not contacted yet')}
          icon={Phone}
          iconBg="bg-slate-100 text-slate-600"
          alert={(summary?.NEW ?? 0) > 0}
          loading={isLoading}
        />
        <StatCard
          title={t('Chờ quá 24 giờ', 'Waiting over 24h')}
          value={summary?.waitingOver24h ?? 0}
          subtitle={t('Nên liên hệ ngay', 'Contact soon')}
          icon={Clock}
          iconBg={(summary?.waitingOver24h ?? 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}
          alert={(summary?.waitingOver24h ?? 0) > 0}
          loading={isLoading}
        />
        <StatCard
          title={t('Đã thành cửa hàng', 'Converted')}
          value={summary?.CONVERTED ?? 0}
          subtitle={
            summary?.total
              ? t(`Tỷ lệ chuyển đổi ${Math.round((summary.CONVERTED / summary.total) * 100)}%`, `${Math.round((summary.CONVERTED / summary.total) * 100)}% conversion`)
              : '–'
          }
          icon={CheckCircle2}
          iconBg="bg-slate-100 text-slate-600"
          loading={isLoading}
        />
      </div>

      {/* SLA Alert Box */}
      {summary?.waitingOver24h > 0 && !overdue && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-[13px] text-red-900" role="status">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
            <span>
              {t(
                `${summary.waitingOver24h} khách đã chờ hơn 24 giờ mà chưa được gọi tư vấn.`,
                `${summary.waitingOver24h} leads have waited over 24 hours without a call.`
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateParams({ overdue: 'true', status: '' })}
            className={`${ui.btnSecondary} h-8 self-start sm:self-center`}
          >
            {t('Xem các khách quá hạn', 'Show overdue leads')}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="space-y-3">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Tìm theo họ tên, số điện thoại, email, tên shop…', 'Search by name, phone, email or store name…')}
            className="w-full lg:w-80"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label={t('Người phụ trách', 'Assignee')}
              value={assignee}
              onChange={(v) => updateParams({ assignee: v })}
              options={assigneeOptions}
              className="max-w-55"
            />
            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-700 cursor-pointer hover:border-slate-300">
              <input
                type="checkbox"
                checked={overdue}
                onChange={(e) => updateParams({ overdue: e.target.checked ? 'true' : '', status: '' })}
                className="accent-blue-600 w-4 h-4 cursor-pointer"
              />
              {t('Chờ quá 24 giờ', 'Waiting over 24h')}
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
              unit={t('khách', 'leads')}
            />
          )
        }
      >
        <table className={`${ui.table} min-w-237.5`}>
          <thead>
            <tr>
              <th className="w-10 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-center">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleSelectAll}
                  aria-label={t('Chọn tất cả khách', 'Select all leads')}
                />
              </th>
              <Th sortKey="fullName" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                {t('Khách hàng', 'Lead')}
              </Th>
              <Th>{t('Cửa hàng dự kiến', 'Planned store')}</Th>
              <Th>{t('Lời nhắn của khách', 'Message')}</Th>
              <Th sortKey="lastSubmittedAt" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                {t('Thời điểm đăng ký', 'Submitted')}
              </Th>
              <Th sortKey="lastContactedAt" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                {t('Liên hệ gần nhất', 'Last contact')}
              </Th>
              <Th>{t('Phụ trách', 'Assignee')}</Th>
              <Th>{t('Trạng thái', 'Status')}</Th>
              <th className="w-12 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <span className="sr-only">{t('Thao tác', 'Actions')}</span>
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
                  title={chips.length || query || status ? t('Không có khách phù hợp bộ lọc', 'No leads match the filters') : t('Chưa có khách hàng tiềm năng', 'No leads yet')}
                  description={
                    chips.length || query || status
                      ? t('Hãy thử thay đổi từ khóa hoặc bỏ bớt các điều kiện lọc.', 'Try another keyword or remove some filters.')
                      : t('Khi người dùng điền form tư vấn trên trang chủ, thông tin sẽ tự động xuất hiện tại đây.', 'Leads appear here when someone fills in the home page form.')
                  }
                  action={
                    chips.length || query ? (
                      <button type="button" onClick={clearFilters} className={ui.btnSecondary}>
                        {t('Xóa bộ lọc', 'Clear filters')}
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
                  onKeyDown={(e) => e.key === 'Enter' && openLead(lead.id)}
                  tabIndex={0}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-slate-50 ${isSelected ? 'bg-blue-50/60' : ''}`}
                >
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => handleSelectRow(lead.id, checked)}
                      aria-label={t(`Chọn ${lead.fullName}`, `Select ${lead.fullName}`)}
                    />
                  </td>
                  <Td>
                    <div>
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        {lead.fullName}
                        {lead.submissionCount > 1 && (
                          <Badge tone="warning" dot={false}>
                            ×{lead.submissionCount}
                          </Badge>
                        )}
                      </p>
                      <p className="text-[12px] text-slate-500 tabular-nums mt-0.5">{lead.phone}</p>
                    </div>
                  </Td>
                  <Td>
                    <p className="font-semibold text-slate-800 truncate max-w-45">
                      {lead.storeName || <span className="text-slate-400">–</span>}
                    </p>
                    {lead.industry && (
                      <p className="text-[12px] text-slate-500 truncate max-w-45 mt-0.5">{lead.industry}</p>
                    )}
                  </Td>
                  <Td className="max-w-55">
                    <span className="line-clamp-2 text-slate-600 text-[12px] leading-relaxed" title={lead.note || ''}>
                      {lead.note || <span className="text-slate-400">{t('Không có lời nhắn', 'No message')}</span>}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <p
                      className={`font-semibold ${waiting ? 'text-red-700' : 'text-slate-900'}`}
                      title={formatVNDateTime(lead.lastSubmittedAt)}
                    >
                      {formatRelativeTime(lead.lastSubmittedAt) || formatVNDateTime(lead.lastSubmittedAt)}
                    </p>
                    {waiting && (
                      <Badge tone="danger" dot={false} className="mt-0.5">
                        {t(`Chờ ${waiting} ngày`, `Waiting ${waiting}d`)}
                      </Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {lead.lastContactedAt ? (
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatRelativeTime(lead.lastContactedAt) || formatVNDateTime(lead.lastContactedAt)}
                        </p>
                        {lead._count?.notes > 0 && (
                          <p className="text-[12px] text-slate-500">{t(`${lead._count.notes} lần tương tác`, `${lead._count.notes} interactions`)}</p>
                        )}
                        {lead.notes?.[0] && (
                          <div
                            className="mt-1 max-w-50 truncate text-[12px] text-slate-600"
                            title={`${noteTypeLabel(lead.notes[0].type)}: ${lead.notes[0].body}`}
                          >
                            <span className="font-medium text-slate-900 mr-1">{noteTypeLabel(lead.notes[0].type)}:</span>
                            <span>{lead.notes[0].body}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">{t('Chưa liên hệ', 'Not contacted')}</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {lead.assignee ? (
                      <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                        <Avatar name={lead.assignee.fullName} size={24} tone="brand" />
                        {lead.assignee.fullName}
                      </span>
                    ) : (
                      <span className="text-slate-400">{t('Chưa giao việc', 'Unassigned')}</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={lead.status} />
                  </Td>
                  <Td align="right">
                    <RowMenu items={actionsFor(lead)} label={t(`Thao tác với ${lead.fullName}`, `Actions for ${lead.fullName}`)} />
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
            label: t(`Nhận phụ trách ${selectedIds.length} khách`, `Assign ${selectedIds.length} leads to me`),
            icon: UserPlus,
            variant: 'primary',
            onClick: async () => {
              try {
                await Promise.all(selectedIds.map((id) => apiUpdateAdminLead(id, { assigneeId: me.id })));
                toast({
                  type: 'success',
                  title: t('Đã nhận phụ trách', 'Assigned to you'),
                  description: t(`Bạn đã nhận phụ trách ${selectedIds.length} khách.`, `You now own ${selectedIds.length} leads.`),
                });
                setSelectedIds([]);
                load({ silent: true });
              } catch (err) {
                toast({ type: 'error', title: t('Không hoàn tất được thao tác', 'Could not complete the action'), description: apiErrorMessage(err) });
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
