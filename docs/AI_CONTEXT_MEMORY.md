# StockPilot — AI Context Memory

> Canonical context for any AI/code agent working on `StockPilot_FE`.
>
> Read this file before creating screens, routes, components, forms, API contracts, mock data, or changing navigation. Do not invent a feature that conflicts with this document. If backend contracts are unknown, keep interfaces explicit and mark them `TODO API-CONTRACT`.

## 1. Product identity

**Name:** StockPilot  
**Full title:** Smart Inventory and Pricing Decision Support System  
**Primary market:** Vietnamese small and medium-sized retailers (SMEs)  
**Product type:** Responsive web application  
**Frontend:** React.js + TypeScript + Vite  
**Charts:** Recharts  
**Backend:** Node.js 24 LTS + Express.js  
**Database:** MySQL 8.4 / InnoDB + Prisma ORM  
**Decision support:** Deterministic TypeScript Decision Engine  
**AI:** OpenAI Responses API called from backend only  
**Authentication:** JWT + RBAC

StockPilot helps retailers manage daily retail data and make clearer inventory/pricing decisions. The system combines operational management with analytics, inventory-risk detection, pricing recommendations, and AI-assisted explanations.

## 2. Non-negotiable product rules

1. MVP = one store per Store Owner account.
2. MVP = one warehouse/location per store.
3. Main roles: `STORE_OWNER`, `WAREHOUSE_STAFF`, `ADMIN`.
4. Pricing recommendations are advisory. The user must explicitly accept, reject, or modify before application.
5. AI does not independently modify product price, inventory, orders, alerts, or recommendations.
6. AI explanations use only authorized store data and Decision Engine outputs.
7. Customer PII, passwords, tokens, DB credentials, and unrelated records must never be sent to AI.
8. Order/inventory operations must preserve consistency; UI never shows success before backend confirmation.
9. Standard dashboard/analytics requests target < 2 seconds in the MVP test environment.
10. UI must work on desktop, tablet, mobile, modest hardware, and unstable networks.

## 3. Roles and responsibilities

### Store Owner
Can register, create store profile, manage account/store settings, categories, products, variants, prices, imports/exports, orders, returns/refunds, inventory, analytics, alerts, pricing recommendations, AI Assistant, notifications, and staff where supported.

### Warehouse Staff
Can manage permitted warehouse operations: products read/permitted edit, stock-in/out, stock take, adjustments, order fulfillment, inventory alerts, notifications. Should not see store-level finance/system admin unless explicitly granted.

### Admin
System-level role for users, roles, permissions, account status, stores, system configuration, audit logs, system health, and AI/Decision Engine monitoring.

## 4. Registration & onboarding — required frontend flow

The registration experience is a structured owner onboarding flow, not a single email/password form.

### Meaning of “register domain”
For MVP, this means reserving a **unique StockPilot store address / subdomain slug**, for example:

`an-phat.stockpilot.vn`

The frontend must not pretend it purchased a public internet domain. Buying or renewing arbitrary domains requires registrar integration and billing and is outside the current MVP unless the backend explicitly adds it. A future optional custom-domain flow may use DNS verification.

### State machine
`START -> ACCOUNT -> STORE_IDENTITY -> STORE_ADDRESS -> BUSINESS_PROFILE -> REVIEW -> CREATE -> VERIFY/LOGIN -> INITIAL_SETUP -> DASHBOARD`

### Step A — Account information
Required:
- Full name
- Email
- Phone
- Password
- Confirm password
- Terms/Privacy acceptance

Optional:
- Preferred language (`vi` default, `en` supported)

Rules:
- Normalize email lowercase.
- Validate Vietnamese phone format.
- Strong password policy.
- Never persist plaintext password in localStorage/sessionStorage.

### Step B — Store identity
Required:
- Store name
- Business/store type
- Owner/representative name
- Province/city

Optional/recommended:
- District/ward
- Detailed address
- Tax code
- Business registration name
- Store phone
- Store email
- Logo

Tax/business-registration fields should remain optional unless backend/business policy requires them.

### Step C — Store address / domain slug
Required:
- Desired slug, e.g. `an-phat`
- Live preview: `an-phat.<stockpilot-domain>`

Frontend behavior:
- Lowercase automatically.
- Suggest transliterated Vietnamese slug.
- Allow letters, numbers, hyphens only.
- No leading/trailing hyphen.
- Target length 3–40 chars.
- Debounced availability check.
- States: checking / available / unavailable / invalid / network error.
- Suggest alternatives when unavailable.
- Block reserved words such as `admin`, `api`, `www`, `support`, `auth`, `login`, `system`.

API concept:
`GET /api/onboarding/store-slugs/check?slug=...`

Example response:
`{ "available": true, "normalizedSlug": "an-phat", "suggestions": [] }`

The frontend availability result is not authoritative; backend must re-check uniqueness transactionally on create.

### Step D — Business profile
Required/defaults:
- Currency: VND
- Time zone: Asia/Ho_Chi_Minh
- Default low-stock threshold
- Default minimum margin rule
- Primary retail category

Optional:
- Expected product count
- Current sales channel
- Historical data available for CSV/Excel import

### Step E — Review & create
Show grouped summary:
- Account
- Store
- Store address
- Business settings

Never show password.

Primary CTA: **Create my StockPilot store**

Error routing:
- Email conflict `409` -> Step Account
- Slug conflict `409` -> Step Store Address
- Validation error -> owning step
- 5xx -> preserve non-sensitive draft and allow safe retry

### Recommended atomic backend command
`POST /api/onboarding/register-owner`

Conceptual payload:

```ts
type RegisterOwnerPayload = {
  account: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    locale: "vi" | "en";
  };
  store: {
    name: string;
    slug: string;
    businessType: string;
    representativeName: string;
    provinceCode: string;
    districtCode?: string;
    wardCode?: string;
    addressLine?: string;
    taxCode?: string;
    businessRegistrationName?: string;
    phone?: string;
    email?: string;
  };
  preferences: {
    currency: "VND";
    timezone: "Asia/Ho_Chi_Minh";
    defaultLowStockThreshold: number;
    defaultMinimumMarginPercent: number;
    primaryCategory?: string;
    currentSalesChannel?: string;
    hasHistoricalData?: boolean;
  };
  legal: {
    acceptedTerms: true;
    acceptedPrivacy: true;
  };
};
```

Expected backend atomic flow:
1. Normalize and validate.
2. Re-check email and slug uniqueness.
3. Create Store.
4. Create Store Owner linked to Store.
5. Hash password.
6. Create baseline Store Settings.
7. Create baseline EngineConfig.
8. Write audit event.
9. Commit transaction.
10. Return verification/auth result per security policy.

If a step fails, frontend must not show a partially-created store as successful.

## 5. First-run setup

After creation, guide the Store Owner through:
1. Complete store profile.
2. Add/import categories and products.
3. Set opening inventory balances.
4. Import historical sales (optional).
5. Review inventory thresholds & minimum margin.
6. Invite warehouse staff (optional).
7. Open dashboard.

Show a progress checklist until critical tasks are complete. Optional setup must be skippable.

## 6. Main information architecture

### Public
- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/terms`
- `/privacy`

### Shared authenticated
- `/app/profile`
- `/app/notifications`

### Store Owner
- `/app/dashboard`
- `/app/catalog/categories`
- `/app/catalog/products`
- `/app/catalog/products/:id`
- `/app/orders`
- `/app/orders/:id`
- `/app/returns`
- `/app/inventory`
- `/app/inventory/movements`
- `/app/inventory/stock-take`
- `/app/analytics`
- `/app/alerts`
- `/app/pricing`
- `/app/pricing/:recommendationId`
- `/app/assistant`
- `/app/reports`
- `/app/import-export`
- `/app/settings/store`
- `/app/settings/staff`
- `/app/settings/decision-engine`

### Warehouse Staff
Default: `/app/warehouse/overview`

Primary areas: products, inventory, stock-in, stock-out, stock-take, order fulfillment, inventory alerts, notifications.

### Admin
- `/admin/dashboard`
- `/admin/users`
- `/admin/stores`
- `/admin/roles-permissions`
- `/admin/system-settings`
- `/admin/audit-logs`
- `/admin/ai-monitoring`
- `/admin/system-health`
- `/admin/notifications`

Never show menu items the current role cannot use. Route guards and backend auth are both required.

## 7. Dashboard meaning

Owner dashboard answers:
1. What is happening now?
2. What needs attention?
3. What decision should I review?
4. What changed over time?

Primary cards:
- Revenue
- Orders
- Inventory value
- Gross margin if supported
- Low-stock / stockout-risk count
- Overstock count
- Slow-moving count

Warehouse dashboard prioritizes tasks/stock, not executive revenue. Admin dashboard prioritizes system health/users/stores/audit/AI usage, not store decisions.

## 8. Inventory risk semantics

Decision Engine handles:
- `STOCKOUT_RISK`
- `OVERSTOCK`
- `SLOW_MOVING`

Each alert shows type, severity, risk score, confidence, product, current stock, sales velocity/trend, main factors, recommended review/action, detected time, status. Low confidence must not be presented as certainty.

## 9. Pricing recommendation semantics

May include current price, recommended price, final user price, action (`INCREASE | DECREASE | MAINTAIN`), margin, minimum margin, inventory condition, sales velocity/trend, factors, confidence, engine version, decision status.

Rules:
- Never auto-apply.
- Explicit confirmation before applying.
- Show reason/factors next to recommendation.
- Preserve decision history.
- Expired recommendations cannot be applied.

## 10. AI Decision Assistant semantics

AI is an explanation layer, not deterministic business truth.

Good prompts:
- Why is this product at stockout risk?
- Summarize highest-priority alerts.
- Explain this pricing recommendation.
- Which products are slow-moving based on current data?

Response UI should show answer, business-data timestamp, related entities/links, missing-data warnings, and clear separation between measured facts, deterministic engine output, and AI explanation.

## 11. Frontend data boundaries

Every store-scoped resource belongs to authenticated `storeId`; ordinary users never type store ID manually. Never trust client-supplied storeId as authorization.

Recommended layers:
- `features/*`
- `services/api/*`
- `types/*`
- `components/ui/*`
- `layouts/*`
- `routes/*`
- `hooks/*`
- `lib/*`

Use feature-based organization and keep API calls out of oversized page components.

## 12. UI behavior standards

- Vietnamese-first copy.
- Desktop may be dense; mobile prioritizes actions.
- Server pagination for large lists.
- URL-driven search/filter state for major lists.
- Skeletons for first load; local spinners for actions.
- Actionable empty states.
- Retry for safe failures.
- Toasts are secondary; critical outcomes stay visible.
- Destructive actions require confirmation.
- No optimistic finalization of stock/order/pricing mutations.
- Field-level validation + summary for multi-step forms.
- Unsaved-change warning for long forms.
- Charts must have text summaries/tooltips.
- Respect `prefers-reduced-motion`.

## 13. Design language

Desired: calm, reliable, data-focused retail operations software.

Avoid neon/gaming, excessive gradients, glassmorphism everywhere, huge authenticated hero blocks, over-animated cards, and red for normal actions.

Use neutral surfaces, strong spacing, accessible contrast, blue/indigo primary, green success, amber warning, red critical/destructive.

## 14. Security frontend rules

- Never store plaintext passwords.
- Never log auth tokens/passwords/reset codes/full sensitive prompts/PII.
- Hidden routes are not security; backend authorization remains authoritative.
- Sanitize/escape rendered data.
- Client upload validation is UX only; backend validation is authoritative.
- Treat custom-domain/DNS values as untrusted data.

## 15. Out of scope unless explicitly approved

- Shopee/Lazada/TikTok Shop direct API
- Native mobile apps
- Payment gateway
- Shipping management
- Multi-store/account
- Multi-warehouse/store
- Fully automatic pricing
- Fully automatic purchasing/replenishment
- Enterprise supply-chain optimization
- Real-time external POS/marketplace sync
- Languages beyond Vietnamese/English
- Automatic public-domain purchase via registrar

## 16. Agent checklist before implementation

1. Which role uses this screen?
2. What business goal does it serve?
3. What is the store scope?
4. Read-only or mutating?
5. Does it affect stock/orders/pricing/permissions?
6. What backend confirmation is required?
7. What are loading/empty/error/permission states?
8. What happens on mobile?
9. Does UI distinguish deterministic output from AI explanation?
10. Is it still inside MVP scope?

If unknown, add `TODO API-CONTRACT` or ask for the missing contract instead of inventing it.
