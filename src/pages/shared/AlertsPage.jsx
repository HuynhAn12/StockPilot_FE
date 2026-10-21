import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ShieldAlert, ShieldCheck, XCircle,
  RefreshCw, Bot, Search, Filter, X, Check, Eye, Clock,
  Package, TrendingDown, Zap, Archive, BarChart3,
  Bell, BellOff, Activity, AlertCircle, Boxes, Loader2,
} from 'lucide-react';
import { useAlertsStore } from '../../components/store/alertsStore';
import { useToast } from '../../components/common/Toast';
import { useTranslation } from '../../i18n/useTranslation';

/* ═══ HELPERS ════════════════════════════════════════════════════ */
const TYPE_META = {
  STOCKOUT:       { labelVi: 'Hết hàng',         labelEn: 'Out of Stock',   icon: XCircle,      bg:'#fef2f2', border:'#fecaca', text:'#dc2626' },
  LOW_STOCK:      { labelVi: 'Tồn thấp',         labelEn: 'Low Stock',      icon: TrendingDown, bg:'#fff7ed', border:'#fed7aa', text:'#ea580c' },
  OVERSTOCK:      { labelVi: 'Thừa hàng',        labelEn: 'Overstock',      icon: Boxes,        bg:'#eff6ff', border:'#bfdbfe', text:'#2563eb' },
  SLOW_MOVING:    { labelVi: 'Bán chậm',         labelEn: 'Slow-Moving',    icon: Archive,      bg:'#faf5ff', border:'#e9d5ff', text:'#7c3aed' },
  DEAD_STOCK:     { labelVi: 'Hàng ứ đọng',      labelEn: 'Dead Stock',     icon: Package,      bg:'#f9fafb', border:'#e5e7eb', text:'#4b5563' },
  UNUSUAL_DEMAND: { labelVi: 'Nhu cầu đột biến', labelEn: 'Unusual Demand', icon: Zap,          bg:'#fffbeb', border:'#fde68a', text:'#d97706' },
};

const SEV = {
  CRITICAL: { dot:'#ef4444', labelVi:'Nghiêm trọng', labelEn:'Critical', cardBg:'#fef2f2', cardText:'#dc2626', cardBorder:'#fecaca', accentBar:'#ef4444', modalBg:'#fef2f2' },
  WARNING:  { dot:'#f59e0b', labelVi:'Cảnh báo',     labelEn:'Warning',  cardBg:'#fffbeb', cardText:'#d97706', cardBorder:'#fde68a', accentBar:'#f59e0b', modalBg:'#fffbeb' },
  INFO:     { dot:'#3b82f6', labelVi:'Thông tin',    labelEn:'Info',     cardBg:'#eff6ff', cardText:'#2563eb', cardBorder:'#bfdbfe', accentBar:'#3b82f6', modalBg:'#eff6ff' },
};

const REASON_KEY_LABELS = {
  type: { vi: 'Loại biến động', en: 'Fluctuation Type' },
  zScore: { vi: 'Điểm Z-Score', en: 'Z-Score Metric' },
  isAnomaly: { vi: 'Bất thường', en: 'Anomaly Flag' },
  spikeType: { vi: 'Dạng đột biến', en: 'Spike Type' },
  availableStock: { vi: 'Tồn khả dụng', en: 'Available Stock' },
  reorderPoint: { vi: 'Điểm đặt hàng', en: 'Reorder Point' },
  stockoutScore: { vi: 'Điểm hết hàng', en: 'Stockout Score' },
  daysSinceLastSale: { vi: 'Số ngày chưa bán', en: 'Days Since Last Sale' },
  overstockScore: { vi: 'Điểm thừa hàng', en: 'Overstock Score' },
  deadStockSeverity: { vi: 'Mức độ ứ đọng', en: 'Dead Stock Severity' },
  isSlowMoving: { vi: 'Bán chậm', en: 'Slow-Moving Flag' },
  salesCount: { vi: 'Lượt bán', en: 'Sales Count' },
  revenue: { vi: 'Doanh thu', en: 'Revenue' },
};

const REASON_VAL_LABELS = {
  HIGH_SPIKE: { vi: 'Tăng đột biến', en: 'High Spike' },
  LOW_SPIKE: { vi: 'Giảm đột ngột', en: 'Sharp Decline' },
  CRITICAL_SPIKE: { vi: 'Đột biến nghiêm trọng', en: 'Critical Spike' },
  NEW_DEMAND_SPIKE: { vi: 'Bán mới trở lại', en: 'Renewed Demand' },
  NEW_SALE_AFTER_INACTIVITY: { vi: 'Bán mới sau thời gian ngừng', en: 'Sale After Inactivity' },
  CRITICAL: { vi: 'Nghiêm trọng', en: 'Critical' },
  WARNING: { vi: 'Cảnh báo', en: 'Warning' },
  INFO: { vi: 'Thông tin', en: 'Info' },
};

function cleanAlertText(str, isEn) {
  if (!str) return '';
  let res = String(str)
    .replace(/\bSKU\s+SP/gi, 'SP')
    .replace(/\bSKU\s+/gi, 'SP ')
    .replace(/\(Z-Score:\s*([^)]+)\)/gi, isEn ? '(Z-Score std dev: $1)' : '(Độ lệch chuẩn Z: $1)');
  if (isEn) {
    res = res
      .replace(/^Cảnh báo thừa hàng:\s*/i, 'Overstock Alert: ')
      .replace(/^Cảnh báo tồn kho thấp:\s*/i, 'Low Stock Alert: ')
      .replace(/^Cảnh báo hết hàng:\s*/i, 'Stockout Alert: ')
      .replace(/^Cảnh báo bán chậm:\s*/i, 'Slow-Moving Alert: ')
      .replace(/^Cảnh báo hàng ứ đọng:\s*/i, 'Dead Stock Alert: ')
      .replace(/^Cảnh báo biến động nhu cầu:\s*/i, 'Unusual Demand Alert: ')
      .replace(/Sản phẩm (\S+) có mức tồn kho vượt ngưỡng an toàn so với tốc độ tiêu thụ hiện tại\./i, 'Product $1 stock level exceeds safe threshold relative to current sales velocity.')
      .replace(/Sản phẩm (\S+) chỉ còn (\d+) đơn vị khả dụng, dưới điểm đặt hàng (\d+)\./i, 'Product $1 has only $2 available units left, below the reorder point of $3.')
      .replace(/Sản phẩm (\S+) đã hết hàng hoàn toàn trong kho\./i, 'Product $1 is completely out of stock in warehouse.');
  }
  return res;
}

function formatMetricKey(k, isEn) {
  const item = REASON_KEY_LABELS[k];
  if (item) return isEn ? item.en : item.vi;
  return k.replace(/([A-Z])/g, ' $1').trim();
}

function formatMetricVal(v, isEn) {
  if (typeof v === 'boolean') return v ? (isEn ? '✓ Yes' : '✓ Có') : (isEn ? '✗ No' : '✗ Không');
  if (typeof v === 'string' && REASON_VAL_LABELS[v]) return isEn ? REASON_VAL_LABELS[v].en : REASON_VAL_LABELS[v].vi;
  if (typeof v === 'number') return Number(v.toFixed(2));
  return String(v);
}

function getMeta(type, isEn) {
  const m = TYPE_META[type];
  if (!m) return { label: type, icon: AlertCircle, bg:'#f9fafb', border:'#e5e7eb', text:'#4b5563' };
  return { ...m, label: isEn ? m.labelEn : m.labelVi };
}

function getSev(sev, isEn) {
  const s = SEV[(sev||'').toUpperCase()] || SEV.INFO;
  return { ...s, label: isEn ? s.labelEn : s.labelVi };
}

function riskColor(s) {
  s = Number(s || 0);
  return s >= 80 ? '#ef4444' : s >= 60 ? '#f59e0b' : s >= 40 ? '#3b82f6' : '#22c55e';
}

function fmtDate(iso, isEn) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(isEn ? 'en-US' : 'vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

/* ═══ RISK RING ══════════════════════════════════════════════════ */
function RiskRing({ score, size = 56 }) {
  const s = Number(score || 0);
  const fill = (s / 100) * 87.96;
  const color = riskColor(s);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 36 36" style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={fill + ' ' + (87.96 - fill)}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 60 ? 17 : 11, fontWeight: 900, color, lineHeight: 1 }}>{Math.round(s)}</span>
        {size > 60 && <span style={{ fontSize: 9, color: '#94a3b8' }}>/100</span>}
      </div>
    </div>
  );
}

/* ═══ KPI CARD ════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, label, value, sub, bg, text, border, pulse }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid ' + border,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'box-shadow .2s',
      }}
      className="hover:shadow-md"
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 24, height: 24, color: text }} />
        </div>
        {pulse && (
          <>
            <span style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: text, opacity: 0.6 }} className="animate-ping" />
            <span style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: text }} />
          </>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: '#64748b', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 900, color: text, margin: 0, lineHeight: 1 }}>{value}</p>
      </div>
      {sub && <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 8, background: bg, color: text, flexShrink: 0 }}>{sub}</span>}
    </div>
  );
}

/* ═══ ALERT CARD ═════════════════════════════════════════════════ */
function AlertCard({ alert, onAcknowledge, onResolve, onView, isEn }) {
  const meta = getMeta(alert.type, isEn);
  const sevCfg = getSev(alert.severity, isEn);
  const Icon = meta.icon;
  const rs = Number(alert.riskScore || 0);
  const conf = Number(alert.confidence || 0);
  const status = (alert.status || '').toUpperCase();

  const displayTitle = cleanAlertText(alert.title, isEn) || (meta.label + ' — ' + (alert.stockItem?.name || (isEn ? 'SKU: ' : 'Mã SP: ') + alert.stockItem?.sku));
  const displayMsg = cleanAlertText(alert.message, isEn);

  return (
    <div
      onClick={() => onView(alert)}
      style={{
        borderRadius: 16,
        border: '1px solid ' + sevCfg.cardBorder,
        background: '#ffffff',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all .2s',
      }}
      className="hover:shadow-lg hover:-translate-y-0.5 group"
    >
      {/* accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: sevCfg.accentBar, borderRadius: '16px 0 0 16px' }} />
      <div style={{ paddingLeft: 20, paddingRight: 16, paddingTop: 14, paddingBottom: 14 }} className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* left */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <Icon style={{ width: 20, height: 20, color: meta.text }} />
          </div>
          <div className="flex-1 min-w-0">
            {/* badges */}
            <div className="flex flex-wrap items-center gap-1.5" style={{ marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sevCfg.cardBg, color: sevCfg.cardText }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sevCfg.dot, display: 'inline-block' }} />
                {sevCfg.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: meta.bg, border: '1px solid ' + meta.border, color: meta.text }}>
                {meta.label}
              </span>
              {status === 'ACKNOWLEDGED' && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
                  {isEn ? 'Acknowledged' : 'Đang theo dõi'}
                </span>
              )}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: riskColor(rs) }}>
                {isEn ? 'Risk ' : 'Rủi ro '}{Math.round(rs)}/100
              </span>
            </div>
            {/* title */}
            <h4 className="text-sm font-bold line-clamp-1 group-hover:text-blue-600 transition-colors" style={{ color: '#0f172a', marginBottom: 2 }}>
              {displayTitle}
            </h4>
            {/* message */}
            <p className="line-clamp-2" style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{displayMsg}</p>
            {/* meta row */}
            <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
              {alert.stockItem?.sku && (
                <span style={{ fontFamily: 'monospace', background: '#f1f5f9', color: '#334155', padding: '1px 6px', borderRadius: 6 }}>
                  {isEn ? 'SKU: ' : 'Mã SP: '}{alert.stockItem.sku}
                </span>
              )}
              <span className="flex items-center gap-1"><Clock style={{ width: 12, height: 12 }} />{fmtDate(alert.openedAt, isEn)}</span>
              {conf > 0 && <span className="flex items-center gap-1"><Activity style={{ width: 12, height: 12 }} />{isEn ? 'Confidence: ' : 'Tin cậy: '}{Math.round(conf)}%</span>}
            </div>
          </div>
        </div>
        {/* risk ring */}
        <div className="hidden lg:flex flex-col items-center gap-1 shrink-0" style={{ width: 72 }}>
          <RiskRing score={rs} size={56} />
          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{isEn ? 'Risk Score' : 'Điểm rủi ro'}</span>
        </div>
        {/* actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onView(alert); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors hover:opacity-80"
            style={{ background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}
          >
            <Eye style={{ width: 13, height: 13 }} /> {isEn ? 'Details' : 'Chi tiết'}
          </button>
          {status === 'OPEN' && (
            <button
              onClick={e => { e.stopPropagation(); onAcknowledge(alert.id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors hover:bg-slate-100"
              style={{ background: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a' }}
            >
              <Bell style={{ width: 13, height: 13 }} /> {isEn ? 'Acknowledge' : 'Tiếp nhận'}
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onResolve(alert.id); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors hover:opacity-90"
            style={{ background: '#16a34a', color: '#fff' }}
          >
            <Check style={{ width: 13, height: 13 }} /> {isEn ? 'Resolved' : 'Đã xử lý'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ DETAIL MODAL ═══════════════════════════════════════════════ */
function AlertDetailModal({ alert, onClose, onAcknowledge, onResolve, onAskAI, isEn }) {
  if (!alert) return null;
  const meta = getMeta(alert.type, isEn);
  const sevCfg = getSev(alert.severity, isEn);
  const Icon = meta.icon;
  const rs = Number(alert.riskScore || 0);
  const conf = Number(alert.confidence || 0);
  const status = (alert.status || '').toUpperCase();

  const displayTitle = cleanAlertText(alert.title, isEn) || (meta.label + ' — ' + (alert.stockItem?.name || (isEn ? 'SKU: ' : 'Mã SP: ') + alert.stockItem?.sku));
  const displayMsg = cleanAlertText(alert.message, isEn);

  let reason = {};
  try { reason = typeof alert.reasonJson === 'string' ? JSON.parse(alert.reasonJson) : (alert.reasonJson || {}); } catch (_) {}
  const entries = Object.entries(reason).filter(([, v]) => v != null);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 640, borderRadius: 20, boxShadow: '0 25px 60px -10px rgba(0,0,0,0.35)', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', background: '#ffffff', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', opacity: 1 }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #e2e8f0', background: sevCfg.cardBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 24, height: 24, color: meta.text }} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sevCfg.cardBg, color: sevCfg.cardText, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: sevCfg.dot, display: 'inline-block' }} />{sevCfg.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: meta.bg, border: '1px solid ' + meta.border, color: meta.text }}>{meta.label}</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                {displayTitle}
              </h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0' }}>
                {isEn ? 'Decision Engine · Confidence: ' : 'Hệ thống phân tích · Tin cậy: '}{Math.round(conf)}%
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }} className="hover:bg-slate-100">
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, backgroundColor: '#ffffff', background: '#ffffff' }} className="space-y-5">
          {/* product info */}
          <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, background: '#f8fafc' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: isEn ? 'Product Name' : 'Tên sản phẩm', val: alert.stockItem?.name || '—' },
                { label: isEn ? 'SKU' : 'Mã SP', val: alert.stockItem?.sku || '—', mono: true },
                { label: isEn ? 'Cost Price' : 'Giá nhập', val: alert.stockItem?.costPrice != null ? Number(alert.stockItem.costPrice).toLocaleString('vi-VN') + ' đ' : '—' },
                { label: isEn ? 'Selling Price' : 'Giá bán', val: alert.stockItem?.sellingPrice != null ? Number(alert.stockItem.sellingPrice).toLocaleString('vi-VN') + ' đ' : '—' },
              ].map(item => (
                <div key={item.label}>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 2 }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', fontFamily: item.mono ? 'monospace' : undefined }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* risk gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <RiskRing score={rs} size={80} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{isEn ? 'Risk Severity Level' : 'Mức độ rủi ro'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: riskColor(rs), marginLeft: 'auto' }}>
                  {isEn
                    ? (rs >= 80 ? 'Very High' : rs >= 60 ? 'High' : rs >= 40 ? 'Medium' : 'Low')
                    : (rs >= 80 ? 'Rất cao' : rs >= 60 ? 'Cao' : rs >= 40 ? 'Trung bình' : 'Thấp')}
                </span>
              </div>
              <div style={{ height: 10, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 8, width: rs + '%', background: 'linear-gradient(90deg,' + riskColor(rs) + '88,' + riskColor(rs) + ')', transition: 'width .7s' }} />
              </div>
              <p style={{ fontSize: 12, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>{displayMsg}</p>
            </div>
          </div>

          {/* reason data */}
          {entries.length > 0 && (
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <BarChart3 style={{ width: 14, height: 14 }} /> {isEn ? 'Analytical Metrics' : 'Chỉ số phân tích'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {entries.map(([k, v]) => (
                  <div key={k} style={{ borderRadius: 10, border: '1px solid #e2e8f0', padding: '10px 12px', background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                      {formatMetricKey(k, isEn)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{formatMetricVal(v, isEn)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* timeline */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Clock style={{ width: 14, height: 14 }} /> {isEn ? 'Activity Timeline' : 'Lịch sử thời gian'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { color: '#ef4444', label: isEn ? 'Detected at:' : 'Phát hiện lúc:', val: alert.openedAt },
                { color: '#f59e0b', label: isEn ? 'Acknowledged at:' : 'Tiếp nhận lúc:', val: alert.acknowledgedAt },
                { color: '#22c55e', label: isEn ? 'Resolved at:' : 'Xử lý lúc:', val: alert.resolvedAt },
              ].filter(r => r.val).map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                  <span style={{ color: '#64748b', width: 120, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtDate(row.val, isEn)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button
            onClick={() => onAskAI(alert)}
            className="flex items-center gap-2 transition-colors hover:bg-violet-100"
            style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 12, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Bot style={{ width: 16, height: 16 }} /> {isEn ? 'Ask AI Pilot about this alert' : 'Hỏi AI Pilot về cảnh báo này'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {status === 'OPEN' && (
              <button
                onClick={() => { onAcknowledge(alert.id); onClose(); }}
                className="flex items-center gap-1.5 transition-colors hover:bg-slate-100"
                style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 12, background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Bell style={{ width: 13, height: 13 }} /> {isEn ? 'Acknowledge' : 'Tiếp nhận'}
              </button>
            )}
            <button
              onClick={() => { onResolve(alert.id); onClose(); }}
              className="flex items-center gap-1.5 transition-colors hover:opacity-90"
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 12, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Check style={{ width: 13, height: 13 }} /> {isEn ? 'Confirm Resolved' : 'Xác nhận đã xử lý'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN PAGE ══════════════════════════════════════════════════ */
export function AlertsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const { alerts, isLoading, isRecalculating, acknowledgeAlert, resolveAlert, fetchAlerts, recalculate } = useAlertsStore();

  const [activeTab, setActiveTab] = useState('ALL');
  const [selType, setSelType] = useState('ALL');
  const [selSev, setSelSev] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modalAlert, setModalAlert] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const critCount = useMemo(() => alerts.filter(a => ['OPEN', 'open'].includes(a.status) && a.severity === 'CRITICAL').length, [alerts]);
  const warnCount = useMemo(() => alerts.filter(a => ['OPEN', 'open'].includes(a.status) && a.severity === 'WARNING').length, [alerts]);
  const openCount = useMemo(() => alerts.filter(a => ['OPEN', 'open'].includes(a.status)).length, [alerts]);
  const ackCount = useMemo(() => alerts.filter(a => a.status === 'ACKNOWLEDGED').length, [alerts]);

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      const st = (a.status || '').toUpperCase();
      if (activeTab === 'OPEN' && st !== 'OPEN') return false;
      if (activeTab === 'ACKNOWLEDGED' && st !== 'ACKNOWLEDGED') return false;
      if (selType !== 'ALL' && a.type !== selType) return false;
      if (selSev !== 'ALL' && (a.severity || '').toUpperCase() !== selSev) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (a.title || '').toLowerCase().includes(q) ||
          (a.message || '').toLowerCase().includes(q) ||
          (a.stockItem?.sku || '').toLowerCase().includes(q) ||
          (a.stockItem?.name || '').toLowerCase().includes(q) ||
          (a.type || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, activeTab, selType, selSev, search]);

  const handleAck = useCallback(async id => {
    await acknowledgeAlert(id);
    toast({
      title: isEn ? 'Alert Acknowledged' : 'Đã tiếp nhận cảnh báo',
      description: isEn ? 'Alert moved to Acknowledged tracking state.' : 'Cảnh báo chuyển sang Đang theo dõi.',
      type: 'info'
    });
  }, [acknowledgeAlert, toast, isEn]);

  const handleResolve = useCallback(async id => {
    await resolveAlert(id);
    toast({
      title: isEn ? '✓ Alert Resolved' : '✓ Đã xử lý xong',
      description: isEn ? 'Alert has been closed and saved to history.' : 'Cảnh báo đã đóng và lưu lịch sử.',
      type: 'success'
    });
  }, [resolveAlert, toast, isEn]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await recalculate();
    setRefreshing(false);
    toast({
      title: isEn ? 'Alerts Synchronized' : 'Đã đồng bộ cảnh báo',
      description: isEn ? 'Engine has re-analyzed entire inventory catalog.' : 'Hệ thống đã phân tích lại toàn bộ kho hàng.',
      type: 'success'
    });
  }, [recalculate, toast, isEn]);

  const handleAskAI = useCallback(a => {
    navigate('/ai-assistant', {
      state: {
        presetQuery: isEn
          ? `Analyze risk alert: "${a.title}" — ${a.message}. What actions do you recommend?`
          : `Phân tích cảnh báo: "${a.title}" — ${a.message} Tôi nên làm gì?`
      }
    });
  }, [navigate, isEn]);

  const clearFilters = () => { setSelType('ALL'); setSelSev('ALL'); setSearch(''); };

  const TYPE_TABS = [
    { key: 'ALL', label: isEn ? 'All' : 'Tất cả' },
    { key: 'STOCKOUT', label: isEn ? 'Out of Stock' : 'Hết hàng' },
    { key: 'LOW_STOCK', label: isEn ? 'Low Stock' : 'Tồn thấp' },
    { key: 'OVERSTOCK', label: isEn ? 'Overstock' : 'Thừa hàng' },
    { key: 'SLOW_MOVING', label: isEn ? 'Slow-Moving' : 'Bán chậm' },
    { key: 'DEAD_STOCK', label: isEn ? 'Dead Stock' : 'Ứ đọng' },
    { key: 'UNUSUAL_DEMAND', label: isEn ? 'Unusual' : 'Đột biến' },
  ];

  const SEV_TABS = [
    { key: 'ALL', label: isEn ? 'All Levels' : 'Mọi mức' },
    { key: 'CRITICAL', label: isEn ? '🔴 Critical' : '🔴 Nghiêm trọng' },
    { key: 'WARNING', label: isEn ? '🟡 Warning' : '🟡 Cảnh báo' },
    { key: 'INFO', label: isEn ? '🔵 Info' : '🔵 Thông tin' },
  ];

  const Pill = ({ label, active, onClick, meta }) => (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 20,
        cursor: 'pointer',
        transition: 'all .15s',
        background: active && meta ? meta.bg : active ? '#f1f5f9' : '#ffffff',
        border: active && meta ? '1px solid ' + meta.border : active ? '1px solid #94a3b8' : '1px solid #e2e8f0',
        color: active && meta ? meta.text : active ? '#0f172a' : '#64748b',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <style>{`
        .alerts-hero-header {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
          border: 1px solid #7dd3fc;
          border-radius: 18px;
          padding: 18px 24px;
          color: #082f49;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 22px -5px rgba(14, 165, 233, 0.22), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
        }
        .alerts-hero-header::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .alerts-hero-header::after {
          content: '';
          position: absolute;
          bottom: -50px;
          left: 30%;
          width: 240px;
          height: 120px;
          background: radial-gradient(ellipse, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .alerts-hero-left {
          position: relative;
          z-index: 1;
        }
        .alerts-hero-title {
          font-size: 22px;
          font-weight: 900;
          margin: 0 0 4px 0;
          letter-spacing: -0.4px;
          color: #082f49;
        }
        .alerts-hero-desc {
          font-size: 13px;
          color: #0c4a6e;
          font-weight: 500;
          margin: 0;
          line-height: 1.45;
          max-width: none;
          white-space: nowrap;
        }
        @media (max-width: 768px) {
          .alerts-hero-desc {
            white-space: normal;
          }
        }
        .alerts-btn-refresh {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          color: #0284c7;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(8px);
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .alerts-btn-refresh:hover:not(:disabled) {
          background: #ffffff;
          border-color: #38bdf8;
          color: #0369a1;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
        }
        .alerts-btn-refresh:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      {/* HEADER */}
      <div className="alerts-hero-header">
        <div className="alerts-hero-left">
          <h1 className="alerts-hero-title">{isEn ? 'Risk Alerts' : 'Cảnh báo rủi ro'}</h1>
          <p className="alerts-hero-desc">
            {isEn
              ? 'Early detection of stockout, overstock, tied capital and abnormal demand fluctuations via intelligent analysis.'
              : 'Phát hiện sớm nguy cơ hết hàng, thừa hàng, ứ đọng và biến động bất thường từ hệ thống phân tích thông minh.'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || isLoading || isRecalculating}
          className="alerts-btn-refresh"
        >
          {refreshing || isLoading || isRecalculating ? (
            <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
          ) : (
            <RefreshCw style={{ width: 15, height: 15 }} />
          )}
          <span>{isRecalculating ? (isEn ? 'Analyzing...' : 'Đang phân tích...') : (isEn ? 'Sync Data' : 'Đồng bộ dữ liệu')}</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={ShieldAlert}
          label={isEn ? 'Critical' : 'Nghiêm trọng'}
          value={critCount}
          sub={isEn ? 'Action needed' : 'Xử lý ngay'}
          bg="#fef2f2"
          text="#dc2626"
          border="#fecaca"
          pulse={critCount > 0}
        />
        <KpiCard
          icon={AlertTriangle}
          label={isEn ? 'Warning' : 'Cảnh báo'}
          value={warnCount}
          sub={isEn ? 'Monitor' : 'Theo dõi'}
          bg="#fffbeb"
          text="#d97706"
          border="#fde68a"
        />
        <KpiCard
          icon={Bell}
          label={isEn ? 'Open' : 'Đang mở'}
          value={openCount}
          sub={isEn ? 'Pending' : 'Chưa xử lý'}
          bg="#fff7ed"
          text="#ea580c"
          border="#fed7aa"
        />
        <KpiCard
          icon={BellOff}
          label={isEn ? 'Acknowledged' : 'Đang theo dõi'}
          value={ackCount}
          sub={isEn ? 'Tracking' : 'Đã tiếp nhận'}
          bg="#eff6ff"
          text="#2563eb"
          border="#bfdbfe"
        />
      </div>

      {/* TABS + SEARCH */}
      <div className="flex flex-row items-center justify-between gap-3 border-b border-border pb-4 overflow-x-auto">
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {[
            { key: 'ALL', label: isEn ? 'All' : 'Tất cả', count: alerts.length },
            { key: 'OPEN', label: isEn ? 'Pending' : 'Chưa xử lý', count: openCount },
            { key: 'ACKNOWLEDGED', label: isEn ? 'Acknowledged' : 'Đang theo dõi', count: ackCount },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all .15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: activeTab === tab.key ? '#2563eb' : '#ffffff',
                color: activeTab === tab.key ? '#fff' : '#64748b',
                border: activeTab === tab.key ? 'none' : '1px solid #e2e8f0',
                boxShadow: activeTab === tab.key ? '0 1px 4px rgba(37,99,235,.25)' : 'none',
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: activeTab === tab.key ? 'rgba(255,255,255,.2)' : '#f1f5f9',
                  color: activeTab === tab.key ? '#fff' : '#0f172a',
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }} className="w-64 sm:w-72 shrink-0">
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#64748b' }} />
          <input
            type="text"
            placeholder={isEn ? "Search product, SKU, risk type..." : "Tìm kiếm tên SP, mã SP, loại rủi ro..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, paddingRight: 32, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-2">
        <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Filter style={{ width: 13, height: 13 }} /> {isEn ? 'Type:' : 'Loại:'}
        </span>
        {TYPE_TABS.map(f => (
          <Pill key={f.key} label={f.label} active={selType === f.key} onClick={() => setSelType(f.key)} meta={f.key !== 'ALL' ? getMeta(f.key, isEn) : null} />
        ))}
        <span style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 4px' }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>{isEn ? 'Severity:' : 'Mức độ:'}</span>
        {SEV_TABS.map(f => (
          <Pill key={f.key} label={f.label} active={selSev === f.key} onClick={() => setSelSev(f.key)} meta={null} />
        ))}
      </div>

      {/* COUNT INFO */}
      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
        {isEn ? 'Showing ' : 'Đang hiển thị '}
        <strong style={{ color: '#0f172a' }}>{filtered.length}</strong>
        {isEn ? ' alerts' : ' cảnh báo'}
        {filtered.length !== alerts.length && (
          <>
            {' '}
            &middot;{' '}
            <button onClick={clearFilters} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
              {isEn ? 'Clear filters' : 'Xóa bộ lọc'}
            </button>
          </>
        )}
      </p>

      {/* ALERT LIST */}
      {(isLoading || isRecalculating) && alerts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
          <Loader2 style={{ width: 40, height: 40, color: '#3b82f6' }} className="animate-spin" />
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {isRecalculating ? (isEn ? 'Analyzing warehouse stock...' : 'Đang phân tích tồn kho...') : (isEn ? 'Loading alerts from engine...' : 'Đang tải cảnh báo từ hệ thống...')}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ borderRadius: 20, border: '1px solid #e2e8f0', background: '#ffffff', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldCheck style={{ width: 32, height: 32, color: '#16a34a' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            {alerts.length === 0 ? (isEn ? 'No alert data found' : 'Chưa có dữ liệu cảnh báo') : (isEn ? 'Warehouse Healthy' : 'Kho hàng an toàn')}
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.6 }}>
            {alerts.length === 0
              ? (isEn
                  ? 'System has no alert data yet. Click "Run Analysis" to scan entire stock and generate automated alerts.'
                  : 'Hệ thống chưa có dữ liệu cảnh báo. Nhấn "Chạy phân tích" để quét toàn bộ tồn kho và tạo cảnh báo tự động.')
              : (isEn
                  ? 'No alerts match the selected filters. All products are operating stably.'
                  : 'Không có cảnh báo phù hợp với bộ lọc hiện tại. Tất cả sản phẩm đang hoạt động ổn định.')}
          </p>
          {alerts.length === 0 ? (
            <button
              onClick={handleRefresh}
              disabled={isRecalculating}
              style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 12, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isRecalculating ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <RefreshCw style={{ width: 14, height: 14 }} />}
              {isRecalculating ? (isEn ? 'Analyzing...' : 'Đang phân tích...') : (isEn ? 'Run Analysis Now' : 'Chạy phân tích ngay')}
            </button>
          ) : (
            (selType !== 'ALL' || selSev !== 'ALL' || search) && (
              <button
                onClick={clearFilters}
                style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: 12, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                {isEn ? 'Clear filters' : 'Xóa bộ lọc'}
              </button>
            )
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <AlertCard
              key={a.id}
              alert={a}
              onAcknowledge={handleAck}
              onResolve={handleResolve}
              onView={setModalAlert}
              isEn={isEn}
            />
          ))}
        </div>
      )}

      {/* MODAL */}
      {modalAlert && (
        <AlertDetailModal
          alert={modalAlert}
          onClose={() => setModalAlert(null)}
          onAcknowledge={handleAck}
          onResolve={handleResolve}
          onAskAI={handleAskAI}
          isEn={isEn}
        />
      )}
    </div>
  );
}
