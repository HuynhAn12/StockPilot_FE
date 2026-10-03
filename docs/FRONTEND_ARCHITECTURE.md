# StockPilot Frontend Architecture & Multi-Developer Guidelines

> Canonical Product Context: `docs/AI_CONTEXT_MEMORY.md`  
> Design System & Tokens: `docs/DESIGN_SYSTEM.md`  
> UI/UX Plan: `docs/UI_UX_IMPLEMENTATION_PLAN.md`

This document establishes the architecture, directory responsibilities, and coding conventions for the `StockPilot_FE` React + TypeScript + Vite codebase to enable concurrent multi-developer collaboration with minimal Git merge conflicts.

---

## 1. Directory Structure & Responsibilities

```text
src/
├── app/                      # Application root configuration
│   ├── providers/            # Root context providers (TanStack Query, Theme, Router)
│   └── router/               # Application route definitions & guards
│
├── components/               # Pure, domain-agnostic reusable UI components
│   ├── ui/                   # Primitive atomic controls (Button, Input, Card, Modal, Select, etc.)
│   ├── feedback/             # Feedback & status indicators (Skeleton, EmptyState, ErrorState)
│   └── data-display/         # Common presentation components (DataTable, MetricCard, Badges, Pagination)
│
├── layouts/                  # Role-based shell layouts & navigation definitions
│   ├── PublicLayout.tsx      # Unauthenticated shell (Login, Onboarding)
│   ├── OwnerLayout.tsx       # Store Owner application shell
│   ├── WarehouseLayout.tsx   # Warehouse Staff operational shell
│   ├── AdminLayout.tsx       # System Administration shell
│   └── navigation.ts         # Navigation items and role configurations
│
├── features/                 # Domain-driven feature modules (Business logic)
│   ├── auth/                 # Authentication, JWT sessions, login, password reset
│   ├── onboarding/           # Store Owner 5-step registration & subdomain setup
│   ├── dashboard/            # Store Owner home dashboard & executive KPI cards
│   ├── catalog/              # Products, Categories, SKUs, barcode management
│   ├── inventory/            # Inventory balances, stock-in/out, movements, stock-take
│   ├── orders/               # Sales orders, POS checkout, returns/refunds
│   ├── analytics/            # Sales performance, category breakdowns, revenue trends
│   ├── alerts/               # Decision Engine risk alerts (Stockout, Overstock, Deadstock)
│   ├── pricing/              # Pricing recommendations, approval/rejection/modification
│   ├── assistant/            # AI Decision Assistant explanation panel & chat
│   ├── reports/              # Excel report generation & exports
│   └── admin/                # System administration, user/store management, system health
│
├── services/                 # Global services & external integrations
│   └── api/                  # Base HTTP client (`httpClient`), API error classes, interceptors
│
├── hooks/                    # Global domain-agnostic custom React hooks (useDebounce, useMediaQuery)
├── lib/                      # Core helpers (cn utility, formatters for vi-VN)
├── mocks/                    # Mock datasets reserved strictly for isolated testing & showcase
├── types/                    # Minimal global shared TypeScript definitions
└── styles/                   # Global CSS & Tailwind configuration (Design tokens)
```

---

## 2. Feature Module Pattern

Every folder in `src/features/<feature-name>/` must strictly adhere to the following internal layout:

```text
features/<feature_name>/
├── pages/                    # Routed page components for this feature
│   ├── FeatureMainPage.tsx
│   └── index.ts
│
├── components/               # Components specific ONLY to this feature
│   ├── FeatureCard.tsx
│   └── index.ts
│
├── api/                      # Typed API client methods for backend endpoints
│   ├── featureApi.ts
│   └── index.ts
│
├── hooks/                    # TanStack Query query/mutation hooks
│   ├── useFeatureData.ts
│   └── index.ts
│
├── schemas/                  # Zod validation schemas for forms and mutations
│   ├── featureSchemas.ts
│   └── index.ts
│
├── types.ts                  # Feature-scoped TypeScript interfaces & DTOs
├── constants.ts              # Feature-scoped constants (filters, limits, labels)
└── index.ts                  # Clean barrel export for external feature consumers
```

---

## 3. Shared vs. Feature-Specific Boundaries

| Component / Code Type | Location | Rule |
|---|---|---|
| **Generic UI Control** (Button, Input, Modal, Select) | `src/components/ui/` | Must NOT import from `features/`. Must remain domain-agnostic. |
| **Generic Data Widget** (DataTable, MetricCard) | `src/components/data-display/` | Must NOT contain business logic or fetch API data directly. |
| **Generic Feedback** (EmptyState, Skeleton, ErrorState) | `src/components/feedback/` | Reusable across all screens. |
| **Business Feature Widget** (e.g., `RevenueTrendChart`, `PriorityAlerts`) | `src/features/<name>/components/` | Specific to one feature; kept inside that feature folder. |
| **Role Shells** (`OwnerLayout`, `AdminLayout`) | `src/layouts/` | Manages persistent shell layout, topbar, and sidebar navigation. |

---

## 4. API & Data Flow Architecture

API calls **must never** live directly inside page or presentation components. Data flow must follow the standard layered pipeline:

```text
┌───────────────────────────────┐
│        Page Component         │  (e.g., OwnerDashboardPage)
└───────────────┬───────────────┘
                │ uses
┌───────────────▼───────────────┐
│     TanStack Query Hook       │  (e.g., useDashboardMetrics)
└───────────────┬───────────────┘
                │ calls
┌───────────────▼───────────────┐
│       Feature API Layer       │  (e.g., dashboardApi.getMetrics)
└───────────────┬───────────────┘
                │ calls
┌───────────────▼───────────────┐
│      Shared HTTP Client       │  (src/services/api/httpClient.ts)
└───────────────┬───────────────┘
                │ HTTP Request
┌───────────────▼───────────────┐
│       StockPilot Backend      │  (/api/v1/...)
└───────────────────────────────┘
```

### Rules:
1. **Server State:** Handled exclusively via TanStack Query hooks in `features/<feature>/hooks/`.
2. **HTTP Client:** All feature API methods must use `httpClient` from `src/services/api`.
3. **No Mock Data in Production:** Production pages must consume real backend endpoints. Mock data is isolated in `src/mocks/` for test fixtures and visual showcase.

---

## 5. Import & Naming Conventions

### File & Component Naming:
- **Components & Pages:** PascalCase (e.g., `Button.tsx`, `OwnerDashboardPage.tsx`, `RiskBadge.tsx`).
- **Hooks:** camelCase with `use` prefix (e.g., `useDashboard.ts`, `useDebounce.ts`).
- **API & Schemas:** camelCase with descriptor suffix (e.g., `dashboardApi.ts`, `authSchemas.ts`).
- **Types & Constants:** `types.ts`, `constants.ts`.

### Import Order:
1. External React & third-party libraries (e.g., `react`, `lucide-react`, `@tanstack/react-query`).
2. Global primitives, feedback, and data-display components (`src/components/*`).
3. Layouts (`src/layouts`).
4. Services and utilities (`src/services/*`, `src/lib/*`).
5. Feature-local imports (`./hooks`, `./components`, `./types`).

---

## 6. Real-World Code Examples

### Example A: Feature API (`src/features/dashboard/api/dashboardApi.ts`)
```ts
import { httpClient } from "../../../services/api";
import type { ApiResponse } from "../../../types/common";
import type { DashboardMetricsData } from "../types";

export const dashboardApi = {
  getMetrics: () =>
    httpClient.get<ApiResponse<DashboardMetricsData>>("/analytics/dashboard"),
};
```

### Example B: Feature Query Hook (`src/features/dashboard/hooks/useDashboard.ts`)
```ts
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboardApi";

export function useDashboardMetrics(range?: string) {
  return useQuery({
    queryKey: ["dashboard", "metrics", range],
    queryFn: () => dashboardApi.getMetrics(),
  });
}
```

### Example C: Page Component (`src/features/dashboard/pages/OwnerDashboardPage.tsx`)
```tsx
import { MetricCard } from "../../../components/data-display/MetricCard";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useDashboardMetrics } from "../hooks/useDashboard";

export function OwnerDashboardPage() {
  const { data, isLoading } = useDashboardMetrics();
  const metrics = data?.data;

  return (
    <OwnerLayout title="Tổng quan cửa hàng">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Doanh thu thuần"
          value={metrics ? `${(metrics.netRevenue / 1_000_000).toFixed(1)} tr ₫` : "0 ₫"}
          delta="+0%"
          tone="success"
        />
      </div>
    </OwnerLayout>
  );
}
```
