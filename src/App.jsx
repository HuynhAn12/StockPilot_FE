import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Component } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
import { useAuthStore } from './components/store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { OrdersPage } from './pages/OrdersPage';
import { AlertsPage } from './pages/AlertsPage';
import { PricingPage } from './pages/PricingPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { ToastContainer } from './components/common/Toast';

// ─── IMPORT CÁC TRANG CATALOG & INVENTORY ───
import { ProductsPage } from './pages/ProductsPage';
import { ProductCreatePage } from './pages/ProductCreatePage';
import { ProductEditPage } from './pages/ProductEditPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryCreatePage } from './pages/CategoryCreatePage';
import { CategoryEditPage } from './pages/CategoryEditPage';

import { InventoryPage } from './pages/InventoryPage';
import { MovementsPage } from './pages/MovementsPage';
import { StockInflowPage } from './pages/StockInflowPage';
import { StockOutflowPage } from './pages/StockOutflowPage';
import { StockTakesListPage } from './pages/StockTakesListPage';
import { StockTakeNewPage } from './pages/StockTakeNewPage';
import { StockTakeDetailPage } from './pages/StockTakeDetailPage';

// ─── Error Boundary: bắt lỗi render, hiển thị thông báo thay vì màn trắng ───
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[StockPilot ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#f0f6ff', fontFamily: 'Inter, sans-serif', padding: '24px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            maxWidth: '480px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0', textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ color: '#1e40af', fontWeight: 700, marginBottom: '8px' }}>
              Đã xảy ra lỗi
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              {this.state.error?.message || 'Lỗi không xác định'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
              style={{
                background: '#2563eb', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '10px 24px', fontWeight: 600,
                cursor: 'pointer', fontSize: '14px'
              }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Protected route: yêu cầu đăng nhập ───
export function ProtectedRoute({ children }) {
  const { user, token, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{
          width: '36px', height: '36px', border: '3px solid #e2e8f0',
          borderTopColor: '#2563eb', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (!user || !token) return <Navigate to="/login" replace />;
  return children;
}

// ─── Role guard: chỉ cho phép role cụ thể ───
export function RequireRole({ roles, children }) {
  const { user, isHydrated } = useAuthStore();
  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" replace />;

  const userRole = (user.role || '').toLowerCase().replace('shop_owner', 'store_owner');
  const allowed = roles.map((r) => r.toLowerCase().replace('shop_owner', 'store_owner'));

  if (!allowed.includes(userRole)) {
    const fallbackPath = userRole === 'warehouse_staff' ? '/pos' : '/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }
  return children;
}

export default function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    if (token) {
      fetchMe().catch((err) => {
        console.warn('[StockPilot] Background session check:', err?.message || err);
      });
    }
  }, [token, fetchMe]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected App Routes */}
          <Route
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <MainLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
            <Route path="/pos" element={<ErrorBoundary><PosPage /></ErrorBoundary>} />
            
            {/* ─── ROUTES CỦA KHIÊM (CATALOG) ─── */}
            <Route path="/products" element={<ErrorBoundary><ProductsPage /></ErrorBoundary>} />
            <Route path="/products/new" element={<ErrorBoundary><ProductCreatePage /></ErrorBoundary>} />
            <Route path="/products/:id" element={<ErrorBoundary><ProductDetailPage /></ErrorBoundary>} />
            <Route path="/products/:id/edit" element={<ErrorBoundary><ProductEditPage /></ErrorBoundary>} />
            
            <Route path="/categories" element={<ErrorBoundary><CategoriesPage /></ErrorBoundary>} />
            <Route path="/categories/new" element={<ErrorBoundary><CategoryCreatePage /></ErrorBoundary>} />
            <Route path="/categories/:id/edit" element={<ErrorBoundary><CategoryEditPage /></ErrorBoundary>} />

            {/* ─── ROUTES CỦA KHIÊM (INVENTORY & STOCK TAKES) ─── */}
            <Route path="/inventory" element={<ErrorBoundary><InventoryPage /></ErrorBoundary>} />
            <Route path="/inventory/movements" element={<ErrorBoundary><MovementsPage /></ErrorBoundary>} />
            <Route path="/inventory/inflow" element={<ErrorBoundary><StockInflowPage /></ErrorBoundary>} />
            <Route path="/inventory/outflow" element={<ErrorBoundary><StockOutflowPage /></ErrorBoundary>} />
            <Route path="/stock-takes" element={<ErrorBoundary><StockTakesListPage /></ErrorBoundary>} />
            <Route path="/stock-takes/new" element={<ErrorBoundary><StockTakeNewPage /></ErrorBoundary>} />
            <Route path="/stock-takes/:id" element={<ErrorBoundary><StockTakeDetailPage /></ErrorBoundary>} />

            {/* Các Routes khác của Hiếu */}
            <Route
              path="/orders"
              element={
                <RequireRole roles={['store_owner', 'admin']}>
                  <ErrorBoundary><OrdersPage /></ErrorBoundary>
                </RequireRole>
              }
            />
            <Route path="/alerts" element={<ErrorBoundary><AlertsPage /></ErrorBoundary>} />
            <Route
              path="/pricing"
              element={
                <RequireRole roles={['store_owner', 'admin']}>
                  <ErrorBoundary><PricingPage /></ErrorBoundary>
                </RequireRole>
              }
            />
            <Route
              path="/analytics"
              element={
                <RequireRole roles={['store_owner', 'admin']}>
                  <ErrorBoundary><AnalyticsPage /></ErrorBoundary>
                </RequireRole>
              }
            />
            <Route path="/ai-assistant" element={<ErrorBoundary><AIAssistantPage /></ErrorBoundary>} />
            <Route
              path="/settings"
              element={
                <RequireRole roles={['store_owner', 'admin']}>
                  <ErrorBoundary><SettingsPage /></ErrorBoundary>
                </RequireRole>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireRole roles={['admin']}>
                  <ErrorBoundary><AdminUsersPage /></ErrorBoundary>
                </RequireRole>
              }
            />
            <Route
              path="/admin/audit-log"
              element={
                <RequireRole roles={['admin']}>
                  <ErrorBoundary><AdminAuditPage /></ErrorBoundary>
                </RequireRole>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
    </QueryClientProvider>
  );
}