# Session Handoff — Block23 Gym Management System

> Canonical handoff document for resuming development across Claude Code sessions.
> Last updated: **2026-06-27** (after DEV-LOG `#023` — Attendance Analytics; **Milestone 4 COMPLETE**).

---

## Project Status

- **Current Phase:** Phase 1 — MVP
- **Current Milestone:** **Milestone 4 — Attendance ✅ complete (`#022` core + `#023` Analytics).** Next: **Milestone 5 — Client Payments.**
- **Overall Progress:**
  - **Planning & design:** 100% complete — 10 planning docs, 48 ADRs (ADR-030–032 intentionally unused), Design System hardened as enforceable SSOT.
  - **Implementation:** **Milestones 1–4 done (`#015`–`#023`).** M4: Check-In Station (search + branches + fee + today's list), Attendance History (URL filters), same-day correction (US-4.11), Client Profile attendance filters, and **Attendance Analytics** (US-4.10 — KPI cards, period-selected Recharts trend/day-of-week/by-hour, Member/Walk-In/Operational insight panels, Alerts incl. 20%-decline). 4 of 8 milestones complete.
  - Milestones 5–8: not started. **Payment records (`CLIENT_TRANSACTION` + method) are Milestone 5 (US-5.1)** — M3 stores membership `price_paid`; M4 stores walk-in `fee_charged` on the attendance; neither creates the transaction yet. (Dashboard panels for US-2.10/2.11 land in M8.)

---

## Last Completed Work

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
        payments, pos, inventory, reports/  placeholders
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
                      attendance/ (history, today, analytics, +tests)
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
- **Attendance (`#022` core + `#023` Analytics, US-4.1–4.5/4.8/4.9/4.10/4.11)** — three-view module (ADR-023): Check-In Station (auto-focus search → branch flows: duplicate/expired-renewal/upcoming/conversion/fee/quick-create + post-check-in expiry toast), Today's Check-Ins (total/unique + 2nd-visit + correction), Attendance History (URL date/visit-type filters), same-day `time_in` correction (US-4.11), Client Profile attendance filters, and Attendance Analytics (KPI cards + Recharts trend/day-of-week/by-hour + Member/Walk-In/Operational insights + Alerts incl. 20%-decline). Snapshots `membership_id`, stamps `created_by`. **Walk-in fee `CLIENT_TRANSACTION` + payment method deferred to M5 (US-5.1)** — M4 records `fee_charged` on the attendance only.

No **Milestone 5+** product features (payments, POS, inventory, dashboard/reports) are implemented yet.

---

## Work In Progress

Nothing is partially coded mid-stream — **Milestones 1–4 are committed** (`#015`–`#023`, all verified). Ready to start **Milestone 5 — Client Payments**.

---

## Known Issues

1. ~~Neon database not provisioned~~ ✅ **Resolved** (`#016`) — Neon project live (Singapore), `.env` holds real pooled + unpooled strings, `init` migration applied.
2. **Prisma 7 needs a driver adapter** (resolved, noted for awareness): the runtime client uses `@prisma/adapter-pg` (depends on `pg`). This is Prisma's required driver, **not** a second query mechanism (TECH-STACK Backend Standards updated). `@prisma/adapter-neon` is the serverless/edge alternative — a one-file swap in `src/lib/prisma.ts`.
3. **`pg` SSL deprecation notice** prints on connect (`sslmode=require` will mean `verify-full` in a future `pg` major). Informational, harmless for Neon today; revisit at the `pg` v9 upgrade.
4. ~~Decide the list-state mechanism before the Client List~~ ✅ **Resolved (`#020`, ADR-047):** URL search params for list state; Zustand for POS cart + sidebar; derived/filtered tables render on the server. Synced to DECISIONS / TECH-STACK / DESIGN-SYSTEM.
5. **Playwright (E2E) deferred** per TECH-STACK — not installed. (Milestone 3 is now done; revisit whether to add E2E before the heavier Attendance/POS flows.)
6. **Sample owner is seeded — change before real use.** A sample owner exists for login/testing: username `owner` / password `ChangeMe!123` (gym "Block23 Gym", Asia/Manila). To swap in real values while there's no real data: set `SEED_OWNER_EMAIL`/`SEED_OWNER_USERNAME`/`SEED_OWNER_PASSWORD` (optionally `SEED_GYM_NAME`/`SEED_GYM_TIMEZONE`) in `.env`, then `pnpm prisma migrate reset --force` (wipes + re-migrates + reseeds). The plain `pnpm db:seed` is idempotent and skips while a user exists.

No technical debt in the existing code.

---

## Next Recommended Milestone

**Milestone 5 — Client Payments** (Milestone 4 is complete). This is where the **`CLIENT_TRANSACTION` + payment-method** layer that M3/M4 deferred finally lands. Scope (ROADMAP + USER-STORIES §5, MODULE-SPECS Module 5, USER-FLOWS Flow 11; ADR-003/006/012/024/028/035):

1. **Payment method on every client transaction** (US-5.1) — Cash / GCash / Card / Other recorded on each `CLIENT_TRANSACTION`. **Retrofit the M3 membership create/renew flow and the M4 walk-in fee check-in to actually create the `CLIENT_TRANSACTION` (+ `TransactionLineItem`)** — membership = one `MEMBERSHIP` line item at `price_paid`; walk-in fee = one `WALK_IN_FEE` line item at the entered fee (`fee_override_note` when ≠ `Gym.default_walkin_fee`). Walk-in and membership are always separate transactions (ADR-024); never mixed (ADR-012). `unit_price`/`cost_price_snapshot` are snapshots (ADR-003).
2. **Client payment history** (US-5.2) — chronological, filterable by date / client / payment method (URL state per ADR-047).
3. **Void a client payment** (US-5.3, Flow 11) — required `void_reason_category` (enum, ADR-028) + optional note (required when `OTHER`); record preserved, excluded from revenue; **voiding is additive and never cancels a membership** (ADR-041) and never deletes the attendance (M4 edge case).
4. **End-of-day collections** (US-5.4) — today's revenue by payment method across `CLIENT_TRANSACTION` + `POS_SALE` (POS arrives M6; show client side now), date selector for prior days.

> Wire payment creation into the existing M3 `membership-actions.ts` and M4 `attendance/actions.ts` (the membership dialog gains a payment-method field; the walk-in fee dialog gains one). Scope by session `gymId`; the Membership History VOID badge (already wired in `#020`) lights up once these transactions exist. Reuse `lib/clients/derive.ts`; do not duplicate. List/filter state per ADR-047.

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

> Resume Block23 Gym V2. Read `docs/SESSION_HANDOFF.md` first for current state. **Milestones 1–4 are complete** (`#015`–`#023`: scaffold, schema/DB, Better Auth, app shell, Settings; Client Management — ADR-047 list-state-in-URL, centralized derivation, List/Profile, archive; Membership Management — create/renew/cancel, canonical date math ADR-040, ad-hoc durations ADR-015, Plan catalog US-3.9, month→days ADR-048; Attendance — Check-In Station with branch flows, Today's list, History with URL filters, same-day correction US-4.11, and Analytics US-4.10 with Recharts + insight/alert panels). Next is **Milestone 5 — Client Payments (US-5.1–5.4)**: this is where the deferred **`CLIENT_TRANSACTION` + payment-method** layer lands — payment method (Cash/GCash/Card/Other) on every client transaction, retrofitting the **M3 membership create/renew** and the **M4 walk-in fee check-in** to actually create the transaction + line item (membership = `MEMBERSHIP` @ `price_paid`; walk-in = `WALK_IN_FEE` @ fee, with `fee_override_note` when ≠ default); chronological payment history (filterable, ADR-047); void with required `void_reason_category` (ADR-028, additive per Flow 11 — never cancels a membership or deletes attendance); end-of-day collections by method. Snapshots immutable (ADR-003); walk-in/membership always separate transactions (ADR-024), never mixed (ADR-012). Wire into the existing `membership-actions.ts` + `attendance/actions.ts`. **Reuse `lib/clients/derive.ts`** — do not duplicate. Scope by session `gymId`; list/filter state per ADR-047. Follow the design-first workflow, keep docs synchronized, update `DEVELOPMENT-LOG.md`, and run the full verification gate (type-check, lint, test, build) before calling anything done.
