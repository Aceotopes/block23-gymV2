# Session Handoff — Block23 Gym Management System

> Canonical handoff document for resuming development across Claude Code sessions.
> Last updated: **2026-06-27** (after DEV-LOG `#021` — Membership Management; **Milestone 3 committed**).

---

## Project Status

- **Current Phase:** Phase 1 — MVP
- **Current Milestone:** **Milestone 3 — Membership Management ✅ committed (`#021`).** Next: **Milestone 4 — Attendance.**
- **Overall Progress:**
  - **Planning & design:** 100% complete — 10 planning docs, 48 ADRs (ADR-030–032 intentionally unused), Design System hardened as enforceable SSOT.
  - **Implementation:** **Milestones 1–2 done (`#015`–`#020`).** **Milestone 3 done (`#021`):** create/renew/cancel membership + canonical date math (ADR-040), ad-hoc custom durations (ADR-015), Membership Plan catalog in Settings (US-3.9), context-aware Client Profile button + history Cancel; month→days pinned by ADR-048. ~3 of 8 milestones complete.
  - Milestones 4–8: not started. The membership **payment** record (`CLIENT_TRANSACTION` + payment method) is **Milestone 5** (US-5.1) — M3 records the `price_paid` snapshot only. (Dashboard "Frequent walk-ins" / "At-risk members" feed panels for US-2.10/2.11 land in M8.)

---

## Last Completed Work

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
        attendance, payments, pos, inventory, reports/  placeholders
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
                      duplicate); memberships/ (duration[+test])
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

No **Milestone 4+** product features (attendance, payments, POS, inventory, dashboard/reports) are implemented yet.

---

## Work In Progress

Nothing is partially coded mid-stream — **Milestones 1–3 are committed** (`#015`–`#021`, all verified). Ready to start **Milestone 4 — Attendance**.

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

**Milestone 4 — Attendance** (Milestone 3 is built). Scope (see ROADMAP + USER-STORIES §4, MODULE-SPECS Module 4, USER-FLOWS Flow 3/7/14/15; ADR-018/020/023/036/038):

1. **Attendance module — three internal views (ADR-023):** Check-In (default, auto-focused search, result cards with status/expiry/today indicator, today's running list), Attendance History (date presets + visit-type filter — wire the deferred Client Profile attendance-tab filters here too), and Attendance Analytics (KPI cards, trend/day-of-week/peak-hour charts, Member/Walk-In/Operational insights, alerts).
2. **Record member check-in** (US-4.1) — expired-MEMBER renewal prompt (ADR-018; ties into the M3 renew flow), post-check-in expiry warning, duplicate same-day confirmation. Snapshot `Attendance.membership_id` = the in-effect membership at check-in.
3. **Record walk-in visit** (US-4.2) — pre-fee conversion prompt for high-frequency walk-ins (`Gym.walkin_conversion_prompt_visits`), inline quick-create client.
4. **Walk-in → Member conversion** (Flow 7, ADR-024/038) — walk-in fee and membership are always separate `CLIENT_TRANSACTION`s; updating `visit_type` WALK_IN→MEMBER is the only permitted `visit_type` mutation and does NOT set `correction_note`/`updated_at`.
5. **Attendance record correction** (US-4.11, Flow 15) — same-day `time_in` edit only; required `correction_note`; sets `updated_at`; prior-day records read-only.

> Reuse the M3 derivation (`deriveClient` / `deriveMembershipStatus` / the renew flow) for member status + the renewal prompt — do not duplicate. All queries scope by the session's `gymId` (ADR-001/025). List/tab/filter state per **ADR-047** (URL params). Note: membership/walk-in **payment** capture (payment method on the `CLIENT_TRANSACTION`) is **Milestone 5** — M4 records attendance; if the walk-in fee transaction is needed before M5, coordinate the boundary.

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

> Resume Block23 Gym V2. Read `docs/SESSION_HANDOFF.md` first for current state. **Milestones 1–3 are done** (`#015`–`#021`: scaffold, schema/DB, Better Auth, app shell, Settings; Client Management — ADR-047 list-state-in-URL, centralized derivation, Client List/Profile, archive; Membership Management — create/renew/cancel with canonical date math ADR-040, ad-hoc custom durations ADR-015, Membership Plan catalog in Settings US-3.9, month→days ADR-048, context-aware Client Profile button + history Cancel). The membership **payment** record (`CLIENT_TRANSACTION` + payment method) is **Milestone 5** (US-5.1) — M3 stores the `price_paid` snapshot only. Next is **Milestone 4 — Attendance**: three internal views (Check-In / History / Analytics, ADR-023); member check-in with expired-MEMBER renewal prompt (US-4.1, ADR-018) reusing the M3 renew flow; walk-in visit + high-frequency conversion prompt (US-4.2); walk-in→member conversion (Flow 7, ADR-024/038 — `visit_type` is the only mutable-via-conversion field, no `correction_note`/`updated_at`); same-day `time_in` correction (US-4.11, Flow 15). **Reuse `lib/clients/derive.ts`** — do not duplicate derivation. Snapshots are immutable (`price_paid`, ADR-003); scope all queries by the session `gymId`; list/tab/filter state per ADR-047. Follow the design-first workflow, keep docs synchronized, update `DEVELOPMENT-LOG.md`, and run the full verification gate (type-check, lint, test, build) before calling anything done.
