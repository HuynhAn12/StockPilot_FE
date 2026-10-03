---
name: stockpilot-ui
description: Use when implementing, reviewing, or planning StockPilot frontend UI. Combines StockPilot product rules, local UI plan, design-system guidance, and safe React/shadcn/Radix frontend practices without redefining business logic.
---

# StockPilot UI

Use this skill for StockPilot frontend work only.

## Required Reading

Before planning or changing UI, read these project files in order:

1. `docs/AI_CONTEXT_MEMORY.md`
2. `docs/UI_UX_IMPLEMENTATION_PLAN.md`
3. `docs/DESIGN_SYSTEM.md` if present, otherwise `docs/DESIGN_SYSTEM_TODO.md`
4. Existing components, routes, layouts, services, and feature folders relevant to the requested screen

If a requested behavior conflicts with the project docs, the project docs win. If backend contracts are missing, mark the interface `TODO API-CONTRACT` or ask for the contract instead of inventing endpoints.

## Business Boundaries

- Maintain role separation for `STORE_OWNER`, `WAREHOUSE_STAFF`, and `ADMIN`.
- Do not invent backend API endpoints, database fields, permissions, inventory rules, pricing rules, or Decision Engine behavior.
- Do not change backend architecture from frontend work.
- Do not auto-apply pricing recommendations.
- Do not let the AI Assistant modify business data.
- Do not optimistically confirm inventory, order, pricing, permission, or destructive mutations; wait for backend confirmation.
- Keep AI explanations separate from deterministic Decision Engine outputs and measured business facts.
- Never send passwords, tokens, credentials, unrelated records, customer PII, or unauthorized store data to AI.

## UI Implementation Rules

- Vietnamese-first copy unless the requested feature explicitly needs English.
- Inspect existing primitives before creating new ones.
- Prefer reusable UI primitives and project conventions.
- Use shadcn/ui and Radix UI where appropriate.
- Design desktop, tablet, and mobile intentionally.
- Implement loading, empty, error, permission, disabled, validation, and success states.
- Use field-level validation and duplicate-submit prevention for forms.
- Use server pagination or explicit API-contract TODOs for large lists.
- Use accessible labels, keyboard focus, focus traps for dialogs, `aria-live` for async availability checks, and text/icon status indicators.
- Respect `prefers-reduced-motion`; keep motion restrained and purposeful.
- Use charts only with labels, tooltips, and text summaries.
- Avoid generic AI SaaS style, excessive gradients, glassmorphism, card overload, decorative dashboards, and unnecessary animations.

## Design Guidance

Use the installed `frontend-design` skill only as visual and copy guidance. It must not override StockPilot docs, route permissions, inventory and pricing semantics, API contracts, or security boundaries.

StockPilot should feel like calm, reliable, data-focused retail operations software for Vietnamese SMEs: efficient, readable, dense where useful, and clear under slow networks or operational pressure.

## Verification

Before handoff after implementation:

- Run the existing repo validation commands only if they exist.
- Prefer `npm run lint`, `npm run typecheck`, `npm run build`, and lightweight tests when available.
- Use browser or screenshot review when available for UI changes.
- Report any skipped validation clearly, including when the frontend app is not yet initialized.
