import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "../../features/auth/pages/LoginPage";
import { OnboardingPage } from "../../features/onboarding/pages/OnboardingPage";
import { OwnerDashboardPage } from "../../features/dashboard/pages/OwnerDashboardPage";
import { ProductsPage } from "../../features/catalog/pages/ProductsPage";
import { InventoryPage } from "../../features/inventory/pages/InventoryPage";
import { MovementsPage } from "../../features/inventory/pages/MovementsPage";
import { OrdersPage } from "../../features/orders/pages/OrdersPage";
import { PricingPage } from "../../features/pricing/pages/PricingPage";
import { AlertsPage } from "../../features/alerts/pages/AlertsPage";
import { AssistantPage } from "../../features/assistant/pages/AssistantPage";
import { AnalyticsPage } from "../../features/analytics/pages/AnalyticsPage";
import { ReportsPage } from "../../features/reports/pages/ReportsPage";
import { ShowcasePage } from "../../pages/ShowcasePage";
import { AUTH_STORAGE_KEYS } from "../../features/auth/constants";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/app/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<OnboardingPage />} />
      <Route path="/onboarding" element={<Navigate to="/register" replace />} />

      {/* Authenticated Store Owner Routes */}
      <Route
        path="/app/dashboard"
        element={
          <ProtectedRoute>
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/catalog/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/inventory"
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/inventory/movements"
        element={
          <ProtectedRoute>
            <MovementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/pricing"
        element={
          <ProtectedRoute>
            <PricingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/assistant"
        element={
          <ProtectedRoute>
            <AssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Internal Showcase / Review */}
      <Route path="/internal/showcase" element={<ShowcasePage />} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
