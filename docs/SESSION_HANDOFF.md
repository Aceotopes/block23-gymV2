# Session Handoff — Block23 Gym Management System

> Canonical handoff document for resuming development across Claude Code sessions.
> Last updated: **2026-06-27** (after DEV-LOG `#026` — POS sell/checkout/void; **Milestone 6 COMPLETE**).

---

## Project Status

- **Current Phase:** Phase 1 — MVP
- **Current Milestone:** **Milestone 6 — POS & Product Sales ✅ complete (`#025` catalog + `#026` sell/checkout/void).** Next: **Milestone 7 — Inventory.**
- **Overall Progress:**
  - **Planning & design:** 100% complete — 10 planning docs, 48 ADRs (ADR-030–032 intentionally unused), Design System hardened as enforceable SSOT.
  - **Implementation:** **Milestones 1–6 done (`#015`–`#026`).** 6 of 8 milestones complete. M5: payment method on every `CLIENT_TRANSACTION`; M3/M4 retrofitted; Payments module. M6: product catalog + category management; the POS sell screen (tabs/grid/search/cart + container mode), checkout (payment method + cash-change), `POS_SALE` with price/cost snapshots + `SALE` ledger entries decrementing `current_stock`, Force Sale (ADR-009/034), and POS History + additive void.
  - **M7 (next):** Inventory — restock (raises `current_stock` via PURCHASE ledger entries — products currently start at 0), manual adjustments (required reason category), Current Stock view (low-stock flag, reorder indicator, days-until-stockout, valuation footer, shrinkage column), remaining-servings display. Dashboard panels (US-2.10/2.11/5.4/7.6/7.7) land in M8.

---

## Last Completed Work

**DEV-LOG `#026` — POS Sell Screen, Checkout, Stock & History/Void (Milestone 6 COMPLETE)** (committed):

- **No schema migration.** **Pure lib** `lib/pos/cart.ts` (CartLine/CartMode, `stockDeduction` container=qty×spc, `cartTotal`/`lineSubtotal`/`changeDue`/`lineDescription`). **+5 tests (76 total).**
- **Cart store** (`pos-cart-store.ts`) — the Zustand store reserved for the POS cart (ADR-047); ephemeral, keyed by product+mode.
- **Checkout/void** (`pos-actions.ts`, interactive `$transaction`): `createPosSale` — server-authoritative price/cost snapshots (ADR-003/026), per-product stock gate (`needsForce` unless `force`), `POS_SALE` (client_id null, ADR-011) + PRODUCT line items + `SALE` ledger entries decrementing `current_stock`, cash≥total rule. **Force Sale** = full SALE deduction + a flagged `FORCED_SALE` ADJUSTMENT marker (qty 0) when stock goes negative (ADR-009/034). `voidPosSale` — required category (ADR-028), **additive reversal** (Flow 11): per-line ADJUSTMENT restoring `−Σ(ledger deltas)`, original SALE rows preserved, system reversal (null reason category + note).
- **UI:** `sell-view` (server, category tabs derived from products → empty categories hidden US-6.16) → `pos-screen` (search/tabs/grid/cart, /serv + /cont buttons for container products) → `checkout-dialog` (payment method + cash-change + Force Sale confirm). POS History (`pos-history-view` — today count+revenue strip, date/method filters, VOID badge) + filters + void action. `page.tsx` renders Sell / Products / History.
- Verified: type-check ✓ · lint ✓ · test 76/76 ✓ · build ✓ (`/pos` 12.2 kB) · **Neon smoke** (normal sale −3 units/−70 servings via container; Force Sale water→−3 + FORCED_SALE marker; void restored stock →0/140; today aggregate excluded the void, count 1/₱250; removed).

**DEV-LOG `#025` — Product Catalog & Categories (Milestone 6 Part 1)** (committed):

- **No schema migration** — `Product` / `ProductCategory` were authored in `#016`.
- **Pure lib** (`lib/products/`): `types.ts` (ProductType STANDARD/SERVING_BASED + labels + guard), `margin.ts` (`grossMargin` — pure ₱+%, US-6.15; `%` null at ₱0 selling; null when cost unset). **+6 tests (71 total).**
- **Schema + actions:** `pos/product-schema.ts` (Zod shared client+server; `superRefine` requires `servings_per_container` for SERVING_BASED; `normalizeProduct` strips serving fields from STANDARD). `product-actions.ts` (create/update/archive/restore — gym-scoped, category-ownership checked, soft delete ADR-005, never writes `current_stock`). `category-actions.ts` (create/rename, dup-name block, no delete at MVP).
- **UI:** POS `?view=` sub-nav (`pos-nav.tsx` — Sell / Products / History; Sell + History are Part-2 placeholders). Products view (server, URL search + show-archived ADR-047) + form dialog (RHF, type toggle reveals serving/container fields, live margin, category select) + row actions (Edit · Archive/Restore) + category manager (add + inline rename) + toolbar.
- **Scope boundary:** `current_stock` starts at 0 (ledger-driven, ADR-004); restock is M7; Force Sale + the sell screen are Part 2. Image is a URL field (R2 upload deferred).
- Verified: type-check ✓ · lint ✓ · test 71/71 ✓ · build ✓ (`/pos` 15.1 kB) · **Neon smoke** (STANDARD + SERVING_BASED create w/ serving fields, stock 0, price edit, archive excludes from active query, restore, category rename; removed).

**DEV-LOG `#024` — Client Payments (Milestone 5 COMPLETE)** (committed):

- **No schema migration** — `Transaction` / `TransactionLineItem` / `PaymentMethod` / `VoidReasonCategory` / `ItemType` were authored in `#016`.
- **Shared lib:** `lib/payments/method.ts` (PaymentMethod enum/labels/guard), `lib/payments/void.ts` (VoidReasonCategory enum/labels/guard, ADR-028), `lib/payments/collections.ts` (`summarizeCollections` — pure, all-four-methods + grand total). `lib/dates.ts` += `gymDayStartUtc` (instant ↔ gym-local-day bounds for `transaction_date`) + `formatDateTimeInTz`. **+9 tests (65 total).**
- **Retrofit M3** (`membership-{schema,actions,actions-ui}`): create + renew wrap `Membership` + `CLIENT_TRANSACTION` + one `MEMBERSHIP` line item (price snapshot, `referenceMembershipId`) in one interactive `$transaction`; dialog gains a payment-method `Select`. Membership History VOID badge now lights up.
- **Retrofit M4** (`attendance/actions.ts`, `check-in-view.tsx`): WALK_IN check-in creates attendance + `CLIENT_TRANSACTION` + `WALK_IN_FEE` line item atomically; `fee_override_note` set when fee ≠ default; fee dialog gains payment-method `Select`. Member visits create no transaction.
- **Payments module** (`payments/`): `?view=` sub-nav (History / Collections, ADR-047). History — chronological `CLIENT_TRANSACTION` table, URL filters (date preset / method / client name), VOID rows show category + note. Void (`actions.ts → voidClientTransaction`) — required category, note required only for `OTHER`, additive `status=VOID`, never cancels membership / deletes attendance. Collections — selected-day by-method totals + grand total spanning both transaction types (POS auto-included at M6), zero-day notice, today-capped date selector.
- Verified: type-check ✓ · lint ✓ · test 65/65 ✓ · build ✓ (`/payments` 12.2 kB) · **Neon smoke** (₱1000 GCash membership + ₱75 Cash walk-in via `$transaction`; today's collections = ₱1075; void left ₱1000 with attendance + live membership intact; removed).

**DEV-LOG `#023` — Attendance Analytics (Milestone 4, part 2 — M4 COMPLETE)** (committed):

- **Pure aggregations** (`lib/attendance/analytics.ts`): period presets + `analyticsRange`/`rangeDays`, `dailyTrend` (total+unique, gap-filled), `byHour` (UTC-hour buckets), `byDayOfWeek` (avg/weekday), `peakHours`/`peakDays`, `newVsReturning`. **+7 tests (56 total).**
- **View**: `analytics-view.tsx` (server — queries + shared derivation) + `analytics-charts.tsx` (client Recharts) + `analytics-period.tsx` (URL period selector). KPI cards, 3 charts, Member/Walk-In/Operational insight panels (links to Client List chips), Alerts (inactive/frequent counts + 20%-decline banner). Conversion per ADR-020; all counts reuse `deriveClient`.
- Verified: type-check ✓ · lint ✓ · test 56/56 ✓ · build ✓ (`/attendance` 126 kB) · **Neon smoke** (groupBy aggregations + trend/peak/dow; removed).

**DEV-LOG `#022` — Attendance core (Milestone 4, part 1)** (committed):

- Three-view module shell (`?view=` — Check-In / History / Analytics, ADR-023/047). **Check-In Station** (auto-focus search → derived branch cards → dialogs: duplicate-today, expired-member renewal redirect, upcoming-member walk-in, walk-in conversion redirect, fee entry, quick-create) + **Today's Check-Ins** (total/unique, 2nd-visit labels, correction). **Attendance History** (URL date presets + visit-type, table). **Correction** (same-day `time_in`, required reason, sets `updated_at`). **Client Profile** attendance tab filters + correction.
- Extended `lib/clients/derive.ts` (`deriveCheckInBranch`, `activeMembershipId`); `lib/attendance/{history,today}.ts`; `dates.ts` time helpers; `getSessionContext()` for `created_by`. **+11 tests (49 total).**
- Actions: `searchClientsForCheckIn`, `checkInClient` (snapshots membership, stamps created_by, records `fee_charged`), `correctAttendanceTime`. Walk-in fee **payment** deferred to M5 (US-5.1).
- Verified: type-check ✓ · lint ✓ · test 49/49 ✓ · build ✓ · **Neon runtime smoke** (branch derivation + snapshot link, today total/unique + 2nd-visit, correction sets updated_at, last-7 range; removed).

**DEV-LOG `#021` — Membership Management (Milestone 3)** (committed):

- **Centralized derivation extended** (`lib/clients/derive.ts`): `deriveMembershipAction` (add / renew / renew-early / upcoming-only), `deriveMembershipBlock` (active "Go to Renew" / upcoming informational / null), `latestRelevantEnd` + `computeRenewalDates` (ADR-040 renewal math, pure — server + dialog preview share it). `dates.ts`: `addDays` / `parseDateOnly` / `toDateInputValue`. **+20 unit tests (38 total).**
- **Membership Plan catalog in Settings** (US-3.9, Flow 13): `plan-schema.ts` + `plan-actions.ts` (create/update/retire/reactivate, gym-scoped, last-active-plan retirement blocked) + `membership-plans.tsx` (list + Add/Edit dialog with duration-type `Select` + custom-days + row ⋯). shadcn `select` added.
- **Create / Renew / Cancel** (`clients/[id]/membership-{schema,actions,actions-ui,row-actions}.tsx`): create (block re-checked server-side, `start_date >= today`, snapshot price, ad-hoc null plan), renew (renewal math + `renewed_from_membership_id`, prior record untouched), cancel (soft `cancelled_at` + required reason, independent of payment void). Client Profile button wired (was disabled in `#020`); history rows carry Cancel.
- **ADR-048:** month plan types → fixed `duration_days` 30/60/90 (`lib/memberships/duration.ts`).
- **Scope boundary:** membership **payment**/`Transaction` deferred to M5 (US-5.1) — M3 stores `price_paid` only.
- Verified: type-check ✓ · lint ✓ · test 38/38 ✓ · build ✓ · **runtime smoke on Neon** (plan + create/renew/cancel + ad-hoc custom, dates per ADR-040, then removed).

**DEV-LOG `#020` — Client Management (Milestone 2)** (committed):

- **ADR-047 (resolved the blocking decision):** list state (chip / search / archived / sort / page / tab / period) lives in **URL search params**; Zustand is reserved for the POS cart + sidebar; derived/filtered tables render on the server. Synced to DECISIONS / TECH-STACK / DESIGN-SYSTEM.
- **Centralized derivation** (`src/lib/clients/derive.ts`, + `dates.ts`, `list.ts`, `duplicate.ts`, `sort.ts`): `client_type` / member + walk-in status / at-risk / per-membership status / 8 chips, all computed at query time (ADR-002/017/019/037/040/041), never stored. **18 unit tests.**
- **Registration / Edit** (`ClientFormDialog` + zod + Server Actions, gym-scoped, server-revalidated) with a non-blocking fuzzy duplicate warning. **Client List** — server-rendered, URL-driven: 8 filter chips + partial-name search + show-archived + sortable Name/Expiry headers + pagination (25/page); row ⋯ → View / Edit / Archive·Reactivate. **Client Profile** — type+status header (no at-risk per US-2.11), quick-stats strip, details, context-aware membership button (disabled → M3), URL tabs (Membership History with Cancelled/VOID badges; Attendance History — filters → M4). Non-UUID id → 404.
- **Shared components built once:** `StatusBadge` / `ClientTypeBadge` / `AtRiskBadge` (§3.4), `EmptyState`, shadcn `badge` / `table` / `alert-dialog`; added on-canvas semantic text tokens (`--*-on`) to `globals.css` (DESIGN-SYSTEM §3.3 values) for AA badge text.
- Verified: type-check ✓ · lint ✓ · test 18/18 ✓ · build ✓ · **runtime smoke on Neon** (chip filtering + profiles + 404 verified with temporary data, then removed).

**DEV-LOG `#019` — Settings module (Milestone 1 COMPLETE)** (committed `5e36f23`):

- Gym Information (name/address/contact + searchable IANA timezone combobox — US-1.2), Pricing (default walk-in fee — US-1.3), System Preferences (4 thresholds, ≥1 validation — US-1.4/1.7/1.8/1.9). Membership Plans deferred to M3.
- `lib/gym.ts` (session-scoped gym helpers), shared Zod schema, `updateGymSettings` Server Action (re-validates server-side), RHF form with `sonner` toasts, `<Toaster/>` in the app layout. shadcn: form, popover, command, sonner.
- Verified: type-check ✓ · lint ✓ · test 2/2 ✓ · build ✓ · runtime smoke (`/settings` 200 with seeded values + all sections).

**DEV-LOG `#018` — Authenticated app shell (8-entry navigation)** (committed `d70cc4d`):

- Route group `src/app/(app)/` with a session-checked layout (authoritative `getSession`); dashboard moved in; placeholder pages for the other 7 nav areas.
- Topbar (wordmark + user menu with logout), collapsible desktop sidebar (8 entries, indigo active accent, 240px ⇄ 64px rail), mobile bottom nav + More sheet (DESIGN-SYSTEM §5.4/§12). Shared `lib/nav.ts` + `PageHeader`. shadcn: dropdown-menu, sheet, tooltip.
- Verified: type-check ✓ · lint ✓ · test 2/2 ✓ · build ✓ · runtime smoke (login 200, unauth dashboard → /login, authed dashboard/settings 200 with full nav).

**DEV-LOG `#017` — Better Auth: owner login, session, route protection (US-1.1)** (committed `46a1199`):

- Reworked `User` to Better Auth's native schema + added `Session`/`Account`/`Verification` tables (migration `add_better_auth`). Credential hash lives in `account` (ADR-046, owner-approved — supersedes the `password_hash`-on-`User` clause of ADR-043).
- `src/lib/auth.ts` (prismaAdapter, username plugin, sign-up disabled, `gymId`/`role` additional fields), auth client, `/api/auth/[...all]` handler, `src/middleware.ts` (default-deny), `/login` page+form (generic error), protected `/dashboard` (authoritative `getSession`) + logout, `prisma/seed.ts` (owner seed).
- Verified: type-check ✓ · lint ✓ · test 2/2 ✓ · build ✓ · **live sign-in round-trip on Neon** (correct → session with `role`/`gymId`; wrong password → `UNAUTHORIZED`). Placeholder seed data removed afterward.

**DEV-LOG `#016` — Domain schema, first migration, Prisma client singleton** (committed `7ccb403`):

- `prisma/schema.prisma`: all **11 domain entities** + 10 enums, authored to `DOMAIN-MODEL.md` and the locked ADRs (snake_case columns via `@map`, UUID v7 PKs, `Decimal(12,2)`, UTC `DateTime` / `@db.Date` / `@db.Time`, no stored derived status, soft deletes, snapshots, `gym_id` everywhere).
- First migration `20260626060051_init` **applied to Neon** (Singapore) — 11 tables, 10 enum types. Verified live (`prisma.gym.count()` round-trip).
- `src/lib/prisma.ts`: runtime client singleton via **`@prisma/adapter-pg`** on the pooled `DATABASE_URL` (Prisma 7 requires a driver adapter — see Known Issues / TECH-STACK).
- Prisma 7 connection wiring: schema `datasource` = provider only; URLs in `prisma.config.ts` (CLI → direct `DATABASE_URL_UNPOOLED`) and client constructor (runtime → pooled `DATABASE_URL`).
- Verified: type-check ✓ · lint ✓ · test 2/2 ✓ · build ✓ · migrate ✓.

**Commit `efc834a` — `build(#015): scaffold Next.js 15 application and lock project foundation`** (first application code in the repo):

- Next.js **15.5.19** App Router (Turbopack dev+build), React 19.1, TypeScript strict, `src/` dir, `@/*` alias, pnpm 11.1.2.
- All approved runtime + dev dependencies installed (see Tech Stack below).
- Design tokens authored in `src/app/globals.css` from DESIGN-SYSTEM §3 (slate/indigo core, semantic feedback, chart palette, radius scale, `@theme inline` map). `:root` = light, `.dark` = dark, `<html class="dark">` = dark-first default.
- Geist Sans + Geist Mono via `next/font/google` (`src/app/layout.tsx`).
- shadcn/ui pinned to classic **shadcn@2 on Radix** (not Base UI): `components.json` (new-york / slate / lucide / RSC), `cn` util (`src/lib/utils.ts`), Radix `Button` (`src/components/ui/button.tsx`).
- Prisma 7 initialized: `prisma.config.ts` (dotenv + `DATABASE_URL`), generator `prisma-client` → `src/generated/prisma` (gitignored). Schema currently **stub only** (generator + datasource, no models).
- Tooling: Prettier (+ tailwind plugin, docs excluded), Vitest (`@/` alias) with a `cn` smoke test, `pnpm-workspace.yaml` build allowlist, npm scripts (`type-check`, `lint`, `format`, `test`, `db:*`).
- `.env.example` documents the full variable set (Neon `DATABASE_URL`/`_UNPOOLED`, `BETTER_AUTH_*`, `R2_*`).
- Minimal dark-first placeholder home page exercising tokens + Button.

**Tooling-drift decisions made (owner-confirmed, both honor the locked stack):**
1. Next.js pinned to 15.x (the `create-next-app` default is now 16).
2. shadcn retained on Radix/new-york/slate via the `shadcn@2` CLI (the v4 default is now Base UI + preset themes).

---

## Current Architecture

- **Framework:** Next.js 15.5.19 (App Router, Server Components, Turbopack), React 19.1, TypeScript strict.
- **Database:** PostgreSQL on **Neon** (Singapore `ap-southeast-1`), accessed via **Prisma 7** + the `@prisma/adapter-pg` driver adapter. Generated client → `src/generated/prisma` (gitignored). 11 tables live; migration history in `prisma/migrations/`. Runtime uses the pooled URL; CLI/migrations use the direct URL.
- **Auth:** **Better Auth 1.6** against the domain `User` table (ADR-043/ADR-046). Login by **username + password** (username plugin); public sign-up disabled. `gym_id`/`role` are additional fields on the session (`{ userId, gymId, role }`). Credential hash in the Better-Auth-owned `account` table; `session`/`account`/`verification` are auth infra (exempt from `gym_id`). Default-deny route protection via `src/middleware.ts` (optimistic) + authoritative `getSession` in the protected layout. Owner provisioned by `prisma/seed.ts`.
- **UI system:** Tailwind CSS v4 + shadcn/ui (new-york, slate base, lucide icons) on Radix. Dark-first. Tokens as CSS variables in `globals.css` (theme = values flip). Fonts: Geist Sans / Geist Mono. Full language in `docs/DESIGN-SYSTEM.md` (ADR-045).
- **Other approved libs:** Zod 4 (validation), React Hook Form + `@hookform/resolvers`, TanStack Table + TanStack Query, Zustand (client state), Recharts (charts).
- **Project structure:**
  ```
  src/
    app/
      page.tsx            redirects to /dashboard
      login/              login page + client form (public)
      (app)/              authenticated route group — shell layout (getSession)
        layout.tsx        topbar + sidebar + mobile nav + TooltipProvider
        dashboard/        placeholder (full content in M8)
        attendance/       page (?view shell) + actions + attendance-nav
                          + check-in-view + today-checkins + history-view
                          + history-filters + attendance-correction
                          + analytics-view + analytics-charts + analytics-period
        payments/         page (?view shell) + payments-nav + actions (void)
                          + history-view + payment-filters + void-action
                          + collections-view + collections-date (M5)
        pos/              page (?view shell) + pos-nav · Products: products-view
                          + products-toolbar + products-search-params
                          + product-form-dialog + product-row-actions
                          + product-schema + product-actions + new-product-button
                          + category-manager + category-actions (M6 Part 1) ·
                          Sell: sell-view + pos-screen + pos-cart-store
                          + checkout-dialog + pos-actions · History: pos-history-view
                          + pos-history-filters + pos-void-action (M6 Part 2)
        inventory, reports/  placeholders
        settings/         page + settings-form + timezone-combobox + actions + schema
                          + membership-plans + plan-actions + plan-schema (US-3.9)
        clients/          page (list) + actions + client-schema + search-params
                          + new-client-button + clients-toolbar + client-filter-chips
                          + clients-table + client-row-actions + client-form-dialog
          [id]/           page (profile) + membership-schema + membership-actions
                          + membership-actions-ui + membership-row-actions (M3)
      api/auth/[...all]/  Better Auth handler
      layout.tsx, globals.css (tokens + on-canvas semantic text --*-on)
    components/
      app-shell/        topbar, app-sidebar, mobile-nav, user-menu, sidebar-store
      status-badge.tsx, empty-state.tsx, page-header.tsx, logout-button.tsx
      ui/ (button, card, input, label, dropdown-menu, sheet, tooltip, form, popover,
           command, sonner, dialog, badge, table, alert-dialog, select)
    lib/              auth.ts, auth-client.ts, prisma.ts, gym.ts, nav.ts, dates.ts,
                      utils.ts (+ test); clients/ (derive[+test], list, sort,
                      duplicate); memberships/ (duration[+test]);
                      attendance/ (history, today, analytics, +tests);
                      payments/ (method, void, collections [+test]); dates (+test);
                      products/ (types, margin [+test]); pos/ (cart [+test])
    middleware.ts     default-deny route protection
    generated/        prisma client (gitignored, regenerated via `pnpm db:generate`)
  prisma/
    schema.prisma   11 domain entities + Session/Account/Verification + 10 enums
    migrations/     init + add_better_auth (committed)
    seed.ts         owner + gym seed (pnpm db:seed)
  prisma.config.ts  CLI/migration connection (direct URL) + seed command
  docs/             11 planning docs (this file + the 10 SSOTs)
  ```

---

## Completed Features

Fully implemented and verified:

- Project scaffold and build pipeline (type-check ✓, lint ✓, test 2/2 ✓, production build ✓).
- Design tokens / theming foundation (dark-first, both theme columns present).
- shadcn add pipeline validated (Button component).
- **Domain schema** — 11 entities + 10 enums, migrated live to Neon (`#016`).
- **Prisma client singleton** (`src/lib/prisma.ts`) — connects to Neon via `@prisma/adapter-pg`, verified round-trip.
- **Authentication (US-1.1)** — owner login by username + password, server-managed sessions, default-deny route protection, owner seed; live sign-in verified (`#017`).
- **App shell (`#018`)** — authenticated layout, 8-entry sidebar (collapsible) + topbar user menu + mobile bottom nav, per DESIGN-SYSTEM §5.4/§12; all 8 routes exist.
- **Settings module (`#019`, US-1.2/1.3/1.4/1.7/1.8/1.9)** — Gym Information (incl. IANA timezone combobox), Pricing (walk-in fee), System Preferences (4 thresholds), via Server Action + Zod on the single `Gym` row. **Milestone 1 complete.**
- **Client Management (`#020`, US-2.1/2.2/2.3/2.4/2.5/2.6/2.9/2.10/2.11)** — centralized derivation (`lib/clients/derive.ts`), registration/edit + duplicate warning, Client List (8 chips + search + archived + URL sort/pagination, server-rendered per ADR-047), Client Profile (header/quick-stats/details/tabs), soft-delete/archive. attendance-tab filters → M4; Dashboard feed panels (US-2.10/2.11) → M8.
- **Membership Management (`#021`, US-3.1/3.2/3.3/3.4/3.9/3.10)** — create/renew/cancel membership (canonical date math ADR-040, snapshot price ADR-003), ad-hoc custom durations (ADR-015), Membership Plan catalog in Settings (US-3.9, last-active-plan retirement blocked), context-aware Client Profile button + history Cancel. Month→days pinned by ADR-048 (30/60/90). **Payment record (`CLIENT_TRANSACTION` + payment method) deferred to M5 (US-5.1)** — M3 stores `price_paid` only; the history VOID badge is wired and lights up with M5.
- **Attendance (`#022` core + `#023` Analytics, US-4.1–4.5/4.8/4.9/4.10/4.11)** — three-view module (ADR-023): Check-In Station (auto-focus search → branch flows: duplicate/expired-renewal/upcoming/conversion/fee/quick-create + post-check-in expiry toast), Today's Check-Ins (total/unique + 2nd-visit + correction), Attendance History (URL date/visit-type filters), same-day `time_in` correction (US-4.11), Client Profile attendance filters, and Attendance Analytics (KPI cards + Recharts trend/day-of-week/by-hour + Member/Walk-In/Operational insights + Alerts incl. 20%-decline). Snapshots `membership_id`, stamps `created_by`. The walk-in fee dialog now also captures a payment method and creates the `CLIENT_TRANSACTION` (M5).
- **Client Payments (`#024`, US-5.1/5.2/5.3/5.4)** — payment method on every `CLIENT_TRANSACTION`; M3 create/renew and M4 walk-in check-in create the transaction + line item atomically (membership = `MEMBERSHIP` @ price snapshot; walk-in = `WALK_IN_FEE` @ fee + `fee_override_note` when ≠ default; separate per ADR-024, never mixed per ADR-012). Payments module: Payment History (URL filters — date/method/client name), additive Void (required `void_reason_category`, note for `OTHER`; never cancels membership or deletes attendance), End-of-Day Collections (by-method totals + grand total spanning both transaction types, today-capped date selector). **Milestone 5 complete.**
- **Product Catalog (`#025`, US-6.1/6.2/6.3/6.4/6.5/6.15)** — POS module `?view=` shell; product CRUD + archive/restore (STANDARD vs SERVING_BASED with conditional servings/container fields, live gross margin), category management (add + rename). Gym-scoped, soft delete (ADR-005); `current_stock` ledger-driven and starts at 0.
- **POS Sales (`#026`, US-6.6/6.7/6.8/6.9/6.10/6.13/6.14/6.16)** — the sell screen (category tabs, product grid, name search, cart with quantity adjust, Per Serving/Per Container modes), checkout (payment method + cash-change calc, no client), `POS_SALE` creation (`client_id` null, price/cost snapshots) with `SALE` inventory entries decrementing `current_stock`, Force Sale override (logs a `FORCED_SALE` marker), and POS History (today's count/revenue strip, date/method filters, additive void with required reason). **Milestone 6 complete.**

**Milestones 7–8** (inventory, dashboard/reports) are not implemented yet.

---

## Work In Progress

Nothing is partially coded mid-stream — **Milestones 1–6 are committed** (`#015`–`#026`, all verified). Ready to start **Milestone 7 — Inventory**.

---

## Known Issues

1. ~~Neon database not provisioned~~ ✅ **Resolved** (`#016`) — Neon project live (Singapore), `.env` holds real pooled + unpooled strings, `init` migration applied.
2. **Prisma 7 needs a driver adapter** (resolved, noted for awareness): the runtime client uses `@prisma/adapter-pg` (depends on `pg`). This is Prisma's required driver, **not** a second query mechanism (TECH-STACK Backend Standards updated). `@prisma/adapter-neon` is the serverless/edge alternative — a one-file swap in `src/lib/prisma.ts`.
3. **`pg` SSL deprecation notice** prints on connect (`sslmode=require` will mean `verify-full` in a future `pg` major). Informational, harmless for Neon today; revisit at the `pg` v9 upgrade.
4. ~~Decide the list-state mechanism before the Client List~~ ✅ **Resolved (`#020`, ADR-047):** URL search params for list state; Zustand for POS cart + sidebar; derived/filtered tables render on the server. Synced to DECISIONS / TECH-STACK / DESIGN-SYSTEM.
5. **Playwright (E2E) deferred** per TECH-STACK — not installed. (Check-in, membership, and payments now shipped; POS lands in M6. Revisit once POS is in, so check-in/membership/payments/POS flows can be covered together.)
6. **Sample owner is seeded — change before real use.** A sample owner exists for login/testing: username `owner` / password `ChangeMe!123` (gym "Block23 Gym", Asia/Manila). To swap in real values while there's no real data: set `SEED_OWNER_EMAIL`/`SEED_OWNER_USERNAME`/`SEED_OWNER_PASSWORD` (optionally `SEED_GYM_NAME`/`SEED_GYM_TIMEZONE`) in `.env`, then `pnpm prisma migrate reset --force` (wipes + re-migrates + reseeds). The plain `pnpm db:seed` is idempotent and skips while a user exists.

No technical debt in the existing code.

---

## Next Recommended Milestone

**Milestone 7 — Inventory** (Milestone 6 is complete). Closes the inventory-ledger loop: M6 sales decrement `current_stock`, but nothing yet *raises* it — so products created in M6 sit at 0 and only Force Sale can move them. M7 adds restock + adjustments and the Current Stock analytics view. Scope (USER-STORIES §7, MODULE-SPECS Module 7, USER-FLOWS Flows 9/19; ADR-004/026/028/034):

1. **Restock** (US-7.1/7.5, Flow 9) — per product, a `PURCHASE` `InventoryTransaction`: `quantity_delta = +units` (STANDARD) or `+containers × servings_per_container` (SERVING_BASED, Flow 9), `resulting_stock`, optional `total_restock_cost` (null-safe), increment `current_stock`. Mirror the M6 interactive-`$transaction` ledger pattern.
2. **Manual adjustment** (US-7.2, Flow 19) — a `+/−` delta `ADJUSTMENT` with a **required** `adjustment_reason_category` (owner enum — `DAMAGE/EXPIRY/THEFT/COUNT_CORRECTION/NATURAL_WASTAGE/PROMOTION/OTHER`; **`FORCED_SALE` is NOT in the selector** — ADR-034) + note (required for `OTHER`, ADR-028). A manual decrease below zero is **blocked** (unlike Force Sale — Flow 19 edge case).
3. **Current Stock view** — stock levels, low-stock flag (`current_stock ≤ low_stock_threshold`), reorder indicator (`reorder_point`, distinct from the alert), remaining-servings display for serving-based (US-7.4), days-until-stockout (`current_stock ÷ avg daily units sold last 30d`, US-7.6, derived), inventory valuation footer (`Σ current_stock × cost_price`, excluded-count note, US-7.7), shrinkage column (this-month negative-`quantity_delta` ADJUSTMENTs by category, amber/red thresholds, US-7.8).
4. **Inventory Movement History** — the per-product `InventoryTransaction` ledger (PURCHASE/SALE/ADJUSTMENT) with restock cost + reasons; the audit surface for everything above.

> All stock math stays ledger-first (ADR-004) — `current_stock` is the cached running total. Reuse: the `?view=` sub-nav + URL filters (ADR-047), the interactive-`$transaction` pattern, and the void/reason-enum patterns. Days-until-stockout, valuation, and shrinkage are **derived at query time** (not stored). The Dashboard cards/alerts that consume these (US-7.6/7.7 KPIs, low-stock feed) are **Milestone 8**.

**Verify & sync** each step: type-check, lint, test, build; update `DEVELOPMENT-LOG.md`, this file, ROADMAP.

---

## Important Notes

- **Design-first workflow (CLAUDE.md):** before changing any planning doc, do a Change Impact Analysis, state reasoning before writing, and keep all docs synchronized via the synchronization map. ADRs are locked — reopening one needs a new ADR with a named rejected alternative.
- **Document ownership matters** — write each change to the doc that owns it (see the table in CLAUDE.md). Mirror cross-references.
- **Per-commit logging:** add one `DEVELOPMENT-LOG.md` entry per commit, newest first. Commit messages follow the existing convention: `type(#NNN): summary`.
- **Verification gate before "done":** `pnpm type-check` · `pnpm lint` · `pnpm test` · `pnpm build` must all pass.
- **Stack is locked** — do not introduce libraries outside TECH-STACK without an ADR. Honor the two tooling-drift pins (Next 15.x, shadcn@2-on-Radix).
- **Money/numbers** use `tabular-nums` + Geist Mono; **all** date/time display converts through `Gym.timezone` (ADR-035).
- **Commits:** the owner controls when to commit/push. Don't commit unless asked.
- **SaaS path:** keep the multi-tenant migration path clean (`gym_id` everywhere) but do not build multi-tenancy features now.

---

## Suggested Resume Prompt

> Resume Block23 Gym V2. Read `docs/SESSION_HANDOFF.md` first for current state. **Milestones 1–6 are complete** (`#015`–`#026`: scaffold, schema/DB, Better Auth, app shell, Settings; Client Management; Membership Management — date math ADR-040, ad-hoc ADR-015, Plan catalog, month→days ADR-048; Attendance — Check-In/branches, Today, History, correction US-4.11, Analytics US-4.10; Client Payments — payment method on every `CLIENT_TRANSACTION`, M3/M4 retrofitted, Payment History, additive Void, End-of-Day Collections; **POS & Product Sales — product catalog + categories; the sell screen (tabs/grid/search/cart + container mode), checkout (payment method + cash-change), `POS_SALE` with price/cost snapshots + `SALE` ledger entries decrementing `current_stock`, Force Sale → `FORCED_SALE` marker, POS History + additive void**). Next is **Milestone 7 — Inventory (US-7.1–7.8)**: restock (`PURCHASE` `InventoryTransaction` — `+units` STANDARD or `+containers×servings_per_container` SERVING_BASED per Flow 9, optional `total_restock_cost`, raises `current_stock` — this is what lets stock exceed 0; M6 only decrements); manual adjustment (`ADJUSTMENT` with **required** `adjustment_reason_category` — owner enum, **`FORCED_SALE` excluded** ADR-034 — + note for `OTHER`, ADR-028; below-zero decrease blocked, Flow 19); Current Stock view (low-stock flag vs `low_stock_threshold`, `reorder_point` indicator, remaining-servings US-7.4, days-until-stockout `current_stock ÷ avg daily sold last 30d` US-7.6, valuation footer `Σ current_stock×cost_price` US-7.7, shrinkage column by category US-7.8 — all **derived at query time**); and Inventory Movement History (the per-product ledger). Ledger-first (ADR-004) — `current_stock` is the cached running total. Reuse the `?view=` sub-nav + URL filters (ADR-047), the interactive-`$transaction` pattern, and the reason-enum patterns. Dashboard cards/alerts consuming these are M8. Follow the design-first workflow, keep docs synchronized, update `DEVELOPMENT-LOG.md`, and run the full verification gate (type-check, lint, test, build) before calling anything done.
