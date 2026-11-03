import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Smartphone,
  ChevronDown,
  Send,
  Loader2,
  Monitor,
  Printer,
  QrCode,
  Menu,
  X,
  Building2,
  Shirt,
  Coffee,
  Phone,
  Sparkles,
  AlertTriangle,
  Mail,
  Store,
  Clock,
  TrendingUp,
  Cpu,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { StockPilotLogo } from '../components/common/StockPilotLogo';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../components/store/authStore';
import { useToast } from '../components/common/Toast';
import { useTranslation } from '../i18n/useTranslation';

// ─── Sub-Components: Hero Mockup ───
import { HeroDashboardMockup } from '../components/landing/HeroDashboardMockup';
import { FeatureScrollShowcase } from '../components/landing/FeatureScrollShowcase';

// ─── Sub-Hero Stats & Integration Partners (from original design) ───
const STATS = [
  // Chỉ nêu thông tin sản phẩm kiểm chứng được — không dùng số khách hàng/hóa đơn chưa có số liệu thật
  { value: '60 giây', valueEn: '60s', labelVi: 'Khởi tạo cửa hàng mới', labelEn: 'Store setup' },
  { value: '3', valueEn: '3', labelVi: 'Loại rủi ro tồn kho được theo dõi tự động', labelEn: 'Inventory risks monitored automatically' },
  { value: '2', valueEn: '2', labelVi: 'Cổng thanh toán QR: VietQR & MoMo', labelEn: 'QR payment options: VietQR & MoMo' },
  { value: '80mm', valueEn: '80mm', labelVi: 'In hóa đơn nhiệt ngay tại quầy', labelEn: 'Thermal receipts at the counter' }
];

// Chỉ liệt kê thanh toán & thiết bị hệ thống thực sự hỗ trợ
const INTEGRATIONS = [
  { vi: 'VietQR', en: 'VietQR' },
  { vi: 'PayOS', en: 'PayOS' },
  { vi: 'Ví MoMo', en: 'MoMo Wallet' },
  { vi: 'Máy in nhiệt 80mm', en: '80mm Thermal Printer' },
  { vi: 'Máy quét mã vạch USB', en: 'USB Barcode Scanner' },
  { vi: 'Camera điện thoại', en: 'Phone Camera Scanner' }
];

// ─── 3 Core Operational Pillars ───
const VALUES = [
  {
    widget: 'rop',
    titleVi: 'Tự động tính lịch nhập hàng — Chấm dứt ước chừng cảm tính',
    titleEn: 'Zero-Guesswork Restocking with Decision Engine',
    descVi: 'Hệ thống tự động tính điểm đặt hàng dựa trên tốc độ bán mỗi ngày và thời gian nhà cung cấp giao. Bạn luôn biết chính xác khi nào cần nhập và nhập bao nhiêu để không bao giờ bị đứt hàng.',
    descEn: 'Automatically calculates optimal Reorder Points based on daily sales velocity and supplier lead times, ensuring your shelves are never empty without tying up excess cash.'
  },
  {
    widget: 'risk',
    titleVi: 'Cảnh báo hàng tồn đọng & Giải phóng vốn kẹt',
    titleEn: 'Dead Stock Radar & Cashflow Recovery',
    descVi: 'Tự động phân loại toàn bộ kho thành 5 nhóm: Hết hàng, Sắp hết, Tồn an toàn, Bán chậm và Hàng ế lâu ngày (>90 ngày). Đo lường chính xác số tiền vốn đang bị chôn để bạn chủ động xả hàng thu hồi tiền mặt.',
    descEn: 'Scans and segments inventory into 5 risk levels: Out of Stock, Low Stock, Optimal, Slow-Moving, and Dead Stock (>90 days). Pinpoints exact tied-up capital so you can liquidate safely.'
  },
  {
    widget: 'ledger',
    titleVi: 'Chống thất thoát kho & Chặn bán dưới giá vốn',
    titleEn: '100% Stock Integrity & Safe Margin Floor',
    descVi: 'Lưu vết chính xác từng lượt xuất, nhập và bán hàng theo thời gian thực — nhân viên không thể sửa lén số liệu, chấm dứt hoàn toàn tình trạng lệch kho hay âm kho. Khi xả hàng thanh lý, hệ thống tự động khóa giá sàn theo giá vốn, không bao giờ để bạn bị bán lỗ.',
    descEn: 'Automatically records every stock in, out, and retail sale in real-time — tamper-proof history eliminates negative stock drifts. When discounting inventory, the system locks safe price floors above cost to prevent selling at a loss.'
  }
];

// ─── 4 How Decision Engine Works Cards ───
const HOW_IT_WORKS_CARDS = [
  {
    step: '01',
    badgeVi: 'Dự báo nhu cầu',
    badgeEn: 'Demand Forecast',
    icon: TrendingUp,
    problemVi: 'Khi nào cần nhập hàng? Nhập bao nhiêu để không bị cháy hàng?',
    problemEn: 'When to restock? How much is enough to avoid stockouts?',
    solutionVi: 'Decision Engine đo tốc độ bán bình quân (ADS) và độ lệch chuẩn 30 ngày. Thuật toán tự động tính Điểm Đặt Hàng Lại (Reorder Point = Nhu cầu Lead Time + Tồn an toàn Safety Stock) và cảnh báo trước 48h.',
    solutionEn: 'Measures 30-day Average Daily Sales (ADS) and standard deviation. Automatically calculates Reorder Point (ROP = Lead Time Demand + Safety Stock) with a 48-hour advance warning.'
  },
  {
    step: '02',
    badgeVi: 'Kiểm soát hàng đọng',
    badgeEn: 'Dead Stock Audit',
    icon: Clock,
    problemVi: 'Bao nhiêu tiền vốn đang bị chôn dưới đáy kho mà bạn không biết?',
    problemEn: 'How much working capital is secretly trapped in unsold inventory?',
    solutionVi: 'Hệ thống tự động phát hiện hàng Bán chậm (Slow-moving > 60 ngày) và Hàng chết (Dead-stock > 90 ngày). Đo lường tổng giá trị vốn nhập đang bị chôn để bạn lên kế hoạch xả hàng.',
    solutionEn: 'Scans all SKUs to tag Slow-Moving (>60 days) and Dead Stock (>90 days without sales). Computes exact tied-up cost value so store owners can act before goods expire.'
  },
  {
    step: '03',
    badgeVi: 'Định giá an toàn',
    badgeEn: 'Smart Price Floor',
    icon: Tag,
    problemVi: 'Xả hàng thanh lý thế nào để thu hồi vốn mà không bị bán lỗ?',
    problemEn: 'How to discount and liquidate overstock without incurring losses?',
    solutionVi: 'Hệ thống tính toán Giá sàn an toàn: Giá vốn / (1 - Biên lợi nhuận tối thiểu). Gợi ý mức chiết khấu thông minh cho hàng dư thừa (Overstock) để giải phóng vốn nhanh nhất mà vẫn bảo toàn lợi nhuận.',
    solutionEn: 'Calculates a strict safe price floor: Cost / (1 - Min Margin). Suggests optimal discount rates for overstocked SKUs to rapidly free capital while guaranteeing gross profits.'
  },
  {
    step: '04',
    badgeVi: 'Trợ lý AI giải thích',
    badgeEn: 'AI Explanation',
    icon: Sparkles,
    problemVi: 'Không rành về bảng biểu và số liệu tài chính phức tạp thì làm sao?',
    problemEn: 'What if you dislike complex spreadsheets and accounting jargon?',
    solutionVi: 'Trợ lý AI tổng hợp dữ liệu kinh doanh và giải thích bằng tiếng Việt giản dị. Bạn chỉ cần hỏi: "Mặt hàng nào đang chôn vốn nhiều nhất?", AI sẽ trả lời rõ ràng kèm lời khuyên hành động.',
    solutionEn: 'The read-only AI Assistant translates analytics into natural conversational answers. Just ask: "Which product traps the most capital?", and receive instant executive guidance.'
  }
];

// ─── 4 Industry Solutions ───
const INDUSTRIES = [
  {
    image: '/industryGrocery.svg',
    icon: Building2,
    badgeVi: 'Hạn dùng & Tồn an toàn',
    badgeEn: 'Expiry & Safety Stock',
    titleVi: 'Tạp hóa & Siêu thị mini',
    titleEn: 'Grocery & Minimart',
    descVi: 'Quản lý hàng nghìn mã vạch, tự động tính điểm đặt hàng lại cho các mặt hàng tiêu dùng nhanh (FMCG), không lo cận date hay cháy hàng giờ cao điểm.',
    descEn: 'Manages thousands of barcodes, calculates FMCG reorder points, tracks expiry dates, and prevents rush-hour stockouts.'
  },
  {
    image: '/industryFashion.svg',
    icon: Shirt,
    badgeVi: 'Phân loại & Mẫu mã',
    badgeEn: 'Variants & Sizes',
    titleVi: 'Thời trang & Mỹ phẩm',
    titleEn: 'Fashion & Cosmetics',
    descVi: 'Phân tích tốc độ bán theo từng size, màu sắc. Tự động cảnh báo mẫu hot sắp hết hàng và gợi ý chiết khấu xả hàng cho mẫu lỗi mốt.',
    descEn: 'Tracks sales velocity by size and color variant. Alerts when trending items run low and suggests promotional markdowns for off-season styles.'
  },
  {
    image: '/industryCafe.svg',
    icon: Coffee,
    badgeVi: 'Tiêu hao & Giờ cao điểm',
    badgeEn: 'Raw Materials & Peaks',
    titleVi: 'Cà phê & Quán ăn F&B',
    titleEn: 'Coffee & F&B Dining',
    descVi: 'Thanh toán tại quầy 8 giây/đơn, xuất hóa đơn QR động. Theo dõi nguyên vật liệu tiêu hao và dự báo nhu cầu chuẩn bị cho ngày cuối tuần.',
    descEn: 'High-speed 8-second counter checkout, dynamic VietQR bills, ingredient consumption tracking, and weekend demand forecasting.'
  },
  {
    image: '/industryChain.svg',
    icon: Store,
    badgeVi: 'Đa chi nhánh & Cân đối kho',
    badgeEn: 'Multi-Branch Balancing',
    titleVi: 'Chuỗi cửa hàng & Bán buôn',
    titleEn: 'Retail Chains & Wholesale',
    descVi: 'Đồng bộ dữ liệu nhiều chi nhánh, thuật toán gợi ý điều chuyển hàng từ chi nhánh thừa sang chi nhánh thiếu để tối ưu hóa tồn kho toàn chuỗi.',
    descEn: 'Multi-location inventory synchronization. Suggests internal stock transfers from overstocked branches to deficit stores to optimize total capital.'
  }
];

const HARDWARE_ITEMS = [
  {
    icon: Monitor,
    titleVi: 'Máy tính bàn & Laptop',
    titleEn: 'Desktop PCs & Laptops',
    descVi: 'Chạy mượt mà trên trình duyệt Chrome, Cốc Cốc, Edge (Windows, macOS).',
    descEn: 'Runs smoothly on Chrome, Edge, Safari (Windows and macOS).'
  },
  {
    icon: Smartphone,
    titleVi: 'Máy tính bảng & Điện thoại',
    titleEn: 'Tablets & Smartphones',
    descVi: 'Giao diện co giãn chuẩn cho iPad, máy tính bảng Android và smartphone.',
    descEn: 'Responsive layout crafted for iPads, Android tablets, and mobile devices.'
  },
  {
    icon: Printer,
    titleVi: 'Máy in hóa đơn nhiệt',
    titleEn: 'Thermal Receipt Printers',
    descVi: 'Hỗ trợ cổng USB, LAN, Bluetooth khổ giấy 58mm và 80mm.',
    descEn: 'Connects easily via USB, LAN network cable, and Bluetooth (58mm/80mm).'
  },
  {
    icon: QrCode,
    titleVi: 'Máy quét mã vạch & Camera',
    titleEn: 'Barcode Scanners & Cameras',
    descVi: 'Đọc barcode 1D/2D bằng máy quét chuyên dụng hoặc camera điện thoại.',
    descEn: 'Scan 1D/2D barcodes with dedicated handheld scanners or device cameras.'
  }
];

// Kịch bản sử dụng minh họa theo loại cửa hàng (không phải lời chứng thực của khách hàng thật)
const USE_CASES = [
  {
    icon: Store,
    industryVi: 'Tạp hóa & siêu thị mini',
    industryEn: 'Grocery & mini-marts',
    scenarioVi: 'Nước giải khát, dầu ăn, mì gói được theo dõi tốc độ bán mỗi ngày. Khi tồn kho chạm điểm đặt hàng lại, chủ tiệm nhận cảnh báo kèm số lượng nên nhập để kịp hàng trước cuối tuần.',
    scenarioEn: 'Fast movers like drinks, cooking oil and noodles are tracked daily. When stock hits the reorder point, the owner gets an alert with a suggested quantity in time for the weekend rush.',
    featureVi: 'Decision Engine · Cảnh báo nhập hàng',
    featureEn: 'Decision Engine · Restock alerts'
  },
  {
    icon: Coffee,
    industryVi: 'Quán cà phê & F&B',
    industryEn: 'Cafés & F&B',
    scenarioVi: 'Cà phê hạt, sữa tươi mỗi loại có thời gian giao khác nhau. Thời gian giao của từng nhà cung cấp được tính vào điểm đặt hàng lại, nên mỗi sáng chủ quán chỉ cần xem danh sách cần nhập.',
    scenarioEn: 'Coffee beans and milk each have different supplier lead times. Those lead times feed the reorder point, so each morning the owner just checks the restock list.',
    featureVi: 'Quản lý kho · Sổ cái biến động',
    featureEn: 'Inventory · Stock ledger'
  },
  {
    icon: Shirt,
    industryVi: 'Thời trang & phụ kiện',
    industryEn: 'Fashion & accessories',
    scenarioVi: 'Mẫu cũ không bán được quá 90 ngày được đánh dấu là hàng tồn đọng. Hệ thống đề xuất mức giảm giá hợp lý nhưng không thấp hơn giá sàn, chủ shop duyệt trước khi áp dụng.',
    scenarioEn: 'Styles unsold for 90+ days are flagged as dead stock. StockPilot suggests a sensible markdown that never drops below the price floor, and the owner approves it first.',
    featureVi: 'Đề xuất giá · Giá sàn',
    featureEn: 'Pricing · Price floor'
  }
];

const FAQ_ITEMS = [
  {
    qVi: 'Decision Engine là gì và khác gì so với phần mềm bán hàng thông thường?',
    qEn: 'What is Decision Engine and how does it differ from traditional POS software?',
    aVi: 'Phần mềm bán hàng thông thường chỉ dừng lại ở việc tạo hóa đơn và cộng trừ tồn kho đơn giản. Còn Decision Engine của StockPilot là một động cơ toán học định lượng: tự động tính tốc độ bán, dự báo khi nào hết hàng, tính số lượng an toàn (Safety Stock) cần nhập, và phát hiện hàng ế đọng vốn >90 ngày để đề xuất xả hàng thu hồi vốn mà không sợ bán lỗ.',
    aEn: 'Traditional POS software only records orders and simple stock balances. StockPilot\'s Decision Engine is a quantitative algorithmic system: it tracks daily velocity, calculates exact Reorder Points and Safety Stock, detects dead inventory over 90 days, and recommends profitable liquidation markdowns.'
  },
  {
    qVi: 'Decision Engine tính toán điểm đặt hàng lại (Reorder Point) dựa trên những số liệu nào?',
    qEn: 'What data does Decision Engine use to compute Reorder Points (ROP)?',
    aVi: 'Thuật toán kết hợp 3 yếu tố cốt lõi: (1) Tốc độ bán bình quân hàng ngày (ADS) trong 30 ngày gần nhất, (2) Độ lệch chuẩn nhu cầu để dự phòng những ngày bán đột biến, và (3) Thời gian giao hàng của nhà cung cấp (Lead time). Nhờ đó, hệ thống luôn gửi cảnh báo trước 48h để bạn kịp tạo phiếu nhập hàng.',
    aEn: 'The engine synthesizes 3 primary parameters: (1) 30-day Average Daily Sales (ADS), (2) demand standard deviation for peak spikes, and (3) supplier delivery lead time. This guarantees a 48-hour advance notice before stock runs out.'
  },
  {
    qVi: 'Đề xuất giảm giá của Decision Engine có làm cửa hàng tôi bị bán lỗ không?',
    qEn: 'Will the engine\'s discount recommendations cause our store to sell at a loss?',
    aVi: 'Hoàn toàn không. Thuật toán luôn tính toán một mức "Giá sàn an toàn" theo công thức: Giá vốn / (1 - Biên lợi nhuận tối thiểu do bạn thiết lập). Mọi đề xuất giảm giá xả hàng cho sản phẩm dư thừa (Overstock) đều được chốt cứng trên giá sàn này để đảm bảo tuyệt đối không bán dưới giá vốn.',
    aEn: 'Absolutely not. The algorithm enforces a strict safe price floor: Cost / (1 - Min Margin). All promotional markdown recommendations are locked strictly above this floor, ensuring zero sales below cost.'
  },
  {
    qVi: 'Trợ lý AI có tự ý thay đổi dữ liệu tồn kho hay đơn hàng của tôi không?',
    qEn: 'Can the AI Assistant accidentally mutate or alter our inventory records?',
    aVi: 'Tuyệt đối không. Theo tiêu chuẩn thiết kế ADR-005 của dự án, Trợ lý AI hoạt động theo nguyên tắc Read-Only (Chỉ đọc). AI chỉ có nhiệm vụ đọc dữ liệu tóm tắt và giải thích cho bạn bằng tiếng Việt giản dị. Mọi quyết định thay đổi giá, tạo phiếu nhập kho hay điều chỉnh số lượng đều do chính bạn chủ động phê duyệt.',
    aEn: 'Strictly no. Under our ADR-005 architectural rule, the AI Assistant operates exclusively in Read-Only mode. It synthesizes insights into clear natural language, while all transactional mutations remain strictly in your manual control.'
  },
  {
    qVi: 'Sổ cái kho bất biến (Immutable Ledger) giúp ích gì cho Decision Engine?',
    qEn: 'How does the Immutable Stock Ledger empower the Decision Engine?',
    aVi: 'Một thuật toán chỉ có thể ra quyết định chính xác nếu dữ liệu đầu vào chuẩn xác. Sổ cái kho của StockPilot áp dụng cơ chế Insert-Only (chỉ ghi thêm, không sửa xóa lịch sử). Mọi đơn bán, hàng trả hay kiểm kê đều được ghi nhận chi tiết, chống âm kho 100%, tạo thành dòng dữ liệu sạch để Decision Engine tính toán không sai sót.',
    aEn: 'An algorithm is only as good as its data. StockPilot\'s Insert-Only stock movement ledger eliminates unrecorded drift and negative stock, feeding clean, reliable data into the Decision Engine.'
  },
  {
    qVi: 'Tôi có thể dùng thử Decision Engine với dữ liệu cửa hàng hiện tại không?',
    qEn: 'Can I test Decision Engine using my current store catalog and history?',
    aVi: 'Có. StockPilot hỗ trợ nhập dữ liệu sản phẩm, số lượng tồn ban đầu và lịch sử bán hàng từ file Excel hoặc từ phần mềm cũ chỉ trong 60 giây. Sau khi nạp dữ liệu, Decision Engine sẽ lập tức phân tích và đưa ra báo cáo rủi ro kho ngay cho bạn.',
    aEn: 'Yes. StockPilot allows importing your catalog, current stock, and past sales via Excel in under 60 seconds. The Decision Engine immediately evaluates your inventory risks.'
  }
];

const CONSULT_INDUSTRIES = [
  { vi: 'Tạp hóa & Siêu thị mini', en: 'Grocery & Mini Mart' },
  { vi: 'Thời trang & Mỹ phẩm', en: 'Fashion & Cosmetics' },
  { vi: 'Cà phê & Quán ăn F&B', en: 'Coffee & F&B Dining' },
  { vi: 'Chuỗi cửa hàng & Bán buôn', en: 'Multi-store Chain & Wholesale' },
  { vi: 'Bán lẻ tổng hợp', en: 'General Retail' }
];

// ─── Small Presentation Helper Components ───
function SectionBadge({ children }) {
  return (
    <span className="inline-block text-xs font-bold text-[#006FFF] bg-blue-50 border border-blue-200/80 px-3.5 py-1 rounded-full uppercase tracking-wider">
      {children}
    </span>
  );
}

// ─── Bilingual Dictionary (VI / EN) for Landing Page ───
const CONTENT = {
  vi: {
    nav: {
      decisionEngine: 'Decision Engine',
      showcase: 'Tính năng',
      industries: 'Ngành hàng',
      hardware: 'Thiết bị',
      faq: 'Hỏi & Đáp',
      contact: 'Tư vấn',
      login: 'Đăng nhập',
      trial: 'Dùng thử miễn phí',
      toDashboard: 'Vào phần mềm'
    },
    hero: {
      badge: 'Nền tảng Bán lẻ & Quản lý Tồn kho Tích hợp Decision Engine',
      line1: 'Bán hàng siêu tốc.',
      line2: 'Dự báo tồn kho.',
      line3: 'Tối ưu lợi nhuận.',
      desc: 'Không chỉ là phần mềm bán hàng thông thường — StockPilot tích hợp Động cơ Ra Quyết Định (Decision Engine): Tự động dự báo điểm đặt hàng lại (Reorder Point), phát hiện hàng ế đọng vốn và đề xuất giá bán tối ưu lợi nhuận cho cửa hàng của bạn.',
      primaryCta: 'Dùng thử ngay',
      secondaryCta: 'Tìm hiểu cơ chế hoạt động',
      check1: 'Tự động tính điểm đặt hàng lại',
      check2: 'Phát hiện hàng đọng vốn 90 ngày',
      check3: 'Không lo âm kho hay bán lỗ'
    },
    howItWorks: {
      tag: 'Cơ chế hoạt động',
      title: 'Decision Engine giải quyết 4 bài toán hóc búa nhất của chủ cửa hàng',
      desc: 'Chuyển hóa dữ liệu giao dịch hàng ngày thành những hành động kinh doanh cụ thể, rõ ràng và mang lại lợi nhuận thực tế.'
    },
    industries: {
      tag: 'Ngành hàng tối ưu',
      title: 'Động cơ phân tích chuyên biệt cho từng mô hình bán lẻ',
      desc: 'Dù kinh doanh bách hóa hàng nghìn mã hay chuỗi thời trang đa mẫu mã, Decision Engine đều thích ứng linh hoạt.'
    },
    hardware: {
      tag: 'Thiết bị phần cứng',
      title: 'Tương thích mọi thiết bị sẵn có tại cửa hàng',
      desc: 'Không cần đầu tư máy móc đắt đỏ. StockPilot hoạt động mượt mà trên máy tính, điện thoại và máy in bill thông dụng tại Việt Nam.'
    },
    testimonials: {
      tag: 'Kịch bản sử dụng',
      title: 'StockPilot hỗ trợ từng loại cửa hàng như thế nào',
      note: 'Kịch bản minh họa'
    },
    faq: {
      tag: 'Hỗ trợ & Giải đáp',
      title: 'Câu hỏi thường gặp về Decision Engine',
      desc: 'Tìm hiểu rõ hơn về thuật toán tính toán, tính an toàn dữ liệu và cơ chế vận hành của hệ thống.'
    },
    consultation: {
      tag: 'Tư vấn 1-1 miễn phí',
      title: 'Để chuyên viên giúp bạn cài đặt Decision Engine cho cửa hàng',
      perk1: 'Phân tích dữ liệu danh mục SKU và xác định ngay hàng đọng vốn',
      perk2: 'Cấu hình ngưỡng an toàn (Safety Stock) và điểm đặt hàng lại',
      perk3: 'Chuyển đổi dữ liệu từ Excel / KiotViet / Sapo miễn phí',
      formTitle: 'Đăng ký tư vấn giải pháp',
      formDesc: 'Điền thông tin, chuyên viên giải pháp sẽ liên hệ hỗ trợ bạn trong vòng 30 phút.',
      nameLabel: 'Họ và tên *',
      phoneLabel: 'Số điện thoại *',
      emailLabel: 'Email',
      storeLabel: 'Tên cửa hàng',
      industryLabel: 'Ngành hàng kinh doanh',
      noteLabel: 'Nhu cầu hoặc số lượng SKU',
      notePlaceholder: 'Ví dụ: Cửa hàng tạp hóa 1.200 SKU, muốn kiểm soát hàng đọng vốn...',
      submitBtn: 'Gửi yêu cầu tư vấn 1-1',
      submitting: 'Đang gửi yêu cầu...',
      successTitle: 'Đã nhận thông tin đăng ký!',
      successDesc: 'Chuyên viên giải pháp StockPilot sẽ liên hệ với bạn trong vòng 30 phút (giờ làm việc 08:00 – 22:00).',
      sendAnother: 'Gửi yêu cầu khác'
    },
    banner: {
      tag: 'Chấm dứt quản lý theo cảm tính',
      title: 'Sẵn sàng để Decision Engine dẫn lối kinh doanh của bạn?',
      desc: 'Khởi tạo cửa hàng trong khoảng 60 giây, nhập danh sách sản phẩm từ Excel và để Decision Engine bắt đầu theo dõi tồn kho cho bạn.',
      primaryCta: 'Bắt đầu dùng thử ngay',
      secondaryCta: 'Đăng ký tư vấn 1-1',
      perk1: 'Cài đặt và hướng dẫn từ xa 1-1',
      perk2: 'Nạp dữ liệu mẫu thử nghiệm 60 giây',
      perk3: 'Hotline hỗ trợ: 0908 123 456'
    },
    footer: {
      desc: 'StockPilot Decision Engine — Nền tảng Quản lý Bán lẻ, Kiểm soát Kho Hàng & Động cơ Hỗ trợ Ra Quyết Định Thông minh dành cho doanh nghiệp bán lẻ tại Việt Nam.',
      hotline: 'Tổng đài tư vấn:',
      email: 'Email hỗ trợ kỹ thuật:',
      hours: 'Thời gian hỗ trợ: 08:00 – 22:00 (Tất cả các ngày trong tuần)',
      solutions: 'Giải pháp theo ngành',
      features: 'Hệ thống cốt lõi',
      account: 'Tài khoản & Truy cập',
      signIn: 'Đăng nhập hệ thống cửa hàng →',
      startFree: 'Đăng ký dùng thử ngay →',
      copyright: '© 2026 StockPilot Decision Engine. Nền tảng quản lý bán lẻ & ra quyết định định lượng.',
      terms: 'Điều khoản dịch vụ',
      privacy: 'Chính sách bảo mật dữ liệu',
      operation: 'Giải quyết khiếu nại'
    }
  },
  en: {
    nav: {
      showcase: 'Features',
      industries: 'Industries',
      hardware: 'Hardware',
      faq: 'FAQ',
      contact: 'Consultation',
      login: 'Sign in',
      trial: 'Start Free Trial',
      goToApp: 'Open Dashboard'
    },
    hero: {
      badge: 'Smart Retail & Quantitative Decision Engine SaaS',
      line1: 'Fast POS Checkout.',
      line2: 'Predict Inventory.',
      line3: 'Maximize Profits.',
      desc: 'Beyond standard POS checkout — StockPilot integrates a Quantitative Decision Engine: automatically calculating Reorder Points, detecting 90-day dead stock, and recommending safe promotional pricing.',
      primaryCta: 'Start Free Trial Now',
      secondaryCta: 'How the Engine Works',
      check1: 'Automated Reorder Point Calculation',
      check2: '90-Day Dead Stock Detection',
      check3: 'Zero Negative Stock & Safe Margin Floors'
    },
    howItWorks: {
      tag: 'Operational Mechanism',
      title: 'How Decision Engine Solves 4 Crucial Retail Dilemmas',
      desc: 'Transform raw transaction logs into proactive, clear business decisions that protect working capital and boost net profit.'
    },
    industries: {
      tag: 'Optimized Industries',
      title: 'Specialized Decision Algorithms for Every Retail Model',
      desc: 'Whether managing high-turnover grocery lines or multi-variant fashion apparel, the engine adapts seamlessly.'
    },
    hardware: {
      tag: 'Hardware Ecosystem',
      title: 'Compatible with Your Existing Hardware',
      desc: 'No expensive proprietary equipment needed. StockPilot runs reliably on standard devices and retail peripherals.'
    },
    testimonials: {
      tag: 'Use cases',
      title: 'How StockPilot fits different kinds of stores',
      note: 'Illustrative scenario'
    },
    faq: {
      tag: 'Support & FAQ',
      title: 'Frequently Asked Questions About Decision Engine',
      desc: 'Learn about statistical formulas, strict data safety principles, and operational workflows.'
    },
    consultation: {
      tag: 'Free 1-on-1 Consultation',
      title: 'Let a Specialist Configure Decision Engine for Your Store',
      perk1: 'Analyze your SKU catalog and instantly identify tied-up dead stock',
      perk2: 'Configure safety stock thresholds and automated reorder points',
      perk3: 'Free Excel data migration from your existing software',
      formTitle: 'Request Solution Walkthrough',
      formDesc: 'Submit your details and a specialist will contact you within 30 minutes.',
      nameLabel: 'Full Name *',
      phoneLabel: 'Phone Number *',
      emailLabel: 'Email',
      storeLabel: 'Store Name',
      industryLabel: 'Industry',
      noteLabel: 'Specific Requirements or SKU Count',
      notePlaceholder: 'E.g., 1,200 SKU grocery store, looking to liquidate slow stock...',
      submitBtn: 'Submit Consultation Request',
      submitting: 'Submitting...',
      successTitle: 'Request Received!',
      successDesc: 'A StockPilot specialist will call you within 30 minutes (operating hours 08:00 – 22:00).',
      sendAnother: 'Submit another request'
    },
    banner: {
      tag: 'Stop Guesswork Management',
      title: 'Ready to Let Decision Engine Steer Your Business?',
      desc: 'Set up your store in about 60 seconds, import your products from Excel, and let the Decision Engine start watching your stock.',
      primaryCta: 'Start Free Trial Now',
      secondaryCta: 'Request 1-on-1 Consultation',
      perk1: 'Remote 1-on-1 setup and onboarding',
      perk2: 'Instant 60-second sandbox catalog demo',
      perk3: 'Support hotline: 0908 123 456'
    },
    footer: {
      desc: 'StockPilot Decision Engine — Retail Management, Inventory Control & Quantitative Decision Platform for Modern Commerce in Vietnam.',
      hotline: 'Advisory Hotline:',
      email: 'Technical Support Email:',
      hours: 'Operating Hours: 08:00 – 22:00 (All days of the week)',
      solutions: 'Industry Solutions',
      features: 'Core Capabilities',
      account: 'Account & Access',
      signIn: 'Store Account Sign In →',
      startFree: 'Start Free Trial Access →',
      copyright: '© 2026 StockPilot Decision Engine. Quantitative Decision & Retail SaaS Platform.',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      operation: 'Complaints & Support'
    }
  }
};

export function LandingPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const { language, toggleLanguage } = useTranslation();
  const t = CONTENT[language] || CONTENT.vi;

  const consultationRef = useRef(null);

  // Navigation & UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(0);
  const [isLangTransitioning, setIsLangTransitioning] = useState(false);

  const handleSmoothToggleLang = () => {
    setIsLangTransitioning(true);
    toggleLanguage();
    setTimeout(() => {
      setIsLangTransitioning(false);
    }, 180);
  };

  // Consultation lead form state
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    storeName: '',
    industry: 'Tạp hóa & Siêu thị mini',
    note: ''
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Smooth scroll handler
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -76;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Full consultation lead submission
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    // Honeypot: hidden from people, only bots fill it. The server drops such submissions.
    const website = e.currentTarget.elements.website?.value || '';

    if (!leadForm.fullName.trim()) {
      setFormError(language === 'en' ? 'Please enter your full name' : 'Vui lòng nhập họ và tên của bạn');
      return;
    }
    if (!leadForm.phone.trim() || leadForm.phone.trim().length < 9) {
      setFormError(language === 'en' ? 'Please enter a valid phone number' : 'Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số)');
      return;
    }

    setIsSubmittingLead(true);
    try {
      await apiClient.post('/public/leads', { ...leadForm, website });
      setSubmitSuccess(true);
      toast({
        title: language === 'en' ? 'Submitted successfully' : 'Gửi yêu cầu thành công',
        description: language === 'en' ? 'Our team will contact you shortly.' : 'Đội ngũ chuyên viên StockPilot sẽ liên hệ với bạn trong thời gian sớm nhất.',
        type: 'success'
      });
      setLeadForm({
        fullName: '',
        phone: '',
        email: '',
        storeName: '',
        industry: 'Tạp hóa & Siêu thị mini',
        note: ''
      });
    } catch (err) {
      const errMsg = err?.response?.data?.error?.message || (language === 'en' ? 'An error occurred. Please try again.' : 'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại.');
      setFormError(errMsg);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] font-sans antialiased selection:bg-blue-100 selection:text-blue-900 pb-16 md:pb-0">
      


      {/* ─── 1. MAIN NAVBAR (GENEROUS H-20 80PX HEIGHT) ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Wordmark */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <StockPilotLogo iconSize={38} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-9 text-[14px] font-semibold text-[#334155]">
            <button
              onClick={() => scrollToSection('capabilities')}
              className="hover:text-[#006FFF] transition-colors cursor-pointer py-1"
            >
              {t.nav.showcase}
            </button>
            <button
              onClick={() => scrollToSection('industries')}
              className="hover:text-[#006FFF] transition-colors cursor-pointer py-1"
            >
              {t.nav.industries}
            </button>
            <button
              onClick={() => scrollToSection('hardware')}
              className="hover:text-[#006FFF] transition-colors cursor-pointer py-1"
            >
              {t.nav.hardware}
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-[#006FFF] transition-colors cursor-pointer py-1"
            >
              {t.nav.faq}
            </button>
            <button
              onClick={() => scrollToSection('consultation')}
              className="hover:text-[#006FFF] transition-colors cursor-pointer py-1"
            >
              {t.nav.contact}
            </button>
          </nav>

          {/* Desktop Actions & Language Toggle */}
          <div className="hidden sm:flex items-center gap-3.5">
            
            {/* Smooth Sliding Segmented Language Switcher VI / EN */}
            <div
              onClick={handleSmoothToggleLang}
              className="relative flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 hover:border-slate-300 cursor-pointer select-none transition-colors shadow-2xs"
              title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              role="button"
              tabIndex={0}
            >
              <div
                className={`absolute top-0.5 bottom-0.5 w-8.5 rounded-full bg-white shadow-xs border border-slate-200/80 transition-transform duration-300 ease-out ${
                  language === 'en' ? 'translate-x-8.5' : 'translate-x-0'
                }`}
              />
              <span
                className={`relative z-10 w-8.5 py-1 text-center text-xs font-bold transition-colors duration-200 ${
                  language === 'vi' ? 'text-[#006FFF]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                VI
              </span>
              <span
                className={`relative z-10 w-8.5 py-1 text-center text-xs font-bold transition-colors duration-200 ${
                  language === 'en' ? 'text-[#006FFF]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                EN
              </span>
            </div>

            {token && user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-bold text-white bg-[#006FFF] hover:bg-blue-600 rounded-full shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
              >
                {t.nav.goToApp || t.nav.toDashboard} <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-[13.5px] font-bold text-[#0F172A] hover:text-[#006FFF] transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-5.5 py-2.5 text-[13.5px] font-bold text-white bg-[#006FFF] hover:bg-blue-600 rounded-full shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  {t.nav.trial}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu & Language Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <div
              onClick={handleSmoothToggleLang}
              className="relative flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 cursor-pointer select-none"
              title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              role="button"
              tabIndex={0}
            >
              <div
                className={`absolute top-0.5 bottom-0.5 w-7 rounded-full bg-white shadow-xs border border-slate-200/80 transition-transform duration-300 ease-out ${
                  language === 'en' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
              <span
                className={`relative z-10 w-7 py-1 text-center text-[11px] font-bold transition-colors duration-200 ${
                  language === 'vi' ? 'text-[#006FFF]' : 'text-slate-400'
                }`}
              >
                VI
              </span>
              <span
                className={`relative z-10 w-7 py-1 text-center text-[11px] font-bold transition-colors duration-200 ${
                  language === 'en' ? 'text-[#006FFF]' : 'text-slate-400'
                }`}
              >
                EN
              </span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-[#006FFF] focus:outline-hidden border border-slate-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-5 pt-3 pb-6 space-y-4 shadow-xl">
            <div className="flex flex-col space-y-2 text-[15px] font-semibold text-[#0F172A]">
              <button
                onClick={() => scrollToSection('capabilities')}
                className="text-left py-2.5 border-b border-slate-100 flex items-center justify-between"
              >
                <span>{t.nav.showcase}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('industries')}
                className="text-left py-2.5 border-b border-slate-100 flex items-center justify-between"
              >
                <span>{t.nav.industries}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('hardware')}
                className="text-left py-2.5 border-b border-slate-100 flex items-center justify-between"
              >
                <span>{t.nav.hardware}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-left py-2.5 border-b border-slate-100 flex items-center justify-between"
              >
                <span>{t.nav.faq}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('consultation')}
                className="text-left py-2.5 border-b border-slate-100 flex items-center justify-between"
              >
                <span>{t.nav.contact}</span>
                <ArrowRight className="w-4 h-4 text-[#006FFF]" />
              </button>
            </div>
            
            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                to="/login"
                className="w-full text-center py-3 text-sm font-bold text-[#0F172A] border border-slate-200 rounded-xl"
              >
                {t.nav.login}
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-3 text-sm font-bold text-white bg-[#006FFF] rounded-xl shadow-md"
              >
                {t.nav.trial}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── MAIN CONTENT WRAPPER WITH SMOOTH CROSSFADE ─── */}
      <main className={`transition-opacity duration-200 ease-in-out ${isLangTransitioning ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>

      {/* ─── 2. HERO SECTION (DECISION ENGINE VALUE PROPOSITION) ─── */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden bg-linear-to-b from-[#EAF3FF] via-[#F5F9FF] to-white border-b border-slate-100">
        
        {/* Subtle dot grid & ambient accent glow */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,111,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,111,255,0.07) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 70% 30%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 70% 30%, black 20%, transparent 70%)'
          }}
        />
        <div className="absolute -top-32 -right-32 w-130 h-130 rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-40 w-105 h-105 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Authoritative SaaS Headline & Decision Engine Pitch */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-blue-200/80 text-[#006FFF] text-xs font-bold tracking-wide shadow-xs">
                <Cpu className="w-3.5 h-3.5 text-[#006FFF]" />
                <span>{t.hero.badge}</span>
              </div>

              {/* Bold 3-line Headline: Manage Inventory. Understand Sales. Make Better Decisions. */}
              <h1 className="text-3xl sm:text-5xl lg:text-[46px] font-black text-[#0A0A0A] tracking-tight leading-[1.15]">
                {language === 'en' ? (
                  <>
                    Fast POS Checkout. <br />
                    Predict Inventory. <br />
                    <span className="text-[#006FFF]">
                      Maximize Profits.
                    </span>
                  </>
                ) : (
                  <>
                    Bán hàng siêu tốc. <br />
                    Dự báo tồn kho. <br />
                    <span className="text-[#006FFF]">
                      Tối ưu lợi nhuận.
                    </span>
                  </>
                )}
              </h1>

              {/* Precise Value Proposition Description explaining Decision Engine */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.hero.desc}
              </p>

              {/* High-Converting Direct B2B SaaS Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-[#006FFF] hover:bg-blue-600 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
                >
                  <span>{t.hero.primaryCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-700 hover:text-[#006FFF] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-xs cursor-pointer hover:border-[#006FFF]/50 whitespace-nowrap"
                >
                  <span>{t.hero.secondaryCta}</span>
                </button>
              </div>

              {/* Three Pillars Checkmarks */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t.hero.check1}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t.hero.check2}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t.hero.check3}</span>
                </span>
              </div>

              {/* Trust Row — chỉ nêu những gì hệ thống thực sự làm được */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 border-t border-slate-200/70 text-[11.5px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#006FFF] shrink-0" aria-hidden />
                  {language === 'en' ? 'VietQR (PayOS) & MoMo payments' : 'Thanh toán VietQR (PayOS) & MoMo'}
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#006FFF] shrink-0" aria-hidden />
                  {language === 'en' ? 'Data isolated per store' : 'Dữ liệu tách biệt theo từng cửa hàng'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-[#006FFF] shrink-0" aria-hidden />
                  {language === 'en' ? '80mm thermal receipts' : 'In hóa đơn nhiệt 80mm'}
                </span>
              </div>

            </div>

            {/* Right Column: Hero Mockup */}
            <div className="lg:col-span-7">
              <HeroDashboardMockup language={language} />
            </div>

          </div>
        </div>
      </section>

      {/* ─── 3. SUB-HERO QUANTITATIVE STATS & ALGORITHM MARQUEE ─── */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, idx) => (
              <div key={idx} className="text-center lg:border-r last:border-r-0 border-slate-100 px-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {language === 'en' && stat.valueEn ? stat.valueEn : stat.value}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  {language === 'en' ? stat.labelEn : stat.labelVi}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-5">
              {language === 'en'
                ? 'INTEGRATED WITH POPULAR PAYMENTS & HARDWARE IN VIETNAM'
                : 'TÍCH HỢP THANH TOÁN & THIẾT BỊ PHỔ BIẾN TẠI VIỆT NAM'}
            </p>
            <div className="relative overflow-hidden mask-[linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
              <div className="sp-marquee flex w-max gap-4">
                {[...INTEGRATIONS, ...INTEGRATIONS].map((partner, idx) => (
                  <span
                    key={idx}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-400 tracking-tight whitespace-nowrap"
                  >
                    {language === 'en' ? partner.en : partner.vi}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. 3 CORE OPERATIONAL PILLARS ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((val, idx) => (
              <div
                key={idx}
                className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Clean, High-Contrast Mini UI Widget (Professional B2B SaaS) */}
                  {val.widget === 'rop' && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5 space-y-3 font-sans select-none">
                      {/* Product Header */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-blue-50 text-[#006FFF] border border-blue-200 font-mono text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                            DA-NP01
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                            {language === 'en' ? 'Neptune Oil 1L' : 'Dầu Neptune 1L'}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                          {language === 'en' ? 'Lead time: 2d' : 'Giao hàng: 2 ngày'}
                        </span>
                      </div>

                      {/* 3 Metric Columns */}
                      <div className="grid grid-cols-3 gap-2 bg-white rounded-lg p-3 border border-slate-200 text-center">
                        <div>
                          <div className="text-[11px] text-slate-500 font-medium">{language === 'en' ? 'Velocity' : 'Tốc độ bán'}</div>
                          <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">8 <span className="text-[10px] font-normal text-slate-400">{language === 'en' ? 'pcs/d' : 'chai/ngày'}</span></div>
                        </div>
                        <div className="border-x border-slate-200">
                          <div className="text-[11px] text-slate-500 font-medium">{language === 'en' ? 'Safety Stock' : 'Tồn an toàn'}</div>
                          <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">10 <span className="text-[10px] font-normal text-slate-400">{language === 'en' ? 'pcs' : 'chai'}</span></div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500 font-medium">{language === 'en' ? 'Reorder Point' : 'Ngưỡng nhập'}</div>
                          <div className="font-mono font-black text-[#006FFF] text-sm mt-0.5">26 <span className="text-[10px] font-normal text-slate-400">{language === 'en' ? 'pcs' : 'chai'}</span></div>
                        </div>
                      </div>

                      {/* Stock Level Bar */}
                      <div className="space-y-1 bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-600">{language === 'en' ? 'Current stock level:' : 'Tồn kho hiện tại:'}</span>
                          <span className="font-mono font-bold text-rose-600">3 / 26 {language === 'en' ? 'pcs' : 'chai'}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-600 rounded-full w-[12%]" />
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-xs font-bold text-rose-600 flex items-center gap-1 whitespace-nowrap">
                          {language === 'en' ? 'Low stock alert' : 'Sắp hết hàng'}
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-[#006FFF] text-white font-bold text-xs shadow-xs whitespace-nowrap">
                          {language === 'en' ? '+30 pcs Reorder' : 'Đặt nhập +30 chai'}
                        </span>
                      </div>
                    </div>
                  )}

                  {val.widget === 'risk' && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5 space-y-3 font-sans select-none">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-200/80 text-slate-700 border border-slate-300/70 font-mono text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                            {language === 'en' ? 'AUDIT' : 'KIỂM KHO'}
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                            {language === 'en' ? '48 SP Scanned' : '48 mặt hàng'}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                          {language === 'en' ? '5 Categories' : 'Phân loại tồn'}
                        </span>
                      </div>

                      {/* Multi-Segment Health Distribution Bar */}
                      <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-2">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>{language === 'en' ? 'Overall Stock Status' : 'Tình trạng toàn bộ kho'}</span>
                          <span className="font-mono font-bold text-slate-900">{language === 'en' ? '48 items' : '48 mã hàng'}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="bg-rose-600 h-full w-[8%]" title="Hết hàng" />
                          <div className="bg-amber-500 h-full w-[15%]" title="Sắp hết" />
                          <div className="bg-emerald-600 h-full w-[65%]" title="Tồn an toàn" />
                          <div className="bg-purple-600 h-full w-[12%]" title="Tồn đọng lâu ngày" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                          <div className="text-slate-600 font-medium">
                            {language === 'en' ? 'Restock needed:' : 'Cần nhập gấp:'}{' '}
                            <strong className="font-mono font-bold text-rose-600 whitespace-nowrap">
                              {language === 'en' ? '2 out • 5 low' : '2 hết • 5 sắp hết'}
                            </strong>
                          </div>
                          <div className="text-right text-slate-600 font-medium">
                            {language === 'en' ? 'Trapped capital >90d:' : 'Tồn kẹt >90 ngày:'}{' '}
                            <strong className="font-mono font-black text-slate-900 whitespace-nowrap">
                              {language === 'en' ? '42.5M ₫' : '42,5 tr'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                          {language === 'en' ? 'Recommendation:' : 'Đề xuất:'}
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-[#006FFF] text-white font-bold text-xs shadow-xs whitespace-nowrap">
                          {language === 'en' ? 'Liquidate 15%' : 'Giảm 15% xả hàng'}
                        </span>
                      </div>
                    </div>
                  )}

                  {val.widget === 'ledger' && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5 space-y-3 font-sans select-none">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-200/80 text-slate-700 border border-slate-300/70 font-mono text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                            {language === 'en' ? 'AUDIT' : 'LỊCH SỬ'}
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                            {language === 'en' ? 'Stock Log' : 'Lưu vết kho'}
                          </span>
                        </div>
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shrink-0 whitespace-nowrap">
                          {language === 'en' ? '100% Match' : 'Khớp 100%'}
                        </span>
                      </div>

                      {/* Live Transaction Ledger Rows */}
                      <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-500 text-[11px]">TX-8921</span>
                            <span className="font-semibold text-slate-900">{language === 'en' ? 'Retail sale #1042' : 'Bán lẻ #1042'}</span>
                          </div>
                          <div className="font-mono font-bold text-rose-600">
                            -2 <span className="text-slate-400 font-normal text-[11px]">(18 → 16)</span>
                          </div>
                        </div>
                        <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-500 text-[11px]">TX-8922</span>
                            <span className="font-semibold text-slate-900">{language === 'en' ? 'Stock import Metro' : 'Nhập hàng Metro'}</span>
                          </div>
                          <div className="font-mono font-bold text-emerald-600">
                            +50 <span className="text-slate-400 font-normal text-[11px]">(16 → 66)</span>
                          </div>
                        </div>
                      </div>

                      {/* Margin Defense Price Floor */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="text-xs whitespace-nowrap">
                          <span className="text-slate-500 font-medium">{language === 'en' ? 'Floor: ' : 'Giá sàn: '}</span>
                          <span className="font-mono font-black text-[#006FFF] text-sm">48.000 đ</span>
                        </div>
                        <span className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs whitespace-nowrap">
                          {language === 'en' ? 'Floor Locked' : 'Chặn bán lỗ'}
                        </span>
                      </div>
                    </div>
                  )}

                  <h3 className="font-black text-slate-900 text-lg group-hover:text-[#006FFF] transition-colors leading-snug">
                    {language === 'en' ? val.titleEn : val.titleVi}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                    {language === 'en' ? val.descEn : val.descVi}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. NEW DEDICATED SECTION: HOW DECISION ENGINE WORKS (4 CRUCIAL PROBLEMS SOLVED) ─── */}
      <section id="how-it-works" className="py-18 bg-[#F8FAFC] border-y border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <SectionBadge>{t.howItWorks.tag}</SectionBadge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t.howItWorks.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {t.howItWorks.desc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {HOW_IT_WORKS_CARDS.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-[#006FFF]/50 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Unified Corporate Badge & Monospace Case Number */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11.5px] font-bold px-3 py-1 rounded-lg bg-blue-50/80 text-[#006FFF] border border-blue-200/70 tracking-wide flex items-center gap-1.5">
                        <IconComp className="w-3.5 h-3.5 text-[#006FFF]" />
                        <span>{language === 'en' ? card.badgeEn : card.badgeVi}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-400 tracking-wider">
                        {language === 'en' ? `CASE #${card.step}` : `BÀI TOÁN ${card.step}`}
                      </span>
                    </div>

                    {/* Question Header: Typography-focused design, no childish emojis */}
                    <div className="flex items-start gap-3 mt-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        Q{card.step}
                      </span>
                      <h3 className="text-base sm:text-[17px] font-black text-slate-900 leading-snug">
                        {language === 'en' ? card.problemEn : card.problemVi}
                      </h3>
                    </div>

                    {/* Decision Engine Algorithmic Solution */}
                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#006FFF] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-blue-50 border border-blue-200/80 text-[#006FFF] flex items-center justify-center shrink-0">
                          <IconComp className="w-3 h-3" />
                        </span>
                        <span>{language === 'en' ? 'Decision Engine Solution:' : 'Giải pháp từ Decision Engine:'}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6.5">
                        {language === 'en' ? card.solutionEn : card.solutionVi}
                      </p>
                    </div>
                  </div>

                  {/* Clean Status Footer */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#006FFF]" />
                      {language === 'en' ? 'Automated in background' : 'Tự động tính toán ngầm'}
                    </span>
                    <span className="text-slate-400 font-mono">{language === 'en' ? 'Zero manual calculation' : 'Không cần bấm máy tính tay'}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── 6. DEMO TÍNH NĂNG THEO CUỘN (khách cuộn tới đâu, demo tính năng tới đó) ─── */}
      <FeatureScrollShowcase language={language} />

      {/* ─── 7. GIẢI PHÁP THEO NGÀNH HÀNG (4 CARDS WITH SVGS & GRADIENT OVERLAYS) ─── */}
      <section id="industries" className="py-16 lg:py-20 bg-[#F8FAFC] border-y border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <SectionBadge>{t.industries.tag}</SectionBadge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              {t.industries.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              {t.industries.desc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {INDUSTRIES.map((ind, idx) => {
              const IconComp = ind.icon;
              return (
                <Link
                  key={idx}
                  to="/register"
                  className="group relative h-95 rounded-3xl overflow-hidden shadow-xs hover:shadow-2xl hover:shadow-slate-900/15 transition-all duration-300"
                >
                  <img
                    src={ind.image}
                    alt={language === 'en' ? ind.titleEn : ind.titleVi}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#0B1B3A] via-[#0B1B3A]/55 to-transparent" />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                    <IconComp className="w-3.5 h-3.5 text-[#006FFF]" />
                    {language === 'en' ? ind.badgeEn : ind.badgeVi}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <h3 className="font-black text-lg leading-tight">
                      {language === 'en' ? ind.titleEn : ind.titleVi}
                    </h3>
                    <p className="text-xs text-slate-200 leading-relaxed mt-2 line-clamp-3">
                      {language === 'en' ? ind.descEn : ind.descVi}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white bg-white/15 group-hover:bg-[#006FFF] backdrop-blur-xs px-3 py-1.5 rounded-full transition-colors">
                      {language === 'en' ? 'Explore Solution' : 'Khám phá giải pháp'}{' '}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 8. HỆ SINH THÁI THIẾT BỊ PHẦN CỨNG ─── */}
      <section id="hardware" className="py-16 lg:py-20 bg-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10 bg-white border border-slate-200">
                <img
                  src="/pos-hardware-3d.png"
                  alt="Hệ sinh thái thiết bị phần cứng StockPilot"
                  className="w-full h-88 object-cover"
                  loading="lazy"
                />
                <div className="p-4 bg-white border-t border-slate-200">
                  <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {t.hardware.tag}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {language === 'en'
                      ? 'Touch POS terminals, barcode scanners, thermal receipt printers, and automatic cash drawers.'
                      : 'Máy POS cảm ứng, đầu đọc mã vạch, máy in hóa đơn nhiệt và ngăn kéo đựng tiền.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <SectionBadge>{t.hardware.tag}</SectionBadge>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t.hardware.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t.hardware.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {HARDWARE_ITEMS.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#006FFF] flex items-center justify-center mb-3 group-hover:bg-[#006FFF] group-hover:text-white transition-colors">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {language === 'en' ? item.titleEn : item.titleVi}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {language === 'en' ? item.descEn : item.descVi}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 9. CÂU CHUYỆN KHÁCH HÀNG ─── */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <SectionBadge>{t.testimonials.tag}</SectionBadge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              {t.testimonials.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {USE_CASES.map((useCase) => {
              const UseCaseIcon = useCase.icon;
              return (
                <article
                  key={useCase.industryVi}
                  className="bg-white rounded-3xl p-7 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#006FFF] flex items-center justify-center">
                      <UseCaseIcon className="w-5 h-5" aria-hidden />
                    </span>
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{t.testimonials.note}</span>
                  </div>
                  <h3 className="mt-5 text-base font-black text-slate-900">
                    {language === 'en' ? useCase.industryEn : useCase.industryVi}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">
                    {language === 'en' ? useCase.scenarioEn : useCase.scenarioVi}
                  </p>
                  <span className="mt-5 self-start text-[11px] font-bold text-[#006FFF] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                    {language === 'en' ? useCase.featureEn : useCase.featureVi}
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 10. CÂU HỎI THƯỜNG GẶP FAQ (TIÊU ĐIỂM DECISION ENGINE) ─── */}
      <section id="faq" className="py-16 lg:py-20 bg-white border-t border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-4 space-y-4">
            <SectionBadge>{t.faq.tag}</SectionBadge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t.faq.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t.faq.desc}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href="tel:0908123456"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-[#006FFF] transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#006FFF] flex items-center justify-center border border-blue-100">
                  <Phone className="w-4 h-4" />
                </span>
                <span>0908 123 456</span>
              </a>
              <a
                href="mailto:support@stockpilot.vn"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-[#006FFF] transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#006FFF] flex items-center justify-center border border-blue-100">
                  <Mail className="w-4 h-4" />
                </span>
                <span>support@stockpilot.vn</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-3">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border overflow-hidden transition-colors ${
                    isOpen ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 cursor-pointer"
                  >
                    <span>{language === 'en' ? faq.qEn : faq.qVi}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ml-3 ${
                        isOpen ? 'rotate-180 text-[#006FFF]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100/80 pt-3">
                      {language === 'en' ? faq.aEn : faq.aVi}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── 11. ĐĂNG KÝ TƯ VẤN 1-1 (CONSULTATION FORM) ─── */}
      <section id="consultation" ref={consultationRef} className="py-16 lg:py-20 bg-[#F8FAFC] border-t border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-900/5">
            
            {/* Left Cover Banner with Consultant Graphic */}
            <div className="relative min-h-72 lg:min-h-full">
              <img
                src="/consultant.svg"
                alt="Chuyên viên tư vấn StockPilot"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0B1B3A] via-[#0B1B3A]/60 to-[#0B1B3A]/10" />
              <div className="relative h-full flex flex-col justify-end p-7 sm:p-10 text-white space-y-4">
                <span className="self-start bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                  {t.consultation.tag}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                  {t.consultation.title}
                </h2>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t.consultation.perk1}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t.consultation.perk2}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t.consultation.perk3}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Consultation Lead Form */}
            <div className="p-7 sm:p-10">
              {submitSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{t.consultation.successTitle}</h3>
                  <p className="text-sm text-slate-600 max-w-sm">
                    {t.consultation.successDesc}
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-4 text-sm font-bold text-[#006FFF] hover:underline cursor-pointer"
                  >
                    {t.consultation.sendAnother}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4" noValidate>
                  <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                    <label>
                      Website
                      <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{t.consultation.formTitle}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t.consultation.formDesc}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">{t.consultation.nameLabel}</span>
                      <input
                        type="text"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006FFF] focus:ring-2 focus:ring-blue-100"
                        value={leadForm.fullName}
                        onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                        placeholder={language === 'en' ? 'John Doe' : 'Nguyễn Văn A'}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">{t.consultation.phoneLabel}</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006FFF] focus:ring-2 focus:ring-blue-100"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        placeholder={language === 'en' ? '+84 908 xxx xxx' : '0908 xxx xxx'}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">{t.consultation.emailLabel}</span>
                      <input
                        type="email"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006FFF] focus:ring-2 focus:ring-blue-100"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        placeholder={language === 'en' ? 'you@yourstore.com' : 'ban@cuahang.vn'}
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">{t.consultation.storeLabel}</span>
                      <input
                        type="text"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006FFF] focus:ring-2 focus:ring-blue-100"
                        value={leadForm.storeName}
                        onChange={(e) => setLeadForm({ ...leadForm, storeName: e.target.value })}
                        placeholder={language === 'en' ? 'Minimart Express' : 'Tạp hóa Minh Anh'}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">{t.consultation.industryLabel}</span>
                    <select
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-hidden focus:border-[#006FFF] focus:ring-2 focus:ring-blue-100 cursor-pointer"
                      value={leadForm.industry}
                      onChange={(e) => setLeadForm({ ...leadForm, industry: e.target.value })}
                    >
                      {CONSULT_INDUSTRIES.map((ind) => (
                        <option key={ind.vi} value={ind.vi}>
                          {language === 'en' ? ind.en : ind.vi}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">{t.consultation.noteLabel}</span>
                    <textarea
                      rows={3}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006FFF] focus:ring-2 focus:ring-blue-100 resize-none"
                      value={leadForm.note}
                      onChange={(e) => setLeadForm({ ...leadForm, note: e.target.value })}
                      placeholder={t.consultation.notePlaceholder}
                    />
                  </label>

                  {formError && (
                    <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="w-full py-3 bg-[#006FFF] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingLead ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t.consultation.submitBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ─── 12. BANNER KÊU GỌI HÀNH ĐỘNG ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 bg-linear-to-r from-[#006FFF]/95 via-blue-600/90 to-[#1D4ED8]/80 text-white p-8 sm:p-14 text-center space-y-4">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <span className="inline-block bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {t.banner.tag}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {t.banner.title}
            </h2>
            <p className="text-sm sm:text-base text-blue-100 max-w-lg mx-auto leading-relaxed">
              {t.banner.desc}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-black text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>{t.banner.primaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('consultation')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base rounded-xl transition-all border border-white/25 cursor-pointer backdrop-blur-xs"
              >
                <span>{t.banner.secondaryCta}</span>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-blue-100">
              <span>✓ {t.banner.perk1}</span>
              <span>✓ {t.banner.perk2}</span>
              <button
                onClick={() => scrollToSection('consultation')}
                className="underline underline-offset-2 hover:text-white cursor-pointer"
              >
                {t.banner.perk3}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 13. FOOTER CHUYÊN NGHIỆP ─── */}
      <footer className="bg-[#0B1B3A] text-slate-400 text-xs py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
            
            {/* Brand Column */}
            <div className="md:col-span-4 space-y-3.5">
              <StockPilotLogo theme="dark" iconSize={38} />
              <p className="text-slate-300 text-xs leading-relaxed max-w-sm mt-2">
                {t.footer.desc}
              </p>
              <div className="pt-1 text-[11px] text-slate-400 space-y-1">
                <p>
                  {t.footer.hotline}{' '}
                  <strong className="text-white font-mono font-bold">0908 123 456</strong>
                </p>
                <p>
                  {t.footer.email}{' '}
                  <strong className="text-white font-bold">support@stockpilot.vn</strong>
                </p>
                <p>{t.footer.hours}</p>
              </div>
            </div>

            {/* Links Column 1: Giải pháp */}
            <div className="md:col-span-3 space-y-2.5">
              <p className="font-bold text-white text-xs uppercase tracking-wider">{t.footer.solutions}</p>
              <ul className="space-y-2 text-xs">
                {INDUSTRIES.map((ind, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => scrollToSection('industries')}
                      className="hover:text-white transition-colors cursor-pointer text-left"
                    >
                      {language === 'en' ? ind.titleEn : ind.titleVi}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Links Column 2: Hệ thống cốt lõi */}
            <div className="md:col-span-2 space-y-2.5">
              <p className="font-bold text-white text-xs uppercase tracking-wider">{t.footer.features}</p>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => scrollToSection('decision-engine')}
                    className="hover:text-white transition-colors cursor-pointer text-[#38BDF8] font-bold"
                  >
                    StockPilot Decision Engine
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'How It Works' : 'Cơ chế hoạt động'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('capabilities')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Inventory Ledger' : 'Kiểm soát kho & SKU'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('pos-features')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Cashier POS' : 'Quầy thu ngân POS'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('capabilities')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Revenue Analytics' : 'Báo cáo doanh thu & COGS'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Links Column 3: Tài khoản & Bảng giá */}
            <div className="md:col-span-3 space-y-2.5">
              <p className="font-bold text-white text-xs uppercase tracking-wider">{t.footer.account}</p>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'FAQ' : 'Câu hỏi thường gặp FAQ'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('consultation')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Request 1-1 Consultation' : 'Đăng ký tư vấn 1-1'}
                  </button>
                </li>
                <li className="pt-2">
                  <Link to="/login" className="text-[#38BDF8] hover:underline font-bold">
                    {t.footer.signIn}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-emerald-400 hover:underline font-bold">
                    {t.footer.startFree}
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <p>{t.footer.copyright}</p>
            <div className="flex items-center gap-5">
              <a href="/dieu-khoan/dieu-khoan-su-dung" className="hover:text-slate-300">{t.footer.terms}</a>
              <a href="/dieu-khoan/chinh-sach-bao-mat" className="hover:text-slate-300">{t.footer.privacy}</a>
              <a href="/dieu-khoan/giai-quyet-khieu-nai" className="hover:text-slate-300">{t.footer.operation}</a>
            </div>
          </div>
        </div>
      </footer>
      </main>

      {/* ─── 14. STICKY MOBILE CONVERSION BOTTOM BAR ─── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 z-40 flex items-center gap-2 shadow-lg">
        <a
          href="tel:0908123456"
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-blue-600" />
          <span>{language === 'en' ? 'Call Support' : 'Gọi tư vấn'}</span>
        </a>
        <Link
          to="/register"
          className="flex-1 py-2.5 bg-[#006FFF] hover:bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all text-center"
        >
          <span>{language === 'en' ? 'Try It Now' : 'Dùng thử ngay'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}

export default LandingPage;
