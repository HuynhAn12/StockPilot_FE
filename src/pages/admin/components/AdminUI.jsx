// Bộ component dùng chung chuẩn Production B2B SaaS cho Quản trị viên hệ thống (Admin).
// Executive Command-Center Edition: Tích hợp Motion Animations, Glassmorphism, Song ngữ Vi/En toàn diện.

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
import { useTranslation } from '../../../i18n/useTranslation';

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
        className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:ring-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
            <h1 className="text-[24px] sm:text-[30px] font-black tracking-tight text-slate-900 leading-tight">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1 text-[13px] sm:text-[14px] text-slate-500 max-w-[75ch] leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Live Indicator badge showing real-time background sync state with radar ping */
export function LiveIndicator({ status = 'synced', lastUpdated, onRefresh, loading }) {
  const { language } = useTranslation();
  const isEn = language === 'en';
  const isError = status === 'error';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/90 text-[12px] text-slate-700 shadow-2xs">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isError ? 'bg-rose-400' : 'bg-emerald-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isError ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
        />
      </span>
      <span className="font-semibold text-slate-600">
        {loading
          ? isEn ? 'Syncing…' : 'Đang đồng bộ…'
          : lastUpdated
          ? `${isEn ? 'Synced at' : 'Đồng bộ lúc'} ${lastUpdated}`
          : isEn ? 'Real-time' : 'Thời gian thực'}
      </span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-40 transition-colors"
          title={isEn ? 'Sync now' : 'Đồng bộ ngay'}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      )}
    </div>
  );
}

/** Underlined tabs with smooth animated sliding indicator */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="relative border-b border-slate-200/80 flex gap-6 overflow-x-auto scrollbar-none" role="tablist">
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`relative pb-3.5 pt-1 text-[13px] sm:text-[14px] whitespace-nowrap cursor-pointer transition-colors ${
              active
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {tab.label}
              {tab.count != null && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums transition-colors ${
                    active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {active && (
              <motion.div
                layoutId="admin-active-tab-line"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className = '' }) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || (isEn ? 'Search…' : 'Tìm kiếm…')}
        aria-label={placeholder || (isEn ? 'Search' : 'Tìm kiếm')}
        className={`${ui.input} pl-9.5 pr-8 h-10 text-[13px]`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label={isEn ? 'Clear search' : 'Xóa tìm kiếm'}
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
      className={`${ui.select.replace('w-full ', '')} h-10 w-full sm:w-auto text-[13px] font-medium ${className}`}
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
  const { language } = useTranslation();
  const isEn = language === 'en';

  if (!chips || !chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200/80 text-blue-700 text-[12px] font-semibold shadow-2xs"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="p-0.5 rounded hover:bg-blue-200/60 cursor-pointer text-blue-600 transition-colors"
            aria-label={`${isEn ? 'Remove filter' : 'Bỏ lọc'} ${chip.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-[12px] text-slate-500 hover:text-slate-900 font-semibold cursor-pointer underline underline-offset-2 ml-1 transition-colors"
        >
          {isEn ? 'Clear all' : 'Xóa tất cả'}
        </button>
      )}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">{children}</div>;
}

const BADGE_TONES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 [--dot:#10B981] shadow-[0_1px_4px_rgba(16,185,129,0.15)]',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80 [--dot:#F59E0B] shadow-[0_1px_4px_rgba(245,158,11,0.15)]',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80 [--dot:#F43F5E] shadow-[0_1px_4px_rgba(244,63,94,0.15)]',
  info: 'bg-blue-50 text-blue-700 border-blue-200/80 [--dot:#3B82F6] shadow-[0_1px_4px_rgba(59,130,246,0.15)]',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200 [--dot:#94A3B8]',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/80 [--dot:#A855F7] shadow-[0_1px_4px_rgba(168,85,247,0.15)]',
};

/** Status pill with a coloured dot. Text always states the status; colour only supports it. */
export function Badge({ tone = 'neutral', children, dot = true, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold border whitespace-nowrap ${
        BADGE_TONES[tone] || BADGE_TONES.neutral
      } ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-(--dot) shrink-0 animate-pulse" aria-hidden="true" />}
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
      className={`rounded-full shrink-0 inline-flex items-center justify-center font-bold tracking-tight border shadow-2xs ${
        tone === 'brand'
          ? 'bg-linear-to-br from-blue-50 to-indigo-100 text-blue-700 border-blue-200/80'
          : 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

/** Production KPI Stat Card with Motion hover lift, radiant accent glow, and trend */
export function StatCard({
  title,
  value,
  change,
  trend = 'neutral',
  subtitle,
  icon: Icon,
  iconBg = 'bg-blue-50 text-blue-600 border-blue-100',
  to,
  onClick,
  loading = false,
  alert = false,
}) {
  const content = (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative p-5 bg-white/95 backdrop-blur-md rounded-2xl border transition-all duration-300 ${
        alert
          ? 'border-amber-300 bg-amber-50/20 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)] ring-1 ring-amber-300/40'
          : 'border-slate-200/80 hover:border-blue-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06),0_2px_6px_-2px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_28px_-6px_rgba(37,99,235,0.12)]'
      } ${to || onClick ? 'group cursor-pointer' : ''}`}
    >
      <div className={`absolute top-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        alert ? 'bg-amber-400' : 'bg-linear-to-r from-blue-500 to-indigo-500'
      }`} />

      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-500 tracking-[-0.01em]">{title}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="admin-num text-[30px] font-black text-slate-900 tracking-[-0.03em] leading-tight">
          {loading ? (
            <span className="inline-block w-20 h-8 rounded-lg bg-slate-100 animate-pulse align-middle" />
          ) : (
            value
          )}
        </p>
      </div>

      {(subtitle || change) && (
        <div className="mt-2.5 flex items-center gap-2 text-[12px]">
          {change && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-600'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
          {subtitle && (
            <span className={`truncate font-medium ${alert ? 'text-amber-800 font-semibold' : 'text-slate-500'}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </motion.div>
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
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50/60 via-white to-transparent flex items-center justify-between gap-3">
          {header}
        </div>
      )}
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
        className={`px-4 py-3.5 bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors select-none ${
          ALIGN[align]
        } ${className}`}
      >
        <div className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span>{children}</span>
          <span className="text-slate-400">
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
            )}
          </span>
        </div>
      </th>
    );
  }

  return (
    <th
      scope="col"
      className={`px-4 py-3.5 bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap select-none ${ALIGN[align]} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '', align = 'left' }) {
  return (
    <td className={`px-4 py-3.5 text-[13px] text-slate-700 align-middle ${ALIGN[align]} ${className}`}>
      {children}
    </td>
  );
}

export function SkeletonRows({ columns, rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-slate-100 last:border-0">
      {Array.from({ length: columns }).map((__, j) => (
        <td key={j} className="px-4 py-4">
          <div className="h-4 rounded-md bg-slate-100 animate-pulse" style={{ width: `${45 + ((i + j) % 4) * 15}%` }} />
        </td>
      ))}
    </tr>
  ));
}

export function EmptyState({ title, description, action }) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  return (
    <div className="px-6 py-16 text-center">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-linear-to-br from-slate-50 to-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/80 shadow-xs">
        <Inbox className="w-7 h-7" />
      </span>
      <p className="mt-4 text-[15px] font-bold text-slate-900 tracking-tight">
        {title || (isEn ? 'No records found' : 'Chưa có dữ liệu')}
      </p>
      {description && <p className="mt-1 text-[13px] text-slate-500 max-w-[45ch] mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  return (
    <div className="px-6 py-14 text-center">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80 shadow-xs">
        <AlertTriangle className="w-7 h-7" />
      </span>
      <p className="mt-4 text-[15px] font-bold text-slate-900">
        {isEn ? 'Failed to load data' : 'Không tải được dữ liệu'}
      </p>
      <p className="mt-1 text-[13px] text-slate-500 max-w-[50ch] mx-auto leading-relaxed">
        {message || (isEn ? 'Check your connection to the server and try again.' : 'Kiểm tra kết nối tới máy chủ rồi thử lại.')}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${ui.btnSecondary} mt-4`}>
          <RefreshCw className="w-3.5 h-3.5" /> {isEn ? 'Retry' : 'Thử lại'}
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
  return <tbody className="[&>tr]:border-b [&>tr]:border-slate-100 [&>tr:last-child]:border-0">{children}</tbody>;
}

/** Enhanced Pagination with rows-per-page selector */
export function Pagination({ pagination, onPage, onLimitChange, disabled, unit }) {
  const { language } = useTranslation();
  const isEn = language === 'en';
  const displayUnit = unit || (isEn ? 'records' : 'bản ghi');

  const { page = 1, totalPages = 1, total = 0, limit = 20 } = pagination || {};
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px]">
      <div className="flex items-center gap-3 text-slate-500">
        <span>
          {isEn ? 'Showing' : 'Hiển thị'} <span className="font-bold text-slate-900">{from}–{to}</span> {isEn ? 'of' : 'trong'} <span className="font-bold text-slate-900">{total}</span> {displayUnit}
        </span>
        {onLimitChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span>{isEn ? 'Per page:' : 'Mỗi trang:'}</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              disabled={disabled}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-900 text-[12px] font-semibold cursor-pointer shadow-2xs hover:border-slate-300"
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
          {isEn ? 'Previous' : 'Trước'}
        </button>
        <span className="text-[13px] text-slate-600 px-2 font-semibold">
          {isEn ? 'Page' : 'Trang'} {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={disabled || page >= totalPages}
          className={`${ui.btnSecondary} px-3 py-1.5 text-[12px]`}
        >
          {isEn ? 'Next' : 'Sau'}
        </button>
      </div>
    </div>
  );
}

/** Floating Bulk Action Bar appearing when rows are selected */
export function BulkActionBar({ selectedCount = 0, onClear, actions = [] }) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  if (selectedCount <= 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.4)] flex items-center gap-4 border border-slate-800 max-w-[95vw]"
    >
      <div className="flex items-center gap-2.5 pr-3 border-r border-slate-800">
        <span className="w-6 h-6 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
          {selectedCount}
        </span>
        <span className="text-[13px] font-semibold whitespace-nowrap">
          {isEn ? `Selected ${selectedCount}` : `Đã chọn ${selectedCount}`}
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {actions.map((act) => (
          <button
            key={act.label}
            type="button"
            onClick={act.onClick}
            disabled={act.disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              act.danger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                : act.variant === 'primary'
                ? 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xs'
                : 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
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
          {isEn ? 'Deselect' : 'Bỏ chọn'}
        </button>
      )}
    </motion.div>
  );
}

/** Kebab menu for row actions with icons. */
export function RowMenu({ items, label }) {
  const { language } = useTranslation();
  const isEn = language === 'en';
  const displayLabel = label || (isEn ? 'Actions' : 'Thao tác');

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
        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        aria-label={displayLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 min-w-52.5 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md py-1.5 shadow-[0_16px_36px_-6px_rgba(15,23,42,0.15)] ring-1 ring-black/5"
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
              className={`w-full text-left px-3.5 py-2 text-[13px] font-semibold flex items-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                item.danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
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

/** Centered dialog with smooth Motion spring entrance. */
export function Modal({ title, description, onClose, busy, children, footer, width = 'max-w-md' }) {
  const { language } = useTranslation();
  const isEn = language === 'en';

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
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={`bg-white rounded-3xl w-full ${width} border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] overflow-hidden ring-1 ring-black/5`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-2">
          <div>
            <h3 className="text-[19px] font-black text-slate-900 tracking-tight">{title}</h3>
            {description && <p className="mt-1 text-[13px] text-slate-500 leading-relaxed font-normal">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={isEn ? 'Close' : 'Đóng'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4.5 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2.5">{footer}</div>}
      </motion.div>
    </div>
  );
}

/** Confirmation for important actions with optional reason and password verification */
export function ConfirmDialog({ title, description, confirmLabel, danger, reason, password, onConfirm, onClose }) {
  const { language } = useTranslation();
  const isEn = language === 'en';

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
            {isEn ? 'Cancel' : 'Hủy'}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !reasonOk || !passwordOk}
            className={danger ? ui.btnDanger : ui.btnPrimary}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel || (isEn ? 'Confirm' : 'Xác nhận')}
          </button>
        </>
      }
    >
      {(reason || password) && (
        <div className="space-y-4">
          {reason && (
            <label className="block">
              <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                {reason.label || (isEn ? 'Reason' : 'Lý do')}{!reason.required && (isEn ? ' (optional)' : ' (không bắt buộc)')}
              </span>
              <textarea
                rows={3}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder={reason.placeholder}
                className={ui.input}
                autoFocus
              />
              <span className="block text-[12px] text-slate-500 mt-1.5 font-normal">
                {reason.required && !reasonOk
                  ? isEn
                    ? `Must be at least ${reason.minLength || 5} characters. `
                    : `Cần ít nhất ${reason.minLength || 5} ký tự. `
                  : ''}
                {reason.hint || (isEn ? 'Reason is recorded in the audit log.' : 'Lý do được ghi nhận vào nhật ký kiểm toán.')}
              </span>
            </label>
          )}
          {password && (
            <label className="block">
              <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                {isEn ? 'Your confirmation password' : 'Mật khẩu xác nhận của bạn'}
              </span>
              <input
                type="password"
                value={passwordText}
                onChange={(e) => setPasswordText(e.target.value)}
                autoComplete="current-password"
                className={ui.input}
              />
              <span className="block text-[12px] text-slate-500 mt-1.5 font-normal">
                {password.hint || (isEn ? 'Sensitive operations require confirming your password.' : 'Thao tác nhạy cảm cần xác nhận lại mật khẩu để bảo vệ hệ thống.')}
              </span>
            </label>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Right-side Drawer panel with smooth Spring slide-in */
export function Drawer({ title, subtitle, badge, tabs, activeTab, onTabChange, onClose, children, footer, width = 'sm:w-[580px]' }) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className={`absolute inset-y-0 right-0 w-full ${width} bg-white border-l border-slate-200 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50/60 via-white to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-[19px] font-black text-slate-900 tracking-tight truncate">{title}</h3>
                {badge}
              </div>
              {subtitle && <p className="text-[13px] text-slate-500 mt-0.5 truncate font-normal">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label={isEn ? 'Close' : 'Đóng'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {tabs && tabs.length > 0 && (
            <div className="flex gap-4 mt-4 -mb-1 overflow-x-auto scrollbar-none border-b border-slate-200/60" role="tablist">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onTabChange && onTabChange(tab.key)}
                    className={`relative pb-2.5 text-[13px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                      active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count != null && (
                      <span className="ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
                        {tab.count}
                      </span>
                    )}
                    {active && (
                      <motion.div
                        layoutId="drawer-tab-line"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[13px]">{children}</div>

        {footer && <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/60 flex flex-wrap justify-end gap-2.5">{footer}</div>}
      </motion.aside>
    </div>
  );
}

export function DetailList({ rows }) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  return (
    <dl className="rounded-2xl border border-slate-200/80 divide-y divide-slate-100 bg-white overflow-hidden shadow-2xs">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 px-4 py-3.5 hover:bg-slate-50/50 transition-colors">
          <dt className="text-[13px] font-semibold text-slate-500 shrink-0">{label}</dt>
          <dd className="text-[13px] text-slate-900 font-semibold text-right wrap-break-word min-w-0">
            {value ?? <span className="text-slate-400 font-normal">{isEn ? 'Not set' : 'Chưa có'}</span>}
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
        <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}
