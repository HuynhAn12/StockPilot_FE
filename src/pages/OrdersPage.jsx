import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Plus, Search, Filter, CheckCircle2, Clock,
  XCircle, ArrowRight, Printer, Eye, Trash2, AlertCircle,
  Package, DollarSign, Store, Tag, ChevronDown, Check, X,
  Banknote, QrCode, CreditCard, RefreshCw, FileText
} from 'lucide-react';
import { useOrderStore } from '../components/store/orderStore';
import { useToast } from '../components/common/Toast';
import { docSoThanhChu } from '../utils/numberToWordsVN';

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}

function getPaymentBadge(method) {
  const m = String(method || 'CASH').toUpperCase();
  if (m === 'BANK_TRANSFER') {
    return {
      label: 'Chuyển khoản',
      icon: QrCode,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    };
  }
  if (m === 'PAYOS' || m === 'WALLET') {
    return {
      label: 'Ví điện tử',
      icon: CreditCard,
      className: 'bg-purple-100 text-purple-800 border-purple-200',
    };
  }
  return {
    label: 'Tiền mặt',
    icon: Banknote,
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orders, isLoading, fetchOrders, fulfillOrder, cancelOrder } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, []);

  const [activeTab, setActiveTab] = useState('ALL'); // ALL | FULFILLED | CONFIRMED | CANCELED
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL'); // ALL | CASH | BANK_TRANSFER | PAYOS
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewOrderDetail, setViewOrderDetail] = useState(null);
  const [printReceiptData, setPrintReceiptData] = useState(null);

  // Normalized orders list
  const normalizedOrders = useMemo(() => {
    return orders.map((o) => {
      const pm = o.payments?.[0]?.method || o.paymentMethod || 'CASH';
      const itemsCount = o.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || o.items?.length || 0;
      const totalAmount = Number(o.totalAmount || 0);

      return {
        ...o,
        orderId: o.orderNumber || `HD-${o.id}`,
        paymentMethod: pm,
        totalAmount,
        itemsCount,
        customerName: o.customerName || 'Khách lẻ',
      };
    });
  }, [orders]);

  // Payment Breakdown Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cashCount = 0;
    let cashTotal = 0;
    let transferCount = 0;
    let transferTotal = 0;
    let walletCount = 0;
    let walletTotal = 0;

    normalizedOrders.forEach((o) => {
      if (o.status !== 'CANCELED' && o.status !== 'CANCELLED') {
        totalRevenue += o.totalAmount;
        if (o.paymentMethod === 'BANK_TRANSFER') {
          transferCount++;
          transferTotal += o.totalAmount;
        } else if (o.paymentMethod === 'PAYOS' || o.paymentMethod === 'WALLET') {
          walletCount++;
          walletTotal += o.totalAmount;
        } else {
          cashCount++;
          cashTotal += o.totalAmount;
        }
      }
    });

    return {
      totalRevenue,
      cashCount,
      cashTotal,
      transferCount,
      transferTotal,
      walletCount,
      walletTotal,
    };
  }, [normalizedOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return normalizedOrders.filter((o) => {
      // Status filter
      if (activeTab !== 'ALL') {
        if (activeTab === 'FULFILLED' && o.status !== 'FULFILLED' && o.status !== 'COMPLETED') return false;
        if (activeTab === 'CONFIRMED' && o.status !== 'CONFIRMED' && o.status !== 'DRAFT') return false;
        if (activeTab === 'CANCELED' && o.status !== 'CANCELED' && o.status !== 'CANCELLED') return false;
      }

      // Payment method filter
      if (selectedPaymentMethod !== 'ALL') {
        if (selectedPaymentMethod === 'CASH' && o.paymentMethod !== 'CASH') return false;
        if (selectedPaymentMethod === 'BANK_TRANSFER' && o.paymentMethod !== 'BANK_TRANSFER') return false;
        if (selectedPaymentMethod === 'PAYOS' && o.paymentMethod !== 'PAYOS' && o.paymentMethod !== 'WALLET') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          o.orderId.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.customerPhone && o.customerPhone.includes(q))
        );
      }

      return true;
    });
  }, [normalizedOrders, activeTab, selectedPaymentMethod, searchQuery]);

  const handlePrintReceipt = (ord) => {
    const receipt = {
      orderNumber: ord.orderId,
      createdAt: new Date(ord.createdAt).toLocaleString('vi-VN'),
      customerName: ord.customerName,
      customerPhone: ord.customerPhone || '',
      cashier: 'Thu ngân tại quầy',
      storeName: 'STOCKPILOT STORE',
      storeAddress: 'Chi nhánh bán hàng trực tiếp tại quầy',
      storePhone: '0978.387.857',
      items: ord.items?.map((it) => ({
        name: it.nameSnapshot || it.name || `Sản phẩm #${it.stockItemId}`,
        sku: it.skuSnapshot || it.sku || '',
        price: Number(it.unitPriceSnapshot || it.price || 0),
        quantity: it.quantity,
        subtotal: Number(it.subtotal || 0),
      })) || [],
      subtotal: Number(ord.subtotalAmount || ord.totalAmount),
      discount: Number(ord.discountAmount || 0),
      total: ord.totalAmount,
      amountGiven: ord.totalAmount,
      changeDue: 0,
      totalInWords: docSoThanhChu(ord.totalAmount),
      paymentMethod: ord.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : ord.paymentMethod === 'PAYOS' ? 'Ví điện tử' : 'Tiền mặt',
    };

    setPrintReceiptData(receipt);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Đơn hàng & Bán lẻ (Tại quầy)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý danh sách đơn bán hàng trực tiếp tại quầy & theo dõi dòng tiền theo phương thức thanh toán: Tiền mặt, Chuyển khoản, Ví điện tử.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrders()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Mở quầy bán hàng (POS)
          </button>
        </div>
      </div>

      {/* KPI Cards: Revenue & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Tổng doanh thu tại quầy</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{formatVND(metrics.totalRevenue)}</h3>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            Từ {normalizedOrders.length} đơn bán lẻ
          </span>
        </div>

        {/* Cash Payments */}
        <div className="bg-card p-4 rounded-xl border border-emerald-200/70 shadow-sm bg-emerald-50/10">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Tiền mặt
            </p>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {metrics.cashCount} đơn
            </span>
          </div>
          <h3 className="text-xl font-bold text-emerald-600 mt-2">{formatVND(metrics.cashTotal)}</h3>
          <span className="text-[11px] text-muted-foreground mt-1 block">Thu ngân giữ tại két</span>
        </div>

        {/* Bank Transfer Payments */}
        <div className="bg-card p-4 rounded-xl border border-blue-200/70 shadow-sm bg-blue-50/10">
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-700 font-semibold flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-blue-600" /> Chuyển khoản VietQR
            </p>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
              {metrics.transferCount} đơn
            </span>
          </div>
          <h3 className="text-xl font-bold text-blue-600 mt-2">{formatVND(metrics.transferTotal)}</h3>
          <span className="text-[11px] text-muted-foreground mt-1 block">Tiền về tài khoản ngân hàng</span>
        </div>

        {/* E-Wallet / Card */}
        <div className="bg-card p-4 rounded-xl border border-purple-200/70 shadow-sm bg-purple-50/10">
          <div className="flex items-center justify-between">
            <p className="text-xs text-purple-700 font-semibold flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Ví điện tử / Thẻ
            </p>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
              {metrics.walletCount} đơn
            </span>
          </div>
          <h3 className="text-xl font-bold text-purple-600 mt-2">{formatVND(metrics.walletTotal)}</h3>
          <span className="text-[11px] text-muted-foreground mt-1 block">Cổng thanh toán điện tử</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'ALL', label: 'Tất cả đơn' },
            { key: 'FULFILLED', label: 'Đã hoàn tất / Xuất kho' },
            { key: 'CONFIRMED', label: 'Chờ thanh toán' },
            { key: 'CANCELED', label: 'Đã hủy' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm mã đơn, khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Payment Method Pills (Chuyển khoản | Tiền mặt | Ví điện tử) */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-muted-foreground font-semibold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Lọc hình thức thanh toán:
        </span>
        {[
          { key: 'ALL', label: 'Tất cả hình thức' },
          { key: 'CASH', label: 'Tiền mặt', icon: Banknote },
          { key: 'BANK_TRANSFER', label: 'Chuyển khoản (VietQR)', icon: QrCode },
          { key: 'PAYOS', label: 'Ví điện tử / Thẻ', icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = selectedPaymentMethod === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setSelectedPaymentMethod(item.key)}
              className={`px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 text-xs ${
                isSelected
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Mã đơn hàng</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Hình thức thanh toán</th>
                <th className="py-3 px-4 text-center">Số lượng</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="font-semibold text-sm">Không tìm thấy đơn hàng nào.</p>
                    <p className="text-xs mt-1">Bạn có thể vào quầy POS để tạo hóa đơn bán lẻ mới.</p>
                    <button
                      onClick={() => navigate('/pos')}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tạo đơn ngay
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const badge = getPaymentBadge(ord.paymentMethod);
                  const BadgeIcon = badge.icon;
                  const isFulfilled = ord.status === 'FULFILLED' || ord.status === 'COMPLETED';

                  return (
                    <tr key={ord.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {ord.orderId}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(ord.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">{ord.customerName}</p>
                        {ord.customerPhone && (
                          <p className="text-[11px] text-muted-foreground">{ord.customerPhone}</p>
                        )}
                      </td>

                      {/* Payment Method Column */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-bold ${badge.className}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-medium text-foreground">
                        {ord.itemsCount} sp
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-foreground text-sm">
                        {formatVND(ord.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                            isFulfilled
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'CANCELED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isFulfilled ? <CheckCircle2 className="w-3 h-3" /> : null}
                          {isFulfilled ? 'Hoàn tất' : ord.status === 'CANCELED' ? 'Đã hủy' : 'Đã xác nhận'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewOrderDetail(ord)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handlePrintReceipt(ord)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-blue-600"
                            title="In hóa đơn bán hàng"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: ORDER DETAILS ─── */}
      {viewOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Chi tiết đơn hàng {viewOrderDetail.orderId}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Thời gian: {new Date(viewOrderDetail.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setViewOrderDetail(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Payment Badge */}
            <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Khách hàng</p>
                <p className="font-bold text-sm text-foreground">{viewOrderDetail.customerName}</p>
                {viewOrderDetail.customerPhone && (
                  <p className="text-xs text-muted-foreground">{viewOrderDetail.customerPhone}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground text-right mb-1">Hình thức thanh toán</p>
                {(() => {
                  const b = getPaymentBadge(viewOrderDetail.paymentMethod);
                  const Icon = b.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-bold ${b.className}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{b.label}</span>
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Danh sách hàng hóa</p>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
                {viewOrderDetail.items?.map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{it.nameSnapshot || it.name || `Sản phẩm #${it.stockItemId}`}</p>
                      <p className="text-muted-foreground">
                        {it.quantity} x {formatVND(it.unitPriceSnapshot || it.price)}
                      </p>
                    </div>
                    <span className="font-bold text-foreground">
                      {formatVND(it.subtotal || it.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="pt-2 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng tiền hàng:</span>
                <span className="font-semibold text-foreground">
                  {formatVND(viewOrderDetail.subtotalAmount || viewOrderDetail.totalAmount)}
                </span>
              </div>
              {viewOrderDetail.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Chiết khấu:</span>
                  <span>-{formatVND(viewOrderDetail.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t border-border">
                <span>Tổng thanh toán:</span>
                <span className="text-blue-600">{formatVND(viewOrderDetail.totalAmount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setViewOrderDetail(null);
                  handlePrintReceipt(viewOrderDetail);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRINT RECEIPT PREVIEW MODAL ─── */}
      {printReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-white text-black w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center print:hidden">
              <span className="text-xs font-bold text-gray-700">Xem trước hóa đơn in</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Printer className="w-3.5 h-3.5" /> In ngay
                </button>
                <button
                  onClick={() => setPrintReceiptData(null)}
                  className="p-1 rounded-lg hover:bg-gray-200 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Layout */}
            <div id="receipt-print-area" className="p-8 overflow-y-auto space-y-4 text-xs font-sans text-gray-800 bg-white">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold tracking-wide uppercase text-blue-700">
                  {printReceiptData.storeName}
                </h2>
                <p className="text-[11px] text-gray-500">{printReceiptData.storeAddress}</p>
                <p className="text-[11px] text-gray-500">Điện thoại: {printReceiptData.storePhone}</p>
                <h3 className="text-base font-bold uppercase mt-3 text-black">HÓA ĐƠN BÁN HÀNG</h3>
                <p className="text-[11px] text-gray-600 font-mono">Số HĐ: {printReceiptData.orderNumber}</p>
                <p className="text-[11px] text-gray-500">Ngày: {printReceiptData.createdAt}</p>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Khách hàng: <strong>{printReceiptData.customerName}</strong></span>
                  {printReceiptData.customerPhone && <span>SĐT: {printReceiptData.customerPhone}</span>}
                </div>
                <div className="flex justify-between">
                  <span>Thu ngân: {printReceiptData.cashier}</span>
                  <span>Phương thức: {printReceiptData.paymentMethod}</span>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="py-1.5 font-bold">Tên hàng hóa</th>
                    <th className="py-1.5 text-center font-bold">SL</th>
                    <th className="py-1.5 text-right font-bold">Đơn giá</th>
                    <th className="py-1.5 text-right font-bold">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {printReceiptData.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 pr-2">
                        <span className="font-semibold block">{it.name}</span>
                        {it.sku && <span className="text-[10px] text-gray-400 font-mono">{it.sku}</span>}
                      </td>
                      <td className="py-1.5 text-center">{it.quantity}</td>
                      <td className="py-1.5 text-right">{it.price.toLocaleString('vi-VN')}</td>
                      <td className="py-1.5 text-right font-bold">{it.subtotal.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền hàng:</span>
                  <span className="font-semibold">{formatVND(printReceiptData.subtotal)}</span>
                </div>
                {printReceiptData.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chiết khấu:</span>
                    <span className="font-semibold">-{formatVND(printReceiptData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300 text-black">
                  <span>Tổng thanh toán:</span>
                  <span>{formatVND(printReceiptData.total)}</span>
                </div>
              </div>

              <div className="pt-1 italic text-[11px] text-gray-600">
                ({printReceiptData.totalInWords})
              </div>

              <div className="text-center pt-4 border-t border-dashed border-gray-300 space-y-1">
                <p className="font-bold text-gray-800">Cảm ơn và hẹn gặp lại Quý khách!</p>
                <p className="text-[10px] text-gray-400">Hệ thống StockPilot POS Retail</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
