import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Package, Upload, X, ChevronDown, AlertTriangle,
  DollarSign, BarChart2, Truck, Calendar,
  FileText, Info, CheckCircle2, ArrowLeft, Save,
  Camera, Hash, Layers, TrendingUp, ShoppingBag, Plus,
  Loader2, CloudUpload, ScanLine
} from "lucide-react";
import { useProductStore, CATEGORIES, UNITS, formatUnit } from "./store/productStore";
import { uploadImageToCloudinary } from "../services/uploadService";
import { BarcodeImageDecoder } from "./BarcodeImageDecoder";
import { useTranslation } from "../i18n/useTranslation";

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

/**
 * Tìm mã sản phẩm SP<n> nhỏ nhất chưa được gán cho bất kỳ sản phẩm nào trong kho.
 * Ví dụ: nếu đã có SP1..SP6, sẽ trả về SP7.
 */
export function getNextAvailableSku(products = []) {
  const existingSet = new Set();
  (products || []).forEach((p) => {
    if (p.code) existingSet.add(String(p.code).trim().toUpperCase());
    if (p.sku) existingSet.add(String(p.sku).trim().toUpperCase());
    if (Array.isArray(p.stockItems)) {
      p.stockItems.forEach((si) => {
        if (si.sku) existingSet.add(String(si.sku).trim().toUpperCase());
      });
    }
  });

  let n = 1;
  while (existingSet.has(`SP${n}`)) {
    n++;
  }
  return `SP${n}`;
}

export function AddProduct({ onBack }) {
  const { language } = useTranslation();
  const isEn = language === 'en';
  const { addProduct, products, fetchProducts } = useProductStore();

  // Tập hợp tất cả mã sản phẩm / SKU hiện có trong hệ thống
  const existingCodes = useMemo(() => {
    const set = new Set();
    (products || []).forEach((p) => {
      if (p.code) set.add(String(p.code).trim().toUpperCase());
      if (p.sku) set.add(String(p.sku).trim().toUpperCase());
      if (Array.isArray(p.stockItems)) {
        p.stockItems.forEach((si) => {
          if (si.sku) set.add(String(si.sku).trim().toUpperCase());
        });
      }
    });
    return set;
  }, [products]);

  // Tập hợp tất cả mã vạch (Barcode) hiện có trong hệ thống -> tên sản phẩm
  const existingBarcodes = useMemo(() => {
    const map = new Map();
    (products || []).forEach((p) => {
      if (p.barcode) {
        map.set(String(p.barcode).trim(), p.name);
      }
      if (Array.isArray(p.stockItems)) {
        p.stockItems.forEach((si) => {
          if (si.barcode) {
            map.set(String(si.barcode).trim(), p.name);
          }
        });
      }
    });
    return map;
  }, [products]);

  // Mã SP số tiếp theo khả dụng chưa gắn vào sản phẩm nào
  const nextAutoSku = useMemo(() => {
    let n = 1;
    while (existingCodes.has(`SP${n}`)) {
      n++;
    }
    return `SP${n}`;
  }, [existingCodes]);

  const [form, setForm] = useState(initialForm);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [imageDragging, setImageDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBarcodeDecoder, setShowBarcodeDecoder] = useState(false);
  const fileInputRef = useRef(null);

  // Đảm bảo dữ liệu sản phẩm được tải để tính toán mã gợi ý và kiểm tra trùng
  useEffect(() => {
    if (!products || products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products]);

  const normalizedInputSku = (form.sku || "").trim().toUpperCase();
  const isInvalidSkuFormat = Boolean(normalizedInputSku && !/^SP[0-9]+$/.test(normalizedInputSku));
  const isDuplicateSku = Boolean(normalizedInputSku && !isInvalidSkuFormat && existingCodes.has(normalizedInputSku));

  const normalizedInputBarcode = (form.barcode || "").trim();
  const duplicateBarcodeProductName = normalizedInputBarcode ? existingBarcodes.get(normalizedInputBarcode) : null;
  const isDuplicateBarcode = Boolean(duplicateBarcodeProductName);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handlePriceChange = (field, raw) => {
    const digits = parseNum(raw);
    setForm((prev) => ({ ...prev, [field]: digits }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleImageFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setUploadError(null);

    // Hiển thị preview tức thì
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    // Tải ảnh lên Cloudinary
    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setUploadedUrl(url);
    } catch (err) {
      console.warn("Lỗi upload Cloudinary:", err);
      setUploadError(err?.message || "Không thể tải ảnh lên Cloudinary");
    } finally {
      setIsUploading(false);
    }
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

    // Kiểm tra mã sản phẩm (chỉ được phép SP kèm số)
    const cleanSku = (form.sku || "").trim().toUpperCase();
    if (!cleanSku) {
      errs.sku = "Vui lòng nhập mã sản phẩm";
    } else if (!/^SP[0-9]+$/.test(cleanSku)) {
      errs.sku = "Mã sản phẩm chỉ được có định dạng SP kèm số (VD: SP1, SP2...)";
    } else if (existingCodes.has(cleanSku)) {
      errs.sku = `Mã sản phẩm "${cleanSku}" đã được gắn với sản phẩm khác. Vui lòng chọn mã khác!`;
    }

    // Kiểm tra mã vạch (Barcode)
    const cleanBarcode = (form.barcode || "").trim();
    if (cleanBarcode && existingBarcodes.has(cleanBarcode)) {
      errs.barcode = `Mã vạch "${cleanBarcode}" đã được gán cho sản phẩm "${existingBarcodes.get(cleanBarcode)}". Vui lòng nhập mã vạch khác!`;
    }

    if (!form.category) errs.category = "Vui lòng chọn danh mục";
    if (!form.costPrice) errs.costPrice = "Vui lòng nhập giá nhập";
    if (!form.salePrice) errs.salePrice = "Vui lòng nhập giá bán";
    if (form.costPrice && form.salePrice && parseInt(form.salePrice) < parseInt(form.costPrice)) {
      errs.salePrice = "Giá bán không được thấp hơn giá nhập";
    }
    if (!form.stock) errs.stock = "Vui lòng nhập số lượng tồn kho";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const cleanSku = form.sku.trim().toUpperCase();
    if (!/^SP[0-9]+$/.test(cleanSku)) {
      setErrors({ sku: "Mã sản phẩm chỉ được có định dạng SP kèm số (VD: SP1, SP2...)" });
      return;
    }
    if (existingCodes.has(cleanSku)) {
      setErrors({ sku: `Mã sản phẩm "${cleanSku}" đã được gắn với sản phẩm khác. Vui lòng chọn mã khác!` });
      return;
    }

    const cleanBarcode = (form.barcode || "").trim();
    if (cleanBarcode && existingBarcodes.has(cleanBarcode)) {
      setErrors({ barcode: `Mã vạch "${cleanBarcode}" đã được gán cho sản phẩm "${existingBarcodes.get(cleanBarcode)}". Vui lòng chọn mã vạch khác!` });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = uploadedUrl;

      // Nếu có chọn ảnh mà chưa upload xong hoặc lỗi, thử upload lại
      if (!finalImageUrl && imageFile) {
        setIsUploading(true);
        try {
          finalImageUrl = await uploadImageToCloudinary(imageFile);
          setUploadedUrl(finalImageUrl);
        } catch (uploadErr) {
          throw new Error(`Upload ảnh lên Cloudinary thất bại: ${uploadErr.message}`);
        } finally {
          setIsUploading(false);
        }
      }

      const defaultImg = "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&h=300&fit=crop";
      const item = await addProduct({
        ...form,
        sku: cleanSku,
        code: cleanSku,
        imageUrl: finalImageUrl || defaultImg,
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

  const handleResetForm = () => {
    setForm(initialForm);
    setImagePreview(null);
    setImageFile(null);
    setUploadedUrl(null);
    setUploadError(null);
    setSubmitted(false);
    setErrors({});
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Thêm sản phẩm thành công!</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Sản phẩm <span className="font-bold text-blue-700">{form.name}</span> (mã: <span className="font-mono font-bold text-emerald-700">{form.sku}</span>) đã được lưu vào kho hàng và sẵn sàng kinh doanh.
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
            onClick={handleResetForm}
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
              title={isEn ? "Back to list" : "Quay lại danh sách"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" /> {isEn ? "Add New Product" : "Thêm sản phẩm mới"}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              {isEn ? "Fill in all details to add the product to the inventory system" : "Điền đầy đủ thông tin để thêm sản phẩm vào hệ thống kho hàng"}
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
              {isEn ? "Cancel" : "Hủy bỏ"}
            </button>
          )}
          <button
            form="add-product-form"
            type="submit"
            disabled={isSubmitting || isUploading || isInvalidSkuFormat || isDuplicateSku || isDuplicateBarcode}
            className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {isEn ? "Saving..." : "Đang lưu..."}
              </>
            ) : isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {isEn ? "Uploading image..." : "Đang tải ảnh..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {isEn ? "Save Product" : "Lưu sản phẩm"}
              </>
            )}
          </button>
        </div>
      </div>

      <form id="add-product-form" onSubmit={handleSubmit} className="space-y-5">
        {errors.form && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errors.form}</span>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* CỘT TRÁI (2/3): Thông tin sản phẩm */}
          <div className="lg:col-span-2 space-y-5">
            {/* THÔNG TIN CƠ BẢN */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  {isEn ? "Basic Information" : "Thông tin cơ bản"}
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? "Product Name" : "Tên sản phẩm"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={isEn ? "E.g., Hao Hao shrimp instant noodles, Coca-Cola..." : "Ví dụ: Mì tôm Hảo Hảo tôm chua cay, Nước ngọt Coca-Cola..."}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${errors.name ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                    } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? "Category" : "Danh mục hàng"} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${errors.category ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                      } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer`}
                  >
                    <option value="">{isEn ? "-- Select category --" : "-- Chọn danh mục ngành hàng --"}</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {isEn ? (cat.labelEn || cat.label) : cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{isEn ? "Unit" : "Đơn vị tính"}</label>
                  <select
                    value={form.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {formatUnit(u, isEn)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1 h-7">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <span>{isEn ? "Product Code" : "Mã sản phẩm"}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    {nextAutoSku && (
                      <button
                        type="button"
                        onClick={() => handleChange("sku", nextAutoSku)}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                        title={isEn ? `Select suggested SKU ${nextAutoSku}` : `Chọn mã gợi ý ${nextAutoSku}`}
                      >
                        {isEn ? "Suggested:" : "Gợi ý:"} <span className="font-bold">{nextAutoSku}</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={isEn ? "E.g., SP1, SP2" : "VD: SP1, SP2"}
                      value={form.sku}
                      onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                      className={`w-full pl-3.5 pr-9 py-2.5 text-sm font-mono font-bold tracking-wide rounded-xl border transition-all ${isInvalidSkuFormat || isDuplicateSku || errors.sku
                        ? "border-rose-400 bg-rose-50/40 text-rose-800 focus:ring-rose-500/20 focus:border-rose-500"
                        : form.sku
                          ? "border-emerald-300 bg-emerald-50/20 text-slate-800 focus:ring-emerald-500/20 focus:border-emerald-500"
                          : "border-slate-200 bg-slate-50/50 focus:ring-blue-500/20 focus:border-blue-500"
                        } focus:outline-hidden focus:ring-2`}
                    />
                    {isInvalidSkuFormat || isDuplicateSku ? (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 flex items-center" title={isEn ? "Invalid SKU" : "Mã không hợp lệ"}>
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    ) : form.sku ? (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center" title={isEn ? "Valid SKU" : "Mã hợp lệ"}>
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : null}
                  </div>
                  {isInvalidSkuFormat ? (
                    <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{isEn ? "Product code must be format SP followed by number (e.g. SP1, SP2...)" : "Mã sản phẩm chỉ được có định dạng SP kèm số (VD:SP1, SP2...)"}</span>
                    </p>
                  ) : isDuplicateSku ? (
                    <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isEn ? `Code "${normalizedInputSku}" is already in use by another product!` : `Mã "${normalizedInputSku}" đã gắn với sản phẩm khác. Không thể dùng!`}
                      </span>
                    </p>
                  ) : errors.sku ? (
                    <p className="text-xs text-rose-500 mt-1.5">{errors.sku}</p>
                  ) : form.sku ? (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{isEn ? "Available code" : "Mã khả dụng"}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isEn ? "Required format: SP followed by number (e.g. SP1, SP2)" : "Định dạng bắt buộc: SP kèm số (VD: SP1, SP2)"}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 h-7">
                    <label className="text-xs font-semibold text-slate-700">{isEn ? "Barcode" : "Mã vạch"}</label>
                    <button
                      type="button"
                      onClick={() => setShowBarcodeDecoder(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors cursor-pointer border border-blue-200"
                      title={isEn ? "Scan barcode from image" : "Đọc mã vạch từ ảnh"}
                    >
                      <ScanLine className="w-3 h-3" /> {isEn ? "Scan from image" : "Đọc từ ảnh"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={isEn ? "Scan or enter barcode..." : "Quét hoặc nhập mã vạch..."}
                      value={form.barcode}
                      onChange={(e) => handleChange("barcode", e.target.value)}
                      className={`w-full pl-3.5 pr-9 py-2.5 text-sm font-mono rounded-xl border transition-all ${isDuplicateBarcode || errors.barcode
                        ? "border-rose-400 bg-rose-50/40 text-rose-800 focus:ring-rose-500/20 focus:border-rose-500"
                        : form.barcode
                          ? "border-emerald-300 bg-emerald-50/20 text-slate-800 focus:ring-emerald-500/20 focus:border-emerald-500"
                          : "border-slate-200 bg-slate-50/50 focus:ring-blue-500/20 focus:border-blue-500"
                        } focus:outline-hidden focus:ring-2`}
                    />
                    {isDuplicateBarcode ? (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 flex items-center" title={isEn ? "Barcode already exists" : "Mã vạch đã tồn tại"}>
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    ) : form.barcode ? (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center" title={isEn ? "Valid barcode" : "Mã vạch khả dụng"}>
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : null}
                  </div>
                  {isDuplicateBarcode ? (
                    <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isEn ? `Barcode "${normalizedInputBarcode}" is assigned to "${duplicateBarcodeProductName}". Cannot save!` : `Mã vạch "${normalizedInputBarcode}" đã gắn với sản phẩm "${duplicateBarcodeProductName}". Không thể lưu!`}
                      </span>
                    </p>
                  ) : errors.barcode ? (
                    <p className="text-xs text-rose-500 mt-1.5">{errors.barcode}</p>
                  ) : form.barcode ? (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{isEn ? "Valid barcode" : "Mã vạch hợp lệ"}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{isEn ? "Product Description" : "Mô tả sản phẩm"}</label>
                <textarea
                  rows={3}
                  placeholder={isEn ? "Additional notes on packaging, origin, storage location..." : "Ghi chú thêm về quy cách đóng gói, xuất xứ, vị trí để hàng..."}
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
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  {isEn ? "Pricing & Margin" : "Giá cả & Biên lợi nhuận"}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? "Cost Price (VND)" : "Giá vốn nhập kho (VNĐ)"} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0"
                      value={formatVND(form.costPrice)}
                      onChange={(e) => handlePriceChange("costPrice", e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 text-sm font-semibold rounded-xl border ${errors.costPrice ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                        } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                  </div>
                  {errors.costPrice && <p className="text-xs text-rose-500 mt-1">{errors.costPrice}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? "Suggested Retail Price (VND)" : "Giá bán lẻ đề xuất (VNĐ)"} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0"
                      value={formatVND(form.salePrice)}
                      onChange={(e) => handlePriceChange("salePrice", e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 text-sm font-semibold rounded-xl border ${errors.salePrice ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                        } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600">đ</span>
                  </div>
                  {errors.salePrice && <p className="text-xs text-rose-500 mt-1">{errors.salePrice}</p>}
                </div>
              </div>

              {/* Box hiển thị lợi nhuận tính tự động */}
              {margin !== null && (
                <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${Number(margin) >= 25
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : Number(margin) >= 15
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-bold">{isEn ? "Gross Margin: " : "Biên lợi nhuận gộp: "}</span>
                      <span className="font-extrabold text-sm">+{margin}%</span>
                      <span className="text-[11px] block text-slate-500 mt-0.5">
                        {isEn
                          ? `Profit ${(parseInt(form.salePrice) - parseInt(form.costPrice)).toLocaleString("vi-VN")} đ per ${formatUnit(form.unit, isEn)}`
                          : `Lãi ${(parseInt(form.salePrice) - parseInt(form.costPrice)).toLocaleString("vi-VN")} đ trên mỗi ${form.unit}`}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${Number(margin) >= 25 ? "bg-emerald-200/80 text-emerald-900" : "bg-amber-200/80 text-amber-900"
                    }`}>
                    {Number(margin) >= 25 ? (isEn ? "Good Margin" : "Tỷ suất tốt") : (isEn ? "Low Margin" : "Biên độ thấp")}
                  </span>
                </div>
              )}
            </div>

            {/* QUẢN LÝ TỒN KHO & CẢNH BÁO */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Layers className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  {isEn ? "Inventory & Safety Threshold" : "Tồn kho & Ngưỡng an toàn"}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? "Initial Stock Quantity" : "Số lượng nhập kho ban đầu"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border ${errors.stock ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                      } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                  />
                  {errors.stock && <p className="text-xs text-rose-500 mt-1">{errors.stock}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? "Low Stock Alert Threshold" : "Ngưỡng cảnh báo sắp hết hàng"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={form.alertThreshold}
                    onChange={(e) => handleChange("alertThreshold", e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isEn ? "System alerts when stock falls below this level" : "Khi tồn kho nhỏ hơn mức này hệ thống sẽ cảnh báo"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? "Supplier / Source" : "Nhà cung cấp / Nguồn hàng"}
                </label>
                <input
                  type="text"
                  placeholder={isEn ? "E.g., Confectionery distributor, Unilever, Thien Long..." : "Ví dụ: Đại lý bánh kẹo, Unilever, Thiên Long..."}
                  value={form.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Hạn sử dụng */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-700">
                      {isEn ? "Does product have an expiration date?" : "Sản phẩm có hạn sử dụng?"}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {isEn ? "Applies to food, beverages, cosmetics..." : "Áp dụng cho thực phẩm, đồ uống, mỹ phẩm..."}
                    </p>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{isEn ? "Expiration Date" : "Ngày hết hạn"}</label>
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
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  {isEn ? "Product Image" : "Ảnh sản phẩm"}
                </h2>
              </div>

              {imagePreview ? (
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />

                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                      <span className="text-xs font-bold">{isEn ? "Uploading to Cloudinary..." : "Đang tải ảnh lên Cloudinary..."}</span>
                    </div>
                  )}

                  {!isUploading && uploadedUrl && (
                    <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3" /> {isEn ? "Saved to Cloudinary" : "Đã lưu Cloudinary"}
                    </div>
                  )}

                  {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                      >
                        {isEn ? "Change image" : "Đổi ảnh"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          setUploadedUrl(null);
                          setUploadError(null);
                        }}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setImageDragging(true); }}
                  onDragLeave={() => setImageDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer aspect-square flex flex-col items-center justify-center gap-2.5 ${imageDragging
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20"
                    }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-600 hover:underline">{isEn ? "Upload image" : "Tải ảnh lên"}</span>
                    <span className="text-xs text-slate-500">{isEn ? " or drag and drop" : " hoặc kéo thả"}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{isEn ? "PNG, JPG, WEBP up to 10MB" : "PNG, JPG, WEBP tối đa 10MB"}</p>
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="text-[11px] leading-tight">{uploadError}</span>
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
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {isEn ? "Business Status" : "Trạng thái kinh doanh"}
              </h2>
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
                    <div className="text-xs font-bold text-slate-800">{isEn ? "Active / Ready" : "Đang bán"}</div>
                    <div className="text-[11px] text-slate-500">
                      {isEn ? "Product is active and ready for POS sales" : "Sản phẩm sẵn sàng xuất bán tại quầy"}
                    </div>
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
                    <div className="text-xs font-bold text-slate-800">{isEn ? "Suspended" : "Tạm ngưng"}</div>
                    <div className="text-[11px] text-slate-500">
                      {isEn ? "Hidden from counter retail catalog" : "Ẩn khỏi danh mục bán lẻ"}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Barcode image decoder modal */}
      {showBarcodeDecoder && (
        <BarcodeImageDecoder
          onDecoded={(code) => {
            handleChange("barcode", code);
          }}
          onClose={() => setShowBarcodeDecoder(false)}
        />
      )}
    </div>
  );
}
