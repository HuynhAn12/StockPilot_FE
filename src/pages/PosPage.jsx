import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search, Plus, Trash2, Printer, CheckCircle, CreditCard,
  Banknote, QrCode, User, Phone, X, ShoppingBag, ArrowRight,
  RotateCcw, Sparkles, Tag, ChevronRight, ChevronLeft, Check, AlertCircle,
  FileText, Percent, Minus, SlidersHorizontal, Package, RefreshCw,
  Receipt, Zap, Scan, Wifi, WifiOff, Link2, Loader2, Copy, ExternalLink,
  Smartphone, Settings
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useAuthStore } from '../components/store/authStore';
import { useTranslation } from '../i18n/useTranslation';
import {
  apiGetPosProducts,
  apiCreatePosSale,
  apiCreatePayosLink,
  apiCheckPayosStatus,
  apiCreateMomoPayment,
  apiCheckMomoStatus,
  apiConfirmMomoSuccess,
  apiGetMomoConfig,
  apiSaveMomoConfig
} from '../services/posService';
import { apiClient } from '../lib/apiClient';
import { docSoThanhChu } from '../utils/numberToWordsVN';

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

function getPosProductImage(p) {
  if (p?.imageUrl) return p.imageUrl;
  const name = (p?.name || p?.productName || '').toLowerCase();
  const sku = (p?.sku || p?.code || p?.productCode || '').toLowerCase();

  // Beverages / Beer / Drinks
  if (name.includes('bia') || name.includes('heineken') || name.includes('tiger') || name.includes('saigon') || name.includes('rượu') || name.includes('ruou') || name.includes('nước ngọt') || name.includes('nuoc ngot') || name.includes('nước') || name.includes('pepsi') || name.includes('coca') || name.includes('redbull') || name.includes('sting')) {
    if (name.includes('heineken')) {
      return 'https://images.unsplash.com/photo-1608270114032-4720935574dc?w=240&h=240&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&h=240&fit=crop';
  }

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
  return 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=240&h=240&fit=crop';
}

function applyPosOverrides(products) {
  try { localStorage.removeItem('stockpilot_overrides'); } catch (_) {}
  return products;
}

export function PosPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();

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

  // ── PayOS QR Payment State ─────────────────────────────────────
  const [payosModalOpen, setPayosModalOpen] = useState(false);
  const [payosData, setPayosData] = useState(null);
  const [payosStatus, setPayosStatus] = useState('WAITING'); // 'WAITING' | 'SUCCESS' | 'EXPIRED'
  const [payosCountdown, setPayosCountdown] = useState(900);
  const [copiedField, setCopiedField] = useState(null);
  const payosPollRef = useRef(null);
  const payosTimerRef = useRef(null);

  // ── MoMo E-Wallet Payment State ────────────────────────────────
  const [momoModalOpen, setMomoModalOpen] = useState(false);
  const [momoData, setMomoData] = useState(null);
  const [momoStatus, setMomoStatus] = useState('WAITING'); // 'WAITING' | 'SUCCESS' | 'EXPIRED'
  const [momoCountdown, setMomoCountdown] = useState(900);
  const [momoQrTab, setMomoQrTab] = useState('p2p'); // 'p2p' | 'vietqr' | 'gateway'
  const [isMomoSimulating, setIsMomoSimulating] = useState(false);
  const momoPollRef = useRef(null);
  const momoTimerRef = useRef(null);

  // ── MoMo Real Account Config State ─────────────────────────────
  const [momoConfigModalOpen, setMomoConfigModalOpen] = useState(false);
  const [momoConfig, setMomoConfig] = useState(null);
  const [momoPartnerCodeInput, setMomoPartnerCodeInput] = useState('MOMOVA0I20261015');
  const [momoAccessKeyInput, setMomoAccessKeyInput] = useState('sjqZwImFcjxZBhHF');
  const [momoSecretKeyInput, setMomoSecretKeyInput] = useState('OK6GwHc66ZBSdqyuR5RXKTx0xA718DKh');
  const [momoBusinessNameInput, setMomoBusinessNameInput] = useState('STOCKPILOT');
  const [isSavingMomoConfig, setIsSavingMomoConfig] = useState(false);

  const loadMomoConfig = useCallback(async () => {
    try {
      const cfg = await apiGetMomoConfig();
      if (cfg) {
        setMomoConfig(cfg);
        setMomoPartnerCodeInput(cfg.partnerCode || 'MOMOVA0I20261015');
        setMomoAccessKeyInput(cfg.accessKey || 'sjqZwImFcjxZBhHF');
        setMomoSecretKeyInput(cfg.secretKey || 'OK6GwHc66ZBSdqyuR5RXKTx0xA718DKh');
        setMomoBusinessNameInput(cfg.businessName || 'STOCKPILOT');
      }
    } catch (e) {
      console.warn('Lỗi tải cấu hình MoMo:', e);
    }
  }, []);

  useEffect(() => {
    loadMomoConfig();
  }, [loadMomoConfig]);

  const handleSaveMomoConfig = async (e) => {
    e?.preventDefault();
    if (!momoPartnerCodeInput.trim() || !momoAccessKeyInput.trim() || !momoSecretKeyInput.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng điền đủ Partner Code, Access Key và Secret Key MoMo', type: 'error' });
      return;
    }
    setIsSavingMomoConfig(true);
    try {
      const res = await apiSaveMomoConfig({
        partnerCode: momoPartnerCodeInput.trim(),
        accessKey: momoAccessKeyInput.trim(),
        secretKey: momoSecretKeyInput.trim(),
        businessName: momoBusinessNameInput.trim() || 'STOCKPILOT',
      });
      setMomoConfig(res);
      setMomoConfigModalOpen(false);
      toast({
        title: 'Đã lưu cấu hình MoMo Doanh Nghiệp!',
        description: `Mã đối tác: ${res.partnerCode} (${res.businessName})`,
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Lỗi lưu cấu hình',
        description: err?.response?.data?.error?.message || err?.message || 'Không thể lưu thông tin MoMo.',
        type: 'error',
      });
    } finally {
      setIsSavingMomoConfig(false);
    }
  };



  // ── Scanner state ──────────────────────────────────────────────
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerCode, setScannerCode] = useState(() => {
    try {
      return localStorage.getItem('stockpilot_pos_scanner_code') || null;
    } catch (_) {
      return null;
    }
  }); // 6-char pairing code
  const [scannerStatus, setScannerStatus] = useState('idle'); // idle | connecting | connected | error
  const [lastScan, setLastScan] = useState(null);           // { name, sku, price, scannedAt }
  const sseRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Add a scanned stock item directly into the active cart tab
  // Add a scanned stock item directly into the active cart tab
  const addScannedItemToCart = useCallback((payload) => {
    // 1. Find matching product in POS products state or overrides
    const matchedProduct = products.find((p) =>
      p.id === payload.productId ||
      p.stockItems?.some((si) => si.id === payload.stockItemId || (payload.barcode && si.barcode === payload.barcode) || si.sku === payload.sku)
    );
    const applied = matchedProduct;

    // Priority for image:
    // 1. applied override/product imageUrl
    // 2. payload.imageUrl from backend
    // 3. getPosProductImage(applied || payload)
    const resolvedImageUrl = applied?.imageUrl 
      || payload.imageUrl 
      || (applied ? getPosProductImage(applied) : getPosProductImage(payload));

    const resolvedName = applied?.name || payload.productName || payload.name;
    const resolvedPrice = Number(applied?.stockItems?.[0]?.sellingPrice || applied?.sellingPrice || payload.sellingPrice || 0);
    const resolvedSku = payload.sku || applied?.code || `SP-${payload.stockItemId}`;
    const resolvedProductId = applied?.id || payload.productId || null;

    setTabs((prev) => prev.map((t) => {
      if (t.id !== activeTabId) return t;
      const existing = t.items.findIndex((it) => it.stockItemId === payload.stockItemId);
      if (existing >= 0) {
        const updated = [...t.items];
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + 1,
          subtotal: (updated[existing].quantity + 1) * updated[existing].price,
          imageUrl: updated[existing].imageUrl || resolvedImageUrl,
        };
        return { ...t, items: updated };
      }
      return {
        ...t,
        items: [
          ...t.items,
          {
            productId: resolvedProductId,
            stockItemId: payload.stockItemId,
            name: resolvedName,
            sku: resolvedSku,
            price: resolvedPrice,
            quantity: 1,
            subtotal: resolvedPrice,
            imageUrl: resolvedImageUrl,
          },
        ],
      };
    }));
  }, [activeTabId, products]);

  const openSseStream = useCallback((code) => {
    if (!code) return;
    if (sseRef.current) {
      try { sseRef.current.abort(); } catch (_) {}
      sseRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const stored = localStorage.getItem('stockpilot-auth');
    let token = '';
    try { token = JSON.parse(stored)?.state?.token || ''; } catch (_) {}
    if (!token) {
      setScannerStatus('idle');
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const ctrl = new AbortController();
    sseRef.current = ctrl;
    setScannerStatus('connecting');

    fetch(`${API_URL}/scanner/sessions/${code}/events`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    }).then(async (res) => {
      if (!res.ok) {
        if (res.status === 404) {
          // Session doesn't exist anymore on server
          try { localStorage.removeItem('stockpilot_pos_scanner_code'); } catch (_) {}
          setScannerCode(null);
          setScannerStatus('idle');
          return;
        }
        setScannerStatus('error');
        // Schedule auto-reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          const currentSaved = localStorage.getItem('stockpilot_pos_scanner_code');
          if (currentSaved) openSseStream(currentSaved);
        }, 5000);
        return;
      }

      setScannerStatus('connected');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const chunk of parts) {
          const eventLine = chunk.split('\n').find(l => l.startsWith('event:'));
          const dataLine = chunk.split('\n').find(l => l.startsWith('data:'));
          const eventName = eventLine?.slice(6).trim();
          const rawData = dataLine?.slice(5).trim();
          if (!rawData) continue;
          try {
            const payload = JSON.parse(rawData);
            if (eventName === 'scan') {
              addScannedItemToCart(payload);
              setLastScan(payload);
              toast({ title: `✓ Quét: ${payload.name}`, description: `${payload.sku} — ${Number(payload.sellingPrice).toLocaleString('vi-VN')} đ`, type: 'success' });
            } else if (eventName === 'expired' || eventName === 'closed') {
              try { localStorage.removeItem('stockpilot_pos_scanner_code'); } catch (_) {}
              setScannerStatus('idle');
              setScannerCode(null);
            }
          } catch (_) {}
        }
      }

      // If disconnected without error and session code still saved, reconnect
      const savedCode = localStorage.getItem('stockpilot_pos_scanner_code');
      if (savedCode && !ctrl.signal.aborted) {
        setScannerStatus('connecting');
        reconnectTimeoutRef.current = setTimeout(() => {
          openSseStream(savedCode);
        }, 3000);
      } else {
        setScannerStatus('idle');
      }
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        setScannerStatus('error');
        const savedCode = localStorage.getItem('stockpilot_pos_scanner_code');
        if (savedCode) {
          reconnectTimeoutRef.current = setTimeout(() => {
            openSseStream(savedCode);
          }, 5000);
        }
      }
    });
  }, [addScannedItemToCart]);

  // Create a pairing session and open SSE stream
  const startScannerSession = async () => {
    setScannerStatus('connecting');
    try {
      const { data } = await apiClient.post('/scanner/sessions', { label: 'POS Web' });
      const code = data.data.code;
      setScannerCode(code);
      try { localStorage.setItem('stockpilot_pos_scanner_code', code); } catch (_) {}
      openSseStream(code);
    } catch (err) {
      setScannerStatus('error');
      toast({ title: 'Không thể tạo phiên Scanner', description: err?.response?.data?.error?.message || err.message, type: 'error' });
    }
  };

  const stopScannerSession = async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (sseRef.current) {
      try { sseRef.current.abort(); } catch (_) {}
      sseRef.current = null;
    }
    if (scannerCode) {
      try { await apiClient.delete(`/scanner/sessions/${scannerCode}`); } catch (_) {}
    }
    try { localStorage.removeItem('stockpilot_pos_scanner_code'); } catch (_) {}
    setScannerCode(null);
    setScannerStatus('idle');
    setLastScan(null);
  };

  // Auto-restore / Auto-connect scanner session on mount
  useEffect(() => {
    let isCancelled = false;
    const restoreSession = async () => {
      try {
        const storedCode = localStorage.getItem('stockpilot_pos_scanner_code');
        // Fetch active sessions from server for current store
        const res = await apiClient.get('/scanner/sessions');
        const sessions = res?.data?.data || [];
        if (isCancelled) return;

        if (sessions.length > 0) {
          const activeCode = sessions[0].code;
          setScannerCode(activeCode);
          try { localStorage.setItem('stockpilot_pos_scanner_code', activeCode); } catch (_) {}
          openSseStream(activeCode);
        } else if (storedCode) {
          setScannerCode(storedCode);
          openSseStream(storedCode);
        }
      } catch (err) {
        console.warn('Không thể tự động khôi phục scanner session:', err);
      }
    };

    restoreSession();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (sseRef.current) {
        try { sseRef.current.abort(); } catch (_) {}
      }
    };
  }, [openSseStream]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      try { localStorage.removeItem('stockpilot_overrides'); } catch (_) {}
      const data = await apiGetPosProducts();
      const raw = Array.isArray(data) ? data : (data?.items || []);
      const mapped = raw.map((p) => {
        const defaultSi = p.stockItems?.[0] || {};
        const price = safeNum(defaultSi.sellingPrice ?? p.sellingPrice ?? p.salePrice);
        return {
          ...p,
          sellingPrice: price,
          stockItems: p.stockItems?.map((si) => ({
            ...si,
            sellingPrice: safeNum(si.sellingPrice ?? price),
          })) || [],
        };
      });
      // Sort products ascending from 1 onwards (SP1, SP2, SP3...)
      mapped.sort((a, b) => {
        const numA = parseInt(String(a.code || a.id).replace(/\D/g, ''), 10) || Number(a.id) || 0;
        const numB = parseInt(String(b.code || b.id).replace(/\D/g, ''), 10) || Number(b.id) || 0;
        return numA - numB;
      });
      setProducts(mapped);
    } catch (err) {
      console.warn('Lỗi tải sản phẩm:', err?.message);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();

    // Tự động đồng bộ ngay khi trang Sản phẩm cập nhật (cùng cửa sổ hoặc khác tab)
    const handleSync = () => {
      loadProducts();
    };
    window.addEventListener('stockpilot_product_updated', handleSync);

    let bc = null;
    try {
      bc = new BroadcastChannel('stockpilot_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PRODUCTS_UPDATED') {
          loadProducts();
        }
      };
    } catch (_) {}

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadProducts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('stockpilot_product_updated', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (bc) bc.close();
    };
  }, []);

  const categoriesList = useMemo(() => {
    const setCat = new Set();
    products.forEach((p) => { if (p.category?.name) setCat.add(p.category.name); });
    return Array.from(setCat);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category?.name === selectedCategory;
      const q = searchProduct.trim().toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.stockItems?.some((si) => si.sku?.toLowerCase().includes(q) || si.barcode?.includes(q));
      return matchCat && matchSearch;
    });

    return list.sort((a, b) => {
      const numA = parseInt(String(a.code || a.id).replace(/\D/g, ''), 10) || Number(a.id) || 0;
      const numB = parseInt(String(b.code || b.id).replace(/\D/g, ''), 10) || Number(b.id) || 0;
      return numA - numB;
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
    const defaultStockItem = product.stockItems?.[0] || {};
    const stockItemId = defaultStockItem.id;
    if (!stockItemId) {
      toast({ title: 'Sản phẩm lỗi', description: 'Sản phẩm chưa có mã kho', type: 'error' });
      return;
    }
    const currentItems = activeTab.items;
    const existingIndex = currentItems.findIndex((it) => it.stockItemId === stockItemId);
    const price = Number(defaultStockItem.sellingPrice ?? product.sellingPrice ?? product.salePrice ?? 0);
    const sku = defaultStockItem.sku || product.code || `SP-${product.id}`;
    const imgSrc = getPosProductImage(product);
    if (existingIndex >= 0) {
      const updated = [...currentItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * price;
      updateActiveTab({ items: updated });
    } else {
      updateActiveTab({
        items: [
          ...currentItems,
          { productId: product.id, stockItemId, name: product.name, sku, price, quantity: 1, subtotal: price, imageUrl: imgSrc }
        ]
      });
    }
  };

  const updateItemQuantity = (stockItemId, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    updateActiveTab({ items: activeTab.items.map((it) => it.stockItemId === stockItemId ? { ...it, quantity: qty, subtotal: qty * it.price } : it) });
  };

  const updateItemPrice = (stockItemId, newPrice) => {
    const price = Math.max(0, parseFloat(newPrice) || 0);
    updateActiveTab({
      items: activeTab.items.map((it) =>
        it.stockItemId === stockItemId ? { ...it, price, subtotal: it.quantity * price } : it
      ),
    });
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

  const stopPayosPolling = useCallback(() => {
    if (payosPollRef.current) {
      clearInterval(payosPollRef.current);
      payosPollRef.current = null;
    }
    if (payosTimerRef.current) {
      clearInterval(payosTimerRef.current);
      payosTimerRef.current = null;
    }
  }, []);

  const stopMomoPolling = useCallback(() => {
    if (momoPollRef.current) {
      clearInterval(momoPollRef.current);
      momoPollRef.current = null;
    }
    if (momoTimerRef.current) {
      clearInterval(momoTimerRef.current);
      momoTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPayosPolling();
      stopMomoPolling();
    };
  }, [stopPayosPolling, stopMomoPolling]);

  const broadcastOrderChange = () => {
    if (typeof window === 'undefined') return;
    try {
      window.dispatchEvent(new CustomEvent('stockpilot_product_updated'));
      const bc = new BroadcastChannel('stockpilot_channel');
      bc.postMessage({ type: 'ORDERS_UPDATED' });
      bc.close();
    } catch (_) {}
  };

  const handleCopyText = (field, text) => {
    navigator.clipboard.writeText(String(text));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulateMomoPaid = async () => {
    if (!momoData?.momoOrderId || isMomoSimulating) return;
    setIsMomoSimulating(true);
    try {
      await apiConfirmMomoSuccess(momoData.momoOrderId);
      toast({
        title: 'Mô phỏng MoMo thành công',
        description: 'Đã gửi xác nhận MoMo thành công! Đang hoàn tất đơn hàng...',
        type: 'success',
      });
      const checkRes = await apiCheckMomoStatus(momoData.momoOrderId);
      if (checkRes?.isPaid) {
        stopMomoPolling();
        setMomoStatus('SUCCESS');

        const receipt = {
          orderNumber: momoData?.orderNumber || `HD-${momoData.momoOrderId}`,
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
          amountGiven: totalPayable,
          changeDue: 0,
          totalInWords: docSoThanhChu(totalPayable),
          paymentMethod: 'Ví điện tử MoMo',
        };

        setTimeout(() => {
          setMomoModalOpen(false);
          updateActiveTab({ items: [], note: '', discount: 0, customer: { name: 'Khách lẻ', phone: '' } });
          toast({
            title: 'Thanh toán MoMo thành công!',
            description: `Đơn hàng #${momoData?.orderNumber} đã ghi nhận và hoàn tất.`,
            type: 'success',
          });
        }, 2000);
      }
    } catch (err) {
      toast({
        title: 'Lỗi mô phỏng MoMo',
        description: err?.response?.data?.error?.message || err?.message || 'Không thể mô phỏng.',
        type: 'error',
      });
    } finally {
      setIsMomoSimulating(false);
    }
  };

  const handleCompleteSale = async (shouldPrint = false) => {
    if (activeTab.items.length === 0) {
      toast({ title: 'Giỏ hàng trống', description: 'Vui lòng chọn ít nhất 1 mặt hàng', type: 'error' });
      return;
    }

    // ── XỬ LÝ THANH TOÁN VÍ ĐIỆN TỬ MOMO TỰ ĐỘNG NHẬN DIỆN ──
    if (paymentMethod === 'MOMO') {
      setIsProcessing(true);
      try {
        const payload = {
          customerName: activeTab.customer.name || 'Khách lẻ',
          customerPhone: activeTab.customer.phone || undefined,
          discountAmount,
          taxAmount: 0,
          note: activeTab.note || undefined,
          totalAmount: totalPayable,
          items: activeTab.items.map((it) => ({
            stockItemId: it.stockItemId,
            quantity: it.quantity,
            price: it.price,
            unitPrice: it.price,
          })),
        };

        const res = await apiCreateMomoPayment(payload);
        setIsCheckoutOpen(false);
        setMomoData(res);
        setMomoStatus('WAITING');
        setMomoCountdown(900);
        setMomoModalOpen(true);

        stopMomoPolling();

        // 1. Đồng hồ đếm ngược 15 phút
        momoTimerRef.current = setInterval(() => {
          setMomoCountdown((prev) => {
            if (prev <= 1) {
              stopMomoPolling();
              setMomoStatus('EXPIRED');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // 2. Polling kiểm tra trạng thái thanh toán từ MoMo mỗi 2.5 giây
        momoPollRef.current = setInterval(async () => {
          try {
            const checkRes = await apiCheckMomoStatus(res.momoOrderId);
            if (checkRes?.isPaid) {
              stopMomoPolling();
              setMomoStatus('SUCCESS');
              broadcastOrderChange();

              const receipt = {
                orderNumber: res?.orderNumber || `HD-${res.momoOrderId}`,
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
                amountGiven: totalPayable,
                changeDue: 0,
                totalInWords: docSoThanhChu(totalPayable),
                paymentMethod: 'Ví điện tử MoMo',
              };

              if (shouldPrint) {
                setPrintReceiptData(receipt);
                setTimeout(() => window.print(), 500);
              }

              setTimeout(() => {
                setMomoModalOpen(false);
                updateActiveTab({ items: [], note: '', discount: 0, customer: { name: 'Khách lẻ', phone: '' } });
                toast({
                  title: 'Thanh toán MoMo thành công!',
                  description: `Đơn hàng #${res?.orderNumber} đã ghi nhận và hoàn tất.`,
                  type: 'success',
                });
              }, 2200);
            }
          } catch (pollErr) {
            console.warn('Lỗi kiểm tra MoMo:', pollErr);
          }
        }, 2500);
      } catch (err) {
        toast({
          title: 'Chưa thể tạo mã QR MoMo',
          description: err?.response?.data?.error?.message || err?.message || 'Lỗi kết nối cổng MoMo.',
          type: 'error',
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // ── XỬ LÝ THANH TOÁN CHUYỂN KHOẢN / PAYOS NHẬN DIỆN TỰ ĐỘNG ──
    if (paymentMethod === 'PAYOS' || paymentMethod === 'BANK_TRANSFER') {
      setIsProcessing(true);
      try {
        const payload = {
          customerName: activeTab.customer.name || 'Khách lẻ',
          customerPhone: activeTab.customer.phone || undefined,
          discountAmount,
          taxAmount: 0,
          note: activeTab.note || undefined,
          totalAmount: totalPayable,
          items: activeTab.items.map((it) => ({
            stockItemId: it.stockItemId,
            quantity: it.quantity,
            price: it.price,
            unitPrice: it.price,
          })),
        };

        const res = await apiCreatePayosLink(payload);
        setIsCheckoutOpen(false);
        setPayosData(res);
        setPayosStatus('WAITING');
        setPayosCountdown(900);
        setPayosModalOpen(true);

        stopPayosPolling();

        // 1. Đồng hồ đếm ngược 15 phút
        payosTimerRef.current = setInterval(() => {
          setPayosCountdown((prev) => {
            if (prev <= 1) {
              stopPayosPolling();
              setPayosStatus('EXPIRED');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // 2. Tự động kiểm tra trạng thái chuyển khoản từ PayOS mỗi 2.5 giây
        payosPollRef.current = setInterval(async () => {
          try {
            const checkRes = await apiCheckPayosStatus(res.orderCode);
            if (checkRes?.isPaid) {
              stopPayosPolling();
              setPayosStatus('SUCCESS');
              broadcastOrderChange();

              const receipt = {
                orderNumber: res?.orderNumber || `HD-${res.orderCode}`,
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
                amountGiven: totalPayable,
                changeDue: 0,
                totalInWords: docSoThanhChu(totalPayable),
                paymentMethod: 'VietQR PayOS',
              };

              if (shouldPrint) {
                setPrintReceiptData(receipt);
                setTimeout(() => window.print(), 500);
              }

              setTimeout(() => {
                setPayosModalOpen(false);
                updateActiveTab({ items: [], note: '', discount: 0, customer: { name: 'Khách lẻ', phone: '' } });
                toast({
                  title: 'Thanh toán PayOS thành công!',
                  description: `Đơn hàng #${res?.orderNumber} đã ghi nhận và hoàn tất.`,
                  type: 'success',
                });
              }, 2200);
            }
          } catch (pollErr) {
            console.warn('Lỗi kiểm tra PayOS:', pollErr);
          }
        }, 2500);
      } catch (err) {
        toast({
          title: 'Chưa thể tạo mã VietQR PayOS',
          description: err?.response?.data?.error?.message || err?.message || 'Cửa hàng chưa cấu hình PayOS. Hãy vào Cài đặt để kết nối.',
          type: 'error',
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }


    // ── XỬ LÝ THANH TOÁN TIỀN MẶT (CASH) ──
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
        paymentMethod: 'CASH',
        totalAmount: totalPayable,
        items: activeTab.items.map((it) => ({
          stockItemId: it.stockItemId,
          quantity: it.quantity,
          price: it.price,
          unitPrice: it.price,
        })),
      };
      const res = await apiCreatePosSale(payload);
      broadcastOrderChange();
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
        paymentMethod: 'Tiền mặt',
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
                  <span className="whitespace-nowrap">{tab.name.startsWith('Hóa đơn') ? `${t('orderTab', 'Hóa đơn')} ${tab.id}` : tab.name}</span>
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
              title={t('newOrder', 'Thêm hóa đơn mới')}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
              {t('hotkeyHint', 'F3 Tìm hàng · F9 Thanh toán')}
            </span>
            {/* Scanner connect button */}
            <button
              onClick={() => setScannerOpen(true)}
              title={t('scannerPairingTitle', 'Kết nối máy quét mã vạch')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                scannerStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : scannerStatus === 'connecting'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              {scannerStatus === 'connected' ? <Wifi className="w-3.5 h-3.5" /> : scannerStatus === 'connecting' ? <Wifi className="w-3.5 h-3.5" /> : <Scan className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{scannerStatus === 'connected' ? t('scanner', 'Scanner') : t('scannerIdle', 'Quét mã')}</span>
            </button>
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
          <div style={{ textAlign: 'center' }}>{t('stt', 'STT')}</div>
          <div style={{ textAlign: 'center' }}>{t('delete', 'Xóa')}</div>
          <div style={{ whiteSpace: 'nowrap' }}>{t('itemName', 'Tên hàng hóa')}</div>
          <div style={{ textAlign: 'center' }}>{t('quantity', 'Số lượng')}</div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{t('unitPrice', 'Đơn giá')}</div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{t('subtotal', 'Thành tiền')}</div>
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
              <h3 className="font-bold text-sm text-slate-700 mb-1">{t('emptyCartTitle', 'Hóa đơn chưa có hàng hóa')}</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {t('emptyCartDesc', 'Chọn sản phẩm từ danh mục bên phải hoặc tìm kiếm theo tên / mã barcode để thêm vào hóa đơn.')}
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
                    src={item.imageUrl || getPosProductImage(item)}
                    alt={item.name}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, border: '2px solid hsl(214 25% 87%)', background: '#f1f5f9', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=240&h=240&fit=crop'; }}
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

                {/* Unit Price (Editable) */}
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.price}
                    onChange={(e) => updateItemPrice(item.stockItemId, e.target.value)}
                    title="Nhấp để sửa đơn giá nếu cần"
                    style={{
                      width: '100%',
                      textAlign: 'right',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: 13,
                      padding: '3px 4px',
                      border: '1px solid hsl(214 25% 88%)',
                      borderRadius: 6,
                      background: 'white',
                      outline: 'none',
                    }}
                  />
                </div>

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
              placeholder={t('orderNote', 'Ghi chú đơn hàng (F8)...')}
              value={activeTab.note}
              onChange={(e) => updateActiveTab({ note: e.target.value })}
              className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Sale mode pills */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold gap-0.5">
              {[
                { id: 'quick', label: language === 'vi' ? 'Bán nhanh' : 'Quick Sale' },
                { id: 'standard', label: language === 'vi' ? 'Bán thường' : 'Standard' },
                { id: 'delivery', label: language === 'vi' ? 'Giao hàng' : 'Delivery' },
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
                {t('subtotalAmount', 'Tổng tiền hàng')} <span className="text-slate-700 font-semibold">({totalItemCount} sp)</span>:
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
        {/* Product Search */}
        <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'hsl(214 25% 89%)' }}>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchProductPlaceholder', 'Tìm hàng hóa theo tên, mã SP, barcode (F3)...')}
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
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 leading-tight">
                          {p.code || `SP${p.id}`}
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] font-medium text-slate-800 line-clamp-1 leading-tight group-hover:text-blue-600 transition-colors">
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
            <span>{t('checkoutButton', 'THANH TOÁN')}</span>
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
                    { id: 'BANK_TRANSFER', label: 'VietQR PayOS', icon: QrCode, color: 'blue' },
                    { id: 'MOMO', label: 'Ví MoMo', icon: Smartphone, color: 'pink' },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    const isMomo = m.id === 'MOMO';
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                          isSelected
                            ? isMomo
                              ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm'
                              : 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                        style={isSelected ? { boxShadow: isMomo ? '0 0 0 2px rgb(236 72 153 / 0.25)' : '0 0 0 2px rgb(59 130 246 / 0.2)' } : {}}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? (isMomo ? 'text-pink-600' : 'text-blue-600') : 'text-slate-400'}`} />
                        <span className="text-center leading-tight">{m.label}</span>
                        {isSelected && <div className={`w-1.5 h-1.5 rounded-full ${isMomo ? 'bg-pink-500' : 'bg-blue-500'}`} />}
                      </button>
                    );
                  })}
                </div>
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

      {/* ── Scanner Pairing Modal ──────────────────────────────── */}
      {scannerOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setScannerOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Scan className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">{t('scannerPairingTitle', 'StockPilot Scanner')}</h2>
                  <p className="text-xs text-slate-500">{t('scannerPairingSub', 'Kết nối app điện thoại')}</p>
                </div>
              </div>
              <button onClick={() => setScannerOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
              scannerStatus === 'connected' ? 'bg-emerald-50 text-emerald-700' :
              scannerStatus === 'connecting' ? 'bg-amber-50 text-amber-700' :
              scannerStatus === 'error' ? 'bg-red-50 text-red-600' :
              'bg-slate-50 text-slate-500'
            }`}>
              {scannerStatus === 'connected' && <><Wifi className="w-4 h-4" /><span>{language === 'vi' ? 'Đã kết nối — đang chờ quét' : 'Connected — ready to scan'}</span></>}
              {scannerStatus === 'connecting' && <><Wifi className="w-4 h-4 animate-pulse" /><span>{t('scannerScanning', 'Đang kết nối...')}</span></>}
              {scannerStatus === 'error' && <><WifiOff className="w-4 h-4" /><span>{language === 'vi' ? 'Lỗi kết nối' : 'Connection Error'}</span></>}
              {scannerStatus === 'idle' && <><Link2 className="w-4 h-4" /><span>{language === 'vi' ? 'Chưa kết nối' : 'Not Connected'}</span></>}
            </div>

            {scannerCode ? (
              <div className="border-2 border-blue-100 rounded-xl p-4 text-center space-y-3">
                <p className="text-xs text-slate-500 font-medium">{t('scannerPairCodeLabel', 'Mã ghép nối (nhập trên app điện thoại)')}</p>
                <div className="flex items-center justify-center gap-2">
                  {scannerCode.split('').map((ch, i) => (
                    <span key={i} className="w-10 h-12 flex items-center justify-center bg-blue-600 text-white text-xl font-black rounded-lg shadow">
                      {ch}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-600 font-medium">{t('scannerAutoSaved', '✓ Mã tự động lưu — Chỉ reset khi đăng xuất')}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm">
                {language === 'vi' ? 'Nhấn nút bên dưới để tạo mã ghép nối' : 'Click the button below to generate a pairing code'}
              </div>
            )}

            {lastScan && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-sm">
                <p className="text-xs text-emerald-600 font-semibold mb-0.5">{t('scannerRecentScan', 'Vừa quét:')}</p>
                <p className="font-bold text-slate-800">{lastScan.name}</p>
                <p className="text-xs text-slate-500">{lastScan.sku} — {Number(lastScan.sellingPrice).toLocaleString('vi-VN')} đ</p>
              </div>
            )}

            <div className="flex gap-2">
              {(scannerStatus === 'idle' || scannerStatus === 'error') ? (
                <button
                  onClick={startScannerSession}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Scan className="w-4 h-4" />
                  {t('scannerGenerateCode', 'Tạo mã ghép nối')}
                </button>
              ) : (
                <button
                  onClick={stopScannerSession}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <WifiOff className="w-4 h-4" />
                  {t('scannerDisconnect', 'Ngắt kết nối')}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              {language === 'vi' 
                ? <>Mở app <strong>StockPilot Scanner</strong> trên điện thoại → Đăng nhập → Nhập mã → Quét mã vạch</>
                : <>Open <strong>StockPilot Scanner</strong> app on phone → Log in → Enter code → Scan barcode</>}
            </p>
          </div>
        </div>
      )}

      {/* ── PayOS VietQR Payment Realtime Modal ──────────────── */}
      {payosModalOpen && payosData && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs font-black text-sm">
                  P
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Thanh toán VietQR PayOS</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Tự động nhận diện
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Mã đơn: #{payosData.orderNumber || payosData.orderCode}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopPayosPolling();
                  setPayosModalOpen(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col items-center text-center">
              {payosStatus === 'WAITING' && (
                <>
                  {/* Amount Badge */}
                  <div className="mb-4">
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">Số tiền thanh toán</span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight money">
                      {formatVND(payosData.amount)}
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-md mb-4 flex items-center justify-center">
                    <img
                      src={payosData.qrImageUrl || `https://api.vietqr.io/image/${payosData.bin}-${payosData.accountNumber}-compact2.png?amount=${payosData.amount}&addInfo=${encodeURIComponent(payosData.description)}&accountName=${encodeURIComponent(payosData.accountName)}`}
                      alt="Mã QR PayOS"
                      className="w-56 h-56 object-contain rounded-xl"
                    />

                    {/* Scanning radar indicator line */}
                    <div className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse opacity-70" />
                  </div>

                  {/* Transfer Details Card */}
                  <div className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-left space-y-2 text-xs mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900 font-bold font-mono">{payosData.accountNumber}</strong>
                        <button
                          type="button"
                          onClick={() => handleCopyText('stk', payosData.accountNumber)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                          title="Sao chép STK"
                        >
                          {copiedField === 'stk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                      <strong className="text-slate-900 font-bold uppercase">{payosData.accountName}</strong>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Nội dung CK:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-blue-700 font-bold font-mono bg-blue-100/70 px-2 py-0.5 rounded text-xs">
                          {payosData.description}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopyText('desc', payosData.description)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                          title="Sao chép nội dung"
                        >
                          {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Realtime Status Banner */}
                  <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-700 font-semibold mb-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                      <span>Đang chờ khách quét và chuyển tiền...</span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {Math.floor(payosCountdown / 60)}:{(payosCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Hệ thống sẽ <strong>tự động nhận diện ngay khi tiền vào tài khoản</strong> và hoàn tất đơn hàng mà không cần bấm xác nhận.
                  </p>
                </>
              )}

              {payosStatus === 'SUCCESS' && (
                <div className="py-8 flex flex-col items-center animate-in zoom-in-90 duration-300">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-12 h-12 stroke-[2.5]" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-1">ĐÃ NHẬN TIỀN THÀNH CÔNG!</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    PayOS đã xác nhận giao dịch <strong>{formatVND(payosData.amount)}</strong>
                  </p>
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    <span>Đang cập nhật tồn kho & in hóa đơn...</span>
                  </div>
                </div>
              )}

              {payosStatus === 'EXPIRED' && (
                <div className="py-6 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                    <AlertCircle className="w-9 h-9" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Mã QR đã hết hạn</h4>
                  <p className="text-xs text-slate-500 mb-4 max-w-xs">
                    Phiên thanh toán quá 15 phút. Bạn vui lòng tạo lại mã QR mới để thanh toán.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPayosModalOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Tạo lại mã thanh toán
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {payosStatus === 'WAITING' && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                {payosData.checkoutUrl && (
                  <a
                    href={payosData.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>Mở cổng PayOS trên web</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    stopPayosPolling();
                    setPayosModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs ml-auto cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MoMo E-Wallet Payment Realtime Modal ──────────────── */}
      {momoModalOpen && momoData && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col"
            style={{ boxShadow: '0 25px 60px -15px rgba(165, 0, 100, 0.25)' }}
          >
            {/* Header with MoMo Brand styling */}
            <div
              className="px-6 py-4 flex items-center justify-between border-b"
              style={{ background: 'linear-gradient(135deg, #a50064 0%, #d82d8b 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight flex items-center gap-1.5">
                    <span>Ví MoMo</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                      Tự động
                    </span>
                  </h3>
                  <p className="text-xs text-pink-100">Quét mã bằng ứng dụng Ví MoMo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopMomoPolling();
                  setMomoModalOpen(false);
                }}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col items-center text-center">
              {momoStatus === 'WAITING' && (
                <>
                  {/* Amount Badge */}
                  <div className="mb-4">
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">Số tiền thanh toán</span>
                    <span className="text-2xl sm:text-3xl font-black text-pink-600 tracking-tight money">
                      {formatVND(momoData.amount)}
                    </span>
                  </div>

                  {/* QR Code Container - Mã QR Thế hệ 2.0 STOCKPILOT (Sáng rõ nét) */}
                  <div className="relative p-4 bg-white rounded-2xl border-2 border-pink-200 shadow-md mb-3 flex flex-col items-center justify-center">
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-pink-700 bg-pink-100/70 px-2.5 py-0.5 rounded-full mb-2">
                      QR Thế hệ 2.0 · Mọi Ví Điện Tử & Ngân Hàng
                    </div>

                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                      <img
                        src={momoData.qrImageUrl || momoData.qrCodeUrl || '/momo-merchant-qr.png'}
                        alt="Mã QR Thế hệ 2.0 MoMo STOCKPILOT"
                        className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  {/* MoMo Enterprise Transfer Details Card */}
                  <div className="w-full bg-pink-50/50 rounded-2xl p-3 border border-pink-100 text-left space-y-2 text-xs mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Đơn vị thụ hưởng:</span>
                      <strong className="text-slate-900 font-bold uppercase">{momoData.businessName || 'STOCKPILOT'}</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Mã điểm bán (COM-QRC ID):</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-pink-700 font-bold font-mono bg-pink-100 px-2 py-0.5 rounded text-xs">
                          {momoData.storeQrId || '4032108'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopyText('momo_store_id', momoData.storeQrId || '4032108')}
                          className="p-1 hover:bg-pink-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Sao chép COM-QRC ID"
                        >
                          {copiedField === 'momo_store_id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Mã đối tác MoMo:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900 font-bold font-mono">{momoData.partnerCode || 'MOMOVA0I20261015'}</strong>
                        <button
                          type="button"
                          onClick={() => handleCopyText('momo_partner', momoData.partnerCode || 'MOMOVA0I20261015')}
                          className="p-1 hover:bg-pink-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Sao chép Mã đối tác"
                        >
                          {copiedField === 'momo_partner' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-pink-100">
                      <span className="text-slate-500 font-medium">Mã đơn hàng MoMo:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900 font-bold font-mono bg-pink-100/50 px-2 py-0.5 rounded text-xs">
                          {momoData.momoOrderId}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopyText('momo_code', momoData.momoOrderId)}
                          className="p-1 hover:bg-pink-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Sao chép mã đơn hàng"
                        >
                          {copiedField === 'momo_code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Realtime Status Banner */}
                  <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-pink-50 border border-pink-200/80 text-xs text-pink-700 font-semibold">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-pink-600 shrink-0" />
                      <span>Đang đợi khách quét trên ứng dụng MoMo...</span>
                    </div>
                    <span className="font-mono text-pink-800 text-[11px]">
                      {Math.floor(momoCountdown / 60)}:{(momoCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </>
              )}

              {momoStatus === 'SUCCESS' && (
                <div className="py-8 flex flex-col items-center animate-in zoom-in-90 duration-300">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-12 h-12 stroke-[2.5]" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-1">ĐÃ NHẬN TIỀN VÍ MOMO THÀNH CÔNG!</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Ví MoMo đã xác nhận giao dịch <strong>{formatVND(momoData.amount)}</strong>
                  </p>
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    <span>Đang cập nhật tồn kho & hoàn tất đơn hàng...</span>
                  </div>
                </div>
              )}

              {momoStatus === 'EXPIRED' && (
                <div className="py-6 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                    <AlertCircle className="w-9 h-9" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Mã QR MoMo đã hết hạn</h4>
                  <p className="text-xs text-slate-500 mb-4 max-w-xs">
                    Phiên thanh toán quá 15 phút. Bạn vui lòng tạo lại mã QR MoMo mới.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMomoModalOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Tạo lại mã thanh toán MoMo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MoMo Enterprise Setup Modal ─────────────────── */}
      {momoConfigModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ background: 'linear-gradient(135deg, #a50064 0%, #d82d8b 100%)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Cấu hình Cổng MoMo Doanh Nghiệp</h3>
                  <p className="text-xs text-pink-100">Kết nối trực tiếp MoMo Gateway Production</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMomoConfigModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMomoConfig} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã đối tác (Partner Code) <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  value={momoPartnerCodeInput}
                  onChange={(e) => setMomoPartnerCodeInput(e.target.value)}
                  placeholder="VD: MOMOVA0I20261015"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Access Key <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  value={momoAccessKeyInput}
                  onChange={(e) => setMomoAccessKeyInput(e.target.value)}
                  placeholder="VD: sjqZwImFcjxZBhHF"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secret Key <span className="text-pink-600">*</span>
                </label>
                <input
                  type="password"
                  value={momoSecretKeyInput}
                  onChange={(e) => setMomoSecretKeyInput(e.target.value)}
                  placeholder="VD: OK6GwHc66ZBSdqyu..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Doanh nghiệp / Cửa hàng
                </label>
                <input
                  type="text"
                  value={momoBusinessNameInput}
                  onChange={(e) => setMomoBusinessNameInput(e.target.value.toUpperCase())}
                  placeholder="VD: STOCKPILOT"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              <div className="p-3 rounded-xl bg-pink-50/80 border border-pink-200/80 text-[11px] text-pink-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-pink-700">
                  <Sparkles className="w-3.5 h-3.5 text-pink-600" /> Cổng MoMo Doanh Nghiệp Thật:
                </p>
                <p className="leading-relaxed">
                  Đã kết nối với Cổng thanh toán <strong>payment.momo.vn</strong> theo hợp đồng doanh nghiệp đã duyệt. Toàn bộ tiền thanh toán sẽ chuyển trực tiếp vào tài khoản ngân hàng của doanh nghiệp.
                </p>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setMomoConfigModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingMomoConfig}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-pink-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingMomoConfig ? 'Đang lưu...' : 'Lưu cấu hình Doanh Nghiệp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

