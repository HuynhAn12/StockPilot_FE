// Bộ component dùng chung chuẩn Production B2B SaaS cho Quản trị viên hệ thống (Admin).
// Cung cấp: PageHeader, Tabs, Toolbar, SearchInput, FilterSelect, FilterChips, TableCard, Th (sortable),
// Td, Checkbox, BulkActionBar, StatCard, LiveIndicator, Pagination (limit selector), RowMenu (với icon),
// Modal, ConfirmDialog, Drawer (hỗ trợ sub-tabs), DetailList, Section.

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  X,
  MoreVertical,
  AlertTriangle,
  Inbox,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Activity,
  TrendingUp,
  TrendingDown,
  Check,
} from 'lucide-react';
import { adminStyles as ui } from '../adminStyles';

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' };

/** Debounced copy of a value; used for search boxes so typing does not fire a request per key. */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Checkbox component accessible and cleanly styled for tables */
export function Checkbox({ checked = false, indeterminate = false, onChange, disabled = false, 'aria-label': ariaLabel }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className="inline-flex items-center justify-center cursor-pointer select-none">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked, e)}
        aria-label={ariaLabel}
        className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 focus:ring-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      />
    </label>
  );
}

/** Page header with breadcrumb slot, description, live indicators and action bar. */
export function PageHeader({ title, description, badge, actions, children }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#0F172A] leading-tight">
              {title}
            </h1>
            {badge}
          </div>
          {description && <p className="mt-1 text-[13px] sm:text-[14px] text-[#64748B] max-w-[75ch] leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Live Indicator badge showing real-time background sync state */
export function LiveIndicator({ status = 'synced', lastUpdated, onRefresh, loading }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[12px] text-[#475569] shadow-2xs">
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status === 'error' ? 'bg-red-400' : 'bg-emerald-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        />
      </span>
      <span className="font-medium">
        {loading ? 'Đang đồng bộ…' : lastUpdated ? `Đồng bộ lúc ${lastUpdated}` : 'Thời gian thực'}
      </span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-0.5 rounded text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-40"
          title="Đồng bộ ngay"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}

/** Underlined tabs for switching views inside one page. */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="border-b border-[#E2E8F0] flex gap-6 overflow-x-auto scrollbar-none" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`-mb-px pb-3 pt-1 text-[14px] whitespace-nowrap border-b-2 cursor-pointer transition-all ${
            value === tab.value
              ? 'border-[#2563EB] text-[#1D4ED8] font-semibold'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-slate-300 font-medium'
          }`}
        >
          {tab.label}
          {tab.count != null && (
            <span
              className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                value === tab.value ? 'bg-[#EFF4FF] text-[#2563EB]' : 'bg-slate-100 text-[#64748B]'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${ui.input} pl-9.5 pr-8 h-9 text-[13px]`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#94A3B8] hover:text-[#334155] hover:bg-slate-100 transition-colors"
          aria-label="Xóa tìm kiếm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/** Compact select used in toolbars. `options` = [{ value, label }]. */
export function FilterSelect({ value, onChange, options, label, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`${ui.select.replace('w-full ', '')} h-9 w-full sm:w-auto text-[13px] ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Active filters as removable chips, with a "clear all". `chips` = [{ key, label, onRemove }]. */
export function FilterChips({ chips, onClearAll }) {
  if (!chips || !chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-[#EFF4FF] border border-blue-200/80 text-[#1D4ED8] text-[12px] font-medium shadow-2xs"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="p-0.5 rounded hover:bg-blue-200/60 cursor-pointer text-[#2563EB]"
            aria-label={`Bỏ lọc ${chip.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-[12px] text-[#64748B] hover:text-[#0F172A] font-medium cursor-pointer underline underline-offset-2 ml-1"
        >
          Xóa tất cả
        </button>
      )}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">{children}</div>;
}

const BADGE_TONES = {
  success: 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5] [--dot:#12B76A]',
  warning: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89] [--dot:#F79009]',
  danger: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA] [--dot:#F04438]',
  info: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF] [--dot:#2E90FA]',
  neutral: 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] [--dot:#94A3B8]',
  purple: 'bg-[#FAF5FF] text-[#7E22CE] border-[#E9D5FF] [--dot:#A855F7]',
};

/** Status pill with a coloured dot. Text always states the status; colour only supports it. */
export function Badge({ tone = 'neutral', children, dot = true, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border whitespace-nowrap shadow-2xs ${
        BADGE_TONES[tone] || BADGE_TONES.neutral
      } ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-(--dot) shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Avatar({ name, size = 32, tone = 'neutral' }) {
  const text = String(name || '?')
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
  return (
    <span
      className={`rounded-full shrink-0 inline-flex items-center justify-center font-bold tracking-tight border ${
        tone === 'brand'
          ? 'bg-[#EFF4FF] text-[#2563EB] border-blue-200'
          : 'bg-[#F1F5F9] text-[#475569] border-slate-200'
      }`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

/** Production KPI Stat Card with trend, badge, and icon */
export function StatCard({
  title,
  value,
  change,
  trend = 'neutral', // 'up' | 'down' | 'neutral'
  subtitle,
  icon: Icon,
  iconBg = 'bg-blue-50 text-[#2563EB] border-blue-100',
  to,
  onClick,
  loading = false,
  alert = false,
}) {
  const content = (
    <div
      className={`relative p-5 bg-white rounded-xl border transition-all ${
        alert
          ? 'border-amber-300 bg-amber-50/20 shadow-sm'
          : 'border-[#E2E8F0] hover:border-slate-300 shadow-[0_1px_3px_rgba(15,23,42,0.06)]'
      } ${to || onClick ? 'group cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-[#64748B]">{title}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <p className="admin-num text-[30px] font-bold text-[#0F172A] tracking-[-0.02em] leading-tight">
          {loading ? <span className="inline-block w-16 h-8 rounded-lg bg-slate-100 animate-pulse align-middle" /> : value}
        </p>
      </div>

      {(subtitle || change) && (
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          {change && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
          {subtitle && (
            <span className={`truncate ${alert ? 'text-amber-800 font-medium' : 'text-[#64748B]'}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left focus-visible:outline-none">
        {content}
      </button>
    );
  }

  return content;
}

/** White container for a table with an optional header slot above it. */
export function TableCard({ children, header, footer }) {
  return (
    <div className={`${ui.card} overflow-hidden`}>
      {header && <div className="px-5 py-3.5 border-b border-[#F1F5F9] bg-[#FAFBFC] flex items-center justify-between gap-3">{header}</div>}
      <div className="relative overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}

/** Table header cell with optional 2-way sorting */
export function Th({ children, className = '', align = 'left', sortKey, currentSortKey, sortDirection = 'desc', onSort }) {
  const isSorted = sortKey && currentSortKey === sortKey;

  if (sortKey && onSort) {
    return (
      <th
        scope="col"
        onClick={() => onSort(sortKey)}
        className={`px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100 hover:text-[#0F172A] transition-colors select-none ${
          ALIGN[align]
        } ${className}`}
      >
        <div className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span>{children}</span>
          <span className="text-[#94A3B8]">
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#2563EB]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#2563EB]" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-50 hover:opacity-100" />
            )}
          </span>
        </div>
      </th>
    );
  }

  return (
    <th
      scope="col"
      className={`px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569] uppercase tracking-wider whitespace-nowrap select-none ${ALIGN[align]} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '', align = 'left' }) {
  return (
    <td className={`px-4 py-3.5 text-[13px] text-[#334155] align-middle ${ALIGN[align]} ${className}`}>
      {children}
    </td>
  );
}

export function SkeletonRows({ columns, rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-[#F1F5F9] last:border-0">
      {Array.from({ length: columns }).map((__, j) => (
        <td key={j} className="px-4 py-4">
          <div className="h-4 rounded-md bg-slate-100 animate-pulse" style={{ width: `${45 + ((i + j) % 4) * 15}%` }} />
        </td>
      ))}
    </tr>
  ));
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="px-6 py-14 text-center">
      <span className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 text-[#64748B] flex items-center justify-center border border-slate-200/80 shadow-2xs">
        <Inbox className="w-6 h-6" />
      </span>
      <p className="mt-3.5 text-[15px] font-semibold text-[#0F172A]">{title}</p>
      {description && <p className="mt-1 text-[13px] text-[#64748B] max-w-[45ch] mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="px-6 py-12 text-center">
      <span className="mx-auto w-12 h-12 rounded-2xl bg-red-50 text-[#DC2626] flex items-center justify-center border border-red-200">
        <AlertTriangle className="w-6 h-6" />
      </span>
      <p className="mt-3.5 text-[15px] font-semibold text-[#0F172A]">Không tải được dữ liệu</p>
      <p className="mt-1 text-[13px] text-[#64748B] max-w-[50ch] mx-auto">{message || 'Kiểm tra kết nối tới máy chủ rồi thử lại.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${ui.btnSecondary} mt-4`}>
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </button>
      )}
    </div>
  );
}

/** Table row states in one place: loading skeleton, error, empty, or the rows themselves. */
export function TableBody({ loading, error, onRetry, empty, columns, children }) {
  if (loading) {
    return (
      <tbody>
        <SkeletonRows columns={columns} />
      </tbody>
    );
  }
  if (error) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns}>
            <ErrorState message={error} onRetry={onRetry} />
          </td>
        </tr>
      </tbody>
    );
  }
  if (empty) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns}>{empty}</td>
        </tr>
      </tbody>
    );
  }
  return <tbody className="[&>tr]:border-b [&>tr]:border-[#F1F5F9] [&>tr:last-child]:border-0">{children}</tbody>;
}

/** Enhanced Pagination with rows-per-page selector */
export function Pagination({ pagination, onPage, onLimitChange, disabled, unit = 'bản ghi' }) {
  const { page = 1, totalPages = 1, total = 0, limit = 20 } = pagination || {};
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="px-5 py-3.5 border-t border-[#F1F5F9] bg-[#FAFBFC] flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px]">
      <div className="flex items-center gap-3 text-[#64748B]">
        <span>
          Hiển thị <span className="font-semibold text-[#0F172A]">{from}–{to}</span> trong <span className="font-semibold text-[#0F172A]">{total}</span> {unit}
        </span>
        {onLimitChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span>Mỗi trang:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              disabled={disabled}
              className="px-2 py-1 rounded-md border border-[#CBD5E1] bg-white text-[#0F172A] text-[12px] font-medium cursor-pointer"
            >
              {[10, 20, 50, 100].map((lim) => (
                <option key={lim} value={lim}>
                  {lim}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={disabled || page <= 1}
          className={`${ui.btnSecondary} px-3 py-1.5 text-[12px]`}
        >
          Trước
        </button>
        <span className="text-[13px] text-[#475569] px-2 font-medium">
          Trang {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={disabled || page >= totalPages}
          className={`${ui.btnSecondary} px-3 py-1.5 text-[12px]`}
        >
          Sau
        </button>
      </div>
    </div>
  );
}

/** Floating Bulk Action Bar appearing when rows are selected */
export function BulkActionBar({ selectedCount = 0, onClear, actions = [] }) {
  if (selectedCount <= 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-700/80 max-w-[95vw]">
      <div className="flex items-center gap-2.5 pr-3 border-r border-slate-700">
        <span className="w-5.5 h-5.5 rounded-full bg-[#2563EB] text-white text-[11px] font-bold flex items-center justify-center">
          {selectedCount}
        </span>
        <span className="text-[13px] font-medium whitespace-nowrap">Đã chọn {selectedCount}</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {actions.map((act) => (
          <button
            key={act.label}
            type="button"
            onClick={act.onClick}
            disabled={act.disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              act.danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : act.variant === 'primary'
                ? 'bg-[#2563EB] hover:bg-blue-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {act.icon && <act.icon className="w-3.5 h-3.5" />}
            {act.label}
          </button>
        ))}
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-[12px] text-slate-400 hover:text-white underline cursor-pointer ml-auto pl-2 whitespace-nowrap"
        >
          Bỏ chọn
        </button>
      )}
    </div>
  );
}

/** Kebab menu for row actions with icons. */
export function RowMenu({ items, label = 'Thao tác' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const visible = items.filter((i) => !i.hidden);
  if (!visible.length) return null;

  return (
    <div ref={ref} className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A] transition-colors cursor-pointer"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 min-w-52.5 rounded-xl border border-[#E2E8F0] bg-white py-1.5 shadow-[0_12px_24px_-4px_rgba(15,23,42,0.12),0_4px_6px_-2px_rgba(15,23,42,0.04)] animate-in fade-in zoom-in-95 duration-100"
        >
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full text-left px-3.5 py-2 text-[13px] flex items-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                item.danger
                  ? 'text-[#DC2626] hover:bg-red-50'
                  : 'text-[#334155] hover:bg-slate-50 hover:text-[#0F172A]'
              }`}
            >
              {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Centered dialog with entrance animation. */
export function Modal({ title, description, onClose, busy, children, footer, width = 'max-w-md' }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [busy, onClose]);

  return (
    <div
      className={ui.modalBackdrop}
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        className={`bg-white rounded-2xl w-full ${width} border border-[#E2E8F0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-2">
          <div>
            <h3 className="text-[18px] font-bold text-[#0F172A] tracking-tight">{title}</h3>
            {description && <p className="mt-1 text-[13px] text-[#64748B] leading-relaxed">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#334155] hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 bg-slate-50 border-t border-[#F1F5F9] flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}

/** Confirmation for important actions with optional reason and password verification */
export function ConfirmDialog({ title, description, confirmLabel, danger, reason, password, onConfirm, onClose }) {
  const [reasonText, setReasonText] = useState(reason?.initial || '');
  const [passwordText, setPasswordText] = useState('');
  const [busy, setBusy] = useState(false);
  const reasonOk = !reason?.required || reasonText.trim().length >= (reason.minLength || 5);
  const passwordOk = !password || passwordText.length > 0;

  const submit = async () => {
    if (!reasonOk || !passwordOk) return;
    setBusy(true);
    try {
      await onConfirm({ reason: reasonText.trim(), password: passwordText });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      description={description}
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
            disabled={busy || !reasonOk || !passwordOk}
            className={danger ? ui.btnDanger : ui.btnPrimary}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {(reason || password) && (
        <div className="space-y-4">
          {reason && (
            <label className="block">
              <span className="block text-[13px] font-semibold text-[#334155] mb-1.5">
                {reason.label || 'Lý do'}{!reason.required && ' (không bắt buộc)'}
              </span>
              <textarea
                rows={3}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder={reason.placeholder}
                className={ui.input}
                autoFocus
              />
              <span className="block text-[12px] text-[#64748B] mt-1.5">
                {reason.required && !reasonOk ? `Cần ít nhất ${reason.minLength || 5} ký tự. ` : ''}
                {reason.hint || 'Lý do được ghi nhận vào nhật ký kiểm toán.'}
              </span>
            </label>
          )}
          {password && (
            <label className="block">
              <span className="block text-[13px] font-semibold text-[#334155] mb-1.5">Mật khẩu xác nhận của bạn</span>
              <input
                type="password"
                value={passwordText}
                onChange={(e) => setPasswordText(e.target.value)}
                autoComplete="current-password"
                className={ui.input}
              />
              <span className="block text-[12px] text-[#64748B] mt-1.5">
                {password.hint || 'Thao tác nhạy cảm cần xác nhận lại mật khẩu để bảo vệ hệ thống.'}
              </span>
            </label>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Right-side Drawer panel with support for inner tabs and smooth slide */
export function Drawer({ title, subtitle, badge, tabs, activeTab, onTabChange, onClose, children, footer, width = 'sm:w-[560px]' }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150" onClick={onClose} />
      <aside
        className={`absolute inset-y-0 right-0 w-full ${width} bg-white border-l border-[#E2E8F0] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="px-6 py-4.5 border-b border-[#F1F5F9] bg-[#FAFBFC]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[18px] font-bold text-[#0F172A] tracking-tight truncate">{title}</h3>
                {badge}
              </div>
              {subtitle && <p className="text-[13px] text-[#64748B] mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#334155] hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {tabs && tabs.length > 0 && (
            <div className="flex gap-4 mt-3 -mb-1 overflow-x-auto scrollbar-none border-b border-slate-200/60" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => onTabChange && onTabChange(tab.key)}
                  className={`-mb-px pb-2 text-[13px] font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                  {tab.count != null && (
                    <span className="ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-[#475569]">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[13px]">{children}</div>

        {footer && <div className="px-6 py-4 border-t border-[#F1F5F9] bg-[#FAFBFC] flex flex-wrap justify-end gap-2.5">{footer}</div>}
      </aside>
    </div>
  );
}

export function DetailList({ rows }) {
  return (
    <dl className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] bg-white overflow-hidden shadow-2xs">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
          <dt className="text-[13px] font-medium text-[#64748B] shrink-0">{label}</dt>
          <dd className="text-[13px] text-[#0F172A] font-medium text-right wrap-break-word min-w-0">
            {value ?? <span className="text-[#94A3B8]">Chưa có</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Section({ title, children, action }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <h4 className="text-[14px] font-bold text-[#0F172A] tracking-tight">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}
