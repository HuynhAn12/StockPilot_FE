# StockPilot Frontend — Multi-Developer Feature Ownership

> Architecture Guide: `docs/FRONTEND_ARCHITECTURE.md`  
> Product Specifications: `docs/AI_CONTEXT_MEMORY.md`

To ensure productive parallel development, minimal Git merge conflicts, and clear team boundaries across `StockPilot_FE`, frontend feature ownership is distributed into dedicated domains.

---

## 1. Feature Domain Ownership Table

| Developer / Track | Assigned Feature Modules | Primary Folder Paths | Key Responsibilities |
|---|---|---|---|
| **Track 1: Identity & Onboarding** | `auth` + `onboarding` | `src/features/auth/`<br/>`src/features/onboarding/` | Owner registration (5-step wizard), store slug reservation, login, password reset, JWT token lifecycle, session refresh. |
| **Track 2: Executive Dashboard** | `dashboard` + `analytics` | `src/features/dashboard/`<br/>`src/features/analytics/` | Store Owner KPI row, executive decision metrics, category revenue charts, time-series revenue trends, date filtering. |
| **Track 3: Catalog & Products** | `catalog` | `src/features/catalog/` | Product list, category tree, SKU management, barcodes, cost/selling price configuration, product variants. |
| **Track 4: Inventory & Risk Engine** | `inventory` + `alerts` | `src/features/inventory/`<br/>`src/features/alerts/` | Warehouse balances, stock-in/out, stock-take adjustments, movements, Decision Engine smart alerts (Stockout, Overstock, Deadstock). |
| **Track 5: Sales Orders & Pricing** | `orders` + `pricing` | `src/features/orders/`<br/>`src/features/pricing/` | Sales orders, POS integration, returns/refunds, Decision Engine pricing recommendations (Accept, Reject, Modify, Apply). |
| **Supporting Modules** | `assistant`, `reports`, `admin` | `src/features/assistant/`<br/>`src/features/reports/`<br/>`src/features/admin/` | AI decision explanations, Excel exports, system administration & monitoring. |

---

## 2. Multi-Developer Collaboration Rules

### Rule 1: Strict Feature Folder Isolation
Each contributor must work primarily inside their assigned `src/features/<feature-name>/` directory.
- **Do NOT** modify files in another developer's feature directory unless explicitly coordinated in a shared task.
- If Feature A needs a component or utility originally created in Feature B:
  1. If it is generic and domain-agnostic, move it to `src/components/ui`, `src/components/feedback`, or `src/components/data-display`.
  2. If it is domain-specific, coordinate with the domain owner before importing or refactoring.

### Rule 2: Shared UI Primitives
- The files in `src/components/ui/`, `src/components/feedback/`, `src/components/data-display/`, and `src/layouts/` are shared foundations.
- Do not make ad-hoc modifications or breaking changes to shared primitives without team alignment.
- New primitive components should follow the one-component-per-file convention and be re-exported in the directory's `index.ts`.

### Rule 3: Single Source of Truth for API
- All feature API modules must consume the shared `httpClient` from `src/services/api`.
- Do not create custom fetch wrappers or duplicate API error handling inside individual feature folders.

---

## 3. Recommended Git Branch Naming Convention

Each developer should create feature branches prefixed with their domain track:

```text
feature/auth-login-flow               # Track 1
feature/onboarding-wizard             # Track 1
feature/owner-dashboard-kpi           # Track 2
feature/analytics-revenue-trend       # Track 2
feature/catalog-product-list          # Track 3
feature/inventory-balances-table      # Track 4
feature/alerts-queue-drawer           # Track 4
feature/orders-fulfillment-flow       # Track 5
feature/pricing-recommendations-queue # Track 5
```
