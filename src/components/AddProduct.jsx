import React, { useState, useRef } from "react";
import {
  Package, Upload, X, ChevronDown, AlertTriangle,
  DollarSign, BarChart2, Truck, Calendar,
  FileText, Info, CheckCircle2, ArrowLeft, Save,
  Camera, Hash, Layers, TrendingUp, ShoppingBag, Plus
} from "lucide-react";
import { useProductStore, CATEGORIES, UNITS } from "./store/productStore";

const initialForm = {
  name: "",
  sku: "",
  category: "",
  unit: "Cái",
  costPrice: "",
  salePrice: "",
  stock: "",
  alertThreshold: "5",
  supplier: "",
  expiryDate: "",
  barcode: "",
  description: "",
  status: "active",
  hasExpiry: false,
};

function formatVND(val) {
  if (!val) return "";
  return Number(String(val).replace(/\D/g, "")).toLocaleString("vi-VN");
}

function parseNum(val) {
  return String(val).replace(/\D/g, "");
}

function calcMargin(cost, sale) {
  const c = parseFloat(String(cost).replace(/\./g, "").replace(",", "."));
  const s = parseFloat(String(sale).replace(/\./g, "").replace(",", "."));
  if (!c || !s || s === 0) return null;
  return (((s - c) / s) * 100).toFixed(1);
}

export function AddProduct({ onBack }) {
  const { addProduct } = useProductStore();

  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDragging, setImageDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);
  const fileInputRef = useRef(null);

  const generateSku = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ").slice(0, 3);
    const initials = words.map((w) => w[0]?.toUpperCase() || "").join("");
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${initials}-${num}`;
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !prev.sku) {
        updated.sku = generateSku(value);
      }
      return updated;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handlePriceChange = (field, raw) => {
    const digits = parseNum(raw);
    setForm((prev) => ({ ...prev, [field]: digits }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setImageDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageFile(file);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập tên sản phẩm";
    if (!form.category) errs.category = "Vui lòng chọn danh mục";
    if (!form.costPrice) errs.costPrice = "Vui lòng nhập giá nhập";
    if (!form.salePrice) errs.salePrice = "Vui lòng nhập giá bán";
    if (form.costPrice && form.salePrice && parseInt(form.salePrice) < parseInt(form.costPrice)) {
      errs.salePrice = "Giá bán không được thấp hơn giá nhập";
    }
    if (!form.stock) errs.stock = "Vui lòng nhập số lượng tồn kho";
    return errs;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const defaultImg = "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&h=300&fit=crop";
      const item = await addProduct({
        ...form,
        imageUrl: imagePreview || defaultImg,
      });

      setCreatedProduct(item);
      setSubmitted(true);
    } catch (err) {
      setErrors({ form: err?.message || 'Lỗi khi tạo sản phẩm' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const margin = calcMargin(form.costPrice, form.salePrice);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Thêm sản phẩm thành công!</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Sản phẩm <span className="font-bold text-blue-700">{form.name}</span> đã được lưu vào kho hàng và sẵn sàng kinh doanh.
        </p>

        {imagePreview && (
          <img
            src={imagePreview}
            alt={form.name}
            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-xs mt-2"
          />
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {onBack && (
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách sản phẩm
            </button>
          )}
          <button
            onClick={() => {
              setForm(initialForm);
              setImagePreview(null);
              setSubmitted(false);
              setErrors({});
            }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Thêm sản phẩm khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans antialiased text-slate-800">
      {/* Top action header */}
      <div className="flex items-center justify-between bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-slate-200"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" /> Thêm sản phẩm mới
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Điền đầy đủ thông tin để thêm sản phẩm vào hệ thống kho hàng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
          )}
          <button
            form="add-product-form"
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Lưu sản phẩm
          </button>
        </div>
      </div>

      <form id="add-product-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* CỘT TRÁI (2/3): Thông tin sản phẩm */}
          <div className="lg:col-span-2 space-y-5">
            {/* THÔNG TIN CƠ BẢN */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Thông tin cơ bản</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên sản phẩm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mì tôm Hảo Hảo tôm chua cay, Nước ngọt Coca-Cola..."
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                    errors.name ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                  } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Danh mục hàng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                      errors.category ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                    } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer`}
                  >
                    <option value="">-- Chọn danh mục (8 nhóm hàng) --</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị tính</label>
                  <select
                    value={form.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Mã SKU</label>
                    <span className="text-[11px] text-slate-400">Tự sinh theo tên</span>
                  </div>
                  <input
                    type="text"
                    placeholder="VD: HAO-3012"
                    value={form.sku}
                    onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã vạch (Barcode)</label>
                  <input
                    type="text"
                    placeholder="Quét hoặc nhập mã vạch..."
                    value={form.barcode}
                    onChange={(e) => handleChange("barcode", e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú thêm về quy cách đóng gói, xuất xứ, vị trí để hàng..."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* GIÁ CẢ & BIÊN LỢI NHUẬN */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Giá cả & Biên lợi nhuận</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá vốn nhập kho (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0"
                      value={formatVND(form.costPrice)}
                      onChange={(e) => handlePriceChange("costPrice", e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 text-sm font-semibold rounded-xl border ${
                        errors.costPrice ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                      } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                  </div>
                  {errors.costPrice && <p className="text-xs text-rose-500 mt-1">{errors.costPrice}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá bán lẻ đề xuất (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0"
                      value={formatVND(form.salePrice)}
                      onChange={(e) => handlePriceChange("salePrice", e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 text-sm font-semibold rounded-xl border ${
                        errors.salePrice ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                      } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600">đ</span>
                  </div>
                  {errors.salePrice && <p className="text-xs text-rose-500 mt-1">{errors.salePrice}</p>}
                </div>
              </div>

              {/* Box hiển thị lợi nhuận tính tự động */}
              {margin !== null && (
                <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                  Number(margin) >= 25
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : Number(margin) >= 15
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-bold">Biên lợi nhuận gộp: </span>
                      <span className="font-extrabold text-sm">+{margin}%</span>
                      <span className="text-[11px] block text-slate-500 mt-0.5">
                        Lãi {(parseInt(form.salePrice) - parseInt(form.costPrice)).toLocaleString("vi-VN")} đ trên mỗi {form.unit}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    Number(margin) >= 25 ? "bg-emerald-200/80 text-emerald-900" : "bg-amber-200/80 text-amber-900"
                  }`}>
                    {Number(margin) >= 25 ? "Tỷ suất tốt" : "Biên độ thấp"}
                  </span>
                </div>
              )}
            </div>

            {/* QUẢN LÝ TỒN KHO & CẢNH BÁO */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Layers className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Tồn kho & Ngưỡng an toàn</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số lượng nhập kho ban đầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border ${
                      errors.stock ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                    } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                  />
                  {errors.stock && <p className="text-xs text-rose-500 mt-1">{errors.stock}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngưỡng cảnh báo sắp hết hàng
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={form.alertThreshold}
                    onChange={(e) => handleChange("alertThreshold", e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Khi tồn kho nhỏ hơn mức này hệ thống sẽ cảnh báo</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nhà cung cấp / Nguồn hàng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đại lý bánh kẹo, Unilever, Thiên Long..."
                  value={form.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Hạn sử dụng */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-700">Sản phẩm có hạn sử dụng?</span>
                    <p className="text-[11px] text-slate-400">Áp dụng cho thực phẩm, đồ uống, mỹ phẩm...</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasExpiry}
                      onChange={(e) => handleChange("hasExpiry", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {form.hasExpiry && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày hết hạn</label>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => handleChange("expiryDate", e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (1/3): Ảnh và Trạng thái */}
          <div className="space-y-5">
            {/* HÌNH ẢNH SẢN PHẨM */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Camera className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Ảnh sản phẩm</h2>
              </div>

              {imagePreview ? (
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-lg shadow-sm"
                    >
                      Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setImageDragging(true); }}
                  onDragLeave={() => setImageDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer aspect-square flex flex-col items-center justify-center gap-2.5 ${
                    imageDragging
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-600 hover:underline">Tải ảnh lên</span>
                    <span className="text-xs text-slate-500"> hoặc kéo thả</span>
                  </div>
                  <p className="text-[11px] text-slate-400">PNG, JPG, WEBP tối đa 5MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageFile(e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* TRẠNG THÁI HOẠT ĐỘNG */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Trạng thái kinh doanh</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={form.status === "active"}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Đang bán</div>
                    <div className="text-[11px] text-slate-500">Sản phẩm sẵn sàng xuất bán tại quầy</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={form.status === "inactive"}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Tạm ngưng</div>
                    <div className="text-[11px] text-slate-500">Ẩn khỏi danh mục bán lẻ</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
