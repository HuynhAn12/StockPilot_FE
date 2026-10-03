# StockPilot Frontend — UI/UX Implementation Plan

> Canonical product context: `docs/AI_CONTEXT_MEMORY.md`

## 1. UX objective

Build a responsive Vietnamese-first business application where a new Store Owner can create an account, create one store, reserve a unique StockPilot store address/subdomain, configure business defaults, add/import data, see a meaningful dashboard, act on inventory risks, review pricing recommendations, and use AI for explanation.

Warehouse Staff receives an operations-first UI. Admin receives a system-control UI.

## 2. Experience principles

- **Action before decoration:** authenticated UI prioritizes speed and clarity.
- **Role-specific density:** Owner = KPI + decisions + operations; Warehouse = work queue + stock; Admin = users + system + audit.
- **Explain decision support:** every alert/recommendation must show its factors.
- **Confirm high-impact actions:** stock, orders, prices, permissions, destructive actions.
- **Progressive onboarding:** no giant registration form.
- **Mobile is operational:** not merely a shrunk desktop.

## 3. Design system

### Suggested tokens

```css
:root {
  --bg: #F7F8FA;
  --surface: #FFFFFF;
  --surface-muted: #F1F5F9;
  --border: #E2E8F0;
  --text: #0F172A;
  --text-muted: #64748B;
  --primary: #2563EB;
  --primary-hover: #1D4ED8;
  --primary-soft: #DBEAFE;
  --success: #16A34A;
  --success-soft: #DCFCE7;
  --warning: #D97706;
  --warning-soft: #FEF3C7;
  --danger: #DC2626;
  --danger-soft: #FEE2E2;
  --info: #0284C7;
  --info-soft: #E0F2FE;
}
```

Rules:
- Red only for critical/destructive.
- Status includes icon/text, not just color.
- Charts need labels/tooltips/text summary.

### Typography
- Inter/system sans.
- Page title 28–32 desktop, 22–24 mobile.
- Section title 18–20.
- Body 14–16.
- Table/meta 13–14.
- Tabular numerals for money/quantity where possible.

### Components to build early
Button, IconButton, Input, PasswordInput, Select/Combobox, Checkbox, Radio, Textarea, FormField, SearchInput, DateRangePicker, Badge, StatusBadge, RiskBadge, Card, KPI Card, Alert, Toast, Modal/ConfirmDialog, Drawer/Sheet, Tabs, Breadcrumb, Pagination, DataTable, EmptyState, ErrorState, Skeleton, FileDropzone, Stepper, ChartCard, Money/Quantity formatters.

## 4. Application shells

### Public/Auth shell
Desktop 2-column: product identity left, form right. Mobile single column with form first.

### Owner shell
Desktop: collapsible sidebar + sticky top bar + content area. No store switcher in MVP because one store/account.

Sidebar:
- Tổng quan
- Bán hàng
- Sản phẩm
- Kho hàng
- Phân tích
- Cảnh báo
- Gợi ý giá
- AI Assistant
- Báo cáo
- Nhập/Xuất dữ liệu
- Cài đặt

### Warehouse shell
- Tổng quan
- Tồn kho
- Nhập kho
- Xuất kho
- Kiểm kho
- Đơn cần xử lý
- Cảnh báo kho
- Thông báo

### Admin shell
- Tổng quan hệ thống
- Người dùng
- Cửa hàng
- Vai trò & quyền
- Cấu hình hệ thống
- Nhật ký
- AI monitoring
- System health
- Notifications

Show a visible **System Administration** scope label.

### Mobile navigation
Owner: Tổng quan / Sản phẩm / Kho / Cảnh báo / Thêm.  
Warehouse: Tổng quan / Kho / Nhập-Xuất / Đơn / Cảnh báo.  
Admin: Tổng quan / Users / Stores / Logs / More.

## 5. Registration/onboarding UI

Route: `/register`, 5-step wizard.

### Step 1 — Tài khoản của bạn
Fields: full name, email, phone, password, confirm password, terms/privacy. Optional language. Password strength hints; blur validation; password never persisted.

### Step 2 — Thông tin cửa hàng
Fields: store name, business type, representative, province/city, district, ward, address, store phone/email, tax code optional, business registration name optional, logo optional.

Desktop: 2-column. Mobile: 1-column.

### Step 3 — Địa chỉ cửa hàng
Core control:
`[ an-phat ] .stockpilot.vn`

States: idle / invalid / checking / available / unavailable + suggestions / network error + retry.

Preview card shows store name + address + explanatory copy. Do not say “domain purchased”. Future custom-domain section stays hidden or disabled unless backend supports DNS verification.

### Step 4 — Thiết lập kinh doanh
- Currency VND
- Timezone Asia/Ho_Chi_Minh
- Primary category
- Default low-stock threshold
- Default minimum margin
- Current sales channel
- Historical data available?

Add “Có thể thay đổi sau”.

### Step 5 — Xác nhận
Summary cards: Account / Store / Store address / Business defaults. Never show password.

Buttons: Back + Create store.

Success: subtle success, show store address, CTA “Tiếp tục thiết lập StockPilot”.

### Edge cases
| Case | UI |
|---|---|
| Email exists | Return Step 1 + focus email |
| Slug taken | Return Step 3 + suggestions |
| Validation error | Return owning step |
| Timeout | Keep non-sensitive draft + retry |
| Duplicate submit | Disable CTA + single-flight |
| 5xx | Stable error panel + retry |
| Refresh | Restore non-sensitive draft if policy allows |

## 6. First-run setup

Route: `/app/getting-started`

Checklist:
1. Complete store profile.
2. Add/import categories/products.
3. Set opening inventory.
4. Import historical sales (optional).
5. Review stock threshold & margin.
6. Add warehouse staff (optional).
7. Open first dashboard.

Also show a dismissible setup card on dashboard until critical steps are complete.

## 7. Store Owner screens

### Dashboard
Hierarchy:
1. Header + date range + refresh.
2. KPI row.
3. Priority action strip.
4. Sales trend + inventory health.
5. Priority alerts.
6. Pricing recommendations waiting review.
7. Top/slow-moving products.
8. AI Assistant quick ask.

KPIs: revenue, orders, inventory value, margin if supported, stockout-risk count, overstock count, slow-moving count.

Mobile: compact grid, alerts immediately after KPIs, charts summarized/collapsible.

### Categories
Search, status filter, create/edit/archive, product count. Avoid drag reorder unless a real ordering field is needed.

### Products
Desktop columns: Product, SKU, Category, Selling price, Cost, Stock, Risk, Status, Actions.

Filters: search, category, status, risk, stock state.

Product detail tabs: Overview / Variants / Inventory / Sales / Alerts / Pricing history.

### Orders
List: order code, customer/reference, date, items, total, status, fulfillment, actions. Detail: status timeline, sale-time item snapshot, inventory impact, returns/refunds, relevant audit metadata.

### Inventory
Overview: search product/SKU, current quantity, available/reserved if supported, threshold, days of cover, risk, last movement.

Actions: Stock in / Stock out / Adjust / Stock take.

Mutation form shows current -> change -> resulting quantity, reason/reference, confirmation.

### Analytics
Revenue trend, order trend, units sold, margin if supported, product/category performance, sales velocity, returns. Date/category/product filters. Export if backend supports.

### Smart Alerts
Queue-first UI with severity counts, filters, priority sort, detail drawer showing risk type, score/confidence, factors, evidence, explanation, related links, status.

### Pricing
Queue: product, current price, recommendation, action, margin, confidence, reason, status.

Detail: current vs recommended, min-margin guardrail, velocity/trend, inventory condition, factors, engine version, history.

Actions: Accept / Modify / Reject / Apply approved price. Apply requires confirm modal.

### AI Assistant
Desktop chat + right context panel. Mobile context bottom sheet.

Starter chips:
- Giải thích cảnh báo quan trọng nhất
- Tóm tắt tình trạng tồn kho
- Vì sao hệ thống đề xuất giá này?
- Sản phẩm nào bán chậm?

Each answer includes context freshness, related links, AI explanation label, missing-data warning.

### Reports
Sales / Inventory / Product performance / Decision outputs if supported. Async export states: pending / ready / failed.

### Import/Export
1. Choose data type.
2. Download template.
3. Upload.
4. Validate/preview.
5. Row-level errors.
6. Import valid rows.
7. Result summary.

### Store settings
Tabs: Profile / Store address / Inventory defaults / Pricing defaults / Staff & access / Notifications / Data/import / Security.

Changing slug is high-impact: warn, re-check, confirm, let backend decide if allowed.

## 8. Warehouse Staff screens

### Overview
Cards: low stock, pending stock-in, pending stock-out/fulfillment, stock-take tasks, critical alerts. Sections: today’s tasks, recent movements, urgent alerts.

### Stock operations
Fast SKU/barcode search if supported, quantity-friendly input, reason/reference, current -> resulting quantity, confirmation, success receipt.

### Stock take
Open session -> count -> variance -> review -> submit. Mobile uses large controls and sticky Save count.

### Fulfillment
Orders needing warehouse action, items/qty/availability/state/stock impact.

## 9. Admin screens

### System dashboard
Active users, stores, failed jobs/imports, critical system alerts, AI status/usage, recent security/audit events.

### Users
Filters by role/status/store/date. Actions: view, status, role/permission change, approved assistance actions. Never show password/token.

### Stores
Store name, slug/domain, owner, status, counts if available, created date. No unaudited impersonation feature.

### Roles & permissions
Permission matrix. Confirm privilege escalation changes.

### Audit logs
Filters actor/action/entity/store/date/severity. Detail drawer with who/what/when/target/result/safe metadata.

### AI monitoring
Volume, error rate, token/cost metrics if available, latency, fallback count, validation/policy failures. Conversation content permission-gated.

## 10. Frontend architecture

```text
src/
  app/
    router/
    providers/
  assets/
  components/
    ui/
    feedback/
    data-display/
  layouts/
    PublicLayout.tsx
    OwnerLayout.tsx
    WarehouseLayout.tsx
    AdminLayout.tsx
  features/
    auth/
    onboarding/
    dashboard/
    catalog/
    orders/
    inventory/
    analytics/
    alerts/
    pricing/
    assistant/
    reports/
    imports/
    notifications/
    settings/
    admin/
  services/
    api/
  types/
  hooks/
  lib/
  styles/
```

Feature folders may contain `components/`, `pages/`, `hooks/`, `schemas/`, `types.ts`, `api.ts`.

## 11. State/data strategy

Recommended if team approves:
- Server state: TanStack Query.
- Forms: React Hook Form + Zod resolver.
- Local state: component state first.

Do not mirror all server data into a global store. No optimistic mutation for inventory, order completion, price apply, or permission changes unless backend has safe concurrency semantics.

## 12. API/error contract

```ts
type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
};
```

Important codes:
`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `EMAIL_ALREADY_EXISTS`, `STORE_SLUG_UNAVAILABLE`, `ENTITY_NOT_FOUND`, `INVENTORY_CONFLICT`, `INSUFFICIENT_STOCK`, `STALE_RECOMMENDATION`, `RATE_LIMITED`, `AI_UNAVAILABLE`.

Drive logic by stable error code, not human message strings.

## 13. Responsive breakpoints

Suggested:
- <640 mobile
- 640–767 small tablet
- 768–1023 tablet
- >=1024 desktop
- >=1440 wide

On mobile, critical status/risk/quantity remains visible. Secondary table fields can move to drawer/detail.

## 14. Accessibility

Keyboard navigation, visible focus, labels, `aria-live` for slug availability, modal focus trap, adequate contrast, icon/text status, text summary for charts, ~44px frequent touch targets, reduced-motion support.

## 15. Performance

- Route code-splitting.
- Lazy-load charts/import modules.
- Paginate large lists.
- Debounce search/slug availability.
- Bound chart datasets.
- Avoid global-state rerender storms.
- Skeleton initial data.
- AI availability must not block dashboard/core features.

## 16. Motion guidelines

- 120–180ms hover/focus/press.
- 180–240ms modal/drawer.
- Small opacity/translate transitions.
- Avoid scale on every card click, route transitions that delay interaction, looping dashboard decoration, large blur/parallax.

## 17. Implementation phases

### Phase 0 — Foundation
Vite + React + TS, lint/format, router, API client, tokens, UI primitives, role layouts/guards.

### Phase 1 — Auth + owner onboarding
Login/reset, 5-step registration, slug check, review/create, error mapping, first-run checklist.

### Phase 2 — Catalog + inventory
Categories, products, inventory overview, stock-in/out/adjustment, movements, stock take.

### Phase 3 — Orders + analytics
Orders, returns/refunds, Owner dashboard, Warehouse overview, analytics.

### Phase 4 — Decision support
Alerts, pricing queue/detail, accept/reject/modify/apply, history.

### Phase 5 — AI Assistant
Chat/explanation UI, contextual entry points, related links, fallback.

### Phase 6 — Admin
Dashboard, users/stores, roles/permissions, logs, AI/system monitoring.

### Phase 7 — Hardening
Accessibility, responsive, errors, performance, E2E, production build audit.

## 18. Critical test scenarios

1. Register owner with valid store slug.
2. Duplicate email rejected.
3. Duplicate slug rejected/resolved.
4. Login + role redirect.
5. Owner blocked from admin route.
6. Warehouse blocked from owner pricing settings.
7. Create product.
8. Stock-in updates only after server success.
9. Insufficient stock error.
10. Order/inventory conflict handling.
11. Alert detail shows factors.
12. Pricing modify + confirmation.
13. Expired recommendation blocked.
14. AI unavailable fallback.
15. Admin permission change confirmation.
16. Mobile onboarding at 360px.
17. Mobile warehouse stock operation.
18. Keyboard registration.
19. Slow network loading states.
20. 5xx does not lose non-sensitive onboarding data.

## 19. Definition of Done per screen

- Correct role and route guard.
- Intentional desktop/mobile layout.
- Loading, empty, error, permission states.
- Validation.
- Duplicate-submit prevention.
- Persistent success/failure feedback.
- Confirmation where needed.
- Typed API calls.
- No secrets/sensitive logs.
- Accessibility basics.
- No contradiction with `AI_CONTEXT_MEMORY.md`.

## 20. Immediate coding order

1. Initialize React + TypeScript + Vite.
2. Add routing and role shells.
3. Add design tokens + primitives.
4. Implement `features/onboarding` first because Account + Store + slug context is foundational.
5. Add typed onboarding API contract.
6. Build Owner shell + first-run setup.
7. Continue Catalog -> Inventory -> Orders -> Dashboard -> Alerts -> Pricing -> AI -> Admin.

Do not start with charts or AI chat before account/store/onboarding data model is stable.
