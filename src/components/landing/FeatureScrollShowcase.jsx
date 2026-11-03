import { useEffect, useRef, useState } from 'react';
import {
  ShoppingCart,
  ScanLine,
  Boxes,
  BrainCircuit,
  Tags,
  MessageSquareText,
  Smartphone,
  Printer,
  ShieldCheck,
  TriangleAlert,
  Lock,
  Check,
  Sparkles,
  Search,
} from 'lucide-react';
import './featureShowcase.css';

/* ─────────────────────────────────────────────────────────────
   FeatureScrollShowcase
   Khách cuộn tới tính năng nào thì khung demo bên phải phát demo của
   tính năng đó (desktop: khung dính cố định; mobile: demo nằm ngay dưới
   từng tính năng). Toàn bộ là mô phỏng giao diện bằng HTML/Tailwind,
   không thêm thư viện, tôn trọng cài đặt "giảm chuyển động".
   Số liệu trong demo là dữ liệu minh họa, khớp với công thức thật của
   Decision Engine (ROP = ADD30 × lead time + tồn an toàn; giá sàn =
   giá vốn ÷ (1 − biên tối thiểu); làm tròn giá tới 1.000đ).
   ───────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    id: 'pos-features',
    icon: ShoppingCart,
    url: 'app.stockpilot.vn/pos',
    shortVi: 'Bán hàng',
    shortEn: 'Checkout',
    eyebrowVi: 'Quầy thu ngân POS',
    eyebrowEn: 'Point of sale',
    titleVi: 'Bán hàng tại quầy chỉ trong vài giây',
    titleEn: 'Check out customers in seconds',
    descVi:
      'Chọn sản phẩm hoặc quét mã, hệ thống tự tính tiền và tạo mã VietQR qua PayOS hoặc ví MoMo theo cấu hình riêng của từng cửa hàng. Khách thanh toán xong là in hóa đơn ngay.',
    descEn:
      'Pick items or scan a barcode. StockPilot totals the order and generates a VietQR code via PayOS or a MoMo request using each store’s own payment settings, then prints the receipt.',
    pointsVi: [
      'Tồn kho được trừ trong cùng giao dịch, không bán âm kho',
      'VietQR (PayOS) và MoMo cấu hình riêng cho từng cửa hàng',
      'In hóa đơn nhiệt khổ 80mm, chống in trùng',
    ],
    pointsEn: [
      'Stock is deducted in the same transaction — no negative stock',
      'VietQR (PayOS) and MoMo configured per store',
      '80mm thermal receipts with duplicate-print protection',
    ],
  },
  {
    id: 'phone-scanner',
    icon: ScanLine,
    url: 'app.stockpilot.vn/pos · scanner',
    shortVi: 'Quét mã',
    shortEn: 'Scanning',
    eyebrowVi: 'Quét mã vạch bằng điện thoại',
    eyebrowEn: 'Phone barcode scanner',
    titleVi: 'Biến điện thoại thành máy quét mã vạch',
    titleEn: 'Turn any phone into a barcode scanner',
    descVi:
      'Ghép nối điện thoại với quầy POS một lần, sau đó quét mã vạch bằng camera. Sản phẩm tự động được thêm vào giỏ hàng trên máy tính thu ngân.',
    descEn:
      'Pair a phone with the POS once, then scan barcodes with its camera. Items land in the cart on the checkout computer instantly.',
    pointsVi: [
      'Không cần mua thêm máy quét chuyên dụng',
      'Vẫn hỗ trợ máy quét mã vạch USB',
      'Tra cứu nhanh giá và tồn kho khi quét',
    ],
    pointsEn: [
      'No dedicated scanner hardware required',
      'USB barcode scanners still supported',
      'Instant price and stock lookup on scan',
    ],
  },
  {
    id: 'inventory-ledger',
    icon: Boxes,
    url: 'app.stockpilot.vn/inventory',
    shortVi: 'Kho hàng',
    shortEn: 'Inventory',
    eyebrowVi: 'Kho hàng & sổ cái',
    eyebrowEn: 'Inventory ledger',
    titleVi: 'Mọi biến động kho đều có dấu vết',
    titleEn: 'Every stock change leaves a trail',
    descVi:
      'Nhập hàng, bán hàng, trả hàng hay kiểm kê đều sinh một dòng trong sổ cái kho. Số tồn luôn khớp với lịch sử, ai làm gì và lúc nào đều tra cứu được.',
    descEn:
      'Receiving, sales, returns and stock counts each write a ledger entry. On-hand quantities always reconcile with history — who did what, and when.',
    pointsVi: [
      'Sổ cái chỉ ghi thêm, không sửa hay xóa',
      'Kiểm kê và điều chỉnh đều phải ghi lý do',
      'Tài khoản nhân viên kho không thấy giá vốn',
    ],
    pointsEn: [
      'Append-only ledger — entries are never edited or deleted',
      'Stock counts and adjustments require a reason',
      'Warehouse staff accounts never see cost prices',
    ],
  },
  {
    id: 'decision-engine',
    icon: BrainCircuit,
    url: 'app.stockpilot.vn/decision-engine',
    shortVi: 'Dự báo nhập',
    shortEn: 'Restocking',
    eyebrowVi: 'Decision Engine',
    eyebrowEn: 'Decision Engine',
    titleVi: 'Biết trước khi nào cần nhập hàng',
    titleEn: 'Know when to reorder — before you run out',
    descVi:
      'Decision Engine tính tốc độ bán trung bình, độ biến động nhu cầu và thời gian nhà cung cấp giao để xác định điểm đặt hàng lại cho từng mặt hàng. Khi tồn kho chạm ngưỡng, bạn nhận cảnh báo kèm số lượng nên nhập.',
    descEn:
      'The Decision Engine combines average daily sales, demand variability and supplier lead time into a reorder point for every SKU. When stock reaches it, you get an alert with a suggested quantity.',
    pointsVi: [
      'Điểm đặt hàng lại = nhu cầu trong thời gian chờ hàng + tồn an toàn',
      'Chấm điểm rủi ro hết hàng, thừa hàng và hàng chậm bán',
      'Mỗi kết quả đều kèm độ tin cậy và lý do cụ thể',
    ],
    pointsEn: [
      'Reorder point = lead-time demand + safety stock',
      'Stockout, overstock and slow-mover risk scores',
      'Every result comes with a confidence level and reasons',
    ],
  },
  {
    id: 'pricing-engine',
    icon: Tags,
    url: 'app.stockpilot.vn/pricing',
    shortVi: 'Đề xuất giá',
    shortEn: 'Pricing',
    eyebrowVi: 'Đề xuất giá bán',
    eyebrowEn: 'Pricing recommendations',
    titleVi: 'Giải phóng hàng tồn mà không bán lỗ',
    titleEn: 'Clear slow stock without selling at a loss',
    descVi:
      'Hàng không bán được quá 90 ngày sẽ được đề xuất giảm giá ở mức hợp lý, nhưng luôn nằm trên giá sàn tính từ giá vốn và biên lợi nhuận tối thiểu. Chủ cửa hàng là người quyết định cuối cùng.',
    descEn:
      'Items unsold for 90+ days get a markdown suggestion that always stays above a price floor derived from cost and your minimum margin. The owner always makes the final call.',
    pointsVi: [
      'Giá sàn = giá vốn ÷ (1 − biên lợi nhuận tối thiểu)',
      'Duyệt, chỉnh sửa hoặc từ chối từng đề xuất',
      'Mọi lần đổi giá đều được lưu lịch sử',
    ],
    pointsEn: [
      'Price floor = cost ÷ (1 − minimum margin)',
      'Approve, adjust or reject each suggestion',
      'Every price change is recorded in history',
    ],
  },
  {
    id: 'ai-assistant',
    icon: MessageSquareText,
    url: 'app.stockpilot.vn/assistant',
    shortVi: 'Trợ lý AI',
    shortEn: 'AI assistant',
    eyebrowVi: 'Trợ lý AI',
    eyebrowEn: 'AI assistant',
    titleVi: 'Hỏi bằng tiếng Việt, nhận câu trả lời có số liệu',
    titleEn: 'Ask in plain language, get answers with numbers',
    descVi:
      'Trợ lý AI đọc kết quả của Decision Engine và giải thích bằng ngôn ngữ dễ hiểu: vì sao có cảnh báo và nên làm gì tiếp theo. Trợ lý chỉ đọc dữ liệu, không tự thay đổi giá hay tồn kho.',
    descEn:
      'The assistant reads Decision Engine results and explains them plainly — why an alert fired and what to do next. It is read-only and never changes prices or stock.',
    pointsVi: [
      'Chỉ dùng dữ liệu của chính cửa hàng bạn',
      'Không tự ý thay đổi bất kỳ dữ liệu nào',
      'Tự ẩn giá vốn với tài khoản nhân viên',
    ],
    pointsEn: [
      'Uses only your own store’s data',
      'Never modifies any data on its own',
      'Hides cost prices from staff accounts',
    ],
  },
];

/* ─── Tiện ích ─── */
const vnd = (n) => `${new Intl.NumberFormat('vi-VN').format(n)}đ`;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Đếm số từ `from` tới `to` khi demo active (dùng requestAnimationFrame). */
function useCountUp(to, active, from = 0, duration = 900, delay = 0) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (!active) {
      setValue(from);
      return undefined;
    }
    if (prefersReducedMotion()) {
      setValue(to);
      return undefined;
    }
    let raf = 0;
    let start = 0;
    const timer = setTimeout(() => {
      const tick = (ts) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(from + (to - from) * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, from, active, duration, delay]);
  return value;
}

/** Trả về số mốc thời gian đã qua kể từ khi demo active. `marks` phải là hằng số cấp module. */
function useTimeline(active, marks) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) {
      setStep(0);
      return undefined;
    }
    if (prefersReducedMotion()) {
      setStep(marks.length);
      return undefined;
    }
    const timers = marks.map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [active, marks]);
  return step;
}

/* ─── Mobile/tablet: giữ nguyên bố cục demo ở chiều rộng thiết kế, thu nhỏ theo tỉ lệ cho vừa màn hình ─── */
const DEMO_DESIGN_WIDTH = 560;

function FitToWidth({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [box, setBox] = useState({ scale: 1, height: undefined });
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;
    const update = () => {
      const scale = Math.min(1, outer.clientWidth / DEMO_DESIGN_WIDTH);
      setBox({ scale, height: inner.offsetHeight * scale });
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outerRef} className="mx-auto w-full max-w-[560px]" style={{ height: box.height }}>
      <div ref={innerRef} className="w-[560px] origin-top-left" style={{ transform: `scale(${box.scale})` }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Khung trình duyệt bao quanh demo ─── */
function BrowserChrome({ url, children }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_-30px_rgb(15_23_42/0.35)] ring-1 ring-slate-900/5">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-slate-300" />
        <span className="size-2.5 rounded-full bg-slate-300" />
        <span className="size-2.5 rounded-full bg-slate-300" />
        <div className="ml-3 flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1">
          <Lock className="size-3 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate font-mono text-[11px] text-slate-500">{url}</span>
        </div>
      </div>
      <div className="relative h-[440px] overflow-hidden bg-slate-50/70">{children}</div>
    </div>
  );
}

/* ═════════════════════ DEMO 1 — POS & VietQR ═════════════════════ */
const POS_PRODUCTS = [
  { vi: 'Mì Hảo Hảo tôm chua cay', en: 'Hao Hao instant noodles', price: 4500, stock: 120, flash: '[--d:200ms]', thumb: 'bg-amber-100 text-amber-700', tag: 'MÌ' },
  { vi: 'Coca-Cola lon 330ml', en: 'Coca-Cola can 330ml', price: 10000, stock: 64, flash: '[--d:700ms]', thumb: 'bg-rose-100 text-rose-700', tag: '330ml' },
  { vi: 'Dầu ăn Neptune 1L', en: 'Neptune cooking oil 1L', price: 41000, stock: 24, flash: '[--d:1200ms]', thumb: 'bg-yellow-100 text-yellow-700', tag: '1L' },
  { vi: 'Sữa tươi TH 180ml', en: 'TH fresh milk 180ml', price: 8000, stock: 56, flash: '', thumb: 'bg-sky-100 text-sky-700', tag: '180ml' },
];
const POS_LINES = [
  { qty: 6, vi: 'Mì Hảo Hảo tôm chua cay', en: 'Hao Hao noodles', amount: 27000, d: '[--d:300ms]' },
  { qty: 3, vi: 'Coca-Cola lon 330ml', en: 'Coca-Cola 330ml', amount: 30000, d: '[--d:800ms]' },
  { qty: 1, vi: 'Dầu ăn Neptune 1L', en: 'Neptune oil 1L', amount: 41000, d: '[--d:1300ms]' },
];

/* Ma trận QR minh họa (không quét được) — sinh cố định để không đổi giữa các lần render */
const QR_CELLS = (() => {
  const n = 21;
  const cells = [];
  let seed = 7;
  const finders = [
    [0, 0],
    [14, 0],
    [0, 14],
  ];
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const f = finders.find(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
      if (f) {
        const dx = x - f[0];
        const dy = y - f[1];
        cells.push(dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      } else {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        cells.push(((seed >> 16) & 1) === 0);
      }
    }
  }
  return cells;
})();

function MiniQr() {
  return (
    <div className="grid size-[72px] shrink-0 grid-cols-[repeat(21,minmax(0,1fr))] rounded-md border border-slate-200 bg-white p-1.5">
      {QR_CELLS.map((on, i) => (
        <span key={i} className={on ? 'bg-slate-900' : ''} />
      ))}
    </div>
  );
}

function PosDemo({ active, tx }) {
  const total = useCountUp(98000, active, 0, 700, 1450);
  return (
    <div className={`sp-demo ${active ? 'is-active' : ''} grid h-full grid-cols-5 gap-3 p-4 sm:p-5`}>
      <div className="col-span-3 flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-400">
          <Search className="size-3.5" aria-hidden />
          <span className="truncate">{tx('Tìm hoặc quét mã sản phẩm…', 'Search or scan a product…')}</span>
          <ScanLine className="ml-auto size-3.5 text-[#006FFF]" aria-hidden />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {POS_PRODUCTS.map((p) => (
            <div key={p.vi} className={`${p.flash ? `sp-flash ${p.flash}` : ''} rounded-xl border border-slate-200 bg-white p-3`}>
              <div className={`mb-2 flex h-10 items-center justify-center rounded-lg font-mono text-[11px] font-bold ${p.thumb}`}>{p.tag}</div>
              <p className="line-clamp-2 min-h-[30px] text-[11.5px] font-semibold leading-tight text-slate-800">
                {tx(p.vi, p.en)}
              </p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="font-mono text-[12px] font-bold text-slate-900">{vnd(p.price)}</span>
                <span className="text-[10px] text-slate-400">
                  {tx('Tồn', 'Stock')} {p.stock}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[12px] font-bold text-slate-900">{tx('Hóa đơn', 'Order')} #HD-1043</span>
          <span className="text-[10px] text-slate-400">{tx('Quầy 1', 'Till 1')}</span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {POS_LINES.map((l) => (
            <li key={l.vi} className={`sp-a-slide ${l.d} flex items-start justify-between gap-2 text-[11px]`}>
              <span className="min-w-0 text-slate-700">
                <span className="font-mono font-bold text-slate-900">{l.qty}×</span> {tx(l.vi, l.en)}
              </span>
              <span className="shrink-0 font-mono text-slate-900">{vnd(l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-2.5 border-t border-slate-100 pt-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{tx('Tổng cộng', 'Total')}</span>
            <span className="font-mono text-[17px] font-bold tabular-nums text-slate-900">{vnd(total)}</span>
          </div>
          <div className="sp-a [--d:1600ms]">
            <div className="sp-ring [--d:1900ms] flex items-center justify-center gap-1.5 rounded-lg bg-[#006FFF] py-2 text-[11.5px] font-bold text-white">
              <ScanLine className="size-3.5" aria-hidden />
              {tx('Thanh toán VietQR', 'Pay with VietQR')}
            </div>
          </div>
          <div className="sp-a-pop [--d:2200ms] flex items-center gap-2 rounded-lg border border-slate-200 p-2">
            <MiniQr />
            <div className="min-w-0 space-y-1.5">
              <p className="text-[10.5px] font-bold text-slate-900">PayOS · VietQR</p>
              <p className="text-[10px] leading-snug text-slate-500">{tx('Khách quét để thanh toán', 'Customer scans to pay')}</p>
              <span className="sp-a-pop [--d:3100ms] inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                <Check className="size-3" aria-hidden />
                {tx('Đã nhận tiền', 'Paid')}
              </span>
            </div>
          </div>
          <div className="sp-a [--d:3500ms] flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-1.5 text-[10.5px] font-semibold text-white">
            <Printer className="size-3.5" aria-hidden />
            {tx('Đang in hóa đơn K80…', 'Printing 80mm receipt…')}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════ DEMO 2 — Quét mã bằng điện thoại ═════════════════════ */
const BARCODE = [2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2];
const BAR_W = { 1: 'w-px', 2: 'w-0.5', 3: 'w-[3px]' };

function ScannerDemo({ active, tx }) {
  return (
    <div className={`sp-demo ${active ? 'is-active' : ''} grid h-full grid-cols-2 items-center gap-4 p-4 sm:p-5`}>
      {/* Điện thoại */}
      <div className="mx-auto flex h-[380px] w-[200px] flex-col overflow-hidden rounded-[30px] border-[6px] border-slate-900 bg-slate-900">
        <div className="flex items-center justify-between px-4 pb-1.5 pt-2 text-[10px] font-semibold text-white/80">
          <span>{tx('Quét mã · Quầy 1', 'Scan · Till 1')}</span>
          <span className="sp-ring-green size-2 rounded-full bg-emerald-400" />
        </div>
        <div className="relative mx-2 flex h-[210px] items-center justify-center overflow-hidden rounded-2xl bg-slate-700">
          <span className="absolute left-3 top-3 size-5 rounded-tl-md border-l-2 border-t-2 border-white/80" />
          <span className="absolute right-3 top-3 size-5 rounded-tr-md border-r-2 border-t-2 border-white/80" />
          <span className="absolute bottom-3 left-3 size-5 rounded-bl-md border-b-2 border-l-2 border-white/80" />
          <span className="absolute bottom-3 right-3 size-5 rounded-br-md border-b-2 border-r-2 border-white/80" />
          <div className="rounded-md bg-white px-3 pb-1.5 pt-2.5">
            <div className="flex h-12 items-stretch gap-px">
              {BARCODE.map((w, i) => (
                <span key={i} className={`${BAR_W[w]} ${i % 2 === 0 ? 'bg-slate-900' : 'bg-transparent'}`} />
              ))}
            </div>
            <p className="mt-1 text-center font-mono text-[9px] tracking-[0.2em] text-slate-700">8934563138165</p>
          </div>
          <span className="sp-scan-line absolute inset-x-4 top-[14%] h-0.5 rounded-full bg-[#006FFF] shadow-[0_0_12px_2px_rgb(0_111_255/0.7)]" />
        </div>
        <div className="flex flex-1 flex-col justify-end gap-2 p-2.5">
          <div className="sp-a-pop [--d:1600ms] rounded-xl bg-white p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <Check className="size-3" aria-hidden />
              {tx('Đã nhận diện', 'Detected')}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold leading-tight text-slate-900">
              {tx('Mì Hảo Hảo tôm chua cay', 'Hao Hao instant noodles')}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-500">4.500đ · {tx('Tồn', 'Stock')} 120</p>
          </div>
          <div className="sp-a [--d:2000ms] rounded-lg bg-[#006FFF] py-1.5 text-center text-[10.5px] font-bold text-white">
            {tx('Đã gửi tới máy POS', 'Sent to POS')}
          </div>
        </div>
      </div>

      {/* Máy POS */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[12px] font-bold text-slate-900">{tx('Giỏ hàng', 'Cart')}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
              <Smartphone className="size-3" aria-hidden />
              {tx('Đã ghép nối', 'Paired')}
            </span>
          </div>
          <ul className="mt-2 space-y-1.5 text-[11px]">
            <li className="flex justify-between gap-2 text-slate-700">
              <span>
                <span className="font-mono font-bold text-slate-900">3×</span> Coca-Cola 330ml
              </span>
              <span className="font-mono text-slate-900">30.000đ</span>
            </li>
            <li className="sp-a-slide [--d:2200ms] -mx-1.5">
              <div className="sp-flash [--d:2300ms] flex justify-between gap-2 rounded-md px-1.5 py-1 text-slate-700">
              <span className="min-w-0">
                <span className="font-mono font-bold text-slate-900">1×</span> {tx('Mì Hảo Hảo', 'Hao Hao noodles')}
                <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-blue-50 px-1 text-[9.5px] font-semibold text-[#006FFF]">
                  <Smartphone className="size-2.5" aria-hidden />
                  {tx('từ điện thoại', 'from phone')}
                </span>
              </span>
              <span className="shrink-0 font-mono text-slate-900">4.500đ</span>
              </div>
            </li>
          </ul>
        </div>
        <div className="sp-a [--d:2700ms] rounded-xl border border-dashed border-slate-300 bg-white/60 p-3 text-[11px] leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-800">{tx('Có máy quét USB?', 'Have a USB scanner?')}</p>
          {tx('Cắm vào là dùng được ngay, không cần cài đặt thêm.', 'Plug it in and start scanning — no setup required.')}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════ DEMO 3 — Kho hàng & sổ cái ═════════════════════ */
const LEDGER_MARKS = [700, 1600, 2500];
const NEPTUNE_QTY = [2, 26, 25, 24];
const LEDGER_ROWS = [
  { delta: '+24', tone: 'in', vi: 'Nhập kho', en: 'Stock in', ref: 'PN-0912', time: '08:05', move: '2 → 26', d: '[--d:700ms]' },
  { delta: '−1', tone: 'out', vi: 'Bán hàng', en: 'Sale', ref: 'HD-1043', time: '10:21', move: '26 → 25', d: '[--d:1600ms]' },
  { delta: '−1', tone: 'out', vi: 'Bán hàng', en: 'Sale', ref: 'HD-1051', time: '11:40', move: '25 → 24', d: '[--d:2500ms]' },
];

function InventoryDemo({ active, tx }) {
  const step = useTimeline(active, LEDGER_MARKS);
  const qty = NEPTUNE_QTY[step];
  const rows = [
    { vi: 'Dầu ăn Neptune 1L', en: 'Neptune cooking oil 1L', qty, live: true },
    { vi: 'Sữa tươi TH 180ml', en: 'TH fresh milk 180ml', qty: 56 },
    { vi: 'Mì Hảo Hảo tôm chua cay', en: 'Hao Hao instant noodles', qty: 120 },
  ];
  return (
    <div className={`sp-demo ${active ? 'is-active' : ''} flex h-full flex-col gap-3 p-4 sm:p-5`}>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <span>{tx('Sản phẩm', 'Product')}</span>
          <span className="text-right">{tx('Tồn khả dụng', 'Available')}</span>
          <span className="w-24 text-right">{tx('Trạng thái', 'Status')}</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.vi}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-slate-100 px-3 py-2 text-[11.5px] last:border-b-0"
          >
            <span className="truncate font-medium text-slate-800">{tx(r.vi, r.en)}</span>
            <span key={r.live ? `q-${r.qty}` : 'static'} className={`${r.live && step > 0 ? 'sp-a-pop' : ''} text-right font-mono font-bold tabular-nums text-slate-900`}>
              {r.qty}
            </span>
            <span className="w-24 text-right">
              {r.live && step >= 3 ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/20">
                  {tx('Gần ngưỡng', 'Near ROP')}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  {tx('Đủ hàng', 'In stock')}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-slate-900">{tx('Sổ cái biến động · Dầu Neptune 1L', 'Stock ledger · Neptune oil 1L')}</p>
          <span className="text-[10px] text-slate-400">{tx('Hôm nay', 'Today')}</span>
        </div>
        <ul className="mt-2.5 space-y-1.5">
          {LEDGER_ROWS.map((r) => (
            <li
              key={r.ref}
              className={`sp-a-slide ${r.d} grid grid-cols-[44px_1fr_auto] items-center gap-2.5 rounded-lg border border-slate-100 px-2.5 py-1.5 text-[11px]`}
            >
              <span
                className={`rounded-md py-0.5 text-center font-mono text-[11px] font-bold ${
                  r.tone === 'in' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {r.delta}
              </span>
              <span className="min-w-0 truncate text-slate-700">
                <span className="font-semibold text-slate-900">{tx(r.vi, r.en)}</span> · {r.ref} · {r.time}
              </span>
              <span className="font-mono text-[10.5px] text-slate-500">{r.move}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sp-a [--d:3000ms] flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 ring-1 ring-slate-200">
          <ShieldCheck className="size-3.5 text-[#006FFF]" aria-hidden />
          {tx('Sổ cái chỉ ghi thêm — không sửa, không xóa', 'Append-only — never edited or deleted')}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 ring-1 ring-slate-200">
          <Lock className="size-3.5 text-slate-500" aria-hidden />
          {tx('Nhân viên kho: ẩn giá vốn', 'Staff: cost hidden')}
        </span>
      </div>
    </div>
  );
}

/* ═════════════════════ DEMO 4 — Decision Engine ═════════════════════ */
const SALES_14D = [5, 7, 6, 8, 9, 7, 8, 10, 9, 8, 7, 11, 9, 10];

function DecisionDemo({ active, tx }) {
  const stock = useCountUp(24, active, 40, 1800, 1300);
  const metrics = [
    { label: tx('Bán TB 30 ngày', 'Avg daily sales'), value: '8', unit: tx('chai/ngày', '/day'), d: '[--d:100ms]' },
    { label: tx('Thời gian giao', 'Lead time'), value: '2', unit: tx('ngày', 'days'), d: '[--d:200ms]' },
    { label: tx('Tồn an toàn', 'Safety stock'), value: '9', unit: tx('chai', 'units'), d: '[--d:300ms]' },
    { label: tx('Điểm đặt hàng', 'Reorder point'), value: '25', unit: tx('chai', 'units'), d: '[--d:400ms]', hi: true },
  ];
  return (
    <div className={`sp-demo ${active ? 'is-active' : ''} flex h-full flex-col gap-3 p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#006FFF]">DA-NP01</span>
          <span className="truncate text-[13px] font-bold text-slate-900">{tx('Dầu ăn Neptune 1L', 'Neptune cooking oil 1L')}</span>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
          {tx('Độ tin cậy: Cao', 'Confidence: High')}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`sp-a ${m.d} rounded-lg border p-2 ${m.hi ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}
          >
            <p className={`text-[9.5px] font-medium leading-tight ${m.hi ? 'text-[#006FFF]' : 'text-slate-500'}`}>{m.label}</p>
            <p className="mt-1 font-mono text-[15px] font-bold text-slate-900">
              {m.value} <span className="text-[9.5px] font-normal text-slate-500">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-[10.5px] font-semibold text-slate-500">{tx('Lượng bán 14 ngày gần nhất', 'Units sold, last 14 days')}</p>
        <div className="mt-2 flex h-14 items-end gap-1">
          {SALES_14D.map((v, i) => (
            <span
              key={i}
              className="sp-bar flex-1 rounded-t-sm bg-blue-200"
              style={{ height: `${(v / 11) * 100}%`, '--d': `${500 + i * 45}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-baseline justify-between">
          <p className="text-[10.5px] font-semibold text-slate-500">{tx('Tồn khả dụng', 'Available stock')}</p>
          <p className="font-mono text-[15px] font-bold tabular-nums text-slate-900">
            {stock} <span className="text-[10px] font-normal text-slate-500">{tx('chai', 'units')}</span>
          </p>
        </div>
        <div className="relative mt-5 h-2.5 rounded-full bg-slate-100">
          <div className="sp-drain h-full rounded-full [--d:1300ms] [--from:66%] [--to:40%]" />
          <div className="absolute -top-1.5 bottom-[-6px] left-[41.7%] w-0.5 rounded bg-slate-900" />
          <span className="absolute -top-5 left-[41.7%] -translate-x-1/2 whitespace-nowrap font-mono text-[9.5px] font-bold text-slate-900">
            ROP 25
          </span>
        </div>
      </div>

      <div className="sp-a-pop [--d:3200ms] flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-amber-900">{tx('Đã chạm điểm đặt hàng lại', 'Reorder point reached')}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-amber-800">
            {tx(
              'Còn khoảng 3 ngày hàng. Đề xuất nhập 48 chai để đủ bán thêm khoảng 9 ngày.',
              'About 3 days of cover left. Suggested order: 48 units (~9 more days).'
            )}
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 ring-1 ring-amber-600/20">
          {tx('Rủi ro', 'Risk')} 78
        </span>
      </div>
    </div>
  );
}

/* ═════════════════════ DEMO 5 — Đề xuất giá ═════════════════════ */
const PRICING_MARKS = [3000, 3500];

function PricingDemo({ active, tx }) {
  const step = useTimeline(active, PRICING_MARKS);
  const approved = step >= 2;
  return (
    <div className={`sp-demo ${active ? 'is-active' : ''} relative flex h-full flex-col gap-3 p-4 sm:p-5`}>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">DL-204</span>
          <span className="truncate text-[13px] font-bold text-slate-900">{tx('Đầm linen xanh', 'Blue linen dress')}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">{tx('Tồn 18 cái', '18 in stock')}</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/20">
            {tx('96 ngày chưa bán', 'No sales in 96 days')}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            {tx('Giá vốn', 'Cost')} 240.000đ
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 pb-4 pt-3">
        <p className="text-[10.5px] font-semibold text-slate-500">{tx('Thang giá (0 – 500.000đ)', 'Price scale (0 – 500,000₫)')}</p>
        <div className="relative mb-9 mt-11 h-2 rounded-full bg-linear-to-r from-red-100 via-slate-100 to-slate-100">
          <div className="absolute inset-y-0 left-0 w-[60%] rounded-l-full bg-red-100" />
          {/* Giá sàn */}
          <div className="absolute -bottom-1.5 -top-1.5 left-[60%] w-0.5 bg-red-500" />
          <span className="absolute left-[60%] top-4 -translate-x-1/2 whitespace-nowrap text-center text-[9.5px] font-semibold leading-tight text-red-600">
            {tx('Giá sàn', 'Floor')}
            <br />
            300.000đ
          </span>
          {/* Giá hiện tại */}
          <div className="absolute -bottom-1.5 -top-1.5 left-[90%] w-0.5 bg-slate-400" />
          <span className="absolute left-[90%] top-4 -translate-x-1/2 whitespace-nowrap text-center text-[9.5px] font-semibold leading-tight text-slate-500">
            {tx('Hiện tại', 'Current')}
            <br />
            450.000đ
          </span>
          {/* Giá đề xuất — trượt từ giá hiện tại về mức đề xuất */}
          <div className="sp-move absolute -top-9 flex -translate-x-1/2 flex-col items-center [--d:700ms] [--from:90%] [--to:76.6%]">
            <span className="whitespace-nowrap rounded-md bg-[#006FFF] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
              383.000đ · −15%
            </span>
            <span className="h-3 w-0.5 bg-[#006FFF]" />
            <span className="size-3 rounded-full border-2 border-white bg-[#006FFF] shadow" />
          </div>
        </div>
      </div>

      <div className="sp-a [--d:2000ms] flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-snug text-emerald-800 ring-1 ring-emerald-600/20">
        <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {tx(
          'Giá đề xuất cao hơn giá sàn (giá vốn 240.000đ ÷ (1 − 20% biên tối thiểu) = 300.000đ)',
          'Above the floor (cost 240,000₫ ÷ (1 − 20% min. margin) = 300,000₫)'
        )}
      </div>

      {approved && (
        <div className="sp-a-pop [--d:0ms] flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-[11px] font-semibold text-white shadow-lg">
          <Check className="size-4 shrink-0 text-emerald-400" aria-hidden />
          {tx('Đã áp dụng giá 383.000đ · Đã lưu lịch sử giá', 'Price 383,000₫ applied · Saved to price history')}
        </div>
      )}

      <div className="sp-a [--d:2400ms] mt-auto">
        <div className="flex gap-2">
          <span
            className={`${step >= 1 ? 'sp-press' : ''} flex-1 rounded-lg py-2 text-center text-[11.5px] font-bold text-white ${
              approved ? 'bg-emerald-600' : 'bg-[#006FFF]'
            }`}
          >
            {approved ? tx('Đã duyệt', 'Approved') : tx('Duyệt', 'Approve')}
          </span>
          <span className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-center text-[11.5px] font-semibold text-slate-700">
            {tx('Chỉnh sửa', 'Adjust')}
          </span>
          <span className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-center text-[11.5px] font-semibold text-slate-700">
            {tx('Từ chối', 'Reject')}
          </span>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">{tx('Chỉ chủ cửa hàng được duyệt giá', 'Only the store owner can approve prices')}</p>
      </div>

    </div>
  );
}

/* ═════════════════════ DEMO 6 — Trợ lý AI ═════════════════════ */
function AssistantDemo({ active, tx }) {
  return (
    <div className={`sp-demo ${active ? 'is-active' : ''} flex h-full flex-col p-4 sm:p-5`}>
      <div className="flex items-center justify-between rounded-t-xl border border-slate-200 bg-white px-3 py-2.5">
        <span className="flex items-center gap-2 text-[12px] font-bold text-slate-900">
          <span className="flex size-6 items-center justify-center rounded-lg bg-blue-50 text-[#006FFF]">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
          {tx('Trợ lý StockPilot', 'StockPilot Assistant')}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{tx('Chỉ đọc', 'Read-only')}</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 border-x border-slate-200 bg-slate-50 p-3">
        <div className="sp-a [--d:200ms] ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-[#006FFF] px-3 py-2 text-[11.5px] leading-snug text-white">
          {tx('Vì sao Dầu Neptune 1L đang bị cảnh báo?', 'Why is Neptune oil 1L flagged?')}
        </div>

        <div className="relative min-h-[180px]">
          <div className="sp-typing [--d:700ms] absolute left-0 top-0 flex gap-1 rounded-2xl rounded-bl-md bg-white px-3 py-2.5 ring-1 ring-slate-200">
            <span className="size-1.5 rounded-full bg-slate-400" />
            <span className="size-1.5 rounded-full bg-slate-400" />
            <span className="size-1.5 rounded-full bg-slate-400" />
          </div>
          <div className="sp-a [--d:2000ms] max-w-[88%] rounded-2xl rounded-bl-md bg-white px-3 py-2.5 text-[11.5px] leading-relaxed text-slate-700 ring-1 ring-slate-200">
            <p>
              {tx('Tồn khả dụng còn', 'Available stock is')} <b className="text-slate-900">{tx('24 chai', '24 units')}</b>,{' '}
              {tx('thấp hơn điểm đặt hàng lại', 'below the reorder point of')} <b className="text-slate-900">{tx('25 chai', '25')}</b>.
            </p>
            <ul className="mt-1.5 space-y-1">
              <li>• {tx('Bán trung bình 8 chai/ngày → còn khoảng 3 ngày hàng', 'Selling 8/day → about 3 days of cover')}</li>
              <li>• {tx('Nhà cung cấp giao sau 2 ngày', 'Supplier lead time is 2 days')}</li>
              <li className="font-semibold text-slate-900">• {tx('Đề xuất: nhập 48 chai trước thứ Sáu', 'Suggestion: order 48 units before Friday')}</li>
            </ul>
          </div>
        </div>

        <div className="sp-a [--d:2600ms] mt-auto flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
            <BrainCircuit className="size-3 text-[#006FFF]" aria-hidden />
            {tx('Nguồn: kết quả Decision Engine', 'Source: Decision Engine results')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
            <ShieldCheck className="size-3 text-emerald-600" aria-hidden />
            {tx('Không tự thay đổi dữ liệu', 'Never changes your data')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-b-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] text-slate-400">
        <MessageSquareText className="size-3.5" aria-hidden />
        {tx('Hỏi về tồn kho, giá bán, doanh thu…', 'Ask about stock, pricing, sales…')}
      </div>
    </div>
  );
}

const DEMOS = [PosDemo, ScannerDemo, InventoryDemo, DecisionDemo, PricingDemo, AssistantDemo];

/* ═════════════════════ Section chính ═════════════════════ */
export function FeatureScrollShowcase({ language = 'vi' }) {
  const tx = (vi, en) => (language === 'en' ? en : vi);
  const [active, setActive] = useState(0);
  const stepRefs = useRef([]);

  // Tính năng nào đi qua đường giữa màn hình thì trở thành tính năng đang demo
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.index));
        });
      },
      { rootMargin: '-48% 0px -48% 0px', threshold: 0 }
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const goTo = (index) => {
    const el = stepRefs.current[index];
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  };

  return (
    <section id="capabilities" className="relative scroll-mt-20 bg-white py-20 lg:py-28">
      <div id="showcase" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <span className="inline-block rounded-full border border-blue-200/80 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#006FFF]">
            {tx('Trải nghiệm sản phẩm', 'Product tour')}
          </span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {tx('Một ngày vận hành cửa hàng cùng StockPilot', 'A day running your store with StockPilot')}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            {tx(
              'Cuộn xuống để xem từng tính năng hoạt động — từ lúc bán hàng tại quầy đến khi hệ thống nhắc bạn nhập hàng.',
              'Scroll to watch each feature in action — from ringing up a sale to getting told exactly when to restock.'
            )}
          </p>
        </div>

        <div className="mt-12 lg:mt-16 lg:grid lg:grid-cols-12 lg:gap-14">
          {/* Cột trái: các bước tính năng */}
          <div className="lg:col-span-5 lg:pb-[18vh]">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const Demo = DEMOS[i];
              const isActive = active === i;
              return (
                <article
                  key={f.id}
                  id={f.id}
                  data-index={i}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  className="flex scroll-mt-24 flex-col justify-center border-b border-slate-100 py-12 last:border-b-0 lg:min-h-[72vh] lg:border-b-0 lg:py-0"
                >
                  <div className={`transition-opacity duration-500 ${isActive ? 'lg:opacity-100' : 'lg:opacity-35'}`}>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-10 items-center justify-center rounded-xl transition-colors duration-300 ${
                          isActive ? 'bg-[#006FFF] text-white shadow-lg shadow-blue-500/25' : 'bg-blue-50 text-[#006FFF]'
                        }`}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="font-mono text-xs font-bold tracking-wider text-slate-400">
                        {String(i + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#006FFF]">{tx(f.eyebrowVi, f.eyebrowEn)}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-black leading-snug tracking-tight text-slate-900 sm:text-2xl">
                      {tx(f.titleVi, f.titleEn)}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{tx(f.descVi, f.descEn)}</p>
                    <ul className="mt-5 space-y-2.5">
                      {(language === 'en' ? f.pointsEn : f.pointsVi).map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#006FFF]">
                            <Check className="size-3" aria-hidden />
                          </span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mobile / tablet: demo nằm ngay dưới từng tính năng */}
                  <div className="mt-8 lg:hidden" aria-hidden="true">
                    <FitToWidth>
                      <BrowserChrome url={f.url}>
                        <Demo active={isActive} tx={tx} />
                      </BrowserChrome>
                    </FitToWidth>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Cột phải (desktop): khung demo dính, đổi theo tính năng đang xem */}
          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-[max(5rem,calc(50vh-262px))]">
              <div aria-hidden="true">
                <BrowserChrome url={FEATURES[active].url}>
                  {FEATURES.map((f, i) => {
                    const Demo = DEMOS[i];
                    const isActive = active === i;
                    return (
                      <div
                        key={f.id}
                        className={`absolute inset-0 transition-all duration-500 ease-out ${
                          isActive ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
                        }`}
                      >
                        <Demo active={isActive} tx={tx} />
                      </div>
                    );
                  })}
                </BrowserChrome>
              </div>

              <nav className="mt-5 flex flex-wrap justify-center gap-2" aria-label={tx('Chọn tính năng để xem demo', 'Choose a feature demo')}>
                {FEATURES.map((f, i) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={active === i ? 'step' : undefined}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006FFF] ${
                      active === i ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="mr-1 font-mono opacity-60">{String(i + 1).padStart(2, '0')}</span>
                    {tx(f.shortVi, f.shortEn)}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureScrollShowcase;
