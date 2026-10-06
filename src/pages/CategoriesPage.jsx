import { useState, useMemo } from 'react';
import { useProductStore, CATEGORIES } from '../components/store/productStore';
import {
  Package, Tag, TrendingUp, TrendingDown, AlertCircle,
  Search, ChevronRight, BarChart2, ShoppingBag, Star,
  Grid, List, ArrowUp, ArrowDown, Boxes, Flame, Zap
} from 'lucide-react';

const COLOR_MAPS = {
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',  icon: 'text-amber-500',  gradient: 'from-amber-400 to-orange-500',  ring: 'ring-amber-200' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',    icon: 'text-blue-500',   gradient: 'from-blue-400 to-cyan-500',     ring: 'ring-blue-200' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700',icon: 'text-orange-500', gradient: 'from-orange-400 to-red-500',    ring: 'ring-orange-200' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700',icon: 'text-indigo-500', gradient: 'from-indigo-400 to-purple-500', ring: 'ring-indigo-200' },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200',   text: 'text-pink-700',   badge: 'bg-pink-100 text-pink-700',    icon: 'text-pink-500',   gradient: 'from-pink-400 to-rose-500',     ring: 'ring-pink-200' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-700',badge: 'bg-emerald-100 text-emerald-700',icon:'text-emerald-500',gradient: 'from-emerald-400 to-teal-500',  ring: 'ring-emerald-200' },
  cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-200',   text: 'text-cyan-700',   badge: 'bg-cyan-100 text-cyan-700',    icon: 'text-cyan-500',   gradient: 'from-cyan-400 to-sky-500',      ring: 'ring-cyan-200' },
  slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',  text: 'text-slate-700',  badge: 'bg-slate-100 text-slate-700',  icon: 'text-slate-500',  gradient: 'from-slate-400 to-gray-500',    ring: 'ring-slate-200' },
};

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const c = COLOR_MAPS[color] || COLOR_MAPS.blue;
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4 flex items-center gap-4 shadow-sm`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CategoryCard({ cat, stats, isSelected, onClick }) {
  const c = COLOR_MAPS[cat.color] || COLOR_MAPS.slate;
  const { count, totalStock, lowStock, revenue } = stats;
  const pct = Math.round((count / Math.max(stats.total, 1)) * 100);

  return (
    <button
      onClick={onClick}
      className={`
        group w-full text-left rounded-2xl border-2 transition-all duration-200 p-5
        hover:shadow-lg hover:-translate-y-0.5 cursor-pointer
        ${isSelected
          ? `${c.border} ${c.bg} shadow-md ring-2 ${c.ring}`
          : 'border-gray-100 bg-white hover:border-gray-200'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-md text-2xl`}>
          {cat.icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.badge}`}>
          {count} SP
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 group-hover:text-gray-900">
        {cat.label}
      </h3>

      {/* Progress bar */}
      <div className="mt-3 mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Tỷ lệ</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${c.gradient} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-white/60 rounded-xl p-2 border border-gray-100">
          <p className="text-xs text-gray-400">Tồn kho</p>
          <p className="text-sm font-bold text-gray-700">{totalStock.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-2 border ${lowStock > 0 ? 'bg-red-50 border-red-100' : 'bg-white/60 border-gray-100'}`}>
          <p className={`text-xs ${lowStock > 0 ? 'text-red-400' : 'text-gray-400'}`}>Sắp hết</p>
          <p className={`text-sm font-bold ${lowStock > 0 ? 'text-red-600' : 'text-gray-700'}`}>{lowStock}</p>
        </div>
      </div>

      {/* Revenue */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">Giá trị tồn</span>
        <span className={`text-xs font-bold ${c.text}`}>
          {(revenue / 1_000_000).toFixed(1)}M ₫
        </span>
      </div>
    </button>
  );
}

function ProductRow({ product, index }) {
  const catObj = CATEGORIES.find(c => c.value === product.category);
  const c = COLOR_MAPS[catObj?.color] || COLOR_MAPS.slate;
  const isLow = product.stock <= product.alertThreshold;
  const isOut = product.stock === 0;
  const margin = product.costPrice > 0
    ? Math.round(((product.salePrice - product.costPrice) / product.salePrice) * 100)
    : 0;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-150 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
      {/* Rank */}
      <div className="w-6 text-center text-xs font-bold text-gray-400 flex-shrink-0">{index + 1}</div>

      {/* Image */}
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
        onError={e => { e.target.src = 'https://via.placeholder.com/40x40?text=SP'; }}
      />

      {/* Name & SKU */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
        <p className="text-xs text-gray-400">{product.sku}</p>
      </div>

      {/* Category badge */}
      <span className={`hidden sm:inline-flex text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${c.badge}`}>
        {catObj?.icon} {catObj?.label?.split(' ')[0]}
      </span>

      {/* Stock */}
      <div className="text-right flex-shrink-0 w-20">
        <p className={`text-sm font-bold ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-gray-700'}`}>
          {product.stock.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">{product.unit}</p>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0 w-24 hidden md:block">
        <p className="text-sm font-bold text-gray-800">{product.salePrice.toLocaleString()}₫</p>
        <p className="text-xs text-emerald-600">+{margin}%</p>
      </div>

      {/* Status pill */}
      <div className="flex-shrink-0">
        {isOut ? (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">Hết</span>
        ) : isLow ? (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-600">Thấp</span>
        ) : (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-600">OK</span>
        )}
      </div>
    </div>
  );
}

export function CategoriesPage() {
  const { products, fetchProducts } = useProductStore();
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('count'); // count | stock | revenue
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchProducts();
  }, []);

  // Compute stats per category
  const catStats = useMemo(() => {
    const total = products.length;
    return CATEGORIES.map(cat => {
      const items = products.filter(
        p => p.category === cat.value || p.category === cat.id || p.categoryLabel?.toLowerCase() === cat.label?.toLowerCase()
      );
      const totalStock = items.reduce((s, p) => s + (p.stock || 0), 0);
      const lowStock = items.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.alertThreshold || 10)).length;
      const outOfStock = items.filter(p => (p.stock || 0) === 0).length;
      const revenue = items.reduce((s, p) => s + (p.salePrice || 0) * (p.stock || 0), 0);
      return {
        ...cat,
        count: items.length,
        totalStock,
        lowStock,
        outOfStock,
        revenue,
        total,
        items,
      };
    });
  }, [products]);

  // Sort categories
  const sortedStats = useMemo(() => {
    return [...catStats].sort((a, b) => {
      let va = a[sortBy === 'count' ? 'count' : sortBy === 'stock' ? 'totalStock' : 'revenue'];
      let vb = b[sortBy === 'count' ? 'count' : sortBy === 'stock' ? 'totalStock' : 'revenue'];
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [catStats, sortBy, sortDir]);

  // Overall stats
  const totalProducts = products.length;
  const totalCategories = CATEGORIES.filter(c => catStats.find(s => s.value === c.value && s.count > 0)).length;
  const totalLowStock = products.filter(p => p.stock > 0 && p.stock <= p.alertThreshold).length;
  const totalOutOfStock = products.filter(p => p.stock === 0).length;

  // Filtered products list for selected category
  const currentCatStats = selectedCat
    ? catStats.find(s => s.value === selectedCat)
    : null;

  const displayedProducts = useMemo(() => {
    const source = currentCatStats ? currentCatStats.items : products;
    if (!search) return source;
    const q = search.toLowerCase();
    return source.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.categoryLabel?.toLowerCase().includes(q)
    );
  }, [currentCatStats, products, search]);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-6">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <span>Trang chủ</span>
          <ChevronRight size={14} />
          <span className="text-blue-600 font-semibold">Danh mục</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">📦 Quản lý Danh mục</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tổng quan các nhóm sản phẩm trong kho</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Search size={15} className="text-gray-400" />
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm outline-none bg-transparent w-44 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Tag}         label="Danh mục"        value={totalCategories}  sub={`/ ${CATEGORIES.length} nhóm`}    color="blue" />
        <StatCard icon={Boxes}       label="Tổng sản phẩm"  value={totalProducts}    sub="mặt hàng quản lý"                 color="indigo" />
        <StatCard icon={AlertCircle} label="Sắp hết hàng"   value={totalLowStock}    sub="cần nhập thêm"                    color="orange" />
        <StatCard icon={Flame}       label="Hết hàng"        value={totalOutOfStock}  sub="cần xử lý ngay"                   color="pink" />
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Sắp xếp theo:</span>
        {[
          { key: 'count',   label: 'Số SP', icon: Package },
          { key: 'stock',   label: 'Tồn kho', icon: Boxes },
          { key: 'revenue', label: 'Giá trị', icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => toggleSort(key)}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
              ${sortBy === key
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
          >
            <Icon size={12} />
            {label}
            {sortBy === key && (sortDir === 'desc' ? <ArrowDown size={10} /> : <ArrowUp size={10} />)}
          </button>
        ))}
        {selectedCat && (
          <button
            onClick={() => setSelectedCat(null)}
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
          >
            ✕ Bỏ lọc
          </button>
        )}
      </div>

      {/* Main layout: categories grid + product list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category cards - 2/3 on desktop, full on mobile */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
            {sortedStats.map(cat => (
              <CategoryCard
                key={cat.value}
                cat={cat}
                stats={cat}
                isSelected={selectedCat === cat.value}
                onClick={() => setSelectedCat(prev => prev === cat.value ? null : cat.value)}
              />
            ))}
          </div>

          {/* Category comparison bar chart */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={18} className="text-blue-500" />
              <h3 className="font-bold text-gray-800">So sánh danh mục</h3>
              <span className="text-xs text-gray-400 ml-auto">Theo số lượng sản phẩm</span>
            </div>
            <div className="space-y-3">
              {sortedStats.map(cat => {
                const c = COLOR_MAPS[cat.color] || COLOR_MAPS.slate;
                const maxCount = Math.max(...catStats.map(s => s.count), 1);
                const pct = Math.round((cat.count / maxCount) * 100);
                return (
                  <div key={cat.value} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center flex-shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium truncate">{cat.label}</span>
                        <span className={`font-bold ${c.text} flex-shrink-0 ml-2`}>{cat.count} SP</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${c.gradient} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Product list panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-white/80" />
              <h3 className="font-bold text-white text-sm">
                {currentCatStats
                  ? `${currentCatStats.icon} ${currentCatStats.label}`
                  : '📋 Tất cả sản phẩm'}
              </h3>
              <span className="ml-auto text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                {displayedProducts.length}
              </span>
            </div>
            {currentCatStats && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-white/70 text-xs">Sản phẩm</p>
                  <p className="text-white font-bold text-sm">{currentCatStats.count}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-white/70 text-xs">Tồn kho</p>
                  <p className="text-white font-bold text-sm">{currentCatStats.totalStock.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-white/70 text-xs">Giá trị</p>
                  <p className="text-white font-bold text-sm">{(currentCatStats.revenue / 1_000_000).toFixed(1)}M</p>
                </div>
              </div>
            )}
          </div>

          {/* Alert rows */}
          {currentCatStats && currentCatStats.lowStock > 0 && (
            <div className="mx-3 mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="text-orange-500 flex-shrink-0" />
              <p className="text-xs text-orange-700 font-medium">
                {currentCatStats.lowStock} sản phẩm sắp hết hàng cần nhập thêm
              </p>
            </div>
          )}
          {currentCatStats && currentCatStats.outOfStock > 0 && (
            <div className="mx-3 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <Flame size={15} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">
                {currentCatStats.outOfStock} sản phẩm đã hết hàng
              </p>
            </div>
          )}

          {/* Product list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[520px]">
            {displayedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm font-semibold text-gray-500">Không có sản phẩm</p>
                <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
              </div>
            ) : (
              displayedProducts.map((p, i) => (
                <ProductRow key={p.id} product={p} index={i} />
              ))
            )}
          </div>

          {/* Panel footer */}
          {!currentCatStats && (
            <div className="p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <p className="text-xs text-center text-gray-400">
                👆 Chọn danh mục để xem chi tiết sản phẩm
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top performing categories */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top by count */}
        {['count', 'revenue', 'totalStock'].map((metric, mi) => {
          const titles = ['🏆 Nhiều SP nhất', '💰 Giá trị cao nhất', '📦 Tồn kho nhiều nhất'];
          const subs   = ['sản phẩm', 'triệu ₫', 'đơn vị'];
          const top3 = [...catStats].sort((a, b) => b[metric] - a[metric]).slice(0, 3);
          return (
            <div key={metric} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h4 className="font-bold text-gray-800 text-sm mb-3">{titles[mi]}</h4>
              <div className="space-y-2">
                {top3.map((cat, i) => {
                  const c = COLOR_MAPS[cat.color] || COLOR_MAPS.slate;
                  const medals = ['🥇', '🥈', '🥉'];
                  const val = metric === 'revenue'
                    ? `${(cat[metric] / 1_000_000).toFixed(1)}M ${subs[mi]}`
                    : `${cat[metric].toLocaleString()} ${subs[mi]}`;
                  return (
                    <div key={cat.value} className="flex items-center gap-3">
                      <span className="text-lg">{medals[i]}</span>
                      <span className="text-lg">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{cat.label}</p>
                        <p className={`text-xs font-bold ${c.text}`}>{val}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
