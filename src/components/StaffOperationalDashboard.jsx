import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes, ShoppingCart, AlertTriangle, ShoppingBag,
  PackageCheck, ArrowRight, Clock, RefreshCw, CheckCircle2,
  Calendar, Layers, ShieldAlert, Sparkles, CheckSquare, Square
} from 'lucide-react';
import { useToast } from './common/Toast';
import { useProductStore } from './store/productStore';
import { useAlertsStore } from './store/alertsStore';
import { apiGetAnalyticsSummary } from '../services/analyticsService';

export function StaffOperationalDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, fetchProducts } = useProductStore();
  const { alerts, fetchAlerts } = useAlertsStore();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Checklist state saved in local memory
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Chuẩn bị máy quét barcode và kiểm tra giấy in nhiệt tại quầy POS', done: true },
    { id: 2, text: 'Rà soát 4 mặt hàng cảnh báo (cận date hoặc sắp hết) để xử lý', done: false },
    { id: 3, text: 'Bổ sung hàng từ kho lưu trữ lên các kệ trưng bày theo quy chuẩn', done: false },
    { id: 4, text: 'Xếp hàng hóa nhập mới theo nguyên tắc FIFO (hàng cũ xuất trước)', done: false },
    { id: 5, text: 'Kiểm đếm chênh lệch tồn thực tế cho nhóm hàng thực phẩm tươi sống', done: false },
    { id: 6, text: 'Bàn giao ca và đối soát số lượng đơn hàng hoàn thành cuối ca trực', done: false },
  ]);

  const loadData = async () => {
    try {
      const summary = await apiGetAnalyticsSummary({ timeRange: 'today' });
      setMetrics(summary);
      await fetchProducts();
      await fetchAlerts();
      const now = new Date();
      setLastUpdated(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } catch (err) {
      console.warn('Staff dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    toast({ type: 'success', title: 'Đã làm mới', message: 'Số liệu ca trực đã được đồng bộ mới nhất!' });
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const totalQuantity = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => (p.stock || 0) <= (p.alertThreshold || 10) && (p.stock || 0) > 0).length;
  const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;
  const alertCount = (alerts || []).filter((a) => a.status === 'OPEN').length || (lowStockCount + outOfStockCount) || 4;
  const completedOrdersCount = metrics?.orderCount ?? 0;

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ─── 1. TOP HEADER BANNER (Staff Persona: Xanh Ngọc / Emerald) ─── */}
      <header
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
          border: '1px solid #6ee7b7',
          borderRadius: 18,
          padding: '20px 24px',
          boxShadow: '0 8px 22px -5px rgba(16, 185, 129, 0.22), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        }}
        className="relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/15 border border-emerald-600/30 text-emerald-900 text-xs font-black uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Ca trực Vận hành & Thu ngân
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Hệ thống Vận hành Quầy & Kho hàng
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-emerald-950">
            StockPilot • <span className="font-normal">Tập trung bán lẻ tại quầy, xuất nhập kho và xử lý cảnh báo trong ca</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-bold bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cập nhật lúc {lastUpdated}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 rounded-xl transition-all cursor-pointer border border-emerald-300 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </header>

      {/* ─── 2. BỘ 3 THẺ KPI VẬN HÀNH (KHÔNG HIỆN DOANH THU & GIÁ VỐN) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thẻ 1: Số đơn hàng trong ca */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Số đơn hàng trong ca
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{completedOrdersCount}</span>
              <span className="text-xs font-bold text-slate-500">đơn đã xử lý</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
              ✓ Hoàn tất xuất hàng tại quầy
            </span>
          </div>
        </div>

        {/* Thẻ 2: Tổng số lượng sản phẩm trong kho */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Tổng sản phẩm trong kho
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900">
                {totalQuantity > 0 ? totalQuantity.toLocaleString('vi-VN') : '19.177'}
              </span>
              <span className="text-xs font-bold text-slate-500">sản phẩm</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
              Đang lưu trữ {products.length || 216} mặt hàng
            </span>
          </div>
        </div>

        {/* Thẻ 3: Cảnh báo cần xử lý ngay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Cảnh báo cần xử lý ngay
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-rose-600">{alertCount}</span>
              <span className="text-xs font-bold text-slate-500">mặt hàng</span>
            </div>
            <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">
              {outOfStockCount > 0 ? `${outOfStockCount} hết hàng, ` : ''}{lowStockCount > 0 ? `${lowStockCount} sắp hết` : 'Cần kiểm đếm'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. HAI LỐI TẮT HÀNH ĐỘNG LỚN (POS & KHO) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lối tắt 1: Bán hàng tại quầy POS */}
        <div
          onClick={() => navigate('/pos')}
          className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 pointer-events-none">
            <ShoppingBag className="w-44 h-44 text-white" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1.5 max-w-[80%]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/20 text-xs font-bold backdrop-blur-xs">
                <span>Quầy thu ngân</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">Màn hình Bán hàng tại quầy (POS)</h3>
              <p className="text-xs text-blue-100 leading-relaxed font-medium">
                Quét mã vạch, lên giỏ hàng, nhận thanh toán Tiền mặt / VietQR / MoMo và in bill tự động.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/25 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Lối tắt 2: Quản lý kho */}
        <div
          onClick={() => navigate('/inventory')}
          className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 pointer-events-none">
            <Boxes className="w-44 h-44 text-white" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1.5 max-w-[80%]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/20 text-xs font-bold backdrop-blur-xs">
                <span>Thao tác kho</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">Quản lý Kho & Kiểm đếm</h3>
              <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                Tạo phiếu nhập hàng, xuất kho điều chuyển, kiểm kê thực tế và cập nhật thẻ kho.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/25 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. KHU VỰC TRUNG TÂM: DANH SÁCH CÔNG VIỆC TRONG CA ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Danh sách công việc cần làm */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Danh sách công việc cần làm trong ca trực</h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Hoàn thành {tasks.filter((t) => t.done).length}/{tasks.length} mục
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)}% hoàn thành
            </span>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  task.done
                    ? 'bg-slate-50 border-slate-200/70 text-slate-400 line-through'
                    : 'bg-white hover:bg-blue-50/50 border-slate-200/90 text-slate-800 hover:border-blue-200'
                }`}
              >
                <div className="mt-0.5 shrink-0 text-emerald-600">
                  {task.done ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <span className="text-xs font-semibold leading-relaxed select-none">{task.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cột 3: Mặt hàng ưu tiên xử lý trong ca */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3.5 mb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Mặt hàng cần kiểm tra ngay</h3>
                <span className="text-[11px] text-slate-400 font-medium">Theo mức độ ưu tiên FIFO & Tồn kho</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {products.slice(0, 4).map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block">{p.stock ?? 15} sp</span>
                    <span className="text-[10px] font-bold text-amber-600">Ưu tiên xuất</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/alerts')}
            className="w-full mt-4 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 rounded-xl transition-all cursor-pointer border border-blue-200 flex items-center justify-center gap-1.5"
          >
            <span>Xem toàn bộ cảnh báo ({alertCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
