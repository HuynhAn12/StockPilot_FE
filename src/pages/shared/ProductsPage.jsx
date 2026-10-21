import React, { useState, useMemo, useEffect } from "react";
import {
  Package, Plus, Search, Layers, AlertTriangle,
  Trash2, Eye, RefreshCw,
  DollarSign, LayoutGrid, List,
  Calendar, Zap, ShoppingBag, X, ZoomIn, Check, Info,
  Store, ChevronRight, Pencil, Upload, Camera
} from "lucide-react";
import { useProductStore, CATEGORIES } from "../../components/store/productStore";
import { useAuthStore } from "../../store/authStore";
import { canViewCostPrice, canDeleteProduct } from "../../config/permissions.config";
import { AddProduct } from "../../components/AddProduct";
import { useToast } from "../../components/common/Toast";
import { useTranslation } from "../../i18n/useTranslation";
import { uploadImageToCloudinary, uploadBase64ToCloudinary } from "../../services/uploadService";

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

function formatVND(val) {
  return safeNum(val).toLocaleString("vi-VN") + " đ";
}

function getCategoryBadge(category) {
  const catKey = (typeof category === "string" ? category : category?.code || "").toLowerCase();
  const map = {
    tpcn: { label: "Thực phẩm", icon: "🍞", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    drink: { label: "Đồ uống", icon: "☕", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    spice: { label: "Gia vị & Đồ khô", icon: "🧂", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    house: { label: "Đồ dùng gia đình", icon: "🧹", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
    care: { label: "Chăm sóc cá nhân", icon: "🧴", color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
    office: { label: "Đồ dùng văn phòng", icon: "📎", color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
    misc: { label: "Tiêu dùng khác", icon: "🔌", color: "#64748b", bg: "#f8fafc", border: "#cbd5e1" },
    "thuc-pham": { label: "Thực phẩm", icon: "🍞", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    "do-an": { label: "Thực phẩm", icon: "🍞", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    "do-uong": { label: "Đồ uống", icon: "☕", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    "gia-vi": { label: "Gia vị & Đồ khô", icon: "🧂", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    "gia-dinh": { label: "Đồ dùng gia đình", icon: "🧹", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
    "ca-nhan": { label: "Chăm sóc cá nhân", icon: "🧴", color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
    "van-phong": { label: "Đồ dùng văn phòng", icon: "📎", color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
  };
  return map[catKey] || { label: "Hàng hóa chung", icon: "📦", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
}

function getProductSocialStats(id) {
  const hash = String(id ?? "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return {
    soldCount: 15 + (hash % 285),
    discountPct: 15 + (hash % 16),
  };
}

function getProductImage(prod) {
  if (prod?.imageUrl && typeof prod.imageUrl === 'string' && prod.imageUrl.trim() !== '') {
    return prod.imageUrl.trim();
  }
  return null;
}

const PAGE_CSS = `
.pp-root {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  font-family: var(--font-ui);
  color: #0f172a;
}

/* ─── Hero Header: Màu xanh lợt chuẩn tinh tế ─── */
.pp-header {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
  border: 1px solid #7dd3fc;
  border-radius: 18px;
  padding: 18px 24px;
  color: #082f49;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 22px -5px rgba(14, 165, 233, 0.22), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
}
.pp-header::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}
.pp-header::after {
  content: '';
  position: absolute;
  bottom: -50px;
  left: 30%;
  width: 240px;
  height: 120px;
  background: radial-gradient(ellipse, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}
.pp-header-left {
  position: relative;
  z-index: 1;
}
.pp-header-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.pp-header-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #0369a1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(8px);
}
.pp-pulse-dot {
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
  animation: ppPulse 1.6s infinite;
}
@keyframes ppPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
.pp-header h1 {
  font-size: 22px;
  font-weight: 900;
  margin: 0 0 4px 0;
  letter-spacing: -0.4px;
  color: #082f49;
}
.pp-header p {
  font-size: 13px;
  color: #0c4a6e;
  font-weight: 500;
  margin: 0;
  line-height: 1.45;
  max-width: none;
  white-space: nowrap;
}
@media (max-width: 768px) {
  .pp-header p {
    white-space: normal;
  }
}
.pp-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.pp-btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  color: #0284c7;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
}
.pp-btn-refresh:hover {
  background: #ffffff;
  border-color: #38bdf8;
  color: #0369a1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
}
.pp-btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  color: #0284c7;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
}
.pp-btn-add:hover {
  background: #ffffff;
  border-color: #38bdf8;
  color: #0369a1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
}

/* ─── 4 KPI Cards Row matching Screenshot ─── */
.pp-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1024px) {
  .pp-stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .pp-stats-grid { grid-template-columns: 1fr; }
}
.pp-stat-card {
  background: white;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.pp-stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  transform: translateY(-2px);
  border-color: #e2e8f0;
}
.pp-stat-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 26px;
}
.pp-stat-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.pp-stat-value {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
}
.pp-stat-sub {
  font-size: 11.5px;
  font-weight: 600;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ─── DANH MỤC NGÀNH HÀNG Container matching Screenshot ─── */
.pp-cat-card {
  background: white;
  border: 1px solid #edf2f7;
  border-radius: 20px;
  padding: 18px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pp-cat-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pp-cat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.pp-cat-count-badge {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}
.pp-cat-pills-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 2px;
}
.pp-cat-pills-wrap::-webkit-scrollbar {
  display: none;
}
.pp-cat-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #334155;
  transition: all 0.18s;
  white-space: nowrap;
  flex-shrink: 0;
}
.pp-cat-pill-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.pp-cat-pill-btn.active {
  background: #1e3a8a;
  border-color: #1e3a8a;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
}
.pp-cat-pill-count {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 800;
}
.pp-cat-pill-btn.active .pp-cat-pill-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
.pp-cat-pill-btn:not(.active) .pp-cat-pill-count {
  background: #e2e8f0;
  color: #475569;
}

/* ─── Filter & Search Toolbar ─── */
.pp-toolbar {
  background: white;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.pp-status-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  flex-shrink: 0;
}
.pp-status-tab-btn {
  padding: 7px 13px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  background: transparent;
  color: #64748b;
  transition: all 0.18s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.pp-status-tab-btn:hover {
  background: rgba(255, 255, 255, 0.65);
  color: #0f172a;
}
.pp-status-tab-btn.active {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.pp-search-box {
  position: relative;
  flex: 1;
  min-width: 220px;
}
.pp-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}
.pp-search-input {
  width: 100%;
  padding: 9px 36px 9px 36px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 12.5px;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.18s, background 0.18s;
  box-sizing: border-box;
}
.pp-search-input:focus {
  border-color: #2563eb;
  background: white;
}
.pp-search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
}
.pp-select-sort {
  padding: 9px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  background: #f8fafc;
  outline: none;
  cursor: pointer;
}
.pp-view-toggle {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.pp-view-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #64748b;
  transition: all 0.18s;
}
.pp-view-btn.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* ─── Product Card matching Screenshot 2 (no 'Kệ A1', with eye + trash) ─── */
.pp-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
  gap: 16px;
}
.pp-card {
  background: white;
  border: 1.5px solid #f1f5f9;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.pp-card:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
}
.pp-card-img-box {
  position: relative;
  aspect-ratio: 1;
  background: #f8fafc;
  overflow: hidden;
  cursor: pointer;
}
.pp-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.pp-card:hover .pp-card-img {
  transform: scale(1.05);
}
.pp-tag-discount {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  color: white;
  font-size: 10.5px;
  font-weight: 800;
  padding: 4px 9px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35);
  letter-spacing: 0.02em;
  z-index: 2;
}
.pp-tag-stock {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.78);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  z-index: 2;
}
.pp-tag-stock.out {
  background: rgba(220, 38, 38, 0.9);
}
.pp-tag-low {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
}
.pp-img-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1;
}
.pp-card-img-box:hover .pp-img-hover-overlay {
  opacity: 1;
}
.pp-zoom-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: white;
  color: #0f172a;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.pp-card-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0px;
}
.pp-card-cat-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  width: fit-content;
  height: 24px;
  box-sizing: border-box;
}
.pp-card-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.4;
  height: 52px;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  transition: color 0.18s;
}
.pp-card-title:hover {
  color: #2563eb;
}
.pp-price-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
  border-top: 1px dashed #f1f5f9;
  padding-top: 4px;
  margin-top: 0px;
}
.pp-sale-price {
  font-size: 17px;
  font-weight: 900;
  color: #0f172a;
}
.pp-cost-price {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

/* ─── Card Actions: Margin tag on left, Eye & Trash icons on right ─── */
.pp-card-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
}
.pp-margin-tag {
  font-size: 11.5px;
  font-weight: 800;
  color: #15803d;
  background: #dcfce7;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
}
.pp-card-icon-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.pp-card-btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.18s;
  flex-shrink: 0;
  border: 1px solid;
}
.pp-card-btn-icon.zoom {
  background: #eff6ff;
  border-color: #dbeafe;
  color: #2563eb;
}
.pp-card-btn-icon.zoom:hover {
  background: #dbeafe;
  transform: scale(1.05);
}
.pp-card-btn-icon.edit {
  background: #fffbeb;
  border-color: #fde68a;
  color: #d97706;
}
.pp-card-btn-icon.edit:hover {
  background: #fef3c7;
  color: #b45309;
  transform: scale(1.05);
}
.pp-card-btn-icon.trash {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #e11d48;
}
.pp-card-btn-icon.trash:hover {
  background: #ffe4e6;
  color: #be123c;
  transform: scale(1.05);
}

/* ─── Table View Mode ─── */
.pp-table-container {
  background: white;
  border: 1px solid #edf2f7;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.pp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.pp-table thead tr {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}
.pp-table thead th {
  padding: 14px 18px;
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.pp-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
  cursor: pointer;
}
.pp-table tbody tr:hover {
  background: #f8faff;
}
.pp-table td {
  padding: 13px 18px;
  vertical-align: middle;
}
.pp-tbl-thumb {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}
.pp-tbl-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  background: transparent;
  transition: all 0.18s;
}
.pp-tbl-btn.zoom:hover { background: #eff6ff; color: #2563eb; }
.pp-tbl-btn.edit:hover { background: #fffbeb; color: #d97706; }
.pp-tbl-btn.trash:hover { background: #fff1f2; color: #e11d48; }

/* ─── Lightbox / Zoom Modal ─── */
.pp-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ppFade 0.15s ease;
}
@keyframes ppFade { from { opacity: 0; } to { opacity: 1; } }

.pp-zoom-modal {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 560px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  animation: ppScale 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}
@keyframes ppScale { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.pp-zoom-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  background: #fafafa;
}
.pp-zoom-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: #f1f5f9;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
}
.pp-zoom-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}
.pp-zoom-img-wrap {
  position: relative;
  background: #090d16;
  max-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.pp-zoom-img {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  transition: transform 0.3s ease;
}
.pp-zoom-img:hover {
  transform: scale(1.03);
}
.pp-zoom-footer {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-top: 1px solid #f1f5f9;
}

/* ─── Delete Modal ─── */
.pp-delete-dialog {
  background: white;
  border-radius: 22px;
  padding: 28px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
  animation: ppScale 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.pp-delete-warn-icon {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: #fff1f2;
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

/* ─── Empty state ─── */
.pp-empty-box {
  background: white;
  border: 1px solid #edf2f7;
  border-radius: 20px;
  padding: 60px 24px;
  text-align: center;
}
`;

function ProductCard({ prod, onZoom, onEdit, onDelete, onDetail }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const canSeeCost = canViewCostPrice(user?.role);
  const canDelete = canDeleteProduct(user?.role);

  const badge = getCategoryBadge(prod.category);
  const isLow = prod.stock > 0 && prod.stock <= (prod.alertThreshold || 10);
  const isOut = prod.stock === 0;
  const marginPct = canSeeCost && prod.salePrice && prod.costPrice && prod.salePrice > prod.costPrice
    ? Math.round(((prod.salePrice - prod.costPrice) / prod.salePrice) * 100) : null;
  const imgSrc = getProductImage(prod);

  return (
    <div className="pp-card">
      <div className="pp-card-img-box" onClick={() => onZoom(prod)}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={prod.name}
            className="pp-card-img"
            onError={(e) => {
              e.target.style.display = "none";
              const fb = e.target.parentElement?.querySelector(".pp-card-fallback-box");
              if (fb) fb.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="pp-card-fallback-box"
          style={{
            display: imgSrc ? "none" : "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 36 }}>{badge.icon || "📦"}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Chưa có ảnh</span>
        </div>
        <div className={`pp-tag-stock${isOut ? " out" : ""}`}>
          {isOut ? t('outOfStock', 'Hết hàng') : `${t('tableStock', 'Tồn')}: ${prod.stock}`}
        </div>
        {isLow && !isOut && (
          <div className="pp-tag-low">
            <AlertTriangle style={{ width: 11, height: 11 }} /> {t('lowStock', 'Sắp hết')}
          </div>
        )}
        {imgSrc && (
          <div className="pp-img-hover-overlay">
            <div className="pp-zoom-pill">
              <ZoomIn style={{ width: 13, height: 13 }} /> {t('zoomImage', 'Phóng to xem ảnh')}
            </div>
          </div>
        )}
      </div>

      <div className="pp-card-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div
            className="pp-card-cat-badge"
            style={{
              background: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`
            }}
          >
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#2563eb',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '2px 7px',
            borderRadius: '6px',
            letterSpacing: '0.02em',
          }}>
            {prod.code || `SP${prod.id}`}
          </span>
        </div>

        <h3
          className="pp-card-title"
          onClick={() => onDetail(prod)}
          title={prod.name}
        >
          {prod.name}
        </h3>

        <div className="pp-price-section">
          <span className="pp-sale-price">{formatVND(prod.salePrice)}</span>
          {canSeeCost && (
            <span className="pp-cost-price">{t('costPrice', 'Giá vốn')}: {formatVND(prod.costPrice)}</span>
          )}
        </div>

        <div className="pp-card-actions-bar">
          <div>
            {marginPct !== null && (
              <span className="pp-margin-tag">+{marginPct}%</span>
            )}
          </div>
          <div className="pp-card-icon-actions">
            <button
              className="pp-card-btn-icon zoom"
              onClick={(e) => {
                e.stopPropagation();
                onZoom(prod);
              }}
              title={t('zoomImage', 'Phóng to ảnh')}
            >
              <Eye style={{ width: 14, height: 14 }} />
            </button>
            <button
              className="pp-card-btn-icon edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prod);
              }}
              title={t('edit', 'Sửa')}
            >
              <Pencil style={{ width: 13, height: 13 }} />
            </button>
            {canDelete && (
              <button
                className="pp-card-btn-icon trash"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(prod.id);
                }}
                title={t('delete', 'Xóa')}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsPage() {
  const { t, language } = useTranslation();
  const { user } = useAuthStore();
  const canSeeCost = canViewCostPrice(user?.role);
  const canDelete = canDeleteProduct(user?.role);

  const { products, deleteProduct, updateProduct, toggleProductStatus, fetchProducts, isLoading } = useProductStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();

    const handleSync = () => {
      fetchProducts();
    };
    window.addEventListener('stockpilot_product_updated', handleSync);

    let bc = null;
    try {
      bc = new BroadcastChannel('stockpilot_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PRODUCTS_UPDATED') {
          fetchProducts();
        }
      };
    } catch (_) {}

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
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

  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [sortBy, setSortBy] = useState("code_asc");
  const [displayLayout, setDisplayLayout] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [zoomImageProduct, setZoomImageProduct] = useState(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    salePrice: 0,
    costPrice: 0,
    imageUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setEditForm({
      name: prod.name || "",
      salePrice: prod.salePrice || 0,
      costPrice: prod.costPrice || 0,
      imageUrl: prod.imageUrl || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault?.();
    if (!editingProduct) return;
    if (!editForm.name.trim()) {
      toast({ type: "warning", title: "Thiếu tên sản phẩm", message: "Vui lòng nhập tên sản phẩm!" });
      return;
    }
    setIsSaving(true);
    try {
      let finalImageUrl = editForm.imageUrl.trim();
      if (finalImageUrl.startsWith("data:image/")) {
        try {
          finalImageUrl = await uploadBase64ToCloudinary(finalImageUrl);
        } catch (uploadErr) {
          console.warn("Upload base64 to Cloudinary failed:", uploadErr);
        }
      }

      await updateProduct(editingProduct.id, {
        name: editForm.name.trim(),
        salePrice: Number(editForm.salePrice) || 0,
        costPrice: Number(editForm.costPrice) || 0,
        imageUrl: finalImageUrl || undefined,
      });
      toast({
        type: "success",
        title: "Cập nhật thành công",
        message: `Đã lưu thông tin mới cho "${editForm.name.trim()}"!`,
      });
      setEditingProduct(null);
    } catch (err) {
      toast({
        type: "error",
        title: "Lỗi cập nhật",
        message: err?.response?.data?.error?.message || err?.message || "Không thể lưu sản phẩm",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          (item.barcode && item.barcode.toLowerCase().includes(q)) ||
          (item.supplier && item.supplier.toLowerCase().includes(q));

        let matchCategory = selectedCategory === "all";
        if (!matchCategory) {
          const cat = item.category?.toLowerCase() || "";
          matchCategory =
            cat === selectedCategory ||
            (selectedCategory === "tpcn" && (cat.includes("thuc-pham") || cat.includes("do-an"))) ||
            (selectedCategory === "drink" && cat.includes("do-uong")) ||
            (selectedCategory === "spice" && cat.includes("gia-vi")) ||
            (selectedCategory === "house" && cat.includes("gia-dinh")) ||
            (selectedCategory === "care" && cat.includes("ca-nhan")) ||
            (selectedCategory === "office" && (cat.includes("office") || cat.includes("van-phong"))) ||
            (selectedCategory === "misc" && (cat.includes("misc") || cat.includes("tieu-dung")));
        }

        let matchStatus = true;
        if (statusTab === "active") matchStatus = item.status === "active";
        else if (statusTab === "low_stock") matchStatus = item.stock > 0 && item.stock <= (item.alertThreshold || 5);
        else if (statusTab === "out_of_stock") matchStatus = item.stock === 0;
        else if (statusTab === "flash_sale") matchStatus = item.stock > 20;

        return matchSearch && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "code_asc" || !sortBy) {
          const numA = parseInt(String(a.code || a.id).replace(/\D/g, ''), 10) || Number(a.id) || 0;
          const numB = parseInt(String(b.code || b.id).replace(/\D/g, ''), 10) || Number(b.id) || 0;
          return numA - numB;
        }
        if (sortBy === "popular") return getProductSocialStats(b.id).soldCount - getProductSocialStats(a.id).soldCount;
        if (sortBy === "newest") return (Number(b.id) || 0) - (Number(a.id) || 0);
        if (sortBy === "price_asc") return (a.salePrice || 0) - (b.salePrice || 0);
        if (sortBy === "price_desc") return (b.salePrice || 0) - (a.salePrice || 0);
        if (sortBy === "stock_asc") return (a.stock || 0) - (b.stock || 0);
        if (sortBy === "stock_desc") return (b.stock || 0) - (a.stock || 0);
        return 0;
      });
  }, [products, searchQuery, selectedCategory, statusTab, sortBy]);

  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= (p.alertThreshold || 5)).length;
    const totalInventoryValue = products.reduce((acc, p) => acc + ((p.costPrice || 0) * (p.stock || 0)), 0);
    const activeCount = products.filter((p) => p.status === "active").length;
    const flashSaleCount = products.filter((p) => p.stock > 20).length;

    return {
      total,
      lowStock,
      totalInventoryValue,
      activeCount,
      flashSaleCount,
    };
  }, [products]);

  // Categories list matching Screenshot 1 (1 hàng duy nhất)
  const categoryPills = [
    { key: "all", label: t('catAll', 'Tất cả'), icon: "🌟", count: products.length },
    { key: "tpcn", label: t('catTpcn', 'Thực phẩm'), icon: "📦", count: products.filter(p => { const c = (p.category || "").toLowerCase(); return c.includes("tpcn") || c.includes("thuc-pham") || c.includes("do-an"); }).length },
    { key: "drink", label: t('catDrink', 'Đồ uống'), icon: "☕", count: products.filter(p => { const c = (p.category || "").toLowerCase(); return c.includes("drink") || c.includes("do-uong"); }).length },
    { key: "spice", label: t('catSpice', 'Gia vị & Đồ khô'), icon: "🧂", count: products.filter(p => { const c = (p.category || "").toLowerCase(); return c.includes("spice") || c.includes("gia-vi"); }).length },
    { key: "house", label: t('catHouse', 'Đồ dùng gia đình'), icon: "🧹", count: products.filter(p => { const c = (p.category || "").toLowerCase(); return c.includes("house") || c.includes("gia-dinh"); }).length },
    { key: "care", label: t('catCare', 'Chăm sóc cá nhân'), icon: "🧴", count: products.filter(p => { const c = (p.category || "").toLowerCase(); return c.includes("care") || c.includes("ca-nhan"); }).length },
    { key: "office", label: t('catOffice', 'Đồ dùng văn phòng'), icon: "📎", count: products.filter(p => { const c = (p.category || "").toLowerCase(); return c.includes("office") || c.includes("van-phong"); }).length },
    { key: "misc", label: t('catMisc', 'Tiêu dùng khác'), icon: "🔌", count: products.filter(p => { const c = (p.category || "").toLowerCase(); return c.includes("misc") || c.includes("tieu-dung"); }).length },
  ];

  if (viewMode === "add") {
    return (
      <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
        <AddProduct onBack={() => setViewMode("list")} />
      </div>
    );
  }

  return (
    <div className="pp-root">
      <style>{PAGE_CSS}</style>

      {/* ─── Hero Header Banner (screenshot 1) ─── */}
      <div className="pp-header">
        <div className="pp-header-left">
          <h1>{t('heroTitle', 'Danh mục Sản phẩm & Kho hàng')}</h1>
          <p>
            {t('heroSubtitle', 'Quản lý mặt hàng, theo dõi tồn kho, giá vốn và giá bán lẻ chính xác, cảnh báo sắp hết hàng.')}
          </p>
        </div>
        <div className="pp-header-actions">
          <button
            className="pp-btn-refresh"
            onClick={() => {
              fetchProducts();
              toast({
                type: "info",
                title: t('refreshSuccessTitle', 'Làm mới thành công'),
                message: t('refreshSuccessMsg', 'Đã cập nhật danh sách kho hàng và số lượng tồn mới nhất!'),
              });
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> {t('refresh', 'Làm mới')}
          </button>
          <button className="pp-btn-add" onClick={() => setViewMode("add")}>
            <Plus style={{ width: 16, height: 16, strokeWidth: 3 }} /> {t('addNewProduct', 'Thêm sản phẩm mới')}
          </button>
        </div>
      </div>

      {/* ─── 4 KPI Cards (screenshot 1) ─── */}
      <div className="pp-stats-grid">
        {/* Card 1: Tổng mặt hàng */}
        <div className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Package style={{ width: 26, height: 26 }} />
          </div>
          <div>
            <div className="pp-stat-label">{t('productsTotal', 'TỔNG MẶT HÀNG')}</div>
            <div className="pp-stat-value">{stats.total} {t('itemsCount', 'SP')}</div>
          </div>
        </div>

        {/* Card 2: Khuyến mãi */}
        <div className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{ background: "#fff7ed", color: "#ea580c" }}>
            <Zap style={{ width: 26, height: 26, fill: "#ea580c" }} />
          </div>
          <div>
            <div className="pp-stat-label">{t('productsFlashSale', 'KHUYẾN MÃI')}</div>
            <div className="pp-stat-value">{stats.flashSaleCount} {t('itemsCount', 'SP')}</div>
          </div>
        </div>

        {/* Card 3: Cảnh báo sắp hết */}
        <div className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{ background: "#fffbeb", color: "#d97706" }}>
            <AlertTriangle style={{ width: 26, height: 26 }} />
          </div>
          <div>
            <div className="pp-stat-label">{t('productsLowStock', 'CẢNH BÁO SẮP HẾT')}</div>
            <div className="pp-stat-value">{stats.lowStock} {t('itemsCount', 'SP')}</div>
          </div>
        </div>

        {/* Card 4: Tổng vốn tồn kho (Ẩn đối với Nhân viên WAREHOUSE_STAFF) */}
        {canSeeCost && (
          <div className="pp-stat-card">
            <div className="pp-stat-icon-wrap" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              <DollarSign style={{ width: 26, height: 26 }} />
            </div>
            <div>
              <div className="pp-stat-label">{t('productsTotalInventoryValue', 'TỔNG VỐN TỒN KHO')}</div>
              <div className="pp-stat-value" style={{ fontSize: 19 }}>
                {formatVND(stats.totalInventoryValue)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── DANH MỤC NGÀNH HÀNG (screenshot 1) ─── */}
      <div className="pp-cat-card">
        <div className="pp-cat-card-header">
          <div className="pp-cat-title">
            <Layers style={{ width: 16, height: 16, color: "#2563eb" }} />
            <span>{t('categorySection', 'DANH MỤC NGÀNH HÀNG')}</span>
          </div>
          <div className="pp-cat-count-badge">
            {filteredProducts.length} {t('matchingProducts', 'sản phẩm phù hợp')}
          </div>
        </div>

        <div className="pp-cat-pills-wrap">
          {categoryPills.map((cp) => (
            <button
              key={cp.key}
              className={`pp-cat-pill-btn ${selectedCategory === cp.key ? "active" : ""}`}
              onClick={() => setSelectedCategory(cp.key)}
            >
              <span>{cp.label}</span>
              <span className="pp-cat-pill-count">{cp.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Filter & Toolbar ─── */}
      <div className="pp-toolbar">
        <div className="pp-status-tabs">
          {[
            { key: "all", label: t('tabAll', 'Tất cả') },
            { key: "active", label: t('tabActive', 'Đang bán') },
            { key: "flash_sale", label: t('tabFlashSale', 'Khuyến mãi') },
            { key: "low_stock", label: t('tabLowStock', 'Sắp hết') },
            { key: "out_of_stock", label: t('tabOutOfStock', 'Hết hàng') },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`pp-status-tab-btn ${statusTab === tab.key ? "active" : ""}`}
              onClick={() => setStatusTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pp-search-box">
          <Search className="pp-search-icon" style={{ width: 15, height: 15 }} />
          <input
            className="pp-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchProductInput', 'Tìm theo tên, mã SP, mã vạch...')}
          />
          {searchQuery && (
            <button className="pp-search-clear" onClick={() => setSearchQuery("")}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        <select
          className="pp-select-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="code_asc">Mã sản phẩm (từ 1 trở đi)</option>
          <option value="popular">{t('sortPopular', 'Bán chạy nhất')}</option>
          <option value="newest">{t('sortNewest', 'Mới nhất')}</option>
          <option value="price_asc">{t('sortPriceAsc', 'Giá thấp → cao')}</option>
          <option value="price_desc">{t('sortPriceDesc', 'Giá cao → thấp')}</option>
          <option value="stock_desc">{t('sortStockDesc', 'Tồn kho nhiều')}</option>
          <option value="stock_asc">{t('sortStockAsc', 'Tồn kho ít')}</option>
        </select>

        <div className="pp-view-toggle">
          <button
            className={`pp-view-btn ${displayLayout === "grid" ? "active" : ""}`}
            onClick={() => setDisplayLayout("grid")}
            title="Dạng thẻ"
          >
            <LayoutGrid style={{ width: 16, height: 16 }} />
          </button>
          <button
            className={`pp-view-btn ${displayLayout === "table" ? "active" : ""}`}
            onClick={() => setDisplayLayout("table")}
            title="Dạng danh sách bảng"
          >
            <List style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* ─── Product Listing ─── */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
          <RefreshCw className="pp-spin" style={{ width: 28, height: 28, margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 600 }}>{t('syncingInventory', 'Đang đồng bộ dữ liệu kho hàng...')}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="pp-empty-box">
          <ShoppingBag style={{ width: 44, height: 44, color: "#94a3b8", margin: "0 auto 14px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>{t('noProductsTitle', 'Không tìm thấy sản phẩm nào')}</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
            {t('noProductsSub', 'Hãy thử tìm bằng từ khóa khác hoặc bỏ chọn bộ lọc danh mục.')}
          </p>
          <button
            style={{
              padding: "9px 18px",
              borderRadius: 10,
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              fontWeight: 700,
              fontSize: 12.5,
              cursor: "pointer",
            }}
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setStatusTab("all");
            }}
          >
            {t('clearFilter', 'Xóa bộ lọc')}
          </button>
        </div>
      ) : displayLayout === "grid" ? (
        <div className="pp-cards-grid">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              prod={prod}
              onZoom={setZoomImageProduct}
              onEdit={handleOpenEdit}
              onDelete={setDeleteConfirmId}
              onDetail={setSelectedProduct}
            />
          ))}
        </div>
      ) : (
        <div className="pp-table-container">
          <div style={{ overflowX: "auto" }}>
            <table className="pp-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>{t('tableProduct', 'Sản phẩm')}</th>
                  <th style={{ textAlign: "left" }}>{t('tableCategory', 'Danh mục')}</th>
                  {canSeeCost && <th style={{ textAlign: "right" }}>{t('tableCostPrice', 'Giá vốn')}</th>}
                  <th style={{ textAlign: "right" }}>{t('tableSalePrice', 'Giá bán')}</th>
                  <th style={{ textAlign: "center" }}>{t('tableStock', 'Tồn kho')}</th>
                  <th style={{ textAlign: "center" }}>{t('tableStatus', 'Trạng thái')}</th>
                  <th style={{ textAlign: "right" }}>{t('tableActions', 'Thao tác')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => {
                  const badge = getCategoryBadge(prod.category);
                  const isLow = prod.stock > 0 && prod.stock <= (prod.alertThreshold || 5);
                  const isOut = prod.stock === 0;
                  const imgSrc = getProductImage(prod);
                  return (
                    <tr key={prod.id} onClick={() => setSelectedProduct(prod)}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={prod.name}
                              className="pp-tbl-thumb"
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomImageProduct(prod);
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              className="pp-tbl-thumb"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f1f5f9",
                                fontSize: 18,
                              }}
                            >
                              {badge.icon || "📦"}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>
                              {prod.name}
                            </div>
                            <span style={{ fontSize: 10.5, color: "#64748b", fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                              {prod.sku || "SP"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: badge.bg, color: badge.color, fontSize: 11.5, fontWeight: 700 }}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      {canSeeCost && (
                        <td style={{ textAlign: "right", color: "#64748b", fontWeight: 600 }}>
                          {formatVND(prod.costPrice)}
                        </td>
                      )}
                      <td style={{ textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                        {formatVND(prod.salePrice)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 800, color: isOut ? "#dc2626" : isLow ? "#d97706" : "#16a34a" }}>
                          {prod.stock} {prod.unit || t('unitPiece', 'Cái')}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleProductStatus(prod.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 20,
                            border: prod.status === "active" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                            background: prod.status === "active" ? "#dcfce7" : "#f1f5f9",
                            color: prod.status === "active" ? "#166534" : "#64748b",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {prod.status === "active" ? t('statusSelling', '● Đang bán') : t('statusPaused', 'Tạm dừng')}
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            className="pp-tbl-btn zoom"
                            onClick={() => setZoomImageProduct(prod)}
                            title={t('zoomImage', 'Phóng to ảnh')}
                          >
                            <Eye style={{ width: 15, height: 15 }} />
                          </button>
                          <button
                            className="pp-tbl-btn edit"
                            onClick={() => handleOpenEdit(prod)}
                            title={t('edit', 'Sửa')}
                          >
                            <Pencil style={{ width: 15, height: 15 }} />
                          </button>
                          {canDelete && (
                            <button
                              className="pp-tbl-btn trash"
                              onClick={() => setDeleteConfirmId(prod.id)}
                              title={t('delete', 'Xóa')}
                            >
                              <Trash2 style={{ width: 15, height: 15 }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Lightbox Zoom Modal (Hình cái mắt để phóng to ảnh để xem) ─── */}
      {zoomImageProduct && (
        <div className="pp-modal-overlay" onClick={() => setZoomImageProduct(null)}>
          <div className="pp-zoom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-zoom-header">
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                  {zoomImageProduct.name}
                </h4>
                <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                  Mã SP: {zoomImageProduct.sku || "N/A"}
                </span>
              </div>
              <button className="pp-zoom-close-btn" onClick={() => setZoomImageProduct(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="pp-zoom-img-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
              {zoomImageProduct.imageUrl ? (
                <img
                  src={zoomImageProduct.imageUrl}
                  alt={zoomImageProduct.name}
                  className="pp-zoom-img"
                />
              ) : (
                <div style={{ textAlign: "center", color: "#64748b", padding: 60 }}>
                  <div style={{ fontSize: 64, marginBottom: 12 }}>{getCategoryBadge(zoomImageProduct.category).icon || "📦"}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Chưa có hình ảnh cho sản phẩm này</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Bạn có thể nhấn vào nút Sửa để cập nhật hình ảnh</div>
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  background: "rgba(0, 0, 0, 0.65)",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 11,
                  backdropFilter: "blur(4px)",
                }}
              >
                🔍 Cuộn chuột hoặc rê để xem chi tiết
              </div>
            </div>

            <div className="pp-zoom-footer">
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                  {formatVND(zoomImageProduct.salePrice)}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b" }}>
                  Tồn kho: <strong>{zoomImageProduct.stock} {zoomImageProduct.unit || "cái"}</strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    background: "#fff1f2",
                    color: "#e11d48",
                    border: "1px solid #fecdd3",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onClick={() => {
                    const p = zoomImageProduct;
                    setZoomImageProduct(null);
                    setDeleteConfirmId(p.id);
                  }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} /> Xóa sản phẩm
                </button>
                <button
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onClick={() => setZoomImageProduct(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Product Detail Modal ─── */}
      {selectedProduct && (
        <div className="pp-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div
            style={{
              background: "white",
              borderRadius: 24,
              maxWidth: 500,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: "relative", height: 210, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: 52, marginBottom: 8 }}>{getCategoryBadge(selectedProduct.category).icon || "📦"}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Chưa có hình ảnh sản phẩm</div>
                </div>
              )}
              <button
                className="pp-zoom-close-btn"
                style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", color: "white" }}
                onClick={() => setSelectedProduct(null)}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ padding: 22 }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#2563eb", fontWeight: 700 }}>
                {selectedProduct.sku}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: "4px 0 10px" }}>
                {selectedProduct.name}
              </h3>
              {selectedProduct.description && (
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 14px", lineHeight: 1.5 }}>
                  {selectedProduct.description}
                </p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: canSeeCost ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 16 }}>
                {canSeeCost && (
                  <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>GIÁ VỐN NHẬP</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{formatVND(selectedProduct.costPrice)}</div>
                  </div>
                )}
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>GIÁ BÁN LẺ</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#2563eb", marginTop: 2 }}>{formatVND(selectedProduct.salePrice)}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>TỒN KHO THỰC TẾ</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#059669", marginTop: 2 }}>{selectedProduct.stock} {selectedProduct.unit}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>NHÀ CUNG CẤP</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginTop: 2 }}>{selectedProduct.supplier || "Chính hãng"}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 12,
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #dbeafe",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onClick={() => {
                    const p = selectedProduct;
                    setSelectedProduct(null);
                    setZoomImageProduct(p);
                  }}
                >
                  <Eye style={{ width: 15, height: 15 }} /> Phóng to ảnh
                </button>
                <button
                  style={{
                    padding: "11px 22px",
                    borderRadius: 12,
                    background: "#0f172a",
                    color: "white",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedProduct(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal (thùng rác để xóa hàng hóa đó ra khỏi sản phẩm) ─── */}
      {deleteConfirmId && (() => {
        const item = products.find((p) => p.id === deleteConfirmId);
        return (
          <div className="pp-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
            <div className="pp-delete-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="pp-delete-warn-icon">
                <Trash2 style={{ width: 28, height: 28 }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>
                {t('deleteConfirmTitle', 'Xác nhận xóa hàng hóa?')}
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 }}>
                {t('deleteConfirmDesc', 'Bạn có chắc chắn muốn xóa sản phẩm này ra khỏi kho sản phẩm?')}
              </p>
              <p style={{ fontSize: 12, color: "#e11d48", fontWeight: 600, margin: "0 0 20px" }}>
                {item?.name ? `"${item.name}"` : ""}
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 12,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                  onClick={() => setDeleteConfirmId(null)}
                >
                  {t('cancel', 'Hủy bỏ')}
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    color: "white",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(220, 38, 38, 0.4)",
                  }}
                  onClick={async () => {
                    const idToDelete = deleteConfirmId;
                    setDeleteConfirmId(null);
                    await deleteProduct(idToDelete);
                    toast({
                      type: "success",
                      title: t('delete', 'Đã xóa hàng hóa'),
                      message: `"${item?.name || ""}"`,
                    });
                  }}
                >
                  {t('confirmDelete', 'Xác nhận xóa')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Edit Product Modal (sửa tên, giá và ảnh) ─── */}
      {editingProduct && (
        <div className="pp-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div
            style={{
              background: "white",
              borderRadius: 24,
              maxWidth: 520,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
              animation: "ppScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                background: "#fafafa",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#fffbeb",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Pencil style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                    {t('editProductTitle', 'Chỉnh sửa sản phẩm')}
                  </h4>
                  <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                    Mã SP: {editingProduct.sku || "N/A"}
                  </span>
                </div>
              </div>
              <button className="pp-zoom-close-btn" onClick={() => setEditingProduct(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 1. Tên sản phẩm */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Tên sản phẩm <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nhập tên sản phẩm..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 2. Giá bán & Giá vốn (Phân quyền: Nhân viên không được sửa giá bán và không được xem giá vốn) */}
              <div style={{ display: "grid", gridTemplateColumns: canSeeCost ? "1fr 1fr" : "1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Giá bán lẻ (VNĐ) <span style={{ color: "#dc2626" }}>*</span> {!canSeeCost && <span style={{ color: "#e11d48", fontSize: 11, fontWeight: 500 }}>(Chỉ Chủ shop mới được sửa giá)</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    disabled={!canSeeCost}
                    value={editForm.salePrice}
                    onChange={(e) => setEditForm({ ...editForm, salePrice: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "#2563eb",
                      outline: "none",
                      boxSizing: "border-box",
                      background: !canSeeCost ? "#f1f5f9" : "#fff",
                      cursor: !canSeeCost ? "not-allowed" : "text",
                    }}
                  />
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    {formatVND(editForm.salePrice)}
                  </div>
                </div>

                {canSeeCost && (
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Giá vốn nhập (VNĐ)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editForm.costPrice}
                      onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: "#475569",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      {formatVND(editForm.costPrice)}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Ảnh sản phẩm */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Hình ảnh sản phẩm
                </label>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 14,
                      border: "1.5px solid #e2e8f0",
                      overflow: "hidden",
                      background: "#f8fafc",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={editForm.imageUrl || getProductImage(editingProduct)}
                      alt="Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&h=200&fit=crop";
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      type="url"
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                      placeholder="Dán link ảnh (https://...)"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 12,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: isUploadingImage ? "#e2e8f0" : "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#334155",
                          cursor: isUploadingImage ? "not-allowed" : "pointer",
                          opacity: isUploadingImage ? 0.7 : 1,
                        }}
                      >
                        {isUploadingImage ? (
                          <RefreshCw className="pp-spin" style={{ width: 13, height: 13 }} />
                        ) : (
                          <Upload style={{ width: 13, height: 13 }} />
                        )}
                        {isUploadingImage ? "Đang tải ảnh lên Cloudinary..." : "Tải ảnh từ máy"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingImage}
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingImage(true);
                            try {
                              const cloudUrl = await uploadImageToCloudinary(file);
                              setEditForm((prev) => ({ ...prev, imageUrl: cloudUrl }));
                              toast({
                                type: "success",
                                title: "Tải ảnh thành công",
                                message: "Ảnh đã được tải lên Cloudinary!",
                              });
                            } catch (uploadErr) {
                              toast({
                                type: "error",
                                title: "Lỗi tải ảnh",
                                message: uploadErr?.message || "Không thể tải ảnh lên",
                              });
                            } finally {
                              setIsUploadingImage(false);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                      {editForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, imageUrl: "" })}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: "transparent",
                            border: "1px solid #fecdd3",
                            color: "#e11d48",
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {t('cancel', 'Hủy bỏ')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1.5,
                    padding: "12px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "white",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 13.5,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Check style={{ width: 16, height: 16 }} />
                  {isSaving ? t('saving', 'Đang lưu...') : t('saveChanges', 'Lưu thay đổi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
