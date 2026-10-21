import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, RefreshCw,
  Search, ClipboardList, Package, DollarSign, AlertTriangle, ShieldOff,
  TrendingUp, X, Check, ArrowRight, Activity, BarChart3
} from 'lucide-react';
import { useProductStore, formatCategoryName, formatUnit } from '../../components/store/productStore';
import { useInventoryStore } from '../../components/store/inventoryStore';
import { useToast } from '../../components/common/Toast';
import { useAuthStore } from '../../store/authStore';
import { canViewCostPrice } from '../../config/permissions.config';
import { useTranslation } from '../../i18n/useTranslation';

/* ─────────────────────────── helpers ─────────────────────────── */
function fmtVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' ₫';
}
function fmtDate(d, isEn = false) {
  if (!d) return '—';
  return new Date(d).toLocaleString(isEn ? 'en-US' : 'vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
function movTypeBadge(type, isEn = false) {
  const map = {
    INFLOW: { label: isEn ? 'Inflow' : 'Nhập kho', cls: 'bg-emerald-100 text-emerald-800' },
    OUTFLOW: { label: isEn ? 'Outflow' : 'Xuất kho', cls: 'bg-amber-100 text-amber-800' },
    AUDIT_ADJUSTMENT: { label: isEn ? 'Adjustment' : 'Điều chỉnh', cls: 'bg-sky-100 text-sky-800' },
    SALE: { label: isEn ? 'Sale' : 'Bán hàng', cls: 'bg-purple-100 text-purple-800' },
    RETURN: { label: isEn ? 'Return' : 'Trả hàng', cls: 'bg-pink-100 text-pink-800' },
  };
  const d = map[type] || { label: type, cls: 'bg-slate-100 text-slate-700' };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${d.cls}`}>{d.label}</span>;
}

const CSS = `
.inv-root { font-family:var(--font-ui); }
.inv-header {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
  border: 1px solid #7dd3fc; border-radius: 18px; padding: 18px 24px;
  color: #082f49; display: flex; align-items: center; justify-content: space-between; gap: 20px;
  position: relative; overflow: hidden;
  box-shadow: 0 8px 22px -5px rgba(14, 165, 233, 0.22), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
}
.inv-header::before {
  content: ''; position: absolute; top: -60px; right: -60px; width: 220px; height: 220px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 70%);
  border-radius: 50%; pointer-events: none;
}
.inv-header::after {
  content: ''; position: absolute; bottom: -50px; left: 30%; width: 240px; height: 120px;
  background: radial-gradient(ellipse, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
  border-radius: 50%; pointer-events: none;
}
.inv-header h1 { font-size:22px; font-weight:900; margin:0 0 3px; letter-spacing:-.4px; color:#082f49; }
.inv-header p  { font-size:12.5px; color:#0c4a6e; margin:0; font-weight:500; white-space:nowrap; }
@media (max-width:768px) { .inv-header p { white-space:normal; } }
.inv-tag {
  display:inline-flex; align-items:center; gap:5px;
  background:rgba(255,255,255,.88); border:1px solid rgba(255,255,255,.95);
  border-radius:14px; padding:3px 10px; font-size:11px; font-weight:700; color:#0369a1;
}
.inv-btn-primary {
  display:flex; align-items:center; gap:6px; padding:9px 16px;
  background:rgba(255,255,255,.92); border:1px solid rgba(255,255,255,.95);
  border-radius:12px; color:#0284c7; font-size:12.5px; font-weight:700;
  cursor:pointer; transition:all .2s; box-shadow:0 2px 6px rgba(0,0,0,.05); backdrop-filter:blur(8px);
}
.inv-btn-primary:hover { background:#fff; border-color:#38bdf8; color:#0369a1; transform:translateY(-1px); box-shadow:0 4px 12px rgba(2,132,199,.2); }
.inv-kpi { background:#fff; border:1px solid #edf2f7; border-radius:18px; padding:18px 20px; display:flex; align-items:center; gap:14px; box-shadow:0 2px 8px rgba(0,0,0,.03); transition:all .25s; }
.inv-kpi:hover { box-shadow:0 8px 24px rgba(0,0,0,.07); transform:translateY(-2px); }
.inv-kpi-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.inv-kpi-label { font-size:11px; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:.05em; margin-bottom:3px; }
.inv-kpi-value { font-size:20px; font-weight:900; color:#0f172a; line-height:1.2; }
.inv-kpi-sub { font-size:11px; font-weight:600; margin-top:3px; color:#94a3b8; }
.inv-tab-bar { display:flex; border-bottom:2px solid #e2e8f0; gap:2px; }
.inv-tab { padding:10px 18px; font-size:13px; font-weight:700; border-bottom:2px solid transparent; margin-bottom:-2px; cursor:pointer; transition:all .18s; color:#64748b; display:flex; align-items:center; gap:6px; background:none; border-top:none; border-left:none; border-right:none; }
.inv-tab.active { border-bottom-color:#0ea5e9; color:#0284c7; }
.inv-tab:hover:not(.active) { color:#0f172a; border-bottom-color:#cbd5e1; }
.inv-card { background:#fff; border:1px solid #edf2f7; border-radius:18px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.03); }
.inv-table { width:100%; text-align:left; border-collapse:collapse; font-size:12.5px; }
.inv-table thead tr { background:#f8fafc; border-bottom:1px solid #edf2f7; }
.inv-table thead th { padding:11px 14px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#64748b; }
.inv-table tbody tr { border-bottom:1px solid #f1f5f9; transition:background .15s; }
.inv-table tbody tr:last-child { border-bottom:none; }
.inv-table tbody tr:hover { background:#f8fafc; }
.inv-table td { padding:11px 14px; color:#0f172a; }
.inv-status-pill { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.inv-modal-overlay { position:fixed; inset:0; z-index:9999; background:rgba(15,23,42,.55); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:16px; animation:fadeIn .15s ease; }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
.inv-modal { background:#fff; border-radius:20px; padding:24px; width:100%; max-width:480px; box-shadow:0 24px 64px rgba(0,0,0,.15),0 8px 20px rgba(0,0,0,.08); animation:slideUp .18s ease; }
@keyframes slideUp { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }
.inv-field-label { font-size:12px; font-weight:700; color:#374151; margin-bottom:5px; display:block; }
.inv-input { width:100%; padding:9px 13px; border:1.5px solid #e2e8f0; border-radius:12px; font-size:13px; background:#f8fafc; transition:border-color .18s,box-shadow .18s; box-sizing:border-box; }
.inv-input:focus { outline:none; border-color:#38bdf8; box-shadow:0 0 0 3px rgba(56,189,248,.15); background:#fff; }
.inv-action-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .2s; }
.inv-btn-in  { background:linear-gradient(135deg,#059669,#10b981); color:#fff; box-shadow:0 4px 12px rgba(5,150,105,.25); }
.inv-btn-in:hover  { transform:translateY(-1px); box-shadow:0 6px 16px rgba(5,150,105,.35); }
.inv-btn-out { background:linear-gradient(135deg,#d97706,#f59e0b); color:#fff; box-shadow:0 4px 12px rgba(217,119,6,.25); }
.inv-btn-out:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(217,119,6,.35); }
.inv-btn-adj { background:linear-gradient(135deg,#2563eb,#3b82f6); color:#fff; box-shadow:0 4px 12px rgba(37,99,235,.25); }
.inv-btn-adj:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(37,99,235,.35); }
.inv-btn-take { background:linear-gradient(135deg,#7c3aed,#8b5cf6); color:#fff; box-shadow:0 4px 12px rgba(124,58,237,.25); }
.inv-btn-take:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(124,58,237,.35); }
.inv-cancel-btn { padding:9px 16px; border-radius:12px; border:1.5px solid #e2e8f0; background:#f8fafc; font-size:13px; font-weight:600; color:#64748b; cursor:pointer; transition:all .15s; }
.inv-cancel-btn:hover { background:#fff; border-color:#cbd5e1; color:#0f172a; }
.inv-empty { text-align:center; padding:48px 24px; color:#94a3b8; }
.inv-empty-icon { width:48px; height:48px; margin:0 auto 12px; opacity:.35; }
.inv-search-wrap { position:relative; }
.inv-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); width:15px; height:15px; color:#94a3b8; pointer-events:none; }
.inv-search-input { width:100%; padding:9px 12px 9px 36px; border:1.5px solid #e2e8f0; border-radius:12px; font-size:13px; background:#f8fafc; transition:all .18s; }
.inv-search-input:focus { outline:none; border-color:#38bdf8; box-shadow:0 0 0 3px rgba(56,189,248,.12); background:#fff; }
.inv-filter-pill { padding:5px 14px; border-radius:20px; border:1.5px solid #e2e8f0; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; background:#fff; color:#64748b; }
.inv-filter-pill.active { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
.inv-filter-pill:hover:not(.active) { background:#f8fafc; color:#374151; border-color:#cbd5e1; }
.inv-loading { display:flex; align-items:center; justify-content:center; gap:8px; padding:32px; color:#94a3b8; font-size:13px; }
.spin { animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
`;

/* ─────────────────── Main Component ─────────────────── */
export function InventoryPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const isEn = language === 'en';
  const canSeeCost = canViewCostPrice(user?.role);
  const { products, fetchProducts } = useProductStore();
  const { movements, stockIn, stockOut, stockAdjustment, fetchMovements, fetchBalances, isLoading } = useInventoryStore();

  /* load */
  useEffect(() => {
    if (!products.length) fetchProducts();
    fetchMovements({ limit: 50 });
    fetchBalances({ limit: 100 });
  }, []);

  /* tabs */
  const [tab, setTab] = useState('balances');

  /* search / filter */
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');

  /* modal: which one open + loading state */
  const [modal, setModal] = useState(null); // 'in' | 'out' | 'adj' | 'take'
  const [saving, setSaving] = useState(false);

  /* form shared state */
  const [selProductId, setSelProductId] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [outReason, setOutReason] = useState('Xuất bán lẻ');

  /* stock-take counts */
  const [takeCounts, setTakeCounts] = useState({});

  /* ─── derived ─── */
  const selProduct = useMemo(() => products.find(p => String(p.id) === String(selProductId)), [products, selProductId]);

  const kpiOut  = useMemo(() => products.filter(p => p.stock === 0).length, [products]);
  const kpiLow  = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= (p.alertThreshold || 10)).length, [products]);
  const kpiOver = useMemo(() => products.filter(p => p.stock >= 50).length, [products]);
  const kpiVal  = useMemo(() => products.reduce((s, p) => s + (p.stock||0)*(p.costPrice||0), 0), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (stockFilter === 'OUT'    && p.stock !== 0) return false;
      if (stockFilter === 'LOW'    && (p.stock === 0 || p.stock > (p.alertThreshold||10))) return false;
      if (stockFilter === 'OVER'   && p.stock < 50) return false;
      if (stockFilter === 'NORMAL' && (p.stock <= (p.alertThreshold||10) || p.stock >= 50)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (p.name||'').toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q) || (p.categoryLabel||'').toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, stockFilter, search]);

  /* ─── helpers ─── */
  const resetForm = () => { setSelProductId(''); setQty(''); setNote(''); setOutReason('Xuất bán lẻ'); };
  const closeModal = () => { setModal(null); resetForm(); };

  /* Get stockItemId from product */
  const getStockItemId = (productId) => {
    const p = products.find(pr => String(pr.id) === String(productId));
    return p?.stockItems?.[0]?.id || null;
  };

  /* ─── actions ─── */
  const handleStockIn = async () => {
    const stockItemId = getStockItemId(selProductId);
    if (!stockItemId || !qty || Number(qty) <= 0) {
      toast({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng chọn sản phẩm và nhập số lượng > 0.' });
      return;
    }
    setSaving(true);
    try {
      await stockIn({ items: [{ stockItemId, quantity: Number(qty) }], note: note || 'Nhập kho thủ công' });
      await fetchProducts();
      toast({ type: 'success', title: 'Nhập kho thành công', message: `Đã nhập thêm ${qty} ${selProduct?.unit||''} vào kho.` });
      closeModal();
    } catch (err) {
      toast({ type: 'error', title: 'Lỗi nhập kho', message: err?.response?.data?.error?.message || err?.message || 'Không thể nhập kho.' });
    } finally { setSaving(false); }
  };

  const handleStockOut = async () => {
    const stockItemId = getStockItemId(selProductId);
    if (!stockItemId || !qty || Number(qty) <= 0) {
      toast({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng chọn sản phẩm và nhập số lượng > 0.' });
      return;
    }
    if (selProduct && Number(qty) > selProduct.stock) {
      toast({ type: 'warning', title: 'Vượt tồn kho', message: `Tồn hiện tại chỉ còn ${selProduct.stock} ${selProduct.unit||''}.` });
      return;
    }
    setSaving(true);
    try {
      await stockOut({ items: [{ stockItemId, quantity: Number(qty) }], note: `${outReason}${note ? ': ' + note : ''}` });
      await fetchProducts();
      toast({ type: 'success', title: 'Xuất kho thành công', message: `Đã xuất ${qty} ${selProduct?.unit||''} khỏi kho.` });
      closeModal();
    } catch (err) {
      toast({ type: 'error', title: 'Lỗi xuất kho', message: err?.response?.data?.error?.message || err?.message || 'Không thể xuất kho.' });
    } finally { setSaving(false); }
  };

  const handleAdjust = async () => {
    const stockItemId = getStockItemId(selProductId);
    if (!stockItemId || qty === '' || Number(qty) < 0) {
      toast({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng chọn sản phẩm và nhập số tồn mới >= 0.' });
      return;
    }
    setSaving(true);
    try {
      await stockAdjustment({ items: [{ stockItemId, countedQuantity: Number(qty) }], note: note || 'Điều chỉnh tồn kho' });
      await fetchProducts();
      toast({ type: 'success', title: 'Điều chỉnh thành công', message: `Số tồn đã được cập nhật thành ${qty} ${selProduct?.unit||''}.` });
      closeModal();
    } catch (err) {
      toast({ type: 'error', title: 'Lỗi điều chỉnh', message: err?.response?.data?.error?.message || err?.message || 'Không thể điều chỉnh tồn.' });
    } finally { setSaving(false); }
  };

  const handleStockTake = async () => {
    const keys = Object.keys(takeCounts).filter(id => takeCounts[id] !== '' && takeCounts[id] !== undefined);
    if (keys.length === 0) {
      toast({ type: 'info', title: 'Chưa có thay đổi', message: 'Nhập số đếm thực tế cho ít nhất 1 sản phẩm.' });
      return;
    }
    setSaving(true);
    try {
      const items = [];
      for (const productId of keys) {
        const stockItemId = getStockItemId(productId);
        if (stockItemId) {
          items.push({ stockItemId, countedQuantity: Number(takeCounts[productId]) });
        }
      }
      if (items.length === 0) throw new Error('Không lấy được stockItemId cho sản phẩm đã chọn');
      await stockAdjustment({ items, note: 'Kiểm kê kho thực tế' });
      await fetchProducts();
      setTakeCounts({});
      toast({ type: 'success', title: 'Hoàn tất kiểm kê', message: `Đã đồng bộ ${items.length} mặt hàng theo số đếm thực tế.` });
    } catch (err) {
      toast({ type: 'error', title: 'Lỗi kiểm kê', message: err?.response?.data?.error?.message || err?.message || 'Không thể thực hiện kiểm kê.' });
    } finally { setSaving(false); }
  };

  /* ─── render ─── */
  return (
    <div className="inv-root" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div className="inv-header">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1>{isEn ? 'Warehouse & Inventory Management' : 'Quản lý Kho hàng & Tồn kho'}</h1>
          <p>
            {isEn
              ? 'Stock inflow, outflow, inventory adjustment, routine stocktaking — track every item accurately.'
              : 'Nhập kho, xuất kho, điều chỉnh tồn, kiểm kê định kỳ — theo dõi chính xác từng mặt hàng.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button className="inv-btn-primary" onClick={async () => { await fetchProducts(); await fetchMovements({ limit: 50 }); toast({ type: 'info', title: isEn ? 'Refreshed' : 'Đã làm mới', message: isEn ? 'Inventory data updated.' : 'Dữ liệu kho đã được cập nhật.' }); }}>
            <RefreshCw style={{ width: 13, height: 13 }} /> {isEn ? 'Refresh' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* KPI (Phân quyền: Nhân viên ẩn thẻ Giá trị tồn kho) */}
      <div style={{ display: 'grid', gridTemplateColumns: canSeeCost ? 'repeat(4,1fr)' : 'repeat(3,1fr)', gap: 14 }}>
        {canSeeCost && (
          <div className="inv-kpi">
            <div className="inv-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><DollarSign style={{ width: 22, height: 22 }} /></div>
            <div>
              <div className="inv-kpi-label">{isEn ? 'Inventory Value' : 'Giá trị tồn kho'}</div>
              <div className="inv-kpi-value" style={{ fontSize: 16 }}>{fmtVND(kpiVal)}</div>
              <div className="inv-kpi-sub">{isEn ? 'Total warehouse capital' : 'Tổng vốn trong kho'}</div>
            </div>
          </div>
        )}
        <div className="inv-kpi">
          <div className="inv-kpi-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><ShieldOff style={{ width: 22, height: 22 }} /></div>
          <div>
            <div className="inv-kpi-label">{isEn ? 'Out of stock' : 'Hết hàng'}</div>
            <div className="inv-kpi-value" style={{ color: '#dc2626' }}>{kpiOut} SP</div>
            <div className="inv-kpi-sub">{isEn ? 'Restock immediately' : 'Cần nhập ngay'}</div>
          </div>
        </div>
        <div className="inv-kpi">
          <div className="inv-kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}><AlertTriangle style={{ width: 22, height: 22 }} /></div>
          <div>
            <div className="inv-kpi-label">{isEn ? 'Low stock' : 'Sắp hết hàng'}</div>
            <div className="inv-kpi-value" style={{ color: '#d97706' }}>{kpiLow} SP</div>
            <div className="inv-kpi-sub">{isEn ? 'Below safety threshold' : 'Dưới ngưỡng an toàn'}</div>
          </div>
        </div>
        <div className="inv-kpi">
          <div className="inv-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><TrendingUp style={{ width: 22, height: 22 }} /></div>
          <div>
            <div className="inv-kpi-label">{isEn ? 'Overstock' : 'Tồn nhiều'}</div>
            <div className="inv-kpi-value" style={{ color: '#2563eb' }}>{kpiOver} SP</div>
            <div className="inv-kpi-sub">{isEn ? 'Tied capital, needs clearance' : 'Vốn đọng, cần xả'}</div>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="inv-tab-bar">
        {[
          { id: 'balances', label: isEn ? `Inventory (${products.length} SP)` : `Tồn kho (${products.length} SP)`, icon: <Package style={{ width: 14, height: 14 }} /> },
          { id: 'movements', label: isEn ? `Movement History (${movements.length})` : `Lịch sử xuất nhập (${movements.length})`, icon: <BarChart3 style={{ width: 14, height: 14 }} /> },
          { id: 'stocktake', label: isEn ? 'Stocktake Audits' : 'Phiên kiểm kê', icon: <ClipboardList style={{ width: 14, height: 14 }} /> },
        ].map(t => (
          <button key={t.id} className={`inv-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: BALANCES ── */}
      {tab === 'balances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { k: 'ALL',    l: isEn ? 'All' : 'Tất cả' },
                { k: 'OUT',    l: isEn ? `Out of stock (${kpiOut})` : `Hết hàng (${kpiOut})` },
                { k: 'LOW',    l: isEn ? `Low stock (${kpiLow})` : `Sắp hết (${kpiLow})` },
                { k: 'OVER',   l: isEn ? `Overstock (${kpiOver})` : `Tồn nhiều (${kpiOver})` },
                { k: 'NORMAL', l: isEn ? 'Normal' : 'Bình thường' },
              ].map(f => (
                <button key={f.k} className={`inv-filter-pill ${stockFilter === f.k ? 'active' : ''}`} onClick={() => setStockFilter(f.k)}>{f.l}</button>
              ))}
            </div>
            <div className="inv-search-wrap" style={{ width: 240 }}>
              <Search className="inv-search-icon" />
              <input className="inv-search-input" placeholder={isEn ? "Search product, SKU..." : "Tìm sản phẩm, mã SP..."} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="inv-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>{isEn ? 'Product / SKU' : 'Sản phẩm / Mã SP'}</th>
                    <th>{isEn ? 'Category' : 'Danh mục'}</th>
                    <th style={{ textAlign: 'center' }}>{isEn ? 'Current Stock' : 'Tồn hiện tại'}</th>
                    <th style={{ textAlign: 'center' }}>{isEn ? 'Safety Threshold' : 'Ngưỡng an toàn'}</th>
                    {canSeeCost && <th style={{ textAlign: 'right' }}>{isEn ? 'Cost Price' : 'Giá vốn'}</th>}
                    {canSeeCost && <th style={{ textAlign: 'right' }}>{isEn ? 'Total Value' : 'Tổng giá trị'}</th>}
                    <th>{isEn ? 'Status' : 'Trạng thái'}</th>
                    <th>{isEn ? 'Actions' : 'Thao tác'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={canSeeCost ? 8 : 6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>{isEn ? 'No matching products found' : 'Không có sản phẩm nào phù hợp'}</td></tr>
                  ) : filteredProducts.map(p => {
                    const isOut  = p.stock === 0;
                    const isLow  = p.stock > 0 && p.stock <= (p.alertThreshold || 10);
                    const isOver = p.stock >= 50;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{p.sku}</div>
                        </td>
                        <td style={{ color: '#64748b', fontSize: 12 }}>{formatCategoryName(p.categoryLabel, isEn)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: isOut ? '#dc2626' : isLow ? '#d97706' : '#0f172a' }}>
                            {p.stock} {formatUnit(p.unit, isEn)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>{p.alertThreshold || 10} {formatUnit(p.unit, isEn)}</td>
                        {canSeeCost && <td style={{ textAlign: 'right', color: '#64748b', fontSize: 12 }}>{fmtVND(p.costPrice)}</td>}
                        {canSeeCost && <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtVND(p.stock * p.costPrice)}</td>}
                        <td>
                          <span className="inv-status-pill" style={
                            isOut  ? { background: '#fef2f2', color: '#dc2626' } :
                            isLow  ? { background: '#fffbeb', color: '#d97706' } :
                            isOver ? { background: '#eff6ff', color: '#2563eb' } :
                                     { background: '#f0fdf4', color: '#16a34a' }
                          }>
                            {isOut ? (isEn ? '⚠ Out of stock' : '⚠ Hết hàng') : isLow ? (isEn ? '↓ Low stock' : '↓ Sắp hết') : isOver ? (isEn ? '↑ Overstock' : '↑ Tồn nhiều') : (isEn ? '✓ Normal' : '✓ Ổn định')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button title={isEn ? "Receive stock" : "Nhập kho"} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #d1fae5', background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                              onClick={() => { setSelProductId(String(p.id)); setModal('in'); }}>{isEn ? '+ Receive' : '+ Nhập'}</button>
                            <button title={isEn ? "Issue stock" : "Xuất kho"} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #fde68a', background: '#fffbeb', color: '#b45309', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                              onClick={() => { setSelProductId(String(p.id)); setModal('out'); }}>{isEn ? '- Issue' : '- Xuất'}</button>
                            <button title={isEn ? "Adjust stock" : "Điều chỉnh tồn"} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                              onClick={() => { setSelProductId(String(p.id)); setQty(String(p.stock)); setModal('adj'); }}>{isEn ? '⚙ Adjust' : '⚙ Điều chỉnh'}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MOVEMENTS ── */}
      {tab === 'movements' && (
        <div className="inv-card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                {isEn ? 'Stock Movement Log' : 'Nhật ký xuất nhập tồn kho'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {isEn ? 'All warehouse movements are tracked automatically' : 'Toàn bộ biến động kho được ghi lại tự động'}
              </div>
            </div>
            <button className="inv-filter-pill" onClick={() => fetchMovements({ limit: 100 })}>
              <RefreshCw style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
              {isEn ? 'Load more' : 'Tải thêm'}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div className="inv-loading">
                <RefreshCw className="spin" style={{ width: 16, height: 16 }} />
                {isEn ? 'Loading history...' : 'Đang tải lịch sử...'}
              </div>
            ) : movements.length === 0 ? (
              <div className="inv-empty">
                <BarChart3 className="inv-empty-icon" />
                <div style={{ fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  {isEn ? 'No transactions yet' : 'Chưa có giao dịch nào'}
                </div>
                <div style={{ fontSize: 12 }}>
                  {isEn ? 'Perform stock in/out to view history here' : 'Thực hiện nhập/xuất kho để xem lịch sử tại đây'}
                </div>
              </div>
            ) : (
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>{isEn ? 'Time' : 'Thời gian'}</th>
                    <th>{isEn ? 'Movement Type' : 'Loại giao dịch'}</th>
                    <th>{isEn ? 'Product / SKU' : 'Sản phẩm / Mã SP'}</th>
                    <th style={{ textAlign: 'center' }}>{isEn ? 'Quantity (Δ)' : 'Số lượng (Δ)'}</th>
                    <th style={{ textAlign: 'center' }}>{isEn ? 'Before → After' : 'Trước → Sau'}</th>
                    <th>{isEn ? 'Note' : 'Ghi chú'}</th>
                    <th>{isEn ? 'Performed By' : 'Người thực hiện'}</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => {
                    const delta = Number(m.delta ?? 0);
                    const isPos = delta >= 0;
                    const productName = m.stockItem?.product?.name || m.stockItem?.name || `SP #${m.stockItemId}`;
                    const sku = m.stockItem?.sku || '—';
                    return (
                      <tr key={m.id}>
                        <td style={{ fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(m.createdAt, isEn)}</td>
                        <td>{movTypeBadge(m.type, isEn)}</td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{productName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{sku}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 900, fontSize: 14, color: isPos ? '#16a34a' : '#dc2626' }}>
                          {isPos ? `+${delta}` : delta}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                          {m.beforeQuantity} <ArrowRight style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle' }} /> <strong style={{ color: '#0f172a' }}>{m.afterQuantity}</strong>
                        </td>
                        <td style={{ fontSize: 12, color: '#64748b', maxWidth: 200 }}>{m.note || '—'}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{m.createdBy?.fullName || m.createdBy?.email || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: STOCK-TAKE ── */}
      {tab === 'stocktake' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 16, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#082f49' }}>
                {isEn ? '📋 Physical Stocktake Sheet' : '📋 Bảng kiểm kê kho thực tế'}
              </div>
              <div style={{ fontSize: 12, color: '#0c4a6e', marginTop: 3 }}>
                {isEn
                  ? 'Enter actual physical count. The system automatically computes variance and syncs stock levels.'
                  : 'Nhập số đếm thực tế. Hệ thống tự tính chênh lệch và đồng bộ tồn kho.'}
              </div>
            </div>
            <button className="inv-action-btn inv-btn-take" onClick={handleStockTake} disabled={saving}>
              {saving ? <RefreshCw className="spin" style={{ width: 14, height: 14 }} /> : <Check style={{ width: 14, height: 14 }} />}
              {saving
                ? (isEn ? 'Processing...' : 'Đang xử lý...')
                : (isEn ? `Complete Stocktake (${Object.keys(takeCounts).filter(k => takeCounts[k] !== '').length} SP)` : `Hoàn tất kiểm kê (${Object.keys(takeCounts).filter(k => takeCounts[k] !== '').length} SP)`)}
            </button>
          </div>

          <div className="inv-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>{isEn ? 'Product / SKU' : 'Sản phẩm / Mã SP'}</th>
                    <th style={{ textAlign: 'center' }}>{isEn ? 'System Stock' : 'Tồn hệ thống'}</th>
                    <th style={{ textAlign: 'center', width: 160 }}>{isEn ? 'Actual Count' : 'Số đếm thực tế'}</th>
                    <th style={{ textAlign: 'center' }}>{isEn ? 'Variance' : 'Chênh lệch'}</th>
                    <th>{isEn ? 'Status' : 'Trạng thái'}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const actual = takeCounts[p.id];
                    const hasEntered = actual !== undefined && actual !== '';
                    const diff = hasEntered ? Number(actual) - p.stock : null;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{p.sku}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 900, fontSize: 15 }}>{p.stock}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min="0"
                            placeholder={String(p.stock)}
                            value={actual ?? ''}
                            onChange={e => setTakeCounts(prev => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ width: 90, padding: '6px 10px', textAlign: 'center', fontWeight: 700, border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, background: hasEntered ? '#fff' : '#f8fafc', borderColor: hasEntered ? '#38bdf8' : '#e2e8f0' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {diff === null ? <span style={{ color: '#94a3b8' }}>—</span> : (
                            <span style={{ fontWeight: 800, padding: '3px 10px', borderRadius: 20, fontSize: 12,
                              background: diff === 0 ? '#f1f5f9' : diff > 0 ? '#f0fdf4' : '#fef2f2',
                              color: diff === 0 ? '#64748b' : diff > 0 ? '#16a34a' : '#dc2626'
                            }}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          )}
                        </td>
                        <td>
                          {diff === null ? <span style={{ color: '#94a3b8', fontSize: 12 }}>{isEn ? 'Not entered' : 'Chưa nhập'}</span>
                          : diff === 0 ? <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 12 }}>{isEn ? '✓ Matched' : '✓ Khớp'}</span>
                          : diff > 0 ? <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 12 }}>{isEn ? `↑ Surplus ${diff}` : `↑ Thừa ${diff}`}</span>
                          : <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 12 }}>{isEn ? `↓ Deficit ${Math.abs(diff)}` : `↓ Thiếu ${Math.abs(diff)}`}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL: NHẬP KHO ═══════ */}
      {modal === 'in' && (
        <div className="inv-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="inv-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #edf2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowDownToLine style={{ width: 18, height: 18, color: '#16a34a' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>{isEn ? 'Stock Inflow Slip' : 'Phiếu Nhập Kho'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{isEn ? 'Add stock to warehouse' : 'Bổ sung hàng hóa vào kho'}</div>
                </div>
              </div>
              <button onClick={closeModal} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748b' }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="inv-field-label">{isEn ? 'Product' : 'Sản phẩm'} <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="inv-input" value={selProductId} onChange={e => setSelProductId(e.target.value)}>
                  <option value="">{isEn ? '— Select product —' : '— Chọn sản phẩm —'}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({isEn ? 'Stock' : 'Tồn'}: {p.stock} {formatUnit(p.unit, isEn)})</option>)}
                </select>
                {selProduct && (
                  <div style={{ marginTop: 6, padding: '8px 12px', background: '#f0fdf4', borderRadius: 10, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                    {isEn ? 'Current stock:' : 'Tồn hiện tại:'} <strong>{selProduct.stock}</strong> {formatUnit(selProduct.unit, isEn)}{canSeeCost ? ` | ${isEn ? 'Cost price' : 'Giá vốn'}: ${fmtVND(selProduct.costPrice)}` : ''}
                  </div>
                )}
              </div>
              <div>
                <label className="inv-field-label">{isEn ? 'Additional quantity' : 'Số lượng nhập thêm'} <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="inv-input" type="number" min="1" placeholder={isEn ? "E.g.: 50" : "Ví dụ: 50"} value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              <div>
                <label className="inv-field-label">{isEn ? 'Note / Source' : 'Ghi chú / Nguồn hàng'}</label>
                <input className="inv-input" type="text" placeholder={isEn ? "E.g.: Received from Acecook, batch Oct 2026" : "Ví dụ: Nhập từ NCC Acecook, lô tháng 10/2026"} value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #edf2f7' }}>
              <button className="inv-cancel-btn" onClick={closeModal}>{isEn ? 'Cancel' : 'Hủy'}</button>
              <button className="inv-action-btn inv-btn-in" onClick={handleStockIn} disabled={saving}>
                {saving ? <RefreshCw className="spin" style={{ width: 14, height: 14 }} /> : <Check style={{ width: 14, height: 14 }} />}
                {saving ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? 'Confirm Stock In' : 'Xác nhận Nhập kho')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL: XUẤT KHO ═══════ */}
      {modal === 'out' && (
        <div className="inv-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="inv-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #edf2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpFromLine style={{ width: 18, height: 18, color: '#d97706' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>{isEn ? 'Stock Outflow Slip' : 'Phiếu Xuất Kho'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{isEn ? 'Manual stock dispatch from warehouse' : 'Xuất hàng thủ công khỏi kho'}</div>
                </div>
              </div>
              <button onClick={closeModal} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748b' }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="inv-field-label">{isEn ? 'Product' : 'Sản phẩm'} <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="inv-input" value={selProductId} onChange={e => setSelProductId(e.target.value)}>
                  <option value="">{isEn ? '— Select product —' : '— Chọn sản phẩm —'}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({isEn ? 'Stock' : 'Tồn'}: {p.stock} {formatUnit(p.unit, isEn)})</option>)}
                </select>
                {selProduct && (
                  <div style={{ marginTop: 6, padding: '8px 12px', background: '#fffbeb', borderRadius: 10, fontSize: 12, color: '#b45309', fontWeight: 600 }}>
                    {isEn ? 'Available stock:' : 'Tồn khả dụng:'} <strong>{selProduct.stock}</strong> {formatUnit(selProduct.unit, isEn)}
                    {selProduct.stock === 0 && <span style={{ color: '#dc2626', marginLeft: 8 }}>{isEn ? '⚠ Out of stock!' : '⚠ Đã hết hàng!'}</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="inv-field-label">{isEn ? 'Outflow quantity' : 'Số lượng xuất'} <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="inv-input" type="number" min="1" max={selProduct?.stock || undefined} placeholder={isEn ? "E.g.: 10" : "Ví dụ: 10"} value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              <div>
                <label className="inv-field-label">{isEn ? 'Outflow reason' : 'Lý do xuất'}</label>
                <select className="inv-input" value={outReason} onChange={e => setOutReason(e.target.value)}>
                  <option value="Xuất bán lẻ">{isEn ? 'Retail sale' : 'Xuất bán lẻ'}</option>
                  <option value="Xuất sỉ / đại lý">{isEn ? 'Wholesale' : 'Xuất sỉ / đại lý'}</option>
                  <option value="Xuất hủy hàng hỏng / hết hạn">{isEn ? 'Damaged / Expired disposal' : 'Xuất hủy hàng hỏng / hết hạn'}</option>
                  <option value="Hàng mẫu trưng bày">{isEn ? 'Display sample' : 'Hàng mẫu trưng bày'}</option>
                  <option value="Xuất nội bộ / sử dụng">{isEn ? 'Internal use' : 'Xuất nội bộ / sử dụng'}</option>
                  <option value="Xuất chênh lệch kiểm kê">{isEn ? 'Stocktake variance' : 'Xuất chênh lệch kiểm kê'}</option>
                </select>
              </div>
              <div>
                <label className="inv-field-label">{isEn ? 'Additional note' : 'Ghi chú thêm'}</label>
                <input className="inv-input" type="text" placeholder={isEn ? "Optional note..." : "Ghi chú tùy chọn..."} value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #edf2f7' }}>
              <button className="inv-cancel-btn" onClick={closeModal}>{isEn ? 'Cancel' : 'Hủy'}</button>
              <button className="inv-action-btn inv-btn-out" onClick={handleStockOut} disabled={saving || (selProduct && selProduct.stock === 0)}>
                {saving ? <RefreshCw className="spin" style={{ width: 14, height: 14 }} /> : <Check style={{ width: 14, height: 14 }} />}
                {saving ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? 'Confirm Stock Out' : 'Xác nhận Xuất kho')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL: ĐIỀU CHỈNH TỒN ═══════ */}
      {modal === 'adj' && (
        <div className="inv-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="inv-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #edf2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SlidersHorizontal style={{ width: 18, height: 18, color: '#2563eb' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>{isEn ? 'Adjust Inventory' : 'Điều chỉnh Tồn kho'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{isEn ? 'Update physical stock count (overwrite)' : 'Cập nhật số tồn thực tế (ghi đè)'}</div>
                </div>
              </div>
              <button onClick={closeModal} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748b' }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="inv-field-label">{isEn ? 'Product' : 'Sản phẩm'} <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="inv-input" value={selProductId} onChange={e => { setSelProductId(e.target.value); const p = products.find(pr => String(pr.id) === e.target.value); if (p) setQty(String(p.stock)); }}>
                  <option value="">{isEn ? '— Select product —' : '— Chọn sản phẩm —'}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({isEn ? 'Stock' : 'Tồn'}: {p.stock} {formatUnit(p.unit, isEn)})</option>)}
                </select>
              </div>
              {selProduct && (
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>{isEn ? 'Current system stock:' : 'Tồn hệ thống hiện tại:'}</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{selProduct.stock} {formatUnit(selProduct.unit, isEn)}</span>
                </div>
              )}
              <div>
                <label className="inv-field-label">{isEn ? 'Actual stock count (new)' : 'Số tồn thực tế (mới)'} <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="inv-input" type="number" min="0" placeholder={isEn ? "Enter exact physical count" : "Nhập số tồn chính xác thực tế"} value={qty} onChange={e => setQty(e.target.value)} />
                {selProduct && qty !== '' && (
                  <div style={{ marginTop: 6, fontSize: 12, color: Number(qty) > selProduct.stock ? '#16a34a' : Number(qty) < selProduct.stock ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                    {isEn ? 'Variance:' : 'Chênh lệch:'} {Number(qty) - selProduct.stock > 0 ? '+' : ''}{Number(qty) - selProduct.stock} {formatUnit(selProduct.unit, isEn)}
                  </div>
                )}
              </div>
              <div>
                <label className="inv-field-label">{isEn ? 'Adjustment reason' : 'Lý do điều chỉnh'}</label>
                <input className="inv-input" type="text" placeholder={isEn ? "E.g.: Stocktake audit, damaged goods..." : "Ví dụ: Kiểm kê ngày 13/10, hao hụt do vỡ..."} value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #edf2f7' }}>
              <button className="inv-cancel-btn" onClick={closeModal}>{isEn ? 'Cancel' : 'Hủy'}</button>
              <button className="inv-action-btn inv-btn-adj" onClick={handleAdjust} disabled={saving}>
                {saving ? <RefreshCw className="spin" style={{ width: 14, height: 14 }} /> : <Check style={{ width: 14, height: 14 }} />}
                {saving ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? 'Save Adjustment' : 'Lưu điều chỉnh')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
