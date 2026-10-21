import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Component } from 'react';
import { useUIStore } from './components/store/uiStore';
import { useAuthStore } from './components/store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { PosPage } from './pages/PosPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { OrdersPage } from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { AlertsPage } from './pages/AlertsPage';
import { PricingPage } from './pages/PricingPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { ToastContainer } from './components/common/Toast';

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
    // If warehouse staff attempts restricted routes, redirect to POS
    const fallbackPath = userRole === 'warehouse_staff' ? '/pos' : '/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }
  return children;
}

export default function App() {
  const { token, fetchMe } = useAuthStore();

  // Khi reload trang: nếu có token thì cập nhật thông tin user mới nhất từ server ở chế độ nền
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    if (token) {
      fetchMe().catch((err) => {
        console.warn('[StockPilot] Background session check:', err?.message || err);
      });
    }
  }, [token, fetchMe]);

  return (
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
            <Route path="/products" element={<ErrorBoundary><ProductsPage /></ErrorBoundary>} />
            <Route path="/pos" element={<ErrorBoundary><PosPage /></ErrorBoundary>} />
            <Route path="/categories" element={<Navigate to="/pos" replace />} />
            <Route
              path="/orders"
              element={
                <RequireRole roles={['store_owner', 'admin']}>
                  <ErrorBoundary><OrdersPage /></ErrorBoundary>
                </RequireRole>
              }
            />
            <Route path="/inventory" element={<ErrorBoundary><InventoryPage /></ErrorBoundary>} />
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

            {/* Admin-only routes */}
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

          {/* Landing page for root path */}
          <Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Toast Notifications */}
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
