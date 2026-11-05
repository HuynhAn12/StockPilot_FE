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

import { apiCreateReturn } from '../../services/inventoryService';

import { useProductStore } from '../../components/store/productStore';

import { useToast } from '../../components/common/Toast';

import { useAuthStore } from '../../store/authStore';

import { canCancelOrder, canViewOrderFinancialSummary, isStaff } from '../../config/permissions.config';

import { docSoThanhChu } from '../../utils/numberToWordsVN';

import { useTranslation } from '../../i18n/useTranslation';

import { ReceiptPrintContent, ReceiptPrintPortal } from '../../components/pos/ReceiptPrintView';





// Icon Đổi trả hàng / Hoàn kho (hình thùng hàng với 2 mũi tên xoay vòng)

function ReturnOrderIcon({ className = "w-4 h-4" }) {

  return (

    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>

      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />

      <path d="M3 3v5h5" />

      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />

      <path d="M21 21v-5h-5" />

      <path d="m7.5 10.5 4.5-2.5 4.5 2.5-4.5 2.5z" />

      <path d="M7.5 10.5v4.5l4.5 2.5v-4.5" />

      <path d="M16.5 10.5v4.5l-4.5 2.5" />

    </svg>

  );

}



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



  if (m === 'PAYOS' || m === 'WALLET') {

    return {

      label: isEn ? 'Bank Transfer' : 'Chuyển khoản',

      icon: QrCode,

      className: 'bg-blue-50 text-blue-700 border-blue-200/80',

      dotColor: 'bg-blue-500',

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

  const getTodayVN = () => {
    const vnNow = new Date(Date.now() + 7 * 3600000);
    const y = vnNow.getUTCFullYear();
    const m = String(vnNow.getUTCMonth() + 1).padStart(2, '0');
    const d = String(vnNow.getUTCDate()).padStart(2, '0');
    return {
      dateStr: `${y}-${m}-${d}`,
      monthStr: `${y}-${m}`,
      year: y,
      monthIndex: vnNow.getUTCMonth(),
    };
  };

  // Custom date/month picker state
  const [customFilterMode, setCustomFilterMode] = useState('day'); // 'day' | 'month'
  const [selectedCustomDate, setSelectedCustomDate] = useState(() => getTodayVN().dateStr);
  const [selectedCustomMonth, setSelectedCustomMonth] = useState(() => getTodayVN().monthStr);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('ALL');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => getTodayVN().year);
  const [pickerMonthIndex, setPickerMonthIndex] = useState(() => getTodayVN().monthIndex);



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



  const [isRefreshing, setIsRefreshing] = useState(false);



  const loadOrders = (

    tab = activeTab,

    page = currentPage,

    search = searchQuery,

    mode = customFilterMode,

    dayStr = selectedCustomDate,

    monthStr = selectedCustomMonth

  ) => {

    const { from, to } = getDateRangeForTab(tab, mode, dayStr, monthStr);

    return fetchOrders({

      page,

      limit: 50,

      search: search.trim() || undefined,

      from,

      to,

    });

  };



  const handleRefresh = async () => {

    try {

      setIsRefreshing(true);

      await Promise.all([

        loadOrders(activeTab, currentPage, searchQuery, customFilterMode, selectedCustomDate, selectedCustomMonth),

        fetchProducts(),

      ]);

      toast({

        type: 'info',

        title: isEn ? 'Refresh Successful' : 'Làm mới thành công',

        message: isEn

          ? 'Order list and metrics have been updated to the latest data!'

          : 'Đã cập nhật danh sách đơn hàng và số liệu thống kê mới nhất!',

      });

    } catch (err) {

      toast({

        type: 'error',

        title: isEn ? 'Refresh Failed' : 'Lỗi làm mới',

        message: err?.response?.data?.error?.message || err?.message || (isEn ? 'Could not refresh orders' : 'Không thể làm mới danh sách đơn hàng'),

      });

    } finally {

      setIsRefreshing(false);

    }

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



  // ─── Modal Đổi Trả Hàng & Hoàn Tiền (Trả 1 số món hoặc hủy toàn bộ) ───

  const [returnModalOrder, setReturnModalOrder] = useState(null);

  const [returnTab, setReturnTab] = useState('PARTIAL'); // 'PARTIAL' (trả 1 số món) | 'CANCEL_ALL' (hủy cả đơn)

  const [returnQuantities, setReturnQuantities] = useState({});

  const [isRestockable, setIsRestockable] = useState(true);

  const [returnReasonText, setReturnReasonText] = useState('Khách đổi ý trả hàng');

  const [cancelAllReasonText, setCancelAllReasonText] = useState('Khách trả toàn bộ hàng về kho');

  const [returnSubmitting, setReturnSubmitting] = useState(false);



  const handleOpenReturnModal = (ord) => {

    setReturnModalOrder(ord);

    setReturnTab(ord.status === 'DRAFT' ? 'CANCEL_ALL' : 'PARTIAL');

    const initQty = {};

    (ord.items || []).forEach((it) => {

      initQty[it.id] = 0;

    });

    setReturnQuantities(initQty);

    setIsRestockable(true);

    setReturnReasonText('Khách đổi ý trả hàng');

    setCancelAllReasonText('Khách trả toàn bộ hàng về kho');

  };

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

      const rawItemsCount = o.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || o.items?.length || 0;

      const returnedQty = (o.items || []).reduce((sum, it) => sum + (it.returnedQuantity || 0), 0) || safeNum(o.returnedQuantity);

      const netItemsCount = Math.max(0, rawItemsCount - returnedQty);



      const grossAmount = safeNum(o.grossAmount ?? o.totalAmount);

      const returnsRefund = (o.returns || [])
        .filter((r) => r.status === 'COMPLETED' || !r.status)
        .reduce((sum, r) => sum + safeNum(r.totalRefundAmount), 0);
      const itemsRefund = (o.items || []).reduce((sum, it) => sum + safeNum(it.refundedAmount), 0);
      const fallbackRefund = returnsRefund > 0 ? returnsRefund : itemsRefund;
      const refundedAmount = safeNum(o.refundedAmount !== undefined && o.refundedAmount !== null ? o.refundedAmount : fallbackRefund);

      const netAmount = Math.max(0, grossAmount - refundedAmount);



      return {

        ...o,

        orderId: o.orderNumber || `HD-${o.id}`,

        paymentMethod: pm,

        totalAmount: netAmount,

        grossAmount,

        refundedAmount,

        netAmount,

        itemsCount: netItemsCount,

        grossItemsCount: rawItemsCount,

        returnedQuantity: returnedQty,

        netItemsCount,

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

    let grossRevenue = 0;

    let refundAmount = 0;

    let customerCount = 0;

    let totalSoldQuantity = 0;

    let grossSoldQuantity = 0;

    let returnedQuantity = 0;

    let cashCount = 0;

    let transferCount = 0;

    let walletCount = 0;

    let draftCount = 0;

    let confirmedCount = 0;

    let fulfilledCount = 0;

    let canceledCount = 0;



    let fulfilledRevenue = 0;

    let pendingRevenue = 0;

    let fulfilledSoldQuantity = 0;

    let pendingSoldQuantity = 0;



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

        totalRevenue += o.netAmount;

        grossRevenue += o.grossAmount;

        refundAmount += o.refundedAmount;

        totalSoldQuantity += o.netItemsCount;

        grossSoldQuantity += o.grossItemsCount;

        returnedQuantity += o.returnedQuantity;



        if (o.status === 'FULFILLED' || o.status === 'COMPLETED') {

          fulfilledRevenue += o.netAmount;

          fulfilledSoldQuantity += o.netItemsCount;

        } else {

          pendingRevenue += o.netAmount;

          pendingSoldQuantity += o.netItemsCount;

        }



        if (o.paymentMethod === 'BANK_TRANSFER' || o.paymentMethod === 'PAYOS' || o.paymentMethod === 'WALLET') {

          transferCount++;

          transferTotal += o.netAmount;

        } else {

          cashCount++;

          cashTotal += o.netAmount;

        }

      }

    });



    return {

      totalRevenue,

      grossRevenue,

      refundAmount,

      netRevenue: totalRevenue,

      fulfilledRevenue,

      pendingRevenue,

      customerCount,

      totalSoldQuantity,

      grossSoldQuantity,

      returnedQuantity,

      netSoldQuantity: totalSoldQuantity,

      fulfilledSoldQuantity,

      pendingSoldQuantity,

      orderCount: dateFilteredOrders.length,

      fulfilledCount,

      pendingCount: draftCount + confirmedCount,

      cashCount,

      transferCount,

      walletCount,

      draftCount,

      confirmedCount,

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



  // Unique staff list for Shop Owner filter
  const availableStaffList = useMemo(() => {
    const map = new Map();
    (normalizedOrders || []).forEach((o) => {
      const id = o.createdById || o.createdBy?.id || 0;
      const name = o.createdBy?.fullName || (isEn ? 'Store Owner' : 'Chủ shop');
      if (id && !map.has(id)) {
        map.set(id, name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [normalizedOrders, isEn]);

  // Filtered orders for table (filtered by client payment method pill & staff)
  const filteredOrders = useMemo(() => {
    return normalizedOrders.filter((o) => {
      if (selectedPaymentMethod !== 'ALL') {
        if (selectedPaymentMethod === 'CASH' && o.paymentMethod !== 'CASH') return false;
        if (selectedPaymentMethod === 'BANK_TRANSFER' && (o.paymentMethod !== 'BANK_TRANSFER' && o.paymentMethod !== 'PAYOS' && o.paymentMethod !== 'WALLET')) return false;
      }
      if (!staffMode && selectedStaffFilter !== 'ALL') {
        const orderStaffId = o.createdById || o.createdBy?.id || 0;
        if (String(orderStaffId) !== String(selectedStaffFilter)) return false;
      }
      return true;
    });
  }, [normalizedOrders, selectedPaymentMethod, selectedStaffFilter, staffMode]);



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



    const handlePartialReturnSubmit = async () => {

    if (!returnModalOrder) return;

    const itemsToReturn = [];

    (returnModalOrder.items || []).forEach((it) => {

      const q = returnQuantities[it.id] || 0;

      if (q > 0) {

        itemsToReturn.push({

          orderItemId: it.id,

          quantity: q,

          isRestockable,

          note: returnReasonText,

        });

      }

    });



    if (itemsToReturn.length === 0) {

      toast.error('Vui lòng chọn số lượng ít nhất 1 món để thực hiện trả hàng');

      return;

    }



    const targetOrderId = returnModalOrder.id;

    const reason = returnReasonText;



    // Đóng modal ngay lập tức khi bấm xác nhận

    setReturnModalOrder(null);

    setActionLoading(true);



    try {

      const res = await apiCreateReturn({

        orderId: targetOrderId,

        reason,

        items: itemsToReturn,

      });



      const totalRefunded = safeNum(res?.totalRefundAmount);

      const totalQty = itemsToReturn.reduce((sum, i) => sum + i.quantity, 0);

      toast.success(

        `Đã tạo phiếu trả hàng #${res?.returnNumber || ''} thành công! Đã hoàn trả ${formatVND(totalRefunded)} cho khách và cộng lại ${totalQty} sản phẩm vào kho.`

      );



      loadOrders(activeTab, pagination?.page || 1, searchQuery);

      fetchProducts();



      try {

        const bc = new BroadcastChannel('stockpilot_channel');

        bc.postMessage({ type: 'ORDERS_UPDATED' });

        bc.postMessage({ type: 'PRODUCTS_UPDATED' });

        bc.close();

      } catch (_) {}

    } catch (err) {

      toast.error(err?.response?.data?.error?.message || err?.message || 'Lỗi khi xử lý trả hàng');

      loadOrders(activeTab, pagination?.page || 1, searchQuery);

    } finally {

      setActionLoading(false);

      setReturnSubmitting(false);

    }

  };



  const handleCancelAllFromReturnModal = async () => {

    if (!returnModalOrder) return;

    const targetOrderId = returnModalOrder.id;

    const targetOrderNumber = returnModalOrder.orderNumber;

    const reason = cancelAllReasonText;



    // Đóng modal ngay lập tức khi bấm xác nhận

    setReturnModalOrder(null);

    setActionLoading(true);



    try {

      await cancelOrder(targetOrderId, { reason });

      toast.success(`Đã hủy toàn bộ đơn hàng ${targetOrderNumber}. Hàng đã được tự động hoàn lại kho và trừ doanh thu!`);

      loadOrders(activeTab, pagination?.page || 1, searchQuery);

      fetchProducts();



      try {

        const bc = new BroadcastChannel('stockpilot_channel');

        bc.postMessage({ type: 'ORDERS_UPDATED' });

        bc.postMessage({ type: 'PRODUCTS_UPDATED' });

        bc.close();

      } catch (_) {}

    } catch (err) {

      toast.error(err?.response?.data?.error?.message || err?.message || 'Lỗi khi hủy đơn hàng');

      loadOrders(activeTab, pagination?.page || 1, searchQuery);

    } finally {

      setActionLoading(false);

      setReturnSubmitting(false);

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

      paymentMethod: (ord.paymentMethod === 'BANK_TRANSFER' || ord.paymentMethod === 'PAYOS' || ord.paymentMethod === 'WALLET') ? 'Chuyển khoản' : 'Tiền mặt',

    };



    setPrintReceiptData(receipt);

    setTimeout(() => {

      window.print();

    }, 400);

  };



  return (

    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12">

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

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

          <button

            onClick={handleRefresh}

            disabled={isRefreshing}

            style={{

              display: 'flex',

              alignItems: 'center',

              gap: 6,

              padding: '9px 15px',

              background: 'rgba(255, 255, 255, 0.92)',

              border: '1px solid rgba(255, 255, 255, 0.95)',

              borderRadius: 12,

              color: '#0284c7',

              fontSize: 12.5,

              fontWeight: 700,

              cursor: isRefreshing ? 'not-allowed' : 'pointer',

              transition: 'all 0.2s',

              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',

              backdropFilter: 'blur(8px)',

            }}

            className="hover:bg-white hover:border-sky-400 hover:text-sky-700 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)] active:scale-95 transition-all"

          >

            <RefreshCw

              style={{ width: 14, height: 14 }}

              className={isRefreshing ? 'animate-spin' : ''}

            />

            {isEn ? 'Refresh' : 'Làm mới'}

          </button>

        </div>

      </div>



      {/* KPI Cards: Revenue & Status Breakdown (Ẩn đối với Nhân viên WAREHOUSE_STAFF) */}

      {canSeeFinancials ? (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Tổng doanh thu */}

          <div className="bg-gradient-to-br from-emerald-500/[0.06] via-white to-white p-5 rounded-2xl border border-emerald-100/90 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.12)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between">

            <div>

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



            {/* Dòng phân rã đối soát thực thu & hoàn trả */}

            <div className="mt-3.5 pt-2.5 border-t border-emerald-100/70 text-[11px] flex flex-col gap-1">

              <div className="flex justify-between items-center">

                <span className="text-slate-500 font-medium">Đã xuất kho (thực thu):</span>

                <span className="font-bold text-emerald-700">

                  {Number(effectiveMetrics.fulfilledRevenue ?? effectiveMetrics.totalRevenue ?? 0).toLocaleString('vi-VN')} đ

                </span>

              </div>

              {Number(effectiveMetrics.refundAmount || 0) > 0 && (

                <div className="flex justify-between items-center text-amber-700">

                  <span>Đã trừ hoàn trả ({Number(effectiveMetrics.returnedQuantity || 0)} SP):</span>

                  <span className="font-semibold text-amber-600">

                    -{Number(effectiveMetrics.refundAmount).toLocaleString('vi-VN')} đ

                  </span>

                </div>

              )}

              {Number(effectiveMetrics.pendingRevenue || 0) > 0 && (

                <div className="flex justify-between items-center text-slate-400">

                  <span>Chờ xử lý / Nháp:</span>

                  <span className="font-semibold text-amber-600">

                    +{Number(effectiveMetrics.pendingRevenue).toLocaleString('vi-VN')} đ

                  </span>

                </div>

              )}

            </div>

          </div>



          {/* Card 2: Số đơn hàng */}

          <div className="bg-gradient-to-br from-blue-500/[0.06] via-white to-white p-5 rounded-2xl border border-blue-100/90 shadow-[0_4px_16px_-4px_rgba(59,130,246,0.12)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between">

            <div>

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



            {/* Dòng phân rã số đơn */}

            <div className="mt-3.5 pt-2.5 border-t border-blue-100/70 text-[11px] flex flex-col gap-1">

              <div className="flex justify-between items-center">

                <span className="text-slate-500 font-medium">Hoàn tất / Đã xuất:</span>

                <span className="font-bold text-blue-700">

                  {Number(effectiveMetrics.fulfilledCount ?? effectiveMetrics.orderCount ?? 0).toLocaleString('vi-VN')} đơn

                </span>

              </div>

              {Number(effectiveMetrics.pendingCount || 0) > 0 && (

                <div className="flex justify-between items-center text-slate-400">

                  <span>Chờ xử lý / Nháp:</span>

                  <span className="font-semibold text-amber-600">

                    +{Number(effectiveMetrics.pendingCount).toLocaleString('vi-VN')} đơn

                  </span>

                </div>

              )}

            </div>

          </div>



          {/* Card 3: Số lượng sản phẩm đã bán */}

          <div className="bg-gradient-to-br from-indigo-500/[0.06] via-white to-white p-5 rounded-2xl border border-indigo-100/90 shadow-[0_4px_16px_-4px_rgba(99,102,241,0.12)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between">

            <div>

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



            {/* Dòng phân rã số SP */}

            <div className="mt-3.5 pt-2.5 border-t border-indigo-100/70 text-[11px] flex flex-col gap-1">

              <div className="flex justify-between items-center">

                <span className="text-slate-500 font-medium">Đã trừ tồn kho (thực bán):</span>

                <span className="font-bold text-indigo-700">

                  {Number(effectiveMetrics.fulfilledSoldQuantity ?? effectiveMetrics.totalSoldQuantity ?? 0).toLocaleString('vi-VN')} SP

                </span>

              </div>

              {Number(effectiveMetrics.returnedQuantity || 0) > 0 && (

                <div className="flex justify-between items-center text-amber-700">

                  <span>Đã nhận lại kho:</span>

                  <span className="font-semibold text-amber-600">

                    +{Number(effectiveMetrics.returnedQuantity).toLocaleString('vi-VN')} SP

                  </span>

                </div>

              )}

              {Number(effectiveMetrics.pendingSoldQuantity || 0) > 0 && (

                <div className="flex justify-between items-center text-slate-400">

                  <span>Chờ xuất / Nháp:</span>

                  <span className="font-semibold text-amber-600">

                    +{Number(effectiveMetrics.pendingSoldQuantity).toLocaleString('vi-VN')} SP

                  </span>

                </div>

              )}

            </div>

          </div>



          {/* Card 4: Phương thức thanh toán */}

          <div className="bg-gradient-to-br from-blue-500/[0.06] via-white to-white p-5 rounded-2xl border border-blue-100/90 shadow-[0_4px_16px_-4px_rgba(59,130,246,0.12)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between">

            <div>

              <div className="flex items-center justify-between">

                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">

                  {isEn ? 'Payment Methods' : 'Phương thức thanh toán'}

                </span>

                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">

                  <CreditCard className="w-4 h-4" />

                </div>

              </div>



              {/* Distribution visual progress bar */}

              {(() => {

                const cashC = Number(effectiveMetrics.cashCount || 0);

                const transC = Number(effectiveMetrics.transferCount || 0);

                const totalCounts = (cashC + transC) || 1;

                const cashPct = Math.round((cashC / totalCounts) * 100);

                const transferPct = 100 - cashPct;

                return (

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5 mt-3">

                    {cashPct > 0 && <div style={{ width: `${cashPct}%` }} className="bg-emerald-500 h-full rounded-full transition-all" title={`${isEn ? 'Cash' : 'Tiền mặt'}: ${cashPct}%`} />}

                    {transferPct > 0 && <div style={{ width: `${transferPct}%` }} className="bg-blue-500 h-full rounded-full transition-all" title={`${isEn ? 'Bank Transfer' : 'Chuyển khoản'}: ${transferPct}%`} />}

                  </div>

                );

              })()}



              <div className="grid grid-cols-2 gap-2 pt-2.5 mt-1 text-center">

                <div>

                  <span className="text-[10px] text-slate-500 block font-semibold">{isEn ? 'Cash' : 'Tiền mặt'}</span>

                  <span className="text-xs font-black text-emerald-600 block">

                    {Number(effectiveMetrics.cashCount || 0).toLocaleString('vi-VN')} {isEn ? 'times' : 'lần'}

                  </span>

                </div>

                <div className="border-l border-slate-200/70">

                  <span className="text-[10px] text-slate-500 block font-semibold">{isEn ? 'Bank Transfer' : 'Chuyển khoản'}</span>

                  <span className="text-xs font-black text-blue-600 block">

                    {Number(effectiveMetrics.transferCount || 0).toLocaleString('vi-VN')} {isEn ? 'times' : 'lần'}

                  </span>

                </div>

              </div>

            </div>



            <span className="text-[10px] text-slate-400 mt-2 block text-center font-medium">

              {isEn

                ? `Total ${(Number(effectiveMetrics.cashCount || 0) + Number(effectiveMetrics.transferCount || 0)).toLocaleString('en-US')} payments ${activeTab === 'TODAY' ? 'today' : activeTab === '3DAYS' ? 'past 3 days' : activeTab === '7DAYS' ? 'past 7 days' : activeTab === '30DAYS' ? 'past 30 days' : 'all-time'}`

                : `Tổng ${(Number(effectiveMetrics.cashCount || 0) + Number(effectiveMetrics.transferCount || 0)).toLocaleString('vi-VN')} lượt thanh toán ${activeTab === 'TODAY' ? 'hôm nay' : activeTab === '3DAYS' ? '3 ngày qua' : activeTab === '7DAYS' ? '7 ngày qua' : activeTab === '30DAYS' ? '30 ngày qua' : 'toàn bộ'}`}

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
                {activeTab === 'TODAY'
                  ? (isEn ? 'Shift Operational Mode (Warehouse Staff & Cashier)' : 'Chế độ Vận hành Trong Ca Trực (Nhân viên Kho & Thu ngân)')
                  : (isEn ? 'Personal Order History (Warehouse Staff)' : 'Lịch sử Đơn Cá nhân Xử lý (Nhân viên Kho)')}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {activeTab === 'TODAY'
                  ? (isEn
                      ? 'Viewing all shift orders created today across all staff (to lookup receipts, reprint for customers, and confirm Completed / Dispatched).'
                      : 'Đang xem toàn bộ đơn trong ca trực hôm nay (tất cả nhân viên) để tra cứu hóa đơn, in lại biên lai cho khách và xác nhận xuất kho.')
                  : (isEn
                      ? 'Past order history: Only displaying orders processed directly by you. Orders of other staff in past days are restricted.'
                      : 'Lịch sử các ngày trước: Chỉ hiển thị các đơn do chính bạn xử lý. Đơn của nhân viên khác ở các ngày trước được bảo mật theo quy định.')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              {activeTab === 'TODAY'
                ? (isEn ? 'Shift Orders Today' : 'Đơn trong ca trực hôm nay')
                : (isEn ? 'Your Orders' : 'Đơn do bạn xử lý')}
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
                          {(() => {
                            const todayVN = getTodayVN();
                            const yest = new Date(Date.now() + 7 * 3600000 - 86400000);
                            const y = yest.getUTCFullYear();
                            const m = String(yest.getUTCMonth() + 1).padStart(2, '0');
                            const d = String(yest.getUTCDate()).padStart(2, '0');
                            const yestStr = `${y}-${m}-${d}`;
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleCustomDateChange(todayVN.dateStr);
                                    setPickerYear(todayVN.year);
                                    setPickerMonthIndex(todayVN.monthIndex);
                                    setIsDayPickerOpen(false);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                                >
                                  Hôm nay (${todayVN.dateStr.slice(8, 10)}/${todayVN.dateStr.slice(5, 7)})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleCustomDateChange(yestStr);
                                    setPickerYear(y);
                                    setPickerMonthIndex(yest.getUTCMonth());
                                    setIsDayPickerOpen(false);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                                >
                                  Hôm qua (${d}/${m})
                                </button>
                              </>
                            );
                          })()}
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

        ].map((item) => {

          const Icon = item.icon;

          const isSelected = selectedPaymentMethod === item.key;

          return (

            <button

              key={item.key}

              onClick={() => setSelectedPaymentMethod(item.key)}

              className={`px-3.5 py-1.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${

                isSelected

                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25'

                  : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'

              }`}

            >

              {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />}

              <span className="whitespace-nowrap">{item.label}</span>

            </button>

          );

        })}

        {!staffMode && availableStaffList.length > 1 && (
          <div className="flex items-center gap-1.5 ml-auto text-xs bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-xs">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">
              {isEn ? 'Staff:' : 'Nhân viên:'}
            </span>
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">{isEn ? 'All Staff' : 'Tất cả nhân viên'}</option>
              {availableStaffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>



      {/* Orders Table */}

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs">

            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">

              <tr className="whitespace-nowrap">

                <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? 'Order Code' : 'Mã đơn hàng'}</th>

                <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? 'Time' : 'Thời gian'}</th>

                <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? 'Handler' : 'Nhân viên xử lý'}</th>

                <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? 'Payment' : 'Thanh toán'}</th>

                <th className="py-3 px-3.5 text-center whitespace-nowrap">{isEn ? 'Quantity' : 'Số lượng'}</th>

                <th className="py-3 px-3.5 text-right whitespace-nowrap">{isEn ? 'Total' : 'Tổng tiền'}</th>

                <th className="py-3 px-3.5 text-center whitespace-nowrap">{isEn ? 'Status' : 'Trạng thái'}</th>

                <th className="py-3 pr-4 pl-2 text-right whitespace-nowrap">{isEn ? 'Actions' : 'Thao tác'}</th>

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

                      <td className="py-3 px-3.5 whitespace-nowrap">

                        <div

                          onClick={() => {

                            if (navigator.clipboard?.writeText) {

                              navigator.clipboard.writeText(ord.orderId);

                              toast.success(isEn ? `Copied: ${ord.orderId}` : `Đã sao chép: ${ord.orderId}`);

                            }

                          }}

                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 text-slate-800 font-mono text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0"

                          title={isEn ? "Click to copy order code" : "Click để sao chép mã đơn"}

                        >

                          <span className="whitespace-nowrap select-all">{ord.orderId}</span>

                          <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600 shrink-0" />

                        </div>

                      </td>



                      {/* Thời gian */}

                      <td className="py-3 px-3.5 whitespace-nowrap">

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

                      <td className="py-3 px-3.5 whitespace-nowrap">

                        <span className="font-semibold text-slate-800 text-xs">

                          {ord.createdBy?.fullName || (isEn ? 'Store Owner' : 'Chủ shop')}

                        </span>

                      </td>



                      {/* Payment Method */}

                      <td className="py-3 px-3.5 whitespace-nowrap">

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold shadow-xs whitespace-nowrap shrink-0 ${payBadge.className}`}>

                          <PayIcon className="w-3.5 h-3.5 shrink-0" />

                          <span className="whitespace-nowrap">{payBadge.label}</span>

                        </span>

                      </td>



                      {/* Số lượng */}

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">

                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs whitespace-nowrap">

                          {ord.netItemsCount ?? ord.itemsCount} SP

                        </span>

                        {Number(ord.returnedQuantity || 0) > 0 && (

                          <span className="block text-[9.5px] font-semibold text-amber-600 mt-0.5 whitespace-nowrap">

                            ({isEn ? `Returned ${ord.returnedQuantity} items` : `Trả ${ord.returnedQuantity} SP`})

                          </span>

                        )}

                      </td>



                      {/* Tổng tiền */}

                      <td className="py-3 px-3.5 text-right whitespace-nowrap">

                        <span className="font-black text-slate-900 text-sm tracking-tight font-sans whitespace-nowrap">

                          {formatVND(ord.netAmount ?? ord.totalAmount)}

                        </span>

                        {Number(ord.refundedAmount || 0) > 0 && (

                          <span className="block text-[9.5px] font-semibold text-amber-600 mt-0.5 whitespace-nowrap">

                            ({isEn ? `Refund ${formatVND(ord.refundedAmount)}` : `Hoàn ${formatVND(ord.refundedAmount)}`})

                          </span>

                        )}

                      </td>



                      {/* Status */}

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">

                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center justify-center border shadow-sm whitespace-nowrap ${statusBadge.className}`}>


                          <span>{statusBadge.label}</span>

                        </span>

                      </td>



                      {/* Actions */}

                      <td className="py-3 pr-4 pl-2 text-right whitespace-nowrap">

                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">

                          {staffMode ? (

                            /* Role Nhân viên: Xem chi tiết đơn, in hóa đơn và đổi trả/hủy đơn trong ca */

                            <>

                              {/* Xem chi tiết đơn */}

                              <button

                                onClick={() => setViewOrderDetail(ord)}

                                className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"

                                title="Xem chi tiết đơn"

                              >

                                <Eye className="w-3.5 h-3.5" />

                              </button>

                              {/* In hóa đơn */}

                              <button

                                onClick={() => handlePrintReceipt(ord)}

                                className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"

                                title="In hóa đơn bán hàng"

                              >

                                <Printer className="w-3.5 h-3.5" />

                              </button>



                              {/* Đổi trả hàng & Hoàn tiền (Thay thế thùng rác) */}

                              {ord.status === 'CANCELED' || ord.status === 'CANCELLED' ? (

                                <span

                                  className="w-7 h-7 rounded-lg border border-slate-100 bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed"

                                  title="Đơn hàng này đã bị hủy hoàn toàn"

                                >

                                  <ReturnOrderIcon className="w-3.5 h-3.5" />

                                </span>

                              ) : (

                                <button

                                  onClick={() => handleOpenReturnModal(ord)}

                                  disabled={actionLoading}

                                  className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"

                                  title="Đổi trả hàng & Hoàn tiền (Trả 1 số món hoặc hủy toàn bộ)"

                                >

                                  <ReturnOrderIcon className="w-3.5 h-3.5" />

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

                                className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"

                                title="Xem chi tiết đơn"

                              >

                                <Eye className="w-3.5 h-3.5" />

                              </button>



                              {/* Print Receipt */}

                              <button

                                onClick={() => handlePrintReceipt(ord)}

                                className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"

                                title="In hóa đơn bán hàng"

                              >

                                <Printer className="w-3.5 h-3.5" />

                              </button>



                              {/* Đổi trả hàng & Hoàn tiền (Thay thế thùng rác) */}

                              {ord.status !== 'CANCELED' && ord.status !== 'CANCELLED' ? (

                                <button

                                  onClick={() => handleOpenReturnModal(ord)}

                                  disabled={actionLoading}

                                  className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"

                                  title="Đổi trả hàng & Hoàn tiền (Trả 1 số món hoặc hủy toàn bộ)"

                                >

                                  <ReturnOrderIcon className="w-3.5 h-3.5" />

                                </button>

                              ) : (

                                <span

                                  className="w-7 h-7 rounded-lg border border-slate-100 bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed"

                                  title="Đơn hàng này đã bị hủy hoàn toàn"

                                >

                                  <ReturnOrderIcon className="w-3.5 h-3.5" />

                                </span>

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

              Hiển thị <span className="font-bold text-slate-800">{((pagination.page - 1) * pagination.limit) + 1}</span> - <span className="font-bold text-slate-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong tổng số <span className="font-bold text-blue-600">{pagination.total?.toLocaleString('vi-VN')}</span> {staffMode ? (activeTab === 'TODAY' ? 'đơn trong ca' : 'đơn bạn xử lý') : 'đơn hàng'}

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

                        {Math.max(0, (it.quantity || 1) - (it.returnedQuantity || 0))} x {formatVND(it.unitPriceSnapshot || it.price)}

                        {Number(it.returnedQuantity || 0) > 0 && (

                          <span className="text-amber-600 font-medium ml-1">

                            (Gốc: {it.quantity} SP · Đã trả: {it.returnedQuantity} SP)

                          </span>

                        )}

                      </p>

                    </div>

                    <div className="text-right">

                      <span className="font-bold text-foreground">

                        {formatVND(Math.max(0, Number(it.subtotal || it.amount) - Number(it.refundedAmount || 0)))}

                      </span>

                      {Number(it.refundedAmount || 0) > 0 && (

                        <span className="block text-[10px] text-amber-600 font-medium">

                          Đã hoàn: {formatVND(it.refundedAmount)}

                        </span>

                      )}

                    </div>

                  </div>

                ))}

              </div>

            </div>



            {/* Financial summary */}

            <div className="pt-2 border-t border-border space-y-1.5 text-xs">

              <div className="flex justify-between">

                <span className="text-muted-foreground">Tổng tiền hàng ban đầu:</span>

                <span className="font-semibold text-foreground">

                  {formatVND(viewOrderDetail.grossAmount || viewOrderDetail.subtotalAmount || viewOrderDetail.totalAmount)}

                </span>

              </div>

              {Number(viewOrderDetail.discountAmount) > 0 && (

                <div className="flex justify-between text-emerald-600">

                  <span>Chiết khấu:</span>

                  <span>-{formatVND(viewOrderDetail.discountAmount)}</span>

                </div>

              )}

              {Number(viewOrderDetail.refundedAmount || 0) > 0 && (

                <div className="flex justify-between text-amber-600 font-semibold">

                  <span>Đã hoàn tiền trả hàng:</span>

                  <span>-{formatVND(viewOrderDetail.refundedAmount)}</span>

                </div>

              )}

              <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t border-border">

                <span>Thực thu (Tổng thanh toán):</span>

                <span className="text-blue-600 font-black text-lg">

                  {formatVND(viewOrderDetail.netAmount ?? (Number(viewOrderDetail.totalAmount) - Number(viewOrderDetail.refundedAmount || 0)))}

                </span>

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



              </div>

              <button
                type="button"
                onClick={() => setViewOrderDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors ml-auto cursor-pointer"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>

            </div>

          </div>

        </div>

      )}



      {/* ─── MODAL: ĐỔI TRẢ HÀNG & HOÀN TIỀN (TRẢ 1 SỐ MÓN HOẶC HỦY TOÀN BỘ) ─── */}

      {returnModalOrder && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0">

          <div className="bg-white w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}

            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50/80">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shadow-inner border border-slate-200/80">

                  <ReturnOrderIcon className="w-5 h-5" />

                </div>

                <div>

                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">

                    Xử lý Đổi trả hàng & Hoàn tiền

                  </h3>

                  <p className="text-xs text-muted-foreground">

                    Mã đơn: <strong className="font-mono text-slate-800">{returnModalOrder.orderNumber}</strong> • Trạng thái: {returnModalOrder.status}

                  </p>

                </div>

              </div>

              <button

                type="button"

                onClick={() => setReturnModalOrder(null)}

                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"

              >

                <X className="w-5 h-5" />

              </button>

            </div>



            {/* Tabs */}

            <div className="flex border-b border-border bg-slate-100/60 p-1.5 gap-1.5">

              <button

                type="button"

                onClick={() => setReturnTab('PARTIAL')}

                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${

                  returnTab === 'PARTIAL'

                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'

                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'

                }`}

              >

                <ReturnOrderIcon className={`w-4 h-4 ${returnTab === 'PARTIAL' ? 'text-slate-900' : 'text-slate-500'}`} />

                Trả sản phẩm

              </button>

              <button

                type="button"

                onClick={() => setReturnTab('CANCEL_ALL')}

                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${

                  returnTab === 'CANCEL_ALL'

                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'

                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'

                }`}

              >

                <XCircle className={`w-4 h-4 ${returnTab === 'CANCEL_ALL' ? 'text-slate-900' : 'text-slate-500'}`} />

                Hủy đơn hàng

              </button>

            </div>



            {/* Modal Body */}

            <div className="p-6 overflow-y-auto space-y-4 flex-1">

              {returnTab === 'PARTIAL' ? (

                <>

                  {/* Danh sách mặt hàng */}

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">

                    <table className="w-full text-left text-xs">

                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">

                        <tr>

                          <th className="py-2.5 px-3">Sản phẩm</th>

                          <th className="py-2.5 px-2 text-right">Đơn giá</th>

                          <th className="py-2.5 px-2 text-center">Đã mua</th>

                          <th className="py-2.5 px-2 text-center">Đã trả</th>

                          <th className="py-2.5 px-3 text-center w-36">SL muốn trả</th>

                          <th className="py-2.5 px-3 text-right">Tiền hoàn</th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {(returnModalOrder.items || []).map((it) => {

                          const alreadyReturned = it.returnedQuantity || 0;

                          const maxReturn = Math.max(0, it.quantity - alreadyReturned);

                          const returnQty = returnQuantities[it.id] || 0;

                          const itemUnitPrice = safeNum(it.unitPriceSnapshot);

                          const itemRefund = returnQty * itemUnitPrice;



                          return (

                            <tr key={it.id} className={returnQty > 0 ? 'bg-slate-50/80' : ''}>

                              <td className="py-2.5 px-3">

                                <p className="font-bold text-slate-800">{it.nameSnapshot}</p>

                                <p className="text-[10px] text-slate-400 font-mono">{it.skuSnapshot}</p>

                              </td>

                              <td className="py-2.5 px-2 text-right font-semibold text-slate-700">

                                {formatVND(itemUnitPrice)}

                              </td>

                              <td className="py-2.5 px-2 text-center font-bold text-slate-800">

                                {it.quantity}

                              </td>

                              <td className="py-2.5 px-2 text-center text-slate-500">

                                {alreadyReturned > 0 ? (

                                  <span className="text-amber-600 font-bold">{alreadyReturned}</span>

                                ) : (

                                  '0'

                                )}

                              </td>

                              <td className="py-2.5 px-3 text-center">

                                {maxReturn <= 0 ? (

                                  <span className="text-[11px] font-bold text-slate-400 italic">Đã trả hết</span>

                                ) : (

                                  <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">

                                    <button

                                      type="button"

                                      onClick={() =>

                                        setReturnQuantities((prev) => ({

                                          ...prev,

                                          [it.id]: Math.max(0, (prev[it.id] || 0) - 1),

                                        }))

                                      }

                                      disabled={returnQty <= 0}

                                      className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"

                                    >

                                      -

                                    </button>

                                    <span className="w-9 text-center font-bold text-slate-900 text-xs">

                                      {returnQty}

                                    </span>

                                    <button

                                      type="button"

                                      onClick={() =>

                                        setReturnQuantities((prev) => ({

                                          ...prev,

                                          [it.id]: Math.min(maxReturn, (prev[it.id] || 0) + 1),

                                        }))

                                      }

                                      disabled={returnQty >= maxReturn}

                                      className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"

                                    >

                                      +

                                    </button>

                                  </div>

                                )}

                              </td>

                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">

                                {returnQty > 0 ? formatVND(itemRefund) : '0 đ'}

                              </td>

                            </tr>

                          );

                        })}

                      </tbody>

                    </table>

                  </div>



                  {/* Reason Options */}

                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">

                    <div>

                      <label className="text-[11px] font-bold text-slate-700 block mb-1">

                        Lý do khách trả hàng:

                      </label>

                      <input

                        type="text"

                        value={returnReasonText}

                        onChange={(e) => setReturnReasonText(e.target.value)}

                        placeholder="VD: Khách đổi ý, hàng bị rách bao bì, lấy nhầm loại..."

                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-400 bg-white"

                      />

                      <div className="flex flex-wrap gap-1.5 mt-2">

                        {['Khách đổi ý', 'Hàng bị lỗi / hỏng', 'Lấy nhầm sản phẩm', 'Hết nhu cầu'].map((sug) => (

                          <button

                            key={sug}

                            type="button"

                            onClick={() => setReturnReasonText(sug)}

                            className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"

                          >

                            {sug}

                          </button>

                        ))}

                      </div>

                    </div>

                  </div>



                  {/* Tóm tắt hoàn tiền */}

                  {(() => {

                    let totalQty = 0;

                    let totalRefund = 0;

                    (returnModalOrder.items || []).forEach((it) => {

                      const q = returnQuantities[it.id] || 0;

                      totalQty += q;

                      totalRefund += q * safeNum(it.unitPriceSnapshot);

                    });



                    return (

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">

                        <div>

                          <p className="text-[11px] text-slate-600 font-medium">Tổng số lượng hoàn trả:</p>

                          <p className="text-sm font-bold text-slate-900">

                            {totalQty} sản phẩm

                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-[11px] text-slate-600 font-medium">Tổng tiền thối lại cho khách:</p>

                          <p className="text-base font-extrabold text-slate-900">

                            {formatVND(totalRefund)}

                          </p>

                        </div>

                      </div>

                    );

                  })()}

                </>

              ) : (

                /* Tab 2: CANCEL ALL */

                <>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 space-y-1.5">

                    <div className="flex items-center gap-2 font-bold text-slate-900">

                      <AlertTriangle className="w-4 h-4 text-slate-700 shrink-0" />

                      Cảnh báo: Hủy đơn hàng

                    </div>

                    <p className="text-[11px] text-slate-700 leading-relaxed">

                      Đơn hàng này sẽ chuyển sang trạng thái <strong className="text-slate-900 font-bold">ĐÃ HỦY (CANCELED)</strong>. Toàn bộ các sản phẩm còn lại chưa trả sẽ được <strong className="text-slate-900 font-bold">tự động hoàn lại kho</strong> và toàn bộ doanh thu <strong className="text-slate-900 font-bold">{formatVND(returnModalOrder.totalAmount)}</strong> sẽ bị trừ khỏi hệ thống.

                    </p>

                  </div>



                  <div>

                    <label className="text-xs font-semibold text-slate-700 block mb-2">

                      Lý do hủy đơn hàng:

                    </label>

                    <div className="space-y-1.5">

                      {[

                        'Khách trả toàn bộ hàng về kho',

                        'Lập nhầm đơn hàng',

                        'Chủ shop hủy giao dịch',

                      ].map((reason) => {

                        const isSel = cancelAllReasonText === reason;

                        return (

                          <button

                            key={reason}

                            type="button"

                            onClick={() => setCancelAllReasonText(reason)}

                            className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all cursor-pointer ${

                              isSel

                                ? 'bg-white border-slate-900 text-slate-900 font-bold ring-1 ring-slate-900 shadow-xs'

                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'

                            }`}

                          >

                            <span>{reason}</span>

                            {isSel && <Check className="w-4 h-4 text-slate-900" />}

                          </button>

                        );

                      })}

                    </div>

                  </div>

                </>

              )}

            </div>



            {/* Modal Footer */}

            <div className="px-6 py-3.5 border-t border-border bg-slate-50 flex items-center justify-between">

              <button

                type="button"

                onClick={() => setReturnModalOrder(null)}

                disabled={returnSubmitting}

                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"

              >

                Đóng

              </button>



              {returnTab === 'PARTIAL' ? (

                (() => {

                  let totalQty = 0;

                  let totalRefund = 0;

                  (returnModalOrder.items || []).forEach((it) => {

                    const q = returnQuantities[it.id] || 0;

                    totalQty += q;

                    totalRefund += q * safeNum(it.unitPriceSnapshot);

                  });



                  return (

                    <button

                      type="button"

                      onClick={handlePartialReturnSubmit}

                      disabled={returnSubmitting || totalQty <= 0}

                      className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"

                    >

                      <ReturnOrderIcon className="w-3.5 h-3.5" />

                      {returnSubmitting ? 'Đang xử lý...' : `Xác nhận trả ${totalQty} món (Hoàn ${formatVND(totalRefund)})`}

                    </button>

                  );

                })()

              ) : (

                <button

                  type="button"

                  onClick={handleCancelAllFromReturnModal}

                  disabled={returnSubmitting}

                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"

                >

                  <XCircle className="w-4 h-4 text-red-500" />

                  {returnSubmitting ? 'Đang hủy đơn...' : 'Xác nhận hủy'}

                </button>

              )}

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

