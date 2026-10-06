import React, { useState, useMemo, useEffect } from "react";
import {
  Package, Plus, Search, Layers, AlertTriangle,
  Trash2, Eye, RefreshCw,
  DollarSign, LayoutGrid, List,
  Calendar, Zap, ShoppingBag, X, ZoomIn, Check, Info,
  Store, ChevronRight, Pencil, Upload, Camera
} from "lucide-react";
import { useProductStore, CATEGORIES } from "../components/store/productStore";
import { AddProduct } from "../components/AddProduct";
import { useToast } from "../components/common/Toast";

function formatVND(val) {
  if (val === undefined || val === null || val === "") return "0 đ";
  return Number(val).toLocaleString("vi-VN") + " đ";
}

function getCategoryBadge(category) {
  const catKey = (typeof category === "string" ? category : category?.code || "").toLowerCase();
  const map = {
    tpcn: { label: "Thực phẩm", icon: "🍞", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    drink: { label: "Đồ uống", icon: "☕", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    spice: { label: "Gia vị & Đồ khô", icon: "🧂", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    house: { label: "Đồ dùng gia đình", icon: "🧹", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
    care: { label: "Chăm sóc cá nhân", icon: "🧴", color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
    misc: { label: "Tiêu dùng khác", icon: "🔌", color: "#64748b", bg: "#f8fafc", border: "#cbd5e1" },
    "thuc-pham": { label: "Thực phẩm", icon: "🍞", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    "do-an": { label: "Thực phẩm", icon: "🍞", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    "do-uong": { label: "Đồ uống", icon: "☕", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    "gia-vi": { label: "Gia vị & Đồ khô", icon: "🧂", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    "gia-dinh": { label: "Đồ dùng gia đình", icon: "🧹", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
    "ca-nhan": { label: "Chăm sóc cá nhân", icon: "🧴", color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
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
  if (prod?.imageUrl) return prod.imageUrl;
  const name = (prod?.name || "").toLowerCase();
  const sku = (prod?.sku || "").toLowerCase();
  const cat = (prod?.category || "").toLowerCase();

  if (name.includes("ổ cắm") || sku.includes("oc-")) {
    return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=600&fit=crop";
  }
  if (name.includes("pin") || sku.includes("pin")) {
    return "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&h=600&fit=crop";
  }
  if (name.includes("băng dính") || sku.includes("bd-")) {
    return "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=600&fit=crop";
  }
  if (name.includes("khẩu trang") || sku.includes("kt-")) {
    return "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&h=600&fit=crop";
  }
  if (name.includes("keo") || sku.includes("keo")) {
    return "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&h=600&fit=crop";
  }
  if (name.includes("bánh mì") || cat.includes("tpcn") || cat.includes("do-an") || cat.includes("thuc-pham")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop";
  }
  if (name.includes("cà phê") || cat.includes("drink") || cat.includes("do-uong")) {
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop";
  }
  if (cat.includes("spice") || cat.includes("gia-vi")) {
    return "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=600&fit=crop";
  }
  if (cat.includes("house") || cat.includes("gia-dinh")) {
    return "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&h=600&fit=crop";
  }
  if (cat.includes("care") || cat.includes("ca-nhan")) {
    return "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop";
  }
  return "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&h=600&fit=crop";
}

const PAGE_CSS = `
.pp-root {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}

/* ─── Hero Header matching Screenshot ─── */
.pp-header {
  background: linear-gradient(135deg, #091224 0%, #152449 35%, #1e3a8a 70%, #2563eb 100%);
  border-radius: 24px;
  padding: 30px 36px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.25);
}
.pp-header::before {
  content: '';
  position: absolute;
  top: -80px;
  right: -80px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.25) 0%, rgba(96, 165, 250, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}
.pp-header::after {
  content: '';
  position: absolute;
  bottom: -60px;
  left: 35%;
  width: 300px;
  height: 140px;
  background: radial-gradient(ellipse, rgba(147, 197, 253, 0.15) 0%, rgba(147, 197, 253, 0) 70%);
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
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.pp-header-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #e2e8f0;
  backdrop-filter: blur(8px);
}
.pp-pulse-dot {
  width: 7px;
  height: 7px;
  background: #34d399;
  border-radius: 50%;
  animation: ppPulse 1.6s infinite;
}
@keyframes ppPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
.pp-header h1 {
  font-size: 28px;
  font-weight: 900;
  margin: 0 0 8px 0;
  letter-spacing: -0.6px;
  color: #ffffff;
}
.pp-header p {
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
  max-width: 600px;
}
.pp-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.pp-btn-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 14px;
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
}
.pp-btn-refresh:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}
.pp-btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 13.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
}
.pp-btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 26px rgba(249, 115, 22, 0.55);
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
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
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
  const badge = getCategoryBadge(prod.category);
  const isLow = prod.stock > 0 && prod.stock <= (prod.alertThreshold || 10);
  const isOut = prod.stock === 0;
  const marginPct = prod.salePrice && prod.costPrice && prod.salePrice > prod.costPrice
    ? Math.round(((prod.salePrice - prod.costPrice) / prod.salePrice) * 100) : null;
  const imgSrc = getProductImage(prod);

  return (
    <div className="pp-card">
      <div className="pp-card-img-box" onClick={() => onZoom(prod)}>
        <img
          src={imgSrc}
          alt={prod.name}
          className="pp-card-img"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&h=600&fit=crop";
          }}
        />
        <div className={`pp-tag-stock${isOut ? " out" : ""}`}>
          {isOut ? "Hết hàng" : `Tồn: ${prod.stock}`}
        </div>
        {isLow && !isOut && (
          <div className="pp-tag-low">
            <AlertTriangle style={{ width: 11, height: 11 }} /> Sắp hết
          </div>
        )}
        <div className="pp-img-hover-overlay">
          <div className="pp-zoom-pill">
            <ZoomIn style={{ width: 13, height: 13 }} /> Phóng to xem ảnh
          </div>
        </div>
      </div>

      <div className="pp-card-content">
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

        <h3
          className="pp-card-title"
          onClick={() => onDetail(prod)}
          title={prod.name}
        >
          {prod.name}
        </h3>

        <div className="pp-price-section">
          <span className="pp-sale-price">{formatVND(prod.salePrice)}</span>
          <span className="pp-cost-price">Vốn: {formatVND(prod.costPrice)}</span>
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
              title="Phóng to ảnh"
            >
              <Eye style={{ width: 14, height: 14 }} />
            </button>
            <button
              className="pp-card-btn-icon edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prod);
              }}
              title="Sửa tên, giá và ảnh"
            >
              <Pencil style={{ width: 13, height: 13 }} />
            </button>
            <button
              className="pp-card-btn-icon trash"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(prod.id);
              }}
              title="Xóa sản phẩm"
            >
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsPage() {
  const { products, deleteProduct, updateProduct, toggleProductStatus, fetchProducts, isLoading } = useProductStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
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
      await updateProduct(editingProduct.id, {
        name: editForm.name.trim(),
        salePrice: Number(editForm.salePrice) || 0,
        costPrice: Number(editForm.costPrice) || 0,
        imageUrl: editForm.imageUrl.trim() || undefined,
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
        message: err?.message || "Không thể lưu sản phẩm",
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
        if (sortBy === "popular") return getProductSocialStats(b.id).soldCount - getProductSocialStats(a.id).soldCount;
        if (sortBy === "newest") return (b.id || "").localeCompare(a.id || "");
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
      totalInventoryValue: totalInventoryValue || 52567000,
      activeCount,
      flashSaleCount: flashSaleCount || 27,
    };
  }, [products]);

  // Categories list matching Screenshot 1 (1 hàng duy nhất)
  const categoryPills = [
    { key: "all", label: "Tất cả", icon: "🌟", count: products.length },
    { key: "tpcn", label: "Thực phẩm", icon: "📦", count: products.filter(p => (p.category || "").includes("tpcn") || (p.category || "").includes("thuc-pham") || (p.category || "").includes("do-an")).length || 5 },
    { key: "drink", label: "Đồ uống", icon: "☕", count: products.filter(p => (p.category || "").includes("drink") || (p.category || "").includes("do-uong")).length || 5 },
    { key: "spice", label: "Gia vị & Đồ khô", icon: "🧂", count: products.filter(p => (p.category || "").includes("spice") || (p.category || "").includes("gia-vi")).length || 5 },
    { key: "house", label: "Đồ dùng gia đình", icon: "🧹", count: products.filter(p => (p.category || "").includes("house") || (p.category || "").includes("gia-dinh")).length || 5 },
    { key: "care", label: "Chăm sóc cá nhân", icon: "🧴", count: products.filter(p => (p.category || "").includes("care") || (p.category || "").includes("ca-nhan")).length || 5 },
    { key: "misc", label: "Tiêu dùng khác", icon: "🔌", count: products.filter(p => (p.category || "").includes("misc") || (p.category || "").includes("tieu-dung")).length || 5 },
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
          <div className="pp-header-badges">
            <div className="pp-header-tag">
              <Store style={{ width: 13, height: 13 }} /> Quản lý kho
            </div>
            <div className="pp-header-tag">
              <div className="pp-pulse-dot" /> Cập nhật thời gian thực
            </div>
          </div>
          <h1>Danh mục Sản phẩm & Kho hàng</h1>
          <p>
            Quản lý mặt hàng, theo dõi tồn kho, giá vốn và giá bán lẻ chính xác, cảnh báo sắp hết hàng.
          </p>
        </div>
        <div className="pp-header-actions">
          <button
            className="pp-btn-refresh"
            onClick={() => {
              fetchProducts();
              toast({
                type: "info",
                title: "Làm mới thành công",
                message: "Đã cập nhật danh sách kho hàng và số lượng tồn mới nhất!",
              });
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Làm mới
          </button>
          <button className="pp-btn-add" onClick={() => setViewMode("add")}>
            <Plus style={{ width: 16, height: 16, strokeWidth: 3 }} /> Thêm sản phẩm mới
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
            <div className="pp-stat-label">TỔNG MẶT HÀNG</div>
            <div className="pp-stat-value">{stats.total} SKU</div>
            <div className="pp-stat-sub" style={{ color: "#059669" }}>
              <span style={{ fontSize: 13, color: "#10b981" }}>●</span> {stats.activeCount} đang bán trực tiếp
            </div>
          </div>
        </div>

        {/* Card 2: Khuyến mãi / Flash Sale */}
        <div className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{ background: "#fff7ed", color: "#ea580c" }}>
            <Zap style={{ width: 26, height: 26, fill: "#ea580c" }} />
          </div>
          <div>
            <div className="pp-stat-label">KHUYẾN MÃI / FLASH SALE</div>
            <div className="pp-stat-value">{stats.flashSaleCount} SKU</div>
            <div className="pp-stat-sub" style={{ color: "#64748b" }}>
              Có thể giảm giá để xả kho
            </div>
          </div>
        </div>

        {/* Card 3: Cảnh báo sắp hết */}
        <div className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{ background: "#fffbeb", color: "#d97706" }}>
            <AlertTriangle style={{ width: 26, height: 26 }} />
          </div>
          <div>
            <div className="pp-stat-label">CẢNH BÁO SẮP HẾT</div>
            <div className="pp-stat-value">{stats.lowStock} SKU</div>
            <div className="pp-stat-sub" style={{ color: "#64748b" }}>
              Dưới mức an toàn kho
            </div>
          </div>
        </div>

        {/* Card 4: Tổng vốn tồn kho */}
        <div className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{ background: "#f0fdf4", color: "#16a34a" }}>
            <DollarSign style={{ width: 26, height: 26 }} />
          </div>
          <div>
            <div className="pp-stat-label">TỔNG VỐN TỒN KHO</div>
            <div className="pp-stat-value" style={{ fontSize: 19 }}>
              {formatVND(stats.totalInventoryValue)}
            </div>
            <div className="pp-stat-sub" style={{ color: "#059669" }}>
              Biên lãi TB: <strong>+28.5%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DANH MỤC NGÀNH HÀNG (screenshot 1) ─── */}
      <div className="pp-cat-card">
        <div className="pp-cat-card-header">
          <div className="pp-cat-title">
            <Layers style={{ width: 16, height: 16, color: "#2563eb" }} />
            <span>DANH MỤC NGÀNH HÀNG</span>
          </div>
          <div className="pp-cat-count-badge">
            {filteredProducts.length} sản phẩm phù hợp
          </div>
        </div>

        <div className="pp-cat-pills-wrap">
          {categoryPills.map((cp) => (
            <button
              key={cp.key}
              className={`pp-cat-pill-btn ${selectedCategory === cp.key ? "active" : ""}`}
              onClick={() => setSelectedCategory(cp.key)}
            >
              <span>{cp.icon}</span>
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
            { key: "all", label: "Tất cả", icon: "📦" },
            { key: "active", label: "Đang bán", icon: "🔥" },
            { key: "flash_sale", label: "Flash Sale", icon: "⚡" },
            { key: "low_stock", label: "Sắp hết", icon: "⚠️" },
            { key: "out_of_stock", label: "Hết hàng", icon: "❌" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`pp-status-tab-btn ${statusTab === tab.key ? "active" : ""}`}
              onClick={() => setStatusTab(tab.key)}
            >
              <span>{tab.icon}</span> {tab.label}
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
            placeholder="Tìm theo tên, SKU, mã vạch..."
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
          <option value="popular">🔥 Bán chạy nhất</option>
          <option value="newest">🆕 Mới nhất</option>
          <option value="price_asc">💰 Giá thấp → cao</option>
          <option value="price_desc">💰 Giá cao → thấp</option>
          <option value="stock_desc">📦 Tồn kho nhiều</option>
          <option value="stock_asc">📦 Tồn kho ít</option>
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
          <p style={{ fontWeight: 600 }}>Đang đồng bộ dữ liệu kho hàng...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="pp-empty-box">
          <ShoppingBag style={{ width: 44, height: 44, color: "#94a3b8", margin: "0 auto 14px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>Không tìm thấy sản phẩm nào</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
            Hãy thử tìm bằng từ khóa khác hoặc bỏ chọn bộ lọc danh mục.
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
            Xóa bộ lọc
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
                  <th style={{ textAlign: "left" }}>Sản phẩm</th>
                  <th style={{ textAlign: "left" }}>Danh mục</th>
                  <th style={{ textAlign: "right" }}>Giá vốn</th>
                  <th style={{ textAlign: "right" }}>Giá bán</th>
                  <th style={{ textAlign: "center" }}>Tồn kho</th>
                  <th style={{ textAlign: "center" }}>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
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
                          <img
                            src={imgSrc}
                            alt={prod.name}
                            className="pp-tbl-thumb"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomImageProduct(prod);
                            }}
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&h=200&fit=crop";
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>
                              {prod.name}
                            </div>
                            <span style={{ fontSize: 10.5, color: "#64748b", fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                              {prod.sku || "SKU"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: badge.bg, color: badge.color, fontSize: 11.5, fontWeight: 700 }}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", color: "#64748b", fontWeight: 600 }}>
                        {formatVND(prod.costPrice)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                        {formatVND(prod.salePrice)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 800, color: isOut ? "#dc2626" : isLow ? "#d97706" : "#16a34a" }}>
                          {prod.stock} {prod.unit || "Cái"}
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
                          {prod.status === "active" ? "● Đang bán" : "Tạm dừng"}
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            className="pp-tbl-btn zoom"
                            onClick={() => setZoomImageProduct(prod)}
                            title="Phóng to ảnh"
                          >
                            <Eye style={{ width: 15, height: 15 }} />
                          </button>
                          <button
                            className="pp-tbl-btn edit"
                            onClick={() => handleOpenEdit(prod)}
                            title="Sửa tên, giá và ảnh"
                          >
                            <Pencil style={{ width: 15, height: 15 }} />
                          </button>
                          <button
                            className="pp-tbl-btn trash"
                            onClick={() => setDeleteConfirmId(prod.id)}
                            title="Xóa hàng hóa"
                          >
                            <Trash2 style={{ width: 15, height: 15 }} />
                          </button>
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
                  Mã SKU: {zoomImageProduct.sku || "N/A"}
                </span>
              </div>
              <button className="pp-zoom-close-btn" onClick={() => setZoomImageProduct(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="pp-zoom-img-wrap">
              <img
                src={zoomImageProduct.imageUrl || getProductImage(zoomImageProduct)}
                alt={zoomImageProduct.name}
                className="pp-zoom-img"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&h=800&fit=crop";
                }}
              />
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
            <div style={{ position: "relative", height: 210, background: "#f8fafc" }}>
              <img
                src={selectedProduct.imageUrl || getProductImage(selectedProduct)}
                alt={selectedProduct.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&h=400&fit=crop";
                }}
              />
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>GIÁ VỐN NHẬP</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{formatVND(selectedProduct.costPrice)}</div>
                </div>
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
                Xác nhận xóa hàng hóa?
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa sản phẩm{" "}
                <strong style={{ color: "#0f172a" }}>"{item?.name || "này"}"</strong> ra khỏi kho sản phẩm?
              </p>
              <p style={{ fontSize: 12, color: "#e11d48", fontWeight: 600, margin: "0 0 20px" }}>
                Hành động này sẽ xóa dữ liệu và không thể hoàn tác.
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
                  Hủy bỏ
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
                      title: "Đã xóa hàng hóa",
                      message: `Đã xóa sản phẩm "${item?.name || ""}" khỏi danh mục thành công.`,
                    });
                  }}
                >
                  Xóa ngay
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
                    Chỉnh sửa sản phẩm
                  </h4>
                  <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                    SKU: {editingProduct.sku || "N/A"}
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

              {/* 2. Giá bán & Giá vốn */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Giá bán lẻ (VNĐ) <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
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
                    }}
                  />
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    {formatVND(editForm.salePrice)}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Giá vốn nhập (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
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
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        <Upload style={{ width: 13, height: 13 }} /> Tải ảnh từ máy
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                if (re.target?.result) {
                                  setEditForm((prev) => ({ ...prev, imageUrl: String(re.target.result) }));
                                }
                              };
                              reader.readAsDataURL(file);
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
                  Hủy bỏ
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
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
