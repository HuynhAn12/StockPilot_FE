import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes, Plus, ArrowDownRight, ArrowUpRight, RefreshCw,
  Search, Filter, CheckCircle2, AlertTriangle, ShieldAlert,
  ClipboardList, ArrowRight, Download, Package, DollarSign,
  TrendingDown, Eye, Check, X, FileText
} from 'lucide-react';
import { useProductStore } from '../components/store/productStore';
import { useInventoryStore } from '../components/store/inventoryStore';
import { useToast } from '../components/common/Toast';

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}

export function InventoryPage() {
  const { toast } = useToast();
  const { products, fetchProducts } = useProductStore();
  const { 
    movements, balances, stockTakeSessions,
    stockIn, stockOut, stockAdjustment,
    fetchMovements, fetchBalances, fetchStockTakes
  } = useInventoryStore();

  useEffect(() => {
    fetchMovements();
    fetchBalances();
    fetchStockTakes();
    if (!products.length) fetchProducts();
  }, []);

  const [activeTab, setActiveTab] = useState('balances'); // balances | movements | stocktake
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockFilter, setSelectedStockFilter] = useState('ALL'); // ALL | LOW | OUT | OVER | NORMAL

  // Modals
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  // Form states
  const [targetProductId, setTargetProductId] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [sourceReasonInput, setSourceReasonInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Stock-take form state
  const [stockTakeCounts, setStockTakeCounts] = useState({});

  // KPIs
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock || 0) * (p.costPrice || 0), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= (p.alertThreshold || 10)).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stock === 0).length;
  }, [products]);

  const overstockCount = useMemo(() => {
    return products.filter((p) => p.stock >= 50).length;
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedStockFilter === 'OUT' && p.stock !== 0) return false;
      if (selectedStockFilter === 'LOW' && (p.stock === 0 || p.stock > (p.alertThreshold || 10))) return false;
      if (selectedStockFilter === 'OVER' && p.stock < 50) return false;
      if (selectedStockFilter === 'NORMAL' && (p.stock <= (p.alertThreshold || 10) || p.stock >= 50)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedStockFilter, searchQuery]);

  // Handlers
  const handleStockInSubmit = () => {
    if (!targetProductId || !quantityInput || Number(quantityInput) <= 0) {
      toast({ title: 'Dữ liệu không hợp lệ', description: 'Vui lòng chọn sản phẩm và số lượng > 0.', type: 'warning' });
      return;
    }
    stockIn(targetProductId, Number(quantityInput), sourceReasonInput, notesInput);
    setIsStockInOpen(false);
    resetForm();
    toast({ title: 'Nhập kho thành công', description: `Đã cộng thêm ${quantityInput} sản phẩm vào kho.`, type: 'success' });
  };

  const handleStockOutSubmit = () => {
    if (!targetProductId || !quantityInput || Number(quantityInput) <= 0) {
      toast({ title: 'Dữ liệu không hợp lệ', description: 'Vui lòng chọn sản phẩm và số lượng > 0.', type: 'warning' });
      return;
    }
    try {
      stockOut(targetProductId, Number(quantityInput), sourceReasonInput, notesInput);
      setIsStockOutOpen(false);
      resetForm();
      toast({ title: 'Xuất kho thành công', description: `Đã trừ ${quantityInput} sản phẩm khỏi kho.`, type: 'success' });
    } catch (err) {
      toast({ title: 'Lỗi xuất kho', description: err.message, type: 'error' });
    }
  };

  const handleAdjustSubmit = () => {
    if (!targetProductId || quantityInput === '' || Number(quantityInput) < 0) {
      toast({ title: 'Dữ liệu không hợp lệ', description: 'Vui lòng nhập số tồn kho mới >= 0.', type: 'warning' });
      return;
    }
    stockAdjustment(targetProductId, Number(quantityInput), sourceReasonInput || 'Điều chỉnh kiểm kê');
    setIsAdjustOpen(false);
    resetForm();
    toast({ title: 'Điều chỉnh thành công', description: 'Đã cập nhật lại số lượng tồn kho thực tế.', type: 'success' });
  };

  const resetForm = () => {
    setTargetProductId('');
    setQuantityInput('');
    setSourceReasonInput('');
    setNotesInput('');
  };

  const handleApplyStockTake = () => {
    const updatedKeys = Object.keys(stockTakeCounts);
    if (updatedKeys.length === 0) {
      toast({ title: 'Chưa có thay đổi', description: 'Vui lòng nhập số đếm thực tế của ít nhất 1 sản phẩm.', type: 'info' });
      return;
    }

    updatedKeys.forEach((id) => {
      const actual = Number(stockTakeCounts[id]);
      if (!isNaN(actual)) {
        stockAdjustment(id, actual, 'Khớp số liệu kiểm kê kho thực tế');
      }
    });

    setStockTakeCounts({});
    toast({ title: 'Hoàn tất kiểm kê', description: `Đã đồng bộ ${updatedKeys.length} sản phẩm theo số đếm thực tế.`, type: 'success' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý tồn kho & Kiểm kê (Inventory)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi vị trí kệ, biến động xuất nhập tồn, tự động tính Days of Inventory (DOI) và hỗ trợ kiểm kê định kỳ.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsStockInOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <ArrowDownRight className="w-4 h-4" />
            Nhập kho
          </button>

          <button
            onClick={() => setIsStockOutOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            Xuất kho
          </button>

          <button
            onClick={() => setIsAdjustOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-muted"
          >
            Điều chỉnh tồn
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Tổng giá trị vốn trong kho</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{formatVND(totalInventoryValue)}</h3>
          <span className="text-xs text-muted-foreground mt-1 inline-block">Tính theo giá vốn nhập</span>
        </div>

        <div className="bg-card p-4 rounded-xl border border-red-200/60 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Hết hàng hoàn toàn (0 sp)</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount} mặt hàng</h3>
          <span className="text-xs text-red-700 font-medium mt-1 inline-block">Mất cơ hội bán</span>
        </div>

        <div className="bg-card p-4 rounded-xl border border-amber-200/60 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Sắp hết hàng (Dưới ngưỡng)</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{lowStockCount} mặt hàng</h3>
          <span className="text-xs text-amber-700 font-medium mt-1 inline-block">Cần đặt hàng sớm</span>
        </div>

        <div className="bg-card p-4 rounded-xl border border-blue-200/60 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Tồn kho nhiều (Vốn đọng)</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">{overstockCount} mặt hàng</h3>
          <span className="text-xs text-blue-700 font-medium mt-1 inline-block">Cần đẩy mạnh xả hàng</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'balances'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Tồn kho hiện tại ({products.length} SKU)
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'movements'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Lịch sử xuất nhập tồn ({movements.length})
        </button>
        <button
          onClick={() => setActiveTab('stocktake')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'stocktake'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Phiên kiểm kê kho
        </button>
      </div>

      {/* Tab 1: Current Balances */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-muted-foreground font-medium">Lọc tình trạng:</span>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'OUT', label: `Hết hàng (${outOfStockCount})` },
                { key: 'LOW', label: `Sắp hết (${lowStockCount})` },
                { key: 'OVER', label: `Tồn nhiều (${overstockCount})` },
                { key: 'NORMAL', label: 'Bình thường' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSelectedStockFilter(f.key)}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    selectedStockFilter === f.key
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm SKU, tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Sản phẩm / SKU</th>
                    <th className="py-3 px-4">Danh mục</th>
                    <th className="py-3 px-4 text-center">Tồn hiện tại</th>
                    <th className="py-3 px-4 text-center">Ngưỡng an toàn</th>
                    <th className="py-3 px-4 text-right">Giá vốn</th>
                    <th className="py-3 px-4 text-right">Tổng giá trị tồn</th>
                    <th className="py-3 px-4">Trạng thái kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((p) => {
                    const isOut = p.stock === 0;
                    const isLow = p.stock > 0 && p.stock <= (p.alertThreshold || 10);
                    const isOver = p.stock >= 50;

                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground text-sm">{p.name}</div>
                          <span className="font-mono text-muted-foreground text-[11px]">SKU: {p.sku}</span>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {p.categoryLabel}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-base font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-foreground'}`}>
                            {p.stock}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-1">{p.unit}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-muted-foreground font-medium">
                          {p.alertThreshold || 10} {p.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right text-muted-foreground">
                          {formatVND(p.costPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-foreground">
                          {formatVND(p.stock * p.costPrice)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              isOut
                                ? 'bg-red-100 text-red-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : isOver
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? 'Đã hết hàng' : isLow ? 'Sắp hết hàng' : isOver ? 'Tồn quá nhiều' : 'Tồn ổn định'}
                          </span>
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

      {/* Tab 2: Movements */}
      {activeTab === 'movements' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h3 className="font-bold text-sm text-foreground">Nhật ký chuyển kho (Stock Movements)</h3>
            <span className="text-xs text-muted-foreground">Lưu vết tất cả hoạt động xuất, nhập, điều chỉnh</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Loại giao dịch</th>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4 text-center">Số lượng</th>
                  <th className="py-3 px-4">Biến động (Trước → Sau)</th>
                  <th className="py-3 px-4">Nguồn / Lý do</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          m.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.type === 'OUT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {m.typeLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {m.productName}
                      <span className="block text-[10px] text-muted-foreground font-mono">{m.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-sm">
                      {m.type === 'IN' ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {m.beforeStock} → <strong className="text-foreground">{m.afterStock}</strong>
                    </td>
                    <td className="py-3 px-4 text-foreground">{m.source}</td>
                    <td className="py-3 px-4 text-muted-foreground">{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stock-take (Kiểm kê) */}
      {activeTab === 'stocktake' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="font-bold text-sm text-blue-900">Bảng nhập số lượng thực đếm (Stock-take Form)</h4>
              <p className="text-xs text-blue-700 mt-0.5">
                Nhập số lượng thực tế đếm tại quầy/kệ. Hệ thống sẽ tự động tính chênh lệch so với số liệu tồn kho.
              </p>
            </div>
            <button
              onClick={handleApplyStockTake}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
            >
              Hoàn tất kiểm kê & Đồng bộ
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Sản phẩm / SKU</th>
                    <th className="py-3 px-4 text-center">Tồn trên hệ thống</th>
                    <th className="py-3 px-4 text-center w-40">Số đếm thực tế</th>
                    <th className="py-3 px-4 text-center">Chênh lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p) => {
                    const actualCount = stockTakeCounts[p.id];
                    const hasEntered = actualCount !== undefined && actualCount !== '';
                    const diff = hasEntered ? Number(actualCount) - p.stock : 0;

                    return (
                      <tr key={p.id}>
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground text-sm block">{p.name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">{p.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-base text-foreground">
                          {p.stock}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            placeholder={String(p.stock)}
                            value={actualCount ?? ''}
                            onChange={(e) =>
                              setStockTakeCounts({ ...stockTakeCounts, [p.id]: e.target.value })
                            }
                            className="w-24 px-2 py-1 text-center font-bold border border-border rounded-md bg-card focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasEntered ? (
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-xs ${
                                diff === 0
                                  ? 'bg-slate-100 text-slate-700'
                                  : diff > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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

      {/* Modal: Nhập kho */}
      {isStockInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                Phiếu nhập kho bổ sung
              </h3>
              <button onClick={() => setIsStockInOpen(false)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Chọn sản phẩm</label>
                <select
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Tồn hiện tại: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Số lượng nhập thêm</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 30"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Nhà cung cấp / Nguồn nhập</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Công ty Acecook VN"
                  value={sourceReasonInput}
                  onChange={(e) => setSourceReasonInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-card"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Ghi chú phiếu nhập</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lô date mới 2027..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-card"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button onClick={() => setIsStockInOpen(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold">
                Hủy
              </button>
              <button onClick={handleStockInSubmit} className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">
                Xác nhận nhập kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xuất kho */}
      {isStockOutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
                Phiếu xuất kho
              </h3>
              <button onClick={() => setIsStockOutOpen(false)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Chọn sản phẩm</label>
                <select
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Tồn khả dụng: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Số lượng xuất</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 5"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Lý do xuất</label>
                <select
                  value={sourceReasonInput}
                  onChange={(e) => setSourceReasonInput(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card"
                >
                  <option value="Xuất bán lẻ">Xuất bán lẻ</option>
                  <option value="Xuất sỉ / đại lý">Xuất sỉ / đại lý</option>
                  <option value="Xuất hủy hàng hỏng/hết hạn">Xuất hủy hàng hỏng/hết hạn</option>
                  <option value="Hàng mẫu trưng bày">Hàng mẫu trưng bày</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button onClick={() => setIsStockOutOpen(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold">
                Hủy
              </button>
              <button onClick={handleStockOutSubmit} className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700">
                Xác nhận xuất kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Điều chỉnh */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Điều chỉnh số lượng tồn kho</h3>
              <button onClick={() => setIsAdjustOpen(false)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Chọn sản phẩm</label>
                <select
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Tồn hiện tại: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Số tồn mới thực tế</label>
                <input
                  type="number"
                  placeholder="Nhập số tồn chính xác"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Lý do điều chỉnh (Bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiểm kê khớp lại sau ngày 30/9..."
                  value={sourceReasonInput}
                  onChange={(e) => setSourceReasonInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-card"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button onClick={() => setIsAdjustOpen(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold">
                Hủy
              </button>
              <button onClick={handleAdjustSubmit} className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
                Lưu điều chỉnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
