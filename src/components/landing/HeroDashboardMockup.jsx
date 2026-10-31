import { useState } from 'react';
import { useCinematicTilt } from '../../hooks/useCinematicMotion';
import { useTranslation } from '../../i18n/useTranslation';
import {
  Search,
  CheckCircle2,
  Printer,
  QrCode,
  AlertTriangle,
  RotateCcw,
  Loader2
} from 'lucide-react';

/**
 * HeroDashboardMockup — Faithful recreation of the top hero layout from `StockPilot Landing.html`
 * - Background merchant photo card (top-right)
 * - Main 3D tilt POS Cashier screen
 * - Floating VietQR success badge (bottom-left)
 * - Floating Low Stock Alert badge (bottom-right)
 * - Fully interactive: product search, category filter, add-to-cart, and checkout celebration!
 */
export function HeroDashboardMockup({ language: propLanguage }) {
  const { language: contextLanguage } = useTranslation();
  const language = propLanguage || contextLanguage || 'vi';
  const isEn = language === 'en';

  const { ref, tiltStyle, onMouseMove, onMouseEnter, onMouseLeave } = useCinematicTilt({
    maxTiltX: 3.5,
    maxTiltY: 4,
    initialTiltX: 2.0,
    initialTiltY: -2.5,
    perspective: 1200
  });

  const categories = [
    { id: 'all', label: isEn ? 'All' : 'Tất cả' },
    { id: 'beverage', label: isEn ? 'Beverage' : 'Đồ uống' },
    { id: 'food', label: isEn ? 'Bakery' : 'Đồ ăn nhẹ' },
    { id: 'grocery', label: isEn ? 'Grocery' : 'Tạp hóa' }
  ];

  const defaultProducts = [
    {
      id: 1,
      sku: 'SP01',
      nameVi: 'Cà phê sữa đá Cầu Đất',
      nameEn: 'Arabica Cau Dat Coffee',
      price: 28000,
      stock: 45,
      category: 'beverage'
    },
    {
      id: 2,
      sku: 'SP02',
      nameVi: 'Bánh Croissant bơ Pháp',
      nameEn: 'French Butter Croissant',
      price: 32000,
      stock: 24,
      category: 'food'
    },
    {
      id: 3,
      sku: 'SP03',
      nameVi: 'Trà đào cam sả túi lọc',
      nameEn: 'Peach Lemongrass Tea',
      price: 35000,
      stock: 32,
      category: 'beverage'
    },
    {
      id: 4,
      sku: 'SP04',
      nameVi: 'Dầu ăn Neptune Light 1L',
      nameEn: 'Neptune Light Cooking Oil 1L',
      price: 54000,
      stock: 6,
      category: 'grocery'
    }
  ];

  const getProduct = (id) => defaultProducts.find((p) => p.id === id);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductFeedback, setSelectedProductFeedback] = useState(null);

  // Cart state - store ids and quantities to ensure instant bilingual reactivity
  const [cartItems, setCartItems] = useState([
    { id: 1, sku: 'SP01', price: 28000, quantity: 2 },
    { id: 2, sku: 'SP02', price: 32000, quantity: 1 },
    { id: 3, sku: 'SP03', price: 35000, quantity: 1 }
  ]);

  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'vietqr' | 'card'
  const [checkoutStatus, setCheckoutStatus] = useState('idle'); // 'idle' | 'processing' | 'success'

  const filteredProducts = defaultProducts.filter((p) => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const name = isEn ? p.nameEn : p.nameVi;
    const matchesQuery = !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleAddToCart = (product) => {
    setSelectedProductFeedback(product.id);
    setTimeout(() => setSelectedProductFeedback(null), 300);

    setCartItems((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, sku: product.sku, price: product.price, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setCheckoutStatus('processing');
    setTimeout(() => {
      setCheckoutStatus('success');
    }, 600);
  };

  const handleResetOrder = () => {
    setCheckoutStatus('idle');
    setCartItems([
      { id: 1, sku: 'SP01', price: 28000, quantity: 1 }
    ]);
  };

  const paymentLabels = {
    cash: isEn ? 'Cash' : 'Tiền mặt',
    vietqr: isEn ? 'VietQR Transfer' : 'Chuyển khoản VietQR',
    card: isEn ? 'POS Card' : 'Thẻ quẹt'
  };

  return (
    <div className="relative lg:pl-6 select-none font-sans pb-10 lg:pb-14" style={{ perspective: '1200px' }}>
      
      {/* ─── 1. BACKGROUND MERCHANT PHOTO CARD (TOP RIGHT) ─── */}
      <div className="hidden md:block absolute -top-8 right-0 w-[58%] h-[78%] rounded-[28px] overflow-hidden shadow-2xl shadow-slate-900/10 ring-1 ring-white/60">
        <img
          src="/hero-merchant-pos.png"
          alt="Chủ cửa hàng bán lẻ sử dụng máy POS StockPilot"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/hero-merchant-vector.svg';
          }}
        />
        <div className="absolute inset-0 bg-linear-to-tr from-[#006FFF]/25 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* ─── 2. FLOATING BADGE 1: VIETQR NOTIFICATION (BOTTOM LEFT) ─── */}
      <div className="hidden sm:flex sp-float absolute -left-2 lg:-left-6 -bottom-10 lg:-bottom-12 z-30 items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-slate-500 font-medium">
            VietQR • {isEn ? 'Just completed' : 'vừa xong'}
          </p>
          <p className="text-sm font-black font-mono text-slate-900">+74.000 ₫</p>
        </div>
      </div>

      {/* ─── 3. FLOATING BADGE 2: DECISION ENGINE ALERT (BOTTOM RIGHT) ─── */}
      <div className="hidden md:flex sp-float-delay absolute right-4 lg:right-6 -bottom-8 lg:-bottom-10 z-30 items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-xl shadow-slate-900/10 ring-1 ring-amber-200">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {isEn ? 'Decision Engine • Restock Alert' : 'Decision Engine • Cảnh báo thiếu hàng'}
          </p>
          <p className="text-xs font-black text-slate-900">
            {isEn ? 'Neptune Oil: 3 left • Suggest +24' : 'Dầu ăn Neptune: còn 3 • Gợi ý nhập +24'}
          </p>
        </div>
      </div>

      {/* ─── 4. MAIN INTERACTIVE POS TERMINAL MOCKUP ─── */}
      <div
        ref={ref}
        style={{
          ...tiltStyle,
          boxShadow:
            '0 30px 70px -20px rgba(0, 111, 255, 0.28), 0 12px 30px -8px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.95)'
        }}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="relative z-20 md:mt-14 md:mr-12 mb-6 bg-white rounded-2xl border border-slate-200 overflow-hidden"
      >
        {/* Window Top Titlebar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
            <span className="font-semibold text-slate-200 ml-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              StockPilot POS & Decision Engine • {isEn ? 'Counter 01' : 'Quầy 01'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            F3: {isEn ? 'Search' : 'Tìm'} • F9: {isEn ? 'Checkout' : 'Thanh toán'}
          </span>
        </div>

        {/* POS Grid View */}
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-slate-50/70">
          
          {/* Left Panel: Catalog & Fast Search (Col 7) */}
          <div className="md:col-span-7 space-y-3">
            
            {/* Search Input & Category Pills */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEn ? 'Search product or SKU...' : 'Tìm sản phẩm theo tên hoặc SKU...'}
                  aria-label="Search product"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:border-[#006FFF]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`px-2.5 py-1 rounded font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      activeCategory === c.id
                        ? 'bg-[#006FFF] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2x2 Product Grid */}
            <div className="grid grid-cols-2 gap-2 text-left">
              {filteredProducts.slice(0, 4).map((p) => {
                const isClicked = selectedProductFeedback === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className={`bg-white p-2.5 rounded-xl border text-left group cursor-pointer transition-all duration-150 active:scale-95 ${
                      isClicked
                        ? 'border-[#006FFF] ring-2 ring-blue-100 shadow-sm'
                        : 'border-slate-200 hover:border-[#006FFF] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-medium">
                        {isEn ? 'Stock ' : 'Tồn '}{p.stock}
                      </span>
                    </div>
                    <p className="font-semibold text-xs text-[#0F172A] mt-1 line-clamp-1 group-hover:text-[#006FFF] transition-colors">
                      {isEn ? p.nameEn : p.nameVi}
                    </p>
                    <p className="font-mono font-bold text-xs text-[#006FFF] mt-1">
                      {p.price.toLocaleString('vi-VN')} ₫
                    </p>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-2 py-6 text-center text-xs text-slate-400">
                  {isEn ? 'No products found.' : 'Không tìm thấy sản phẩm phù hợp.'}
                </div>
              )}
            </div>

            {/* Live Sync Status Bar */}
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {isEn ? 'Ledger sync: instant' : 'Đồng bộ kho tức thì'}
              </span>
              <span className="font-medium text-[#006FFF] text-[10.5px]">
                {isEn ? 'Click item to test checkout' : 'Bấm sản phẩm để thử tính tiền'}
              </span>
            </div>

          </div>

          {/* Right Panel: Current Bill & Checkout (Col 5) */}
          <div className="md:col-span-5 bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between relative overflow-hidden min-h-64 shadow-xs">
            
            {/* Success Celebration Overlay */}
            {checkoutStatus === 'success' && (
              <div className="absolute inset-0 bg-white/98 z-20 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="font-bold text-xs text-slate-900">
                  {isEn ? 'Bill #1042 Completed' : 'Hóa đơn #1042 Đã Thanh Toán'}
                </p>
                <p className="font-mono font-black text-base text-[#006FFF] mt-0.5">
                  {cartTotal.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-[10.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded mt-1.5 font-medium">
                  {paymentLabels[paymentMethod]} • {isEn ? 'Stock deducted' : 'Đã xác nhận & trừ kho'}
                </p>
                <button
                  onClick={handleResetOrder}
                  className="mt-3 px-3.5 py-1.5 bg-[#006FFF] hover:bg-blue-600 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  {isEn ? 'Create next order' : 'Tạo đơn tiếp theo'}
                </button>
              </div>
            )}

            {/* Bill Header & Item List */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-900">
                  {isEn ? 'Bill #1042' : 'Hóa đơn #1042'}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 font-medium px-1.5 py-0.5 rounded">
                  {isEn ? 'Walk-in' : 'Khách lẻ'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 my-2 max-h-36 overflow-y-auto pr-1">
                {cartItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    {isEn ? 'Cart is empty. Click items on the left.' : 'Giỏ hàng đang trống. Bấm sản phẩm bên trái để thêm.'}
                  </div>
                ) : (
                  cartItems.map((item) => {
                    const prod = getProduct(item.id);
                    const displayName = isEn ? (prod?.nameEn || item.sku) : (prod?.nameVi || item.sku);
                    return (
                      <div key={item.id} className="py-1.5 px-1 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-medium text-slate-900 truncate text-[11px]">{displayName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.quantity} × {item.price.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[11px] text-slate-900">
                            {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-slate-300 hover:text-rose-500 cursor-pointer text-xs"
                            title="Remove item"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Checkout Action Area */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>{isEn ? 'Total Due' : 'Khách cần trả'}</span>
                <span className="text-[#006FFF] font-mono text-sm">
                  {cartTotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-medium text-center">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-1 rounded border transition-colors cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-50 border-[#006FFF] text-[#006FFF] font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {isEn ? 'Cash' : 'Tiền mặt'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`py-1 rounded border transition-colors cursor-pointer ${
                    paymentMethod === 'vietqr'
                      ? 'bg-blue-50 border-[#006FFF] text-[#006FFF] font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {isEn ? 'VietQR' : 'Chuyển khoản'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-1 rounded border transition-colors cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-blue-50 border-[#006FFF] text-[#006FFF] font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {isEn ? 'Card' : 'Thẻ'}
                </button>
              </div>

              {/* Checkout & Print Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || checkoutStatus === 'processing'}
                className="w-full mt-1 bg-[#006FFF] hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {checkoutStatus === 'processing' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isEn ? 'Printing receipt...' : 'Đang in hóa đơn...'}</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Checkout & Print [F9]' : 'Thanh toán & In [F9]'}</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* Footer Bar */}
        <div className="bg-slate-100/80 px-4 py-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {isEn ? 'Offline cache ready' : 'Offline cache sẵn sàng'}
          </span>
          <span className="font-mono text-slate-900 font-bold">
            {isEn ? 'Shift sales: 3,420,000 ₫' : 'Doanh thu ca: 3.420.000 ₫'}
          </span>
        </div>
      </div>

    </div>
  );
}
