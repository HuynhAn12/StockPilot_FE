import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Plus, Trash2, Printer, CheckCircle, CreditCard,
  Banknote, QrCode, User, Phone, X, ShoppingBag, ArrowRight,
  RotateCcw, Sparkles, Tag, ChevronRight, ChevronLeft, Check, AlertCircle,
  FileText, Percent, Minus, SlidersHorizontal, Package, RefreshCw,
  Receipt, Zap
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useAuthStore } from '../components/store/authStore';
import { apiGetPosProducts, apiCreatePosSale } from '../services/posService';
import { docSoThanhChu } from '../utils/numberToWordsVN';

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}

function getPosProductImage(p) {
  if (p?.imageUrl) return p.imageUrl;
  const name = (p?.name || '').toLowerCase();
  const sku = (p?.sku || p?.code || '').toLowerCase();

  // Fashion / Apparel (matching screenshot)
  if (name.includes('vest') || name.includes('suit')) {
    if (name.includes('xanh lá') || name.includes('xanh la')) {
      return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=240&h=240&fit=crop';
    }
    if (name.includes('kem') || name.includes('trắng') || name.includes('trang')) {
      return 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=240&h=240&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=240&h=240&fit=crop';
  }
  if (name.includes('sơ mi') || name.includes('so mi')) {
    if (name.includes('đỏ') || name.includes('do') || name.includes('caro')) {
      return 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=240&h=240&fit=crop';
    }
    if (name.includes('trắng') || name.includes('trang') || name.includes('sọc')) {
      return 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=240&h=240&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=240&h=240&fit=crop';
  }
  if (name.includes('cà vạt') || name.includes('ca vat') || name.includes('tie')) {
    return 'https://images.unsplash.com/photo-1589756823695-278bc923f962?w=240&h=240&fit=crop';
  }
  if (name.includes('thắt lưng') || name.includes('that lung') || name.includes('belt')) {
    return 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=240&h=240&fit=crop';
  }
  if (name.includes('quần tây') || name.includes('quan tay') || name.includes('kaki') || name.includes('quần')) {
    return 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=240&h=240&fit=crop';
  }

  // Convenience / Grocery / Electronics
  if (name.includes('ổ cắm') || name.includes('o cam') || sku.includes('oc-')) {
    return 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=240&h=240&fit=crop';
  }
  if (name.includes('pin') || sku.includes('pin')) {
    return 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=240&h=240&fit=crop';
  }
  if (name.includes('khẩu trang') || name.includes('khau trang') || sku.includes('kt-')) {
    return 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=240&h=240&fit=crop';
  }
  if (name.includes('khăn giấy') || name.includes('khan giay') || sku.includes('kg-')) {
    return 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=240&h=240&fit=crop';
  }
  if (name.includes('băng dính') || name.includes('bang dinh') || sku.includes('bd-')) {
    return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=240&h=240&fit=crop';
  }
  if (name.includes('keo 502') || sku.includes('keo')) {
    return 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=240&h=240&fit=crop';
  }
  if (name.includes('bánh mì') || name.includes('banh mi') || name.includes('xúc xích') || name.includes('xuc xich')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=240&h=240&fit=crop';
  }
  if (name.includes('cà phê') || name.includes('ca phe') || name.includes('trà') || name.includes('coca') || name.includes('sữa')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&h=240&fit=crop';
  }
  if (name.includes('dầu gội') || name.includes('dau goi') || name.includes('kem đánh răng') || name.includes('sữa tắm')) {
    return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=240&h=240&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=240&h=240&fit=crop';
}

// Read the same localStorage overrides that ProductsPage edit modal writes
function applyPosOverrides(products) {
  try {
    const raw = localStorage.getItem('stockpilot_overrides');
    if (!raw) return products;
    const overrides = JSON.parse(raw); // { [productId]: { name, salePrice, imageUrl } }
    return products.map((p) => {
      const ov = overrides[String(p.id)];
      if (!ov) return p;
      return {
        ...p,
        name: ov.name ?? p.name,
        imageUrl: ov.imageUrl ?? p.imageUrl,
        sellingPrice: ov.salePrice ?? p.sellingPrice,
        // also patch stockItems sellingPrice so cart price is correct
        stockItems: p.stockItems?.map((si) => ({
          ...si,
          sellingPrice: ov.salePrice ?? si.sellingPrice,
        })),
      };
    });
  } catch {
    return products;
  }
}

export function PosPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [tabs, setTabs] = useState([
    {
      id: 1,
      name: 'Hóa đơn 1',
      items: [],
      customer: { name: 'Khách lẻ', phone: '' },
      note: '',
      discount: 0,
      saleMode: 'standard'
    }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);

  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountGiven, setAmountGiven] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [printReceiptData, setPrintReceiptData] = useState(null);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [custNameInput, setCustNameInput] = useState('');
  const [custPhoneInput, setCustPhoneInput] = useState('');

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await apiGetPosProducts();
      const raw = Array.isArray(data) ? data : (data?.items || []);
      setProducts(applyPosOverrides(raw));
    } catch (err) {
      console.warn('Lỗi tải sản phẩm:', err?.message);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const categoriesList = useMemo(() => {
    const setCat = new Set();
    products.forEach((p) => { if (p.category?.name) setCat.add(p.category.name); });
    return Array.from(setCat);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category?.name === selectedCategory;
      const q = searchProduct.trim().toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.stockItems?.some((si) => si.sku?.toLowerCase().includes(q) || si.barcode?.includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchProduct]);

  // POS Pagination (18 items per page, 3 columns x 6 rows)
  const [posPage, setPosPage] = useState(1);
  const POS_ITEMS_PER_PAGE = 18;

  useEffect(() => {
    setPosPage(1);
  }, [selectedCategory, searchProduct]);

  const totalPosPages = Math.max(1, Math.ceil(filteredProducts.length / POS_ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (posPage - 1) * POS_ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + POS_ITEMS_PER_PAGE);
  }, [filteredProducts, posPage]);

  const addTab = () => {
    const nextId = (tabs[tabs.length - 1]?.id || 0) + 1;
    setTabs([...tabs, {
      id: nextId,
      name: `Hóa đơn ${nextId}`,
      items: [],
      customer: { name: 'Khách lẻ', phone: '' },
      note: '',
      discount: 0,
      saleMode: 'standard'
    }]);
    setActiveTabId(nextId);
  };

  const closeTab = (tabId, e) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      setTabs([{ id: 1, name: 'Hóa đơn 1', items: [], customer: { name: 'Khách lẻ', phone: '' }, note: '', discount: 0, saleMode: 'standard' }]);
      return;
    }
    const filtered = tabs.filter((t) => t.id !== tabId);
    setTabs(filtered);
    if (activeTabId === tabId) setActiveTabId(filtered[0].id);
  };

  const updateActiveTab = (updates) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, ...updates } : t)));
  };

  const addItemToCart = (product) => {
    // Apply latest overrides at the moment of adding
    const [applied] = applyPosOverrides([product]);
    const defaultStockItem = applied.stockItems?.[0] || {};
    const stockItemId = defaultStockItem.id;
    if (!stockItemId) {
      toast({ title: 'Sản phẩm lỗi', description: 'Sản phẩm chưa có mã kho', type: 'error' });
      return;
    }
    const currentItems = activeTab.items;
    const existingIndex = currentItems.findIndex((it) => it.stockItemId === stockItemId);
    const price = Number(defaultStockItem.sellingPrice || applied.sellingPrice || 0);
    const sku = defaultStockItem.sku || applied.code || `SKU-${applied.id}`;
    const imgSrc = getPosProductImage(applied);
    if (existingIndex >= 0) {
      const updated = [...currentItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * price;
      updateActiveTab({ items: updated });
    } else {
      updateActiveTab({
        items: [
          ...currentItems,
          { productId: applied.id, stockItemId, name: applied.name, sku, price, quantity: 1, subtotal: price, imageUrl: imgSrc }
        ]
      });
    }
  };

  const updateItemQuantity = (stockItemId, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    updateActiveTab({ items: activeTab.items.map((it) => it.stockItemId === stockItemId ? { ...it, quantity: qty, subtotal: qty * it.price } : it) });
  };

  const removeItem = (stockItemId) => {
    updateActiveTab({ items: activeTab.items.filter((it) => it.stockItemId !== stockItemId) });
  };

  const totalItemCount = useMemo(() => activeTab.items.reduce((s, it) => s + it.quantity, 0), [activeTab.items]);
  const subtotalAmount = useMemo(() => activeTab.items.reduce((s, it) => s + it.subtotal, 0), [activeTab.items]);
  const discountAmount = Number(activeTab.discount || 0);
  const totalPayable = Math.max(0, subtotalAmount - discountAmount);

  useEffect(() => {
    if (isCheckoutOpen) setAmountGiven(String(totalPayable));
  }, [isCheckoutOpen, totalPayable]);

  const customerPayNum = Number(amountGiven || 0);
  const changeDue = customerPayNum - totalPayable;

  const handleCompleteSale = async (shouldPrint = false) => {
    if (activeTab.items.length === 0) {
      toast({ title: 'Giỏ hàng trống', description: 'Vui lòng chọn ít nhất 1 mặt hàng', type: 'error' });
      return;
    }
    if (customerPayNum < totalPayable && paymentMethod === 'CASH') {
      toast({ title: 'Chưa đủ tiền', description: 'Tiền khách đưa nhỏ hơn tổng cần thanh toán', type: 'error' });
      return;
    }
    setIsProcessing(true);
    try {
      const payload = {
        customerName: activeTab.customer.name || 'Khách lẻ',
        customerPhone: activeTab.customer.phone || undefined,
        discountAmount,
        taxAmount: 0,
        note: activeTab.note || undefined,
        paymentMethod,
        items: activeTab.items.map((it) => ({ stockItemId: it.stockItemId, quantity: it.quantity })),
      };
      const res = await apiCreatePosSale(payload);
      toast({ title: 'Thanh toán thành công!', description: `Đơn #${res?.order?.orderNumber || 'POS'} đã ghi nhận.`, type: 'success' });

      const receipt = {
        orderNumber: res?.order?.orderNumber || `HD-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toLocaleString('vi-VN'),
        customerName: activeTab.customer.name || 'Khách lẻ',
        customerPhone: activeTab.customer.phone || '',
        cashier: user?.fullName || user?.email || 'Thu ngân',
        storeName: user?.store?.name || 'StockPilot Store',
        storeAddress: user?.store?.address || 'Chi nhánh trung tâm',
        storePhone: user?.store?.phone || '0978.387.857',
        items: activeTab.items,
        subtotal: subtotalAmount,
        discount: discountAmount,
        total: totalPayable,
        amountGiven: customerPayNum,
        changeDue: Math.max(0, changeDue),
        totalInWords: docSoThanhChu(totalPayable),
        paymentMethod: paymentMethod === 'CASH' ? 'Tiền mặt' : paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'PayOS',
      };

      updateActiveTab({ items: [], note: '', discount: 0, customer: { name: 'Khách lẻ', phone: '' } });
      setIsCheckoutOpen(false);

      if (shouldPrint) {
        setPrintReceiptData(receipt);
        setTimeout(() => window.print(), 400);
      }
    } catch (err) {
      toast({ title: 'Thanh toán thất bại', description: err?.response?.data?.error?.message || err?.message || 'Lỗi khi tạo đơn.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-5rem)] max-w-[1760px] mx-auto overflow-hidden">

      {/* ─── LEFT COLUMN: CART (60%) ─── */}
      <div
        className="flex-1 flex flex-col overflow-hidden min-w-0 rounded-2xl border border-white/80"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.04)' }}
      >
        {/* Tabs Header */}
        <div
          className="flex items-center justify-between border-b px-3 pt-2 overflow-x-auto gap-2"
          style={{ background: 'linear-gradient(180deg, #f8fafd 0%, #f1f5fb 100%)', borderColor: 'hsl(214 25% 89%)' }}
        >
          <div className="flex items-center gap-1 overflow-x-auto pb-px">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const count = tab.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-t border-x cursor-pointer transition-all select-none ${
                    isActive
                      ? 'bg-white text-blue-600 border-blue-200/60 border-b-white shadow-sm -mb-px'
                      : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-white/60'
                  }`}
                  style={isActive ? { borderBottomColor: '#fff' } : {}}
                >
                  <Receipt className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{tab.name}</span>
                  {count > 0 && (
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {count}
                    </span>
                  )}
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            <button
              onClick={addTab}
              className="mb-0.5 p-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 text-xs flex items-center gap-1 transition-all"
              title="Thêm hóa đơn mới"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
              F3 Tìm hàng · F4 Khách · F9 Thanh toán
            </span>
          </div>
        </div>

        {/* Cart Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '44px 44px 1fr 70px 88px 100px',
            gap: 8,
            padding: '10px 20px',
            borderBottom: '1px solid hsl(214 25% 89%)',
            background: 'hsl(214 30% 96%)',
            color: 'hsl(215 16% 55%)',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <div style={{ textAlign: 'center' }}>STT</div>
          <div style={{ textAlign: 'center' }}>Xóa</div>
          <div style={{ whiteSpace: 'nowrap' }}>Tên hàng hóa</div>
          <div style={{ textAlign: 'center' }}>Số lượng</div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Đơn giá</div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Thành tiền</div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto divide-y" style={{ divideColor: 'hsl(214 25% 93%)' }}>
          {activeTab.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, hsl(213 100% 94%) 0%, hsl(221 100% 92%) 100%)' }}
              >
                <ShoppingBag className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-700 mb-1">Hóa đơn chưa có hàng hóa</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Chọn sản phẩm từ danh mục bên phải hoặc tìm kiếm theo tên / mã barcode để thêm vào hóa đơn.
              </p>
            </div>
          ) : (
            activeTab.items.map((item, idx) => (
              <div
                key={item.stockItemId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 44px 1fr 70px 88px 100px',
                  gap: 8,
                  padding: '12px 20px',
                  alignItems: 'center',
                  borderBottom: '1px solid hsl(214 25% 91%)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'hsl(213 100% 98%)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                {/* STT */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 26, height: 26, borderRadius: 8,
                    background: 'hsl(214 30% 94%)', color: 'hsl(215 20% 50%)',
                    fontWeight: 700, fontSize: 12
                  }}>{idx + 1}</span>
                </div>

                {/* Delete */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => removeItem(item.stockItemId)}
                    style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid hsl(214 25% 89%)', background: 'white', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s', margin: '0 auto' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'hsl(214 25% 89%)'; }}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>

                {/* Image + Name + SKU */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <img
                    src={getPosProductImage(item)}
                    alt={item.name}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, border: '2px solid hsl(214 25% 87%)', background: '#f1f5f9', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=240&h=240&fit=crop'; }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 800, color: '#1e293b', fontSize: 14, lineHeight: 1.35, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em', background: 'hsl(214 30% 95%)', padding: '2px 7px', borderRadius: 5 }}>{item.sku}</span>
                  </div>
                </div>

                {/* Quantity */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <button
                    onClick={() => updateItemQuantity(item.stockItemId, item.quantity - 1)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid hsl(214 25% 87%)', background: 'white', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'hsl(214 25% 87%)'; }}
                  >
                    <Minus style={{ width: 11, height: 11 }} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(item.stockItemId, e.target.value)}
                    className="pos-qty-input"
                    style={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: 13, padding: '3px 2px', border: '1px solid hsl(214 25% 87%)', borderRadius: 6, background: 'white', color: '#1e293b', outline: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                  />
                  <button
                    onClick={() => updateItemQuantity(item.stockItemId, item.quantity + 1)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid hsl(214 25% 87%)', background: 'white', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'hsl(214 25% 87%)'; }}
                  >
                    <Plus style={{ width: 11, height: 11 }} />
                  </button>
                </div>

                {/* Unit Price */}
                <div style={{ textAlign: 'right', color: '#475569', fontWeight: 700, fontSize: 14 }}>{formatVND(item.price)}</div>

                {/* Subtotal */}
                <div style={{ textAlign: 'right', fontWeight: 900, fontSize: 16, color: '#2563eb' }}>{formatVND(item.subtotal)}</div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t p-3 space-y-2.5"
          style={{ background: 'linear-gradient(180deg, #fff 0%, #f8fafd 100%)', borderColor: 'hsl(214 25% 89%)' }}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Ghi chú đơn hàng (F8)..."
              value={activeTab.note}
              onChange={(e) => updateActiveTab({ note: e.target.value })}
              className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Sale mode pills */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold gap-0.5">
              {[
                { id: 'quick', label: 'Bán nhanh' },
                { id: 'standard', label: 'Bán thường' },
                { id: 'delivery', label: 'Giao hàng' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => updateActiveTab({ saleMode: mode.id })}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    activeTab.saleMode === mode.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Tổng tiền hàng <span className="text-slate-700 font-semibold">({totalItemCount} sp)</span>:
              </span>
              <span className="text-xl font-black text-slate-800 money tracking-tight">
                {formatVND(subtotalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: CATALOG + CHECKOUT (45%) ─── */}
      <div
        className="w-full lg:w-[520px] xl:w-[600px] 2xl:w-[660px] flex flex-col overflow-hidden shrink-0 rounded-2xl border border-white/80"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.04)' }}
      >
        {/* Customer Search */}
        <div
          className="p-3 border-b flex items-center gap-2"
          style={{ background: 'linear-gradient(180deg, #f8fafd 0%, #f1f5fb 100%)', borderColor: 'hsl(214 25% 89%)' }}
        >
          <div className="relative flex-1">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm khách hàng (F4)..."
              value={activeTab.customer.name === 'Khách lẻ' && !activeTab.customer.phone ? '' : `${activeTab.customer.name}${activeTab.customer.phone ? ' · ' + activeTab.customer.phone : ''}`}
              onChange={(e) => updateActiveTab({ customer: { ...activeTab.customer, name: e.target.value } })}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all"
            title="Thêm khách hàng"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Product Search */}
        <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'hsl(214 25% 89%)' }}>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm hàng hóa theo tên, SKU, barcode (F3)..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            {searchProduct && (
              <button
                onClick={() => setSearchProduct('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={loadProducts}
            disabled={isLoadingProducts}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all disabled:opacity-40"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProducts ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Categories */}
        <div
          className="px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-xs"
          style={{ background: 'hsl(214 30% 97%)', borderColor: 'hsl(214 25% 89%)' }}
        >
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300'
            }`}
          >
            Tất cả ({products.length})
          </button>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid (3 Columns with Images exactly like user screenshot) */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoadingProducts ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Đang tải sản phẩm...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'hsl(214 30% 94%)' }}
              >
                <Package className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-600">Không tìm thấy sản phẩm nào</p>
              <p className="text-xs text-slate-400 mt-1">Thử tìm theo từ khóa hoặc danh mục khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {paginatedProducts.map((p) => {
                const stockItem = p.stockItems?.[0] || {};
                const price = Number(stockItem.sellingPrice || p.sellingPrice || 0);
                const stock = stockItem.balances?.reduce((sum, b) => sum + (b.quantity || 0), 0) ?? 0;
                const inCart = activeTab.items.find(it => it.stockItemId === stockItem.id);
                const imgUrl = getPosProductImage(p);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItemToCart(p)}
                    className={`relative p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all group cursor-pointer ${
                      inCart
                        ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400/40'
                        : 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-xs'
                    }`}
                  >
                    {/* In-cart count badge */}
                    {inCart && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs z-10 animate-in zoom-in-75">
                        {inCart.quantity}
                      </span>
                    )}

                    {/* Product Image on the Left */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 p-0.5 flex items-center justify-center">
                      <img
                        src={imgUrl}
                        alt={p.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&h=200&fit=crop";
                        }}
                      />
                    </div>

                    {/* Product Info on the Right */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-xs sm:text-[13px] font-medium text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </p>
                      <p className="text-xs sm:text-[13px] font-bold text-blue-600 mt-1">
                        {Number(price).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── BOTTOM FOOTER BAR (< 1/3 > and THANH TOÁN) ─── */}
        <div
          className="p-3 border-t bg-white flex items-center justify-between gap-3 shrink-0"
          style={{ borderColor: 'hsl(214 25% 89%)' }}
        >
          {/* Pagination: < 1/3 > */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setPosPage((prev) => Math.max(1, prev - 1))}
              disabled={posPage <= 1}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition-all cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs sm:text-sm font-semibold text-slate-700 px-2 min-w-10 text-center select-none">
              {posPage}/{totalPosPages}
            </span>

            <button
              type="button"
              onClick={() => setPosPage((prev) => Math.min(totalPosPages, prev + 1))}
              disabled={posPage >= totalPosPages}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition-all cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Big Blue THANH TOÁN Button */}
          <button
            type="button"
            onClick={() => setIsCheckoutOpen(true)}
            disabled={activeTab.items.length === 0}
            className="flex-1 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span>THANH TOÁN</span>
            {activeTab.items.length > 0 && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold ml-1">
                {formatVND(totalPayable)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── CHECKOUT DRAWER ─── */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end" style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-[420px] h-full border-l flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right-full"
            style={{
              background: '#fff',
              borderColor: 'hsl(214 25% 88%)',
              boxShadow: '-8px 0 40px rgb(0 0 0 / 0.12)',
            }}
          >
            <div className="space-y-5 flex-1">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: 'hsl(214 25% 90%)' }}>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Xác nhận thanh toán</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {user?.fullName || 'Nhân viên'} · {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer card */}
              <div
                className="p-3.5 rounded-xl flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, hsl(213 100% 97%) 0%, hsl(221 100% 95%) 100%)', border: '1px solid hsl(217 91% 88%)' }}
              >
                <div>
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">Khách hàng</span>
                  <p className="font-bold text-sm text-slate-800 mt-0.5">{activeTab.customer.name || 'Khách lẻ'}</p>
                  {activeTab.customer.phone && <p className="text-xs text-slate-500 mt-0.5">{activeTab.customer.phone}</p>}
                </div>
                <span
                  className="text-xs font-black px-2.5 py-1.5 rounded-lg text-blue-700"
                  style={{ background: 'hsl(213 100% 91%)' }}
                >
                  {activeTab.items.length} mặt hàng
                </span>
              </div>

              {/* Order Items summary */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(214 25% 89%)' }}>
                <div className="px-3.5 py-2 border-b" style={{ background: 'hsl(214 30% 96%)', borderColor: 'hsl(214 25% 89%)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chi tiết đơn hàng</span>
                </div>
                <div className="divide-y max-h-36 overflow-y-auto" style={{ divideColor: 'hsl(214 25% 92%)' }}>
                  {activeTab.items.map((it) => (
                    <div key={it.stockItemId} className="flex justify-between items-center px-3.5 py-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-700 line-clamp-1">{it.name}</span>
                        <span className="text-slate-400 ml-1">×{it.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-800 money shrink-0 ml-2">{formatVND(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment summary */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tổng tiền hàng</span>
                  <span className="font-semibold text-slate-800 money">{formatVND(subtotalAmount)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Giảm giá</span>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      value={activeTab.discount || ''}
                      onChange={(e) => updateActiveTab({ discount: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full text-right text-sm py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div
                  className="flex justify-between items-center py-3 px-4 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, hsl(217 91% 52%) 0%, hsl(224 76% 48%) 100%)' }}
                >
                  <span className="font-bold text-white">Khách cần trả</span>
                  <span className="text-2xl font-black text-white money">{formatVND(totalPayable)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-600">Khách thanh toán</span>
                  <div className="w-44">
                    <input
                      type="number"
                      min="0"
                      value={amountGiven}
                      onChange={(e) => setAmountGiven(e.target.value)}
                      className="w-full text-right text-base font-bold py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-1.5 justify-end flex-wrap">
                  <button
                    onClick={() => setAmountGiven(String(totalPayable))}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all"
                  >
                    Đủ tiền
                  </button>
                  {[50000, 100000, 200000, 500000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmountGiven(String(val))}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all"
                    >
                      {val.toLocaleString('vi-VN')}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tiền thừa trả khách</span>
                  <span className={`font-black text-base money ${changeDue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {changeDue >= 0 ? formatVND(changeDue) : `Thiếu ${formatVND(Math.abs(changeDue))}`}
                  </span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Phương thức thanh toán</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'Tiền mặt', icon: Banknote, color: 'emerald' },
                    { id: 'BANK_TRANSFER', label: 'Chuyển khoản', icon: QrCode, color: 'violet' },
                    { id: 'PAYOS', label: 'Thẻ / PayOS', icon: CreditCard, color: 'blue' },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                        style={isSelected ? { boxShadow: '0 0 0 2px rgb(59 130 246 / 0.2)' } : {}}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="text-center leading-tight">{m.label}</span>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div
                    className="p-3.5 rounded-xl text-xs space-y-1"
                    style={{ background: 'hsl(258 100% 97%)', border: '1px solid hsl(258 100% 88%)' }}
                  >
                    <p className="font-bold flex items-center gap-1.5 text-violet-700">
                      <QrCode className="w-3.5 h-3.5" /> Quét mã VietQR chuyển khoản
                    </p>
                    <p className="text-violet-600">STK: <strong>0978387857</strong> (MB Bank)</p>
                    <p className="text-violet-600">Chủ TK: <strong>STOCKPILOT STORE</strong></p>
                    <p className="text-violet-600">Số tiền: <strong className="money">{formatVND(totalPayable)}</strong></p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2.5 border-t mt-4" style={{ borderColor: 'hsl(214 25% 90%)' }}>
              <button
                onClick={() => handleCompleteSale(true)}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, hsl(217 91% 52%) 0%, hsl(224 76% 48%) 100%)',
                  boxShadow: '0 4px 16px rgb(59 130 246 / 0.35)',
                }}
              >
                <Printer className="w-4 h-4" />
                {isProcessing ? 'Đang xử lý...' : 'THANH TOÁN & IN HÓA ĐƠN'}
              </button>

              <button
                onClick={() => handleCompleteSale(false)}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl border text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all disabled:opacity-50"
                style={{ borderColor: 'hsl(214 25% 87%)' }}
              >
                Chỉ thanh toán (Không in)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD CUSTOMER MODAL ─── */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden animate-in zoom-in-95"
            style={{ background: '#fff', boxShadow: '0 24px 64px rgb(0 0 0 / 0.14), 0 0 0 1px rgb(0 0 0 / 0.06)' }}
          >
            <div
              className="px-5 py-4 border-b flex items-center justify-between"
              style={{ background: 'linear-gradient(180deg, #f8fafd 0%, #f1f5fb 100%)', borderColor: 'hsl(214 25% 89%)' }}
            >
              <div>
                <h3 className="font-black text-sm text-slate-900">Thêm thông tin khách hàng</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Lưu thông tin để ghi vào hóa đơn</p>
              </div>
              <button onClick={() => setIsAddCustomerOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Tên khách hàng <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Anh Hoàng Nam"
                  value={custNameInput}
                  onChange={(e) => setCustNameInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0987654321"
                  value={custPhoneInput}
                  onChange={(e) => setCustPhoneInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border text-slate-600 hover:bg-slate-50 transition-all"
                style={{ borderColor: 'hsl(214 25% 87%)' }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!custNameInput.trim()) {
                    toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập tên khách hàng', type: 'error' });
                    return;
                  }
                  updateActiveTab({ customer: { name: custNameInput.trim(), phone: custPhoneInput.trim() } });
                  setIsAddCustomerOpen(false);
                  setCustNameInput('');
                  setCustPhoneInput('');
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, hsl(217 91% 52%) 0%, hsl(224 76% 48%) 100%)',
                  boxShadow: '0 3px 10px rgb(59 130 246 / 0.3)',
                }}
              >
                Lưu khách hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRINT RECEIPT PREVIEW ─── */}
      {printReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white text-black w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-3 border-b border-slate-200 flex justify-between items-center print:hidden"
              style={{ background: 'linear-gradient(180deg, #f8fafd 0%, #f1f5fb 100%)' }}
            >
              <span className="text-xs font-bold text-slate-700">Xem trước hóa đơn in</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, hsl(217 91% 52%) 0%, hsl(224 76% 48%) 100%)' }}
                >
                  <Printer className="w-3.5 h-3.5" /> In ngay
                </button>
                <button
                  onClick={() => setPrintReceiptData(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div id="receipt-print-area" className="p-8 overflow-y-auto space-y-4 text-xs font-sans text-gray-800 bg-white">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold tracking-wide uppercase text-blue-700">{printReceiptData.storeName}</h2>
                <p className="text-[11px] text-gray-500">{printReceiptData.storeAddress}</p>
                <p className="text-[11px] text-gray-500">ĐT: {printReceiptData.storePhone}</p>
                <h3 className="text-base font-bold uppercase mt-3 text-black">HÓA ĐƠN BÁN HÀNG</h3>
                <p className="text-[11px] text-gray-500 font-mono">Số HĐ: {printReceiptData.orderNumber}</p>
                <p className="text-[11px] text-gray-500">Ngày: {printReceiptData.createdAt}</p>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Khách hàng: <strong>{printReceiptData.customerName}</strong></span>
                  {printReceiptData.customerPhone && <span>SĐT: {printReceiptData.customerPhone}</span>}
                </div>
                <div className="flex justify-between">
                  <span>Thu ngân: {printReceiptData.cashier}</span>
                  <span>PT: {printReceiptData.paymentMethod}</span>
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
                        <span className="text-[10px] text-gray-400 font-mono">{it.sku}</span>
                      </td>
                      <td className="py-1.5 text-center">{it.quantity}</td>
                      <td className="py-1.5 text-right">{it.price.toLocaleString('vi-VN')}</td>
                      <td className="py-1.5 text-right font-bold">{it.subtotal.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-[11px]">
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
                <div className="flex justify-between text-gray-600">
                  <span>Tiền khách đưa:</span>
                  <span>{formatVND(printReceiptData.amountGiven)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tiền trả lại:</span>
                  <span className="font-bold text-gray-800">{formatVND(printReceiptData.changeDue)}</span>
                </div>
              </div>

              <div className="pt-1 italic text-[11px] text-gray-500">({printReceiptData.totalInWords})</div>

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
