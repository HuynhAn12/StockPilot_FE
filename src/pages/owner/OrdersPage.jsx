import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Plus, Search, Filter, CheckCircle2, Clock,
  XCircle, ArrowRight, Printer, Eye, Trash2, AlertCircle,
  Package, DollarSign, Store, Tag, ChevronDown, Check, X,
  Banknote, QrCode, CreditCard, RefreshCw, FileText, Send, Receipt,
  User, Users, Phone, MapPin, AlertTriangle, CheckSquare, Undo2,
  Copy, TrendingUp, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { useOrderStore } from '../../components/store/orderStore';
import { useProductStore } from '../../components/store/productStore';
import { useToast } from '../../components/common/Toast';
import { useAuthStore } from '../../store/authStore';
import { canCancelOrder, canViewOrderFinancialSummary, isStaff } from '../../config/permissions.config';
import { docSoThanhChu } from '../../utils/numberToWordsVN';
import { useTranslation } from '../../i18n/useTranslation';
import { ReceiptPrintContent, ReceiptPrintPortal } from '../../components/pos/ReceiptPrintView';


function safeNum(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'object') {
    if (typeof val.toNumber === 'function') return val.toNumber();
    if (Array.isArray(val.d) && val.d.length > 0) {
      return Number(val.d[0]) * (val.s < 0 ? -1 : 1);
    }
    return 0;
  }
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function formatVND(n) {
  return safeNum(n).toLocaleString('vi-VN') + ' đ';
}

function getPaymentBadge(method, isEn = false) {
  const m = String(method || 'CASH').toUpperCase();
  if (m === 'BANK_TRANSFER') {
    return {
      label: isEn ? 'Bank Transfer' : 'Chuyển khoản',
      icon: QrCode,
      className: 'bg-blue-50 text-blue-700 border-blue-200/80',
      dotColor: 'bg-blue-500',
    };
  }
  if (m === 'MOMO') {
    return {
      label: isEn ? 'MoMo Wallet' : 'Ví MoMo',
      icon: CreditCard,
      className: 'bg-pink-50 text-pink-700 border-pink-200/80',
      dotColor: 'bg-pink-500',
    };
  }
  if (m === 'PAYOS' || m === 'WALLET') {
    return {
      label: 'VietQR PayOS',
      icon: CreditCard,
      className: 'bg-purple-50 text-purple-700 border-purple-200/80',
      dotColor: 'bg-purple-500',
    };
  }
  return {
    label: isEn ? 'Cash' : 'Tiền mặt',
    icon: Banknote,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
  };
}

function getStatusBadge(status, isEn = false) {
  switch (status) {
    case 'FULFILLED':
    case 'COMPLETED':
      return {
        label: isEn ? 'Completed / Dispatched' : 'Hoàn tất / Xuất kho',
        icon: CheckCircle2,
        className: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80',
        dotColor: 'bg-emerald-500',
      };
    case 'CONFIRMED':
      return {
        label: isEn ? 'Confirmed / Deducted' : 'Đã xác nhận / Đã trừ kho',
        icon: Check,
        className: 'bg-blue-50/90 text-blue-700 border-blue-200/80',
        dotColor: 'bg-blue-500',
      };
    case 'DRAFT':
      return {
        label: isEn ? 'Draft' : 'Đơn nháp',
        icon: Clock,
        className: 'bg-amber-50/90 text-amber-700 border-amber-200/80',
        dotColor: 'bg-amber-500',
      };
    case 'CANCELED':
    case 'CANCELLED':
      return {
        label: isEn ? 'Cancelled' : 'Đã hủy',
        icon: XCircle,
        className: 'bg-rose-50/90 text-rose-700 border-rose-200/80',
        dotColor: 'bg-rose-500',
      };
    default:
      return {
        label: status || (isEn ? 'Unknown' : 'Không rõ'),
        icon: Clock,
        className: 'bg-slate-50 text-slate-700 border-slate-200/80',
        dotColor: 'bg-slate-400',
      };
  }
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getFirstDayOfWeekVN(year, monthIndex) {
  const day = new Date(year, monthIndex, 1).getDay();
  return (day + 6) % 7; // Monday = 0, Sunday = 6
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const isEn = language === 'en';
  const staffMode = isStaff(user?.role);
  const canSeeFinancials = canViewOrderFinancialSummary(user?.role);
  const canCancel = canCancelOrder(user?.role);

  const {
    orders,
    pagination,
    metrics: backendMetrics,
    timeframeCounts: backendTimeframeCounts,
    isLoading,
    fetchOrders,
    createOrder,
    confirmOrder,
    fulfillOrder,
    cancelOrder
  } = useOrderStore();
  const { products, fetchProducts } = useProductStore();

  const [activeTab, setActiveTab] = useState('TODAY'); // Luôn mặc định là TODAY (Hôm nay) khi vào trang hoặc F5
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL'); // ALL | CASH | BANK_TRANSFER | PAYOS
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Custom date/month picker state
  const [customFilterMode, setCustomFilterMode] = useState('day'); // 'day' | 'month'
  const [selectedCustomDate, setSelectedCustomDate] = useState('2026-10-17');
  const [selectedCustomMonth, setSelectedCustomMonth] = useState('2026-10');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerMonthIndex, setPickerMonthIndex] = useState(9); // 0-indexed: 9 = Tháng 10

  const getDateRangeForTab = (
    tab = activeTab,
    mode = customFilterMode,
    dayStr = selectedCustomDate,
    monthStr = selectedCustomMonth
  ) => {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 3600000);
    const vnYear = vnNow.getUTCFullYear();
    const vnMonth = vnNow.getUTCMonth();
    const vnDate = vnNow.getUTCDate();

    if (tab === 'TODAY') {
      return {
        from: new Date(Date.UTC(vnYear, vnMonth, vnDate, -7, 0, 0, 0)).toISOString(),
        to: undefined,
      };
    }
    if (tab === '3DAYS') {
      return {
        from: new Date(Date.UTC(vnYear, vnMonth, vnDate - 2, -7, 0, 0, 0)).toISOString(),
        to: undefined,
      };
    }
    if (tab === '7DAYS') {
      return {
        from: new Date(Date.UTC(vnYear, vnMonth, vnDate - 6, -7, 0, 0, 0)).toISOString(),
        to: undefined,
      };
    }
    if (tab === '30DAYS') {
      return {
        from: new Date(Date.UTC(vnYear, vnMonth, vnDate - 29, -7, 0, 0, 0)).toISOString(),
        to: undefined,
      };
    }
    if (tab === 'CUSTOM') {
      if (mode === 'day') {
        const [y, m, d] = (dayStr || '2026-10-17').split('-').map(Number);
        return {
          from: new Date(Date.UTC(y, m - 1, d, -7, 0, 0, 0)).toISOString(),
          to: new Date(Date.UTC(y, m - 1, d, 16, 59, 59, 999)).toISOString(),
        };
      }
      if (mode === 'month') {
        const [y, m] = (monthStr || '2026-10').split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        return {
          from: new Date(Date.UTC(y, m - 1, 1, -7, 0, 0, 0)).toISOString(),
          to: new Date(Date.UTC(y, m - 1, lastDay, 16, 59, 59, 999)).toISOString(),
        };
      }
    }
    return { from: undefined, to: undefined }; // ALL
  };

  const loadOrders = (
    tab = activeTab,
    page = currentPage,
    search = searchQuery,
    mode = customFilterMode,
    dayStr = selectedCustomDate,
    monthStr = selectedCustomMonth
  ) => {
    const { from, to } = getDateRangeForTab(tab, mode, dayStr, monthStr);
    fetchOrders({
      page,
      limit: 50,
      search: search.trim() || undefined,
      from,
      to,
    });
  };

  useEffect(() => {
    loadOrders('TODAY', 1, '');
    fetchProducts();

    const handleSync = () => {
      loadOrders();
      fetchProducts();
    };
    window.addEventListener('stockpilot_product_updated', handleSync);

    let bc = null;
    try {
      bc = new BroadcastChannel('stockpilot_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PRODUCTS_UPDATED' || event.data?.type === 'ORDERS_UPDATED') {
          loadOrders();
          fetchProducts();
        }
      };
    } catch (_) {}

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadOrders();
        fetchProducts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('stockpilot_product_updated', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (bc) bc.close();
    };
  }, []);

  // Modals & popups
  const [viewOrderDetail, setViewOrderDetail] = useState(null);
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const [cancelReasonText, setCancelReasonText] = useState('Khách yêu cầu hủy');
  const [actionLoading, setActionLoading] = useState(false);

  // New order form state
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newOrderNote, setNewOrderNote] = useState('');
  const [newDiscount, setNewDiscount] = useState(0);
  const [newOrderItems, setNewOrderItems] = useState([
    { stockItemId: null, quantity: 1, sellingPrice: 0, name: '' },
  ]);

  // Normalized orders list
  const normalizedOrders = useMemo(() => {
    return orders.map((o) => {
      const pm = o.payments?.[0]?.method || o.paymentMethod || 'CASH';
      const itemsCount = o.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || o.items?.length || 0;
      const totalAmount = safeNum(o.totalAmount);

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

  // 1. Orders filtered by selected Date Range (authoritative from backend API)
  const dateFilteredOrders = useMemo(() => {
    return normalizedOrders;
  }, [normalizedOrders]);

  // 2. Metrics dynamically calculated from the selected date range
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let customerCount = 0;
    let totalSoldQuantity = 0;
    let cashCount = 0;
    let transferCount = 0;
    let walletCount = 0;
    let draftCount = 0;
    let confirmedCount = 0;
    let fulfilledCount = 0;
    let canceledCount = 0;

    let cashTotal = 0;
    let transferTotal = 0;
    let walletTotal = 0;

    dateFilteredOrders.forEach((o) => {
      if (o.status === 'DRAFT') draftCount++;
      if (o.status === 'CONFIRMED') confirmedCount++;
      if (o.status === 'FULFILLED' || o.status === 'COMPLETED') fulfilledCount++;
      if (o.status === 'CANCELED' || o.status === 'CANCELLED') canceledCount++;

      if (o.status !== 'CANCELED' && o.status !== 'CANCELLED') {
        customerCount++;
        totalRevenue += o.totalAmount;
        totalSoldQuantity += (o.itemsCount || 0);

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
      customerCount,
      totalSoldQuantity,
      orderCount: dateFilteredOrders.length,
      cashCount,
      transferCount,
      walletCount,
      draftCount,
      confirmedCount,
      fulfilledCount,
      canceledCount,
      cashTotal,
      transferTotal,
      walletTotal,
    };
  }, [dateFilteredOrders]);

  // 3. Pre-calculated counts for all date range tabs
  const dateCounts = useMemo(() => {
    let all = normalizedOrders.length;
    let today = 0;
    let threeDays = 0;
    let sevenDays = 0;
    let thirtyDays = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOf3Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).getTime();
    const startOf7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
    const startOf30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29).getTime();

    normalizedOrders.forEach((o) => {
      const t = new Date(o.createdAt).getTime();
      if (!isNaN(t)) {
        if (t >= startOfToday) today++;
        if (t >= startOf3Days) threeDays++;
        if (t >= startOf7Days) sevenDays++;
        if (t >= startOf30Days) thirtyDays++;
      }
    });

    return { all, today, threeDays, sevenDays, thirtyDays };
  }, [normalizedOrders]);

  // Effective metrics & timeframe counts (prioritizing backend aggregated store totals)
  const effectiveMetrics = backendMetrics || metrics;
  const effectiveTimeframeCounts = backendTimeframeCounts || dateCounts;

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
    loadOrders(key, 1, searchQuery, customFilterMode, selectedCustomDate, selectedCustomMonth);
  };

  const handleCustomModeChange = (newMode) => {
    setCustomFilterMode(newMode);
    setIsMonthPickerOpen(false);
    setIsDayPickerOpen(false);
    setCurrentPage(1);
    loadOrders('CUSTOM', 1, searchQuery, newMode, selectedCustomDate, selectedCustomMonth);
  };

  const handleCustomDateChange = (newDate) => {
    setSelectedCustomDate(newDate);
    setCurrentPage(1);
    loadOrders('CUSTOM', 1, searchQuery, 'day', newDate, selectedCustomMonth);
  };

  const handleCustomMonthChange = (newMonth) => {
    setSelectedCustomMonth(newMonth);
    setCurrentPage(1);
    loadOrders('CUSTOM', 1, searchQuery, 'month', selectedCustomDate, newMonth);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    loadOrders(activeTab, newPage, searchQuery, customFilterMode, selectedCustomDate, selectedCustomMonth);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders(activeTab, 1, searchQuery, customFilterMode, selectedCustomDate, selectedCustomMonth);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtered orders for table (filtered by client payment method pill)
  const filteredOrders = useMemo(() => {
    return normalizedOrders.filter((o) => {
      if (selectedPaymentMethod !== 'ALL') {
        if (selectedPaymentMethod === 'CASH' && o.paymentMethod !== 'CASH') return false;
        if (selectedPaymentMethod === 'BANK_TRANSFER' && o.paymentMethod !== 'BANK_TRANSFER') return false;
        if (selectedPaymentMethod === 'PAYOS' && o.paymentMethod !== 'PAYOS' && o.paymentMethod !== 'WALLET') return false;
      }
      return true;
    });
  }, [normalizedOrders, selectedPaymentMethod]);

  const getTimeframeDescription = (type = 'orders') => {
    if (isEn) {
      let typeLabel = 'Orders';
      if (type === 'revenue' || type === 'Doanh thu') typeLabel = 'Revenue';
      else if (type === 'sold' || type === 'Xuất bán') typeLabel = 'Sold';
      
      if (activeTab === 'TODAY') return `${typeLabel} today`;
      if (activeTab === '3DAYS') return `${typeLabel} past 3 days`;
      if (activeTab === '7DAYS') return `${typeLabel} in 7 days`;
      if (activeTab === '30DAYS') return `${typeLabel} in 30 days`;
      if (activeTab === 'CUSTOM') {
        if (customFilterMode === 'day') {
          const parts = (selectedCustomDate || '').split('-');
          return `${typeLabel} on ${parts[2] || ''}/${parts[1] || ''}/${parts[0] || ''}`;
        }
        if (customFilterMode === 'month') {
          const parts = (selectedCustomMonth || '').split('-');
          return `${typeLabel} in ${parts[1] || ''}/${parts[0] || ''}`;
        }
      }
      return `Total all-time ${typeLabel.toLowerCase()}`;
    }
    const prefix = type === 'revenue' ? 'Doanh thu' : type === 'sold' ? 'Xuất bán' : type === 'orders' ? 'Đơn phát sinh' : type;
    if (activeTab === 'TODAY') return `${prefix} hôm nay`;
    if (activeTab === '3DAYS') return `${prefix} 3 ngày qua`;
    if (activeTab === '7DAYS') return `${prefix} trong 7 ngày`;
    if (activeTab === '30DAYS') return `${prefix} trong 30 ngày`;
    if (activeTab === 'CUSTOM') {
      if (customFilterMode === 'day') {
        const parts = (selectedCustomDate || '').split('-');
        return `${prefix} ngày ${parts[2] || ''}/${parts[1] || ''}/${parts[0] || ''}`;
      }
      if (customFilterMode === 'month') {
        const parts = (selectedCustomMonth || '').split('-');
        return `${prefix} tháng ${parts[1] || ''}/${parts[0] || ''}`;
      }
    }
    return `Tổng toàn bộ ${prefix.toLowerCase()}`;
  };

  const currentTabCount = useMemo(() => {
    if (searchQuery.trim()) {
      return pagination?.total ?? filteredOrders.length;
    }
    if (activeTab === 'TODAY') return effectiveTimeframeCounts.today ?? 0;
    if (activeTab === '3DAYS') return effectiveTimeframeCounts.threeDays ?? 0;
    if (activeTab === '7DAYS') return effectiveTimeframeCounts.sevenDays ?? 0;
    if (activeTab === '30DAYS') return effectiveTimeframeCounts.thirtyDays ?? 0;
    if (activeTab === 'CUSTOM') return pagination?.total ?? effectiveMetrics.orderCount ?? 0;
    return effectiveTimeframeCounts.all ?? pagination?.total ?? effectiveMetrics.orderCount ?? 0;
  }, [activeTab, effectiveTimeframeCounts, searchQuery, pagination?.total, filteredOrders.length, effectiveMetrics.orderCount]);

  // Handle Order Actions
  const handleConfirmOrder = async (orderId) => {
    setActionLoading(true);
    try {
      await confirmOrder(orderId);
      toast.success('Đã xác nhận đơn hàng và tự động trừ kho thành công!');
      if (viewOrderDetail && viewOrderDetail.id === orderId) {
        setViewOrderDetail((prev) => ({ ...prev, status: 'CONFIRMED' }));
      }
      setActiveTab('TODAY');
      loadOrders('TODAY', 1, searchQuery);
      fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Lỗi khi xác nhận đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfillOrder = async (orderId) => {
    setActionLoading(true);
    try {
      await fulfillOrder(orderId);
      toast.success('Đã hoàn tất đơn hàng và xuất kho thành công!');
      if (viewOrderDetail && viewOrderDetail.id === orderId) {
        setViewOrderDetail((prev) => ({ ...prev, status: 'FULFILLED' }));
      }
      setActiveTab('TODAY');
      loadOrders('TODAY', 1, searchQuery);
      fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Lỗi khi hoàn tất đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrderSubmit = async () => {
    if (!cancelingOrder) return;
    const targetOrderId = cancelingOrder.id;
    const targetOrderNumber = cancelingOrder.orderId;
    setActionLoading(true);
    try {
      await cancelOrder(targetOrderId, { reason: cancelReasonText });
      toast.success(`Đã hủy đơn hàng ${targetOrderNumber}. Hàng đã được tự động hoàn lại kho và trừ doanh thu!`);
      if (viewOrderDetail && viewOrderDetail.id === targetOrderId) {
        setViewOrderDetail((prev) => ({ ...prev, status: 'CANCELED', cancelReason: cancelReasonText }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Lỗi khi hủy đơn hàng');
    } finally {
      // Luôn đóng modal ngay lập tức và giải phóng màn hình
      setCancelingOrder(null);
      setActionLoading(false);

      // Cập nhật lại toàn bộ: Luôn chuyển về tab Hôm nay và đồng bộ lại 4 thẻ thống kê cùng tồn kho
      setActiveTab('TODAY');
      loadOrders('TODAY', 1, searchQuery);
      fetchProducts();

      try {
        const bc = new BroadcastChannel('stockpilot_channel');
        bc.postMessage({ type: 'ORDERS_UPDATED' });
        bc.postMessage({ type: 'PRODUCTS_UPDATED' });
        bc.close();
      } catch (_) {}
    }
  };

  // Create new order submit
  const handleCreateOrderSubmit = async (autoConfirm = false) => {
    const validItems = newOrderItems.filter((it) => it.stockItemId && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm hợp lệ');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        customerName: newCustomerName.trim() || 'Khách lẻ',
        customerPhone: newCustomerPhone.trim() || undefined,
        customerAddress: newCustomerAddress.trim() || undefined,
        note: newOrderNote.trim() || undefined,
        discountAmount: Number(newDiscount) || 0,
        items: validItems.map((it) => ({
          stockItemId: Number(it.stockItemId),
          quantity: Number(it.quantity),
        })),
      };

      const created = await createOrder(payload);

      if (autoConfirm && created?.id) {
        await confirmOrder(created.id);
        toast.success(`Đã tạo và xác nhận đơn hàng ${created.orderNumber || ''} (đã trừ kho)!`);
      } else {
        toast.success(`Tạo đơn hàng nháp ${created?.orderNumber || ''} thành công!`);
      }

      setShowCreateOrderModal(false);
      // Reset form
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setNewOrderNote('');
      setNewDiscount(0);
      setNewOrderItems([{ stockItemId: null, quantity: 1, sellingPrice: 0, name: '' }]);

      // Luôn chuyển về tab Hôm nay và đồng bộ dữ liệu
      setActiveTab('TODAY');
      loadOrders('TODAY', 1, '');
      fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Lỗi khi tạo đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

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
      {/* Header — Framed Hero Gradient matching Inventory & Products pages */}
      <div
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
          border: '1px solid #7dd3fc',
          borderRadius: 18,
          padding: '18px 24px',
          color: '#082f49',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 22px -5px rgba(14, 165, 233, 0.22), 0 2px 6px -1px rgba(0, 0, 0, .04)',
        }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.4px', color: '#082f49' }}>
            {isEn ? 'Orders & Retail' : 'Đơn hàng & Bán lẻ'}
          </h1>
          <p style={{ fontSize: 13, color: '#0c4a6e', margin: 0, fontWeight: 500 }} className="whitespace-nowrap sm:whitespace-nowrap max-sm:whitespace-normal">
            {isEn
              ? 'Comprehensive management of retail counter orders, stock issuance, cancellations, and payment cash flow.'
              : 'Quản lý toàn diện đơn hàng bán lẻ tại quầy, xuất kho, hủy đơn và theo dõi dòng tiền thanh toán.'}
          </p>
        </div>
      </div>

      {/* KPI Cards: Revenue & Status Breakdown (Ẩn đối với Nhân viên WAREHOUSE_STAFF) */}
      {canSeeFinancials ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng doanh thu */}
          <div className="bg-gradient-to-br from-emerald-500/[0.06] via-white to-white p-5 rounded-2xl border border-emerald-100/90 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.12)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {isEn ? 'Total Order Revenue' : 'Tổng doanh thu đơn hàng'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight font-sans">
                {Number(effectiveMetrics.totalRevenue || 0).toLocaleString('vi-VN')}
              </span>
              <span className="text-sm font-bold text-emerald-600">đ</span>
            </div>
            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                {getTimeframeDescription('revenue')}
              </span>
            </div>
          </div>

          {/* Card 2: Số đơn hàng */}
          <div className="bg-gradient-to-br from-blue-500/[0.06] via-white to-white p-5 rounded-2xl border border-blue-100/90 shadow-[0_4px_16px_-4px_rgba(59,130,246,0.12)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {isEn ? 'Total Orders' : 'Số đơn hàng'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight font-sans">
                {Number(effectiveMetrics.orderCount || 0).toLocaleString('vi-VN')}
              </span>
              <span className="text-sm font-bold text-blue-600">{isEn ? 'orders' : 'đơn'}</span>
            </div>
            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-[11px] font-semibold">
                <Receipt className="w-3 h-3 text-blue-600" />
                {getTimeframeDescription('orders')}
              </span>
            </div>
          </div>

          {/* Card 3: Số lượng sản phẩm đã bán */}
          <div className="bg-gradient-to-br from-indigo-500/[0.06] via-white to-white p-5 rounded-2xl border border-indigo-100/90 shadow-[0_4px_16px_-4px_rgba(99,102,241,0.12)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {isEn ? 'Products Sold' : 'Sản phẩm đã bán'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight font-sans">
                {Number(effectiveMetrics.totalSoldQuantity || 0).toLocaleString('vi-VN')}
              </span>
              <span className="text-sm font-bold text-indigo-600">SP</span>
            </div>
            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                {getTimeframeDescription('sold')}
              </span>
            </div>
          </div>

          {/* Card 4: Phương thức thanh toán */}
          <div className="bg-gradient-to-br from-purple-500/[0.06] via-white to-white p-5 rounded-2xl border border-purple-100/90 shadow-[0_4px_16px_-4px_rgba(168,85,247,0.12)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  {isEn ? 'Payment Methods' : 'Phương thức thanh toán'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>

              {/* Distribution visual progress bar */}
              {(() => {
                const cashC = Number(effectiveMetrics.cashCount || 0);
                const transC = Number(effectiveMetrics.transferCount || 0);
                const wallC = Number(effectiveMetrics.walletCount || 0);
                const totalCounts = (cashC + transC + wallC) || 1;
                const cashPct = Math.round((cashC / totalCounts) * 100);
                const transferPct = Math.round((transC / totalCounts) * 100);
                const walletPct = Math.max(0, 100 - cashPct - transferPct);
                return (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5 mt-3">
                    {cashPct > 0 && <div style={{ width: `${cashPct}%` }} className="bg-emerald-500 h-full rounded-full transition-all" title={`${isEn ? 'Cash' : 'Tiền mặt'}: ${cashPct}%`} />}
                    {transferPct > 0 && <div style={{ width: `${transferPct}%` }} className="bg-blue-500 h-full rounded-full transition-all" title={`${isEn ? 'Bank Transfer' : 'Chuyển khoản'}: ${transferPct}%`} />}
                    {walletPct > 0 && <div style={{ width: `${walletPct}%` }} className="bg-purple-500 h-full rounded-full transition-all" title={`${isEn ? 'E-Wallet' : 'Ví điện tử'}: ${walletPct}%`} />}
                  </div>
                );
              })()}

              <div className="grid grid-cols-3 gap-1 pt-2.5 mt-1 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">{isEn ? 'Cash' : 'Tiền mặt'}</span>
                  <span className="text-xs font-black text-emerald-600 block">
                    {Number(effectiveMetrics.cashCount || 0).toLocaleString('vi-VN')} {isEn ? 'times' : 'lần'}
                  </span>
                </div>
                <div className="border-x border-slate-200/70">
                  <span className="text-[10px] text-slate-500 block font-semibold">{isEn ? 'Bank Transfer' : 'Chuyển khoản'}</span>
                  <span className="text-xs font-black text-blue-600 block">
                    {Number(effectiveMetrics.transferCount || 0).toLocaleString('vi-VN')} {isEn ? 'times' : 'lần'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">{isEn ? 'E-Wallet' : 'Ví điện tử'}</span>
                  <span className="text-xs font-black text-purple-600 block">
                    {Number(effectiveMetrics.walletCount || 0).toLocaleString('vi-VN')} {isEn ? 'times' : 'lần'}
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 mt-2 block text-center font-medium">
              {isEn
                ? `Total ${(Number(effectiveMetrics.cashCount || 0) + Number(effectiveMetrics.transferCount || 0) + Number(effectiveMetrics.walletCount || 0)).toLocaleString('en-US')} payments ${activeTab === 'TODAY' ? 'today' : activeTab === '3DAYS' ? 'past 3 days' : activeTab === '7DAYS' ? 'past 7 days' : activeTab === '30DAYS' ? 'past 30 days' : 'all-time'}`
                : `Tổng ${(Number(effectiveMetrics.cashCount || 0) + Number(effectiveMetrics.transferCount || 0) + Number(effectiveMetrics.walletCount || 0)).toLocaleString('vi-VN')} lượt thanh toán ${activeTab === 'TODAY' ? 'hôm nay' : activeTab === '3DAYS' ? '3 ngày qua' : activeTab === '7DAYS' ? '7 ngày qua' : activeTab === '30DAYS' ? '30 ngày qua' : 'toàn bộ'}`}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {isEn ? 'Shift Operational Mode (Warehouse Staff & Cashier)' : 'Chế độ Vận hành Trong Ca Trực (Nhân viên Kho & Thu ngân)'}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {isEn
                  ? 'Look up created invoices, reprint receipts for customers, and confirm Completed / Dispatched. Financial totals and order cancellation are reserved for Shop Owner.'
                  : 'Tra cứu hóa đơn đã lập, in lại biên lai cho khách và xác nhận Hoàn tất / Xuất kho. Số liệu tài chính tổng & quyền hủy đơn thuộc thẩm quyền của Chủ shop.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              {isEn ? 'Orders in Shift' : 'Đơn trong ca trực'}
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        {/* Date Range Segmented Control */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl shadow-inner flex-wrap">
          {[
            { key: 'TODAY', label: isEn ? 'Today' : 'Hôm nay' },
            { key: '3DAYS', label: isEn ? '3 days' : '3 ngày' },
            { key: '7DAYS', label: isEn ? '7 days' : '7 ngày' },
            { key: '30DAYS', label: isEn ? '30 days' : '30 ngày' },
            { key: 'ALL', label: isEn ? 'All' : 'Tất cả' },
            { key: 'CUSTOM', label: isEn ? 'Custom' : 'Tùy chọn' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Section: Số đơn bên trái phần tìm kiếm + Ô tìm kiếm */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs shadow-sm whitespace-nowrap">
            <span className="text-slate-500 font-medium">{isEn ? 'Orders:' : 'Số đơn:'}</span>
            <span className="font-black text-slate-900 text-xs sm:text-[13px]">
              {Number(currentTabCount || 0).toLocaleString('vi-VN')}
            </span>
            <span className="text-slate-400 text-[11px]">{isEn ? 'orders' : 'đơn'}</span>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:w-72 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={isEn ? "Search order code, staff, customer, total..." : "Tìm mã đơn, nhân viên, khách, tổng tiền..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-200/90 rounded-xl shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-medium placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date / Month Selector Bar */}
      {activeTab === 'CUSTOM' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl animate-in fade-in-0 duration-200 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Chế độ xem:</span>
            </div>

            {/* Sub-mode switcher */}
            <div className="inline-flex p-0.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => handleCustomModeChange('day')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  customFilterMode === 'day'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo ngày
              </button>
              <button
                type="button"
                onClick={() => handleCustomModeChange('month')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  customFilterMode === 'month'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo tháng
              </button>
            </div>

            {/* Custom Vietnamese Day Picker */}
            {customFilterMode === 'day' ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const [y, m] = (selectedCustomDate || '2026-10-17').split('-').map(Number);
                    setPickerYear(y || 2026);
                    setPickerMonthIndex((m || 10) - 1);
                    setIsDayPickerOpen(!isDayPickerOpen);
                    setIsMonthPickerOpen(false);
                  }}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-xs font-bold text-slate-800 text-xs transition-all cursor-pointer group"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Ngày {selectedCustomDate.split('-').reverse().join('/')}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {isDayPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDayPickerOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 w-[310px] animate-in fade-in-0 zoom-in-95 duration-150">
                      {/* Header: Tháng X, Năm YYYY with Prev/Next */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            if (pickerMonthIndex === 0) {
                              setPickerMonthIndex(11);
                              setPickerYear(pickerYear - 1);
                            } else {
                              setPickerMonthIndex(pickerMonthIndex - 1);
                            }
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Tháng trước"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          Tháng {pickerMonthIndex + 1}, Năm {pickerYear}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (pickerMonthIndex === 11) {
                              setPickerMonthIndex(0);
                              setPickerYear(pickerYear + 1);
                            } else {
                              setPickerMonthIndex(pickerMonthIndex + 1);
                            }
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Tháng sau"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Weekday labels in Vietnamese */}
                      <div className="grid grid-cols-7 gap-1 pt-3 pb-2 text-center text-[10px] font-extrabold text-slate-400">
                        <span>T2</span>
                        <span>T3</span>
                        <span>T4</span>
                        <span>T5</span>
                        <span>T6</span>
                        <span className="text-blue-500">T7</span>
                        <span className="text-rose-500">CN</span>
                      </div>

                      {/* Days grid */}
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {Array.from({ length: getFirstDayOfWeekVN(pickerYear, pickerMonthIndex) }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}

                        {Array.from({ length: getDaysInMonth(pickerYear, pickerMonthIndex) }).map((_, i) => {
                          const d = i + 1;
                          const dateStr = `${pickerYear}-${String(pickerMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isSelected = selectedCustomDate === dateStr;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                handleCustomDateChange(dateStr);
                                setIsDayPickerOpen(false);
                              }}
                              className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleCustomDateChange('2026-10-18');
                              setPickerYear(2026);
                              setPickerMonthIndex(9);
                              setIsDayPickerOpen(false);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                          >
                            Hôm nay (18/10)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleCustomDateChange('2026-10-17');
                              setPickerYear(2026);
                              setPickerMonthIndex(9);
                              setIsDayPickerOpen(false);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                          >
                            Hôm qua (17/10)
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDayPickerOpen(false)}
                          className="text-slate-400 hover:text-slate-600 font-semibold px-1.5 py-1 cursor-pointer"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Custom Vietnamese Month Picker */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const [y] = (selectedCustomMonth || '2026-10').split('-').map(Number);
                    setPickerYear(y || 2026);
                    setIsMonthPickerOpen(!isMonthPickerOpen);
                    setIsDayPickerOpen(false);
                  }}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-xs font-bold text-slate-800 text-xs transition-all cursor-pointer group"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Tháng {selectedCustomMonth.split('-')[1]} / {selectedCustomMonth.split('-')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {isMonthPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMonthPickerOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 w-[310px] animate-in fade-in-0 zoom-in-95 duration-150">
                      {/* Header: Năm with Prev/Next */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => setPickerYear(pickerYear - 1)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Năm trước"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          Năm {pickerYear}
                        </span>

                        <button
                          type="button"
                          onClick={() => setPickerYear(pickerYear + 1)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Năm sau"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 12 Months Grid in Vietnamese */}
                      <div className="grid grid-cols-3 gap-2 pt-3 pb-1">
                        {Array.from({ length: 12 }).map((_, i) => {
                          const m = i + 1;
                          const monthStr = `${pickerYear}-${String(m).padStart(2, '0')}`;
                          const isSelected = selectedCustomMonth === monthStr;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                handleCustomMonthChange(monthStr);
                                setIsMonthPickerOpen(false);
                              }}
                              className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-102'
                                  : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              Tháng {m}
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            handleCustomMonthChange('2026-10');
                            setPickerYear(2026);
                            setIsMonthPickerOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer"
                        >
                          Tháng 10/2026 (Hiện tại)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMonthPickerOpen(false)}
                          className="text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 cursor-pointer"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 border border-blue-200/60 px-3 py-1.5 rounded-xl">
            {customFilterMode === 'day'
              ? `Đang lọc: Ngày ${selectedCustomDate.split('-').reverse().join('/')}`
              : `Đang lọc: Tháng ${selectedCustomMonth.split('-')[1]}/${selectedCustomMonth.split('-')[0]}`}
          </div>
        </div>
      )}

      {/* Payment Method Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-500 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-blue-600" /> {isEn ? 'Method:' : 'Hình thức:'}
        </span>
        {[
          { key: 'ALL', label: isEn ? 'All' : 'Tất cả' },
          { key: 'CASH', label: staffMode ? (isEn ? 'Cash' : 'Tiền mặt') : (isEn ? `Cash (${formatVND(effectiveMetrics.cashTotal)})` : `Tiền mặt (${formatVND(effectiveMetrics.cashTotal)})`), icon: Banknote },
          { key: 'BANK_TRANSFER', label: staffMode ? (isEn ? 'Bank Transfer' : 'Chuyển khoản') : (isEn ? `Bank Transfer (${formatVND(effectiveMetrics.transferTotal)})` : `Chuyển khoản (${formatVND(effectiveMetrics.transferTotal)})`), icon: QrCode },
          { key: 'PAYOS', label: staffMode ? (isEn ? 'E-Wallet' : 'Ví điện tử') : (isEn ? `E-Wallet (${formatVND(effectiveMetrics.walletTotal)})` : `Ví điện tử (${formatVND(effectiveMetrics.walletTotal)})`), icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = selectedPaymentMethod === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setSelectedPaymentMethod(item.key)}
              className={`px-3.5 py-1.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-xs font-semibold ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{isEn ? 'Order Code' : 'Mã đơn hàng'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Time' : 'Thời gian'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Handler' : 'Nhân viên xử lý'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Payment' : 'Thanh toán'}</th>
                <th className="py-3.5 px-4 text-center">{isEn ? 'Quantity' : 'Số lượng'}</th>
                <th className="py-3.5 px-4 text-right">{isEn ? 'Total' : 'Tổng tiền'}</th>
                <th className="py-3.5 px-4 text-center">{isEn ? 'Status' : 'Trạng thái'}</th>
                <th className="py-3.5 px-4 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <ShoppingCart className="w-7 h-7" />
                    </div>
                    <p className="font-bold text-sm text-slate-700">
                      {isEn ? 'No orders found.' : 'Không tìm thấy đơn hàng nào.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isEn ? 'You can create a new order or sell at the POS counter.' : 'Bạn có thể tạo đơn hàng mới hoặc bán tại quầy POS.'}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate('/pos')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> {isEn ? 'Open POS Counter' : 'Mở quầy POS'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const payBadge = getPaymentBadge(ord.paymentMethod, isEn);
                  const PayIcon = payBadge.icon;
                  const statusBadge = getStatusBadge(ord.status, isEn);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <tr key={ord.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Mã đơn hàng */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => {
                            if (navigator.clipboard?.writeText) {
                              navigator.clipboard.writeText(ord.orderId);
                              toast.success(isEn ? `Copied: ${ord.orderId}` : `Đã sao chép: ${ord.orderId}`);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 text-slate-800 font-mono text-xs font-bold cursor-pointer transition-colors"
                          title={isEn ? "Click to copy order code" : "Click để sao chép mã đơn"}
                        >
                          <span>{ord.orderId}</span>
                          <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                        </div>
                      </td>

                      {/* Thời gian */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(ord.createdAt).toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium pl-4">
                            {new Date(ord.createdAt).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}
                          </span>
                        </div>
                      </td>

                      {/* Nhân viên xử lý */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 text-xs">
                          {ord.createdBy?.fullName || (isEn ? 'Store Owner' : 'Chủ shop')}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-sm ${payBadge.className}`}>
                          <PayIcon className="w-3.5 h-3.5" />
                          <span>{payBadge.label}</span>
                        </span>
                      </td>

                      {/* Số lượng */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          {ord.itemsCount} SP
                        </span>
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-slate-900 text-sm tracking-tight font-sans">
                          {formatVND(ord.totalAmount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border shadow-sm ${statusBadge.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor || 'bg-slate-400'}`} />
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {staffMode ? (
                            /* Role Nhân viên: CHỈ CÓ IN VÀ HỦY */
                            <>
                              {/* In hóa đơn */}
                              <button
                                onClick={() => handlePrintReceipt(ord)}
                                className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                title="In hóa đơn bán hàng"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Hủy đơn hàng (Khách đến trả hàng / Hủy giao dịch) */}
                              {ord.status === 'CANCELED' || ord.status === 'CANCELLED' ? (
                                <span
                                  className="w-8 h-8 rounded-lg border border-slate-100 bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed"
                                  title="Đơn hàng này đã bị hủy"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCancelingOrder(ord);
                                    setCancelReasonText('Khách trả hàng / Hoàn kho');
                                  }}
                                  disabled={actionLoading}
                                  className="w-8 h-8 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                  title="Hủy đơn hàng (hoàn lại hàng vào kho & trừ doanh thu)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            /* Role Chủ shop & Admin: Đầy đủ xác nhận, xuất kho, xem chi tiết, in và hủy */
                            <>
                              {/* If DRAFT: Confirm */}
                              {ord.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleConfirmOrder(ord.id)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
                                  title="Xác nhận đơn và trừ kho ngay"
                                >
                                  <Check className="w-3 h-3" /> Xác nhận
                                </button>
                              )}

                              {/* If CONFIRMED: Fulfill */}
                              {ord.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleFulfillOrder(ord.id)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm shadow-emerald-500/20 active:scale-95 transition-all"
                                  title="Hoàn tất đơn / Đã giao cho khách"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                                </button>
                              )}

                              {/* Detail View */}
                              <button
                                onClick={() => setViewOrderDetail(ord)}
                                className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                title="Xem chi tiết đơn"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Receipt */}
                              <button
                                onClick={() => handlePrintReceipt(ord)}
                                className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                title="In hóa đơn bán hàng"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Cancel */}
                              {ord.status !== 'CANCELED' && ord.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => {
                                    setCancelingOrder(ord);
                                    setCancelReasonText('Chủ shop hủy đơn');
                                  }}
                                  disabled={actionLoading}
                                  className="w-8 h-8 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                  title="Hủy đơn hàng & Hoàn trả tồn kho"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 text-xs">
            <span className="text-slate-500 font-medium">
              Hiển thị <span className="font-bold text-slate-800">{((pagination.page - 1) * pagination.limit) + 1}</span> - <span className="font-bold text-slate-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong tổng số <span className="font-bold text-blue-600">{pagination.total?.toLocaleString('vi-VN')}</span> {staffMode ? 'đơn trong ca' : 'đơn hàng'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 font-bold">
                Trang {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: ORDER DETAILS ─── */}
      {viewOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
                className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status, Customer & Handler Badge */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide font-bold text-slate-400">Nhân viên xử lý</p>
                <p className="font-bold text-sm text-slate-900 mb-1.5">{viewOrderDetail.createdBy?.fullName || 'Chủ shop'}</p>
                <p className="text-xs text-muted-foreground">Khách: <strong className="text-slate-800">{viewOrderDetail.customerName || 'Khách lẻ'}</strong></p>
                {viewOrderDetail.customerPhone && (
                  <p className="text-xs text-muted-foreground">{viewOrderDetail.customerPhone}</p>
                )}
                {viewOrderDetail.customerAddress && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {viewOrderDetail.customerAddress}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Trạng thái đơn</p>
                {(() => {
                  const sb = getStatusBadge(viewOrderDetail.status);
                  const SIcon = sb.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-bold ${sb.className}`}>
                      <SIcon className="w-3.5 h-3.5" />
                      <span>{sb.label}</span>
                    </span>
                  );
                })()}
              </div>
            </div>

            {viewOrderDetail.cancelReason && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                <strong>Lý do hủy đơn:</strong> {viewOrderDetail.cancelReason}
              </div>
            )}

            {/* Items list */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Danh sách hàng hóa</p>
              <div className="divide-y divide-border border border-slate-200 rounded-xl overflow-hidden bg-white">
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
              {Number(viewOrderDetail.discountAmount) > 0 && (
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

            {/* Modal Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {viewOrderDetail.status === 'DRAFT' && (
                  <button
                    onClick={() => handleConfirmOrder(viewOrderDetail.id)}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Xác nhận & Trừ kho
                  </button>
                )}

                {viewOrderDetail.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleFulfillOrder(viewOrderDetail.id)}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất đơn
                  </button>
                )}

                {(viewOrderDetail.status === 'DRAFT' || viewOrderDetail.status === 'CONFIRMED') && canCancel && (
                  <button
                    onClick={() => {
                      setCancelingOrder(viewOrderDetail);
                      setCancelReasonText('Khách yêu cầu hủy');
                    }}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Hủy đơn
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setViewOrderDetail(null);
                  handlePrintReceipt(viewOrderDetail);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CANCEL ORDER REASON ─── */}
      {cancelingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-white w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-foreground">Hủy đơn hàng {cancelingOrder.orderId}</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              {cancelingOrder.status === 'CONFIRMED' || cancelingOrder.status === 'FULFILLED' || cancelingOrder.status === 'COMPLETED'
                ? 'Đơn hàng này đã trừ kho trước đó. Khi hủy, hệ thống sẽ TỰ ĐỘNG hoàn lại toàn bộ hàng vào kho lưu trữ và tự động trừ lại vào doanh thu bán hàng.'
                : 'Bạn có chắc chắn muốn hủy đơn hàng này không?'}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Lý do hủy đơn / Khách trả hàng:</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Khách trả hàng / Hoàn kho',
                  'Khách đổi ý không lấy nữa',
                  'Lập nhầm đơn hàng',
                ].map((reason) => {
                  const isSelected = cancelReasonText === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setCancelReasonText(reason)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-rose-50 border-rose-400 text-rose-700 font-bold shadow-sm ring-1 ring-rose-400'
                          : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{reason}</span>
                      {isSelected && <Check className="w-4 h-4 text-rose-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setCancelingOrder(null)}
                disabled={actionLoading}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelOrderSubmit}
                disabled={actionLoading || !cancelReasonText.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE ORDER DIRECTLY ─── */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Tạo đơn hàng mới
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tạo đơn hàng nháp hoặc xuất bán trực tiếp từ danh mục hàng hóa.
                </p>
              </div>
              <button
                onClick={() => setShowCreateOrderModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-border text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Tên khách hàng</label>
                <input
                  type="text"
                  placeholder="Khách lẻ (hoặc họ tên)"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="09..."
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold text-foreground block mb-1">Địa chỉ nhận hàng (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, quận/huyện..."
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg"
                />
              </div>
            </div>

            {/* Products Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase">Hàng hóa trong đơn</span>
                <button
                  onClick={() =>
                    setNewOrderItems((prev) => [
                      ...prev,
                      { stockItemId: null, quantity: 1, sellingPrice: 0, name: '' },
                    ])
                  }
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm sản phẩm
                </button>
              </div>

              <div className="space-y-2">
                {newOrderItems.map((item, idx) => {
                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <div className="flex-1 w-full">
                        <select
                          value={item.stockItemId || ''}
                          onChange={(e) => {
                            const sid = Number(e.target.value);
                            const prod = products.find((p) => p.stockItems?.[0]?.id === sid || p.id === sid);
                            const stockItem = prod?.stockItems?.[0];
                            const price = Number(stockItem?.sellingPrice || prod?.sellingPrice || prod?.salePrice || 0);

                            setNewOrderItems((prev) =>
                              prev.map((row, i) =>
                                i === idx
                                  ? {
                                      ...row,
                                      stockItemId: stockItem?.id || sid,
                                      sellingPrice: price,
                                      name: prod?.name || '',
                                    }
                                  : row
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-border rounded-lg font-medium"
                        >
                          <option value="">-- Chọn sản phẩm --</option>
                          {products.map((p) => {
                            const sid = p.stockItems?.[0]?.id;
                            const stock = p.stockItems?.[0]?.balances?.reduce((s, b) => s + (b.quantity || 0), 0) ?? p.stock ?? 0;
                            return (
                              <option key={p.id} value={sid || p.id}>
                                {p.name} {p.sku ? `(${p.sku})` : ''} - Tồn: {stock} - {formatVND(p.sellingPrice || p.salePrice || 0)}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">SL:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = Math.max(1, Number(e.target.value));
                              setNewOrderItems((prev) =>
                                prev.map((row, i) => (i === idx ? { ...row, quantity: qty } : row))
                              );
                            }}
                            className="w-16 px-2 py-1 bg-white border border-border rounded-lg text-center font-bold"
                          />
                        </div>

                        <div className="w-28 text-right font-bold text-foreground">
                          {formatVND(Number(item.quantity || 0) * Number(item.sellingPrice || 0))}
                        </div>

                        {newOrderItems.length > 1 && (
                          <button
                            onClick={() => setNewOrderItems((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Ghi chú đơn</label>
                <input
                  type="text"
                  placeholder="Ghi chú giao hàng, xuất hóa đơn..."
                  value={newOrderNote}
                  onChange={(e) => setNewOrderNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Chiết khấu (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg font-bold"
                />
              </div>
            </div>

            {/* Total calculation */}
            {(() => {
              const subtotal = newOrderItems.reduce(
                (sum, it) => sum + (Number(it.quantity || 0) * Number(it.sellingPrice || 0)),
                0
              );
              const total = Math.max(0, subtotal - Number(newDiscount || 0));

              return (
                <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính:</span>
                    <span className="font-semibold">{formatVND(subtotal)}</span>
                  </div>
                  {newDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Chiết khấu:</span>
                      <span>-{formatVND(newDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                    <span>Tổng đơn hàng:</span>
                    <span className="text-blue-600">{formatVND(total)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowCreateOrderModal(false)}
                disabled={actionLoading}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted"
              >
                Đóng
              </button>
              <button
                onClick={() => handleCreateOrderSubmit(false)}
                disabled={actionLoading}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
              >
                Lưu đơn nháp
              </button>
              <button
                onClick={() => handleCreateOrderSubmit(true)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> Tạo & Trừ kho ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HIDDEN RECEIPT PORTAL FOR ACTUAL 1-PAGE PRINTING ─── */}
      {printReceiptData && (
        <ReceiptPrintPortal data={printReceiptData} />
      )}

      {/* ─── PRINT RECEIPT PREVIEW MODAL ─── */}
      {printReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 print:hidden">
          <div className="bg-white text-black w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-800">Xem trước hóa đơn in</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" /> In ngay
                </button>
                <button
                  type="button"
                  onClick={() => setPrintReceiptData(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <ReceiptPrintContent data={printReceiptData} isPreview={true} />
          </div>
        </div>
      )}
    </div>
  );
}
