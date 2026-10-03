# StockPilot Design System

StockPilot should feel like calm, reliable retail operations software for Vietnamese SME retailers. The system favors compact density, legible data, restrained surfaces, and clear operational states over decorative dashboard styling.

## Principles

- Action before decoration: tools, filters, and status should be immediately scannable.
- Compact but readable: authenticated screens can be dense, but labels, numbers, and controls must breathe.
- Trust through restraint: use neutral surfaces, clear hierarchy, consistent spacing, and limited motion.
- Status is never color-only: pair semantic color with text and icons.
- Mobile is operational: preserve primary actions, risk, quantity, and status before secondary metadata.

## Colors

| Token | Hex | Use |
|---|---:|---|
| `--sp-bg` | `#F7F8FA` | App background |
| `--sp-bg-subtle` | `#F1F5F9` | Muted bands and secondary controls |
| `--sp-surface` | `#FFFFFF` | Primary panels, cards, fields |
| `--sp-border` | `#DBE3EE` | Default borders |
| `--sp-border-strong` | `#CBD5E1` | Tables, dividers, selected outlines |
| `--sp-text` | `#0F172A` | Primary text |
| `--sp-text-muted` | `#5F6F86` | Secondary text |
| `--sp-primary` | `#2563EB` | Primary actions and selected states |
| `--sp-success` | `#15803D` | Completed, healthy, accepted |
| `--sp-warning` | `#B45309` | Needs attention, medium risk |
| `--sp-danger` | `#DC2626` | Critical and destructive only |
| `--sp-info` | `#0369A1` | Informational states |
| `--sp-purple` | `#6D28D9` | AI/explanation labels only |

Use blue as the main action color, green for positive confirmation, amber for warning, red only for critical/destructive states, and purple sparingly to distinguish AI explanation from deterministic business data.

## Typography

- Font stack: Inter, system sans-serif.
- Page title: 24px mobile, 28-32px desktop, 700 weight, 1.2 line-height.
- Section title: 18-20px, 650-700 weight.
- Body: 14-16px, 1.5 line-height.
- Table/meta text: 13-14px.
- Use tabular numerals for money, quantities, percentages, and KPI values.
- Do not use oversized authenticated headings or decorative all-caps labels.

## Spacing

- Base spacing unit: 4px.
- Page gutters: 16px mobile, 24px tablet, 28-32px desktop.
- Panel padding: 16px mobile, 20-24px desktop.
- Dense table rows: 48px default, 56px when actions are present.
- Form field gap: 6px label-to-control, 16px between fields.

## Radius And Shadows

- Small controls and badges: 6px.
- Inputs, buttons, cards, and panels: 8px.
- Dialogs and drawers: 10px.
- Shadows are sparse: use borders first, `--sp-shadow-sm` for light lift, `--sp-shadow-md` for dialogs/drawers.

## Surface Hierarchy

1. App background: `--sp-bg`.
2. Raised surfaces: white panels with 1px border.
3. Active rows and soft states: `--sp-bg-subtle` or semantic soft colors.
4. Dialog/drawer overlays: white surface, strong border, medium shadow.

Avoid nested cards. Use tables, lists, bands, and simple panels for dense operational information.

## Controls

- Button heights: 32px small, 38px medium, 44px large.
- Input/select heights: 38px default, 44px mobile-friendly.
- Icon buttons: 36px square default; icons 16-18px.
- Sidebar item height: 36px desktop, 44px mobile drawer.
- Visible focus is required on every interactive control.

## Badges And Semantic States

- Badges use icon + text where status matters.
- Status states: draft, active, inactive, pending, completed, failed, archived.
- Risk states: low, medium, high, critical.
- Low confidence must be shown as uncertainty, not as a definitive warning.

## Tables

- Default table text: 13-14px.
- Header text is sentence case, 12-13px, medium weight.
- Keep SKU, quantity, money, margin, and risk values visible in desktop tables.
- On mobile, transform large tables into stacked rows/cards with the primary entity, quantity/status/risk, and main action visible.

## Charts

- Charts must include a title, text summary, tooltip, axis labels where useful, and an empty/error state.
- Use restrained colors from the design system.
- Bound chart height to avoid dominating operations screens.

## Responsive Behavior

- `<640px`: single-column forms, mobile nav/drawer, table-to-card presentation.
- `640-767px`: two-column where content remains readable.
- `768-1023px`: tablet shell, compact sidebar or sheet navigation.
- `>=1024px`: desktop sidebar with sticky top bar.
- `>=1440px`: constrain readable content width rather than stretching tables blindly.

## Motion

- Hover/focus/press: 120-180ms.
- Dialog/drawer: 180-240ms.
- Use opacity/translate changes only where they clarify state.
- Respect `prefers-reduced-motion`.

## Accessibility

- Keyboard navigation and visible focus are required.
- Use labels for fields and `aria-live` for async availability/status messages.
- Dialogs and sheets must trap focus through Radix primitives.
- Do not rely on color alone for risk or status.
- Frequent touch targets should be about 44px on mobile.

## Component Direction

Build from reusable primitives: Button, IconButton, Input, PasswordInput, Select, Combobox, Checkbox, Radio, Textarea, FormField, Badge, StatusBadge, RiskBadge, Card, MetricCard, DataTable, EmptyState, ErrorState, Skeleton, ConfirmDialog, Modal, Drawer, Sheet, Tabs, Breadcrumb, Pagination, Stepper, and ChartCard.
