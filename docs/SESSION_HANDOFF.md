# Session Handoff — Block23 Gym Management System

> Canonical handoff document for resuming development across Claude Code sessions.
> Last updated: **2026-06-26** (after DEV-LOG `#018` — authenticated app shell; commit pending).

---

## Project Status

- **Current Phase:** Phase 1 — MVP
- **Current Milestone:** **Milestone 1 — Foundation & Auth** (in progress)
- **Overall Progress:**
  - **Planning & design:** 100% complete — 10 planning docs, 46 ADRs (ADR-030–032 intentionally unused), Design System hardened as enforceable SSOT.
  - **Implementation:** ~75% of Milestone 1. Scaffold (`#015`) + schema/DB/client (`#016`) + Better Auth login/session/protection (`#017`, US-1.1) + app shell (`#018`) landed. **Next: Settings module — the last unit of Milestone 1.**
  - Milestones 2–8: not started.

---

## Last Completed Work

**DEV-LOG `#018` — Authenticated app shell (8-entry navigation)** (commit pending):

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
        clients, attendance, payments, pos, inventory, reports, settings/  placeholders
      api/auth/[...all]/  Better Auth handler
      layout.tsx, globals.css (tokens)
    components/
      app-shell/        topbar, app-sidebar, mobile-nav, user-menu, sidebar-store
      page-header.tsx, logout-button.tsx; ui/ (button, card, input, label, dropdown-menu, sheet, tooltip)
    lib/              auth.ts, auth-client.ts, prisma.ts, nav.ts, utils.ts (+ test)
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
- **App shell (`#018`)** — authenticated layout, 8-entry sidebar (collapsible) + topbar user menu + mobile bottom nav, per DESIGN-SYSTEM §5.4/§12; all 8 routes exist (dashboard real-but-placeholder, other 7 stubbed).

No further **product** features (clients, memberships, etc.) are implemented yet.

---

## Work In Progress

Nothing is partially coded mid-stream — the `#018` changes are complete and verified (commit pending owner approval). One unit of Milestone 1 remains:

- **Gym settings + threshold settings screens** (US-1.2/1.3/1.4/1.7/1.8/1.9) — the `/settings` page is currently a placeholder.

---

## Known Issues

1. ~~Neon database not provisioned~~ ✅ **Resolved** (`#016`) — Neon project live (Singapore), `.env` holds real pooled + unpooled strings, `init` migration applied.
2. **Prisma 7 needs a driver adapter** (resolved, noted for awareness): the runtime client uses `@prisma/adapter-pg` (depends on `pg`). This is Prisma's required driver, **not** a second query mechanism (TECH-STACK Backend Standards updated). `@prisma/adapter-neon` is the serverless/edge alternative — a one-file swap in `src/lib/prisma.ts`.
3. **`pg` SSL deprecation notice** prints on connect (`sslmode=require` will mean `verify-full` in a future `pg` major). Informational, harmless for Neon today; revisit at the `pg` v9 upgrade.
4. **Open design decision (pre-Milestone 2):** list-state mechanism — URL search params vs. Zustand for filter/sort/page/tab/period state (DESIGN-SYSTEM §14.4/§19, TECH-STACK open decisions). If URL params → needs a new ADR + TECH-STACK State Management update. Not blocking Milestone 1.
5. **Playwright (E2E) deferred** to post-Milestone-3 per TECH-STACK — not installed.
6. **Sample owner is seeded — change before real use.** A sample owner exists for login/testing: username `owner` / password `ChangeMe!123` (gym "Block23 Gym", Asia/Manila). To swap in real values while there's no real data: set `SEED_OWNER_EMAIL`/`SEED_OWNER_USERNAME`/`SEED_OWNER_PASSWORD` (optionally `SEED_GYM_NAME`/`SEED_GYM_TIMEZONE`) in `.env`, then `pnpm prisma migrate reset --force` (wipes + re-migrates + reseeds). The plain `pnpm db:seed` is idempotent and skips while a user exists.

No technical debt in the existing code.

---

## Next Recommended Milestone

**Milestone 1 — Foundation & Auth** (continue). Schema, DB, client, auth, and the app shell are done (`#016`–`#018`). One unit remains:

1. ~~Domain schema · Prisma client · first migration~~ ✅ (`#016`) · ~~Better Auth login/session/protection (US-1.1)~~ ✅ (`#017`) · ~~App shell (8-entry nav)~~ ✅ (`#018`).
2. **Settings module** (the `/settings` page exists as a placeholder) — Gym profile (name, address, contact, **timezone** IANA, ADR-035) **US-1.2**; default walk-in fee **US-1.3** (no gym-level membership fee, ADR-039); and threshold settings: expiring-soon **US-1.4**, walk-in inactivity **US-1.7**, member inactivity **US-1.8**, walk-in conversion prompt **US-1.9**. Mutations via **Server Actions + Zod** (TECH-STACK); read/write the single `Gym` row scoped by the session's `gymId`. Use shadcn form patterns (likely add `form`, `sonner`/toast). Suggested IA: Settings sub-sections per INFORMATION-ARCHITECTURE §2.8 (Gym Information · Pricing · System Preferences · Membership Plans — the last is US-3.9, deferrable to Milestone 3). **After this, Milestone 1 is complete** — tick the remaining ROADMAP boxes.
4. **Verify & sync** — type-check, lint, test, production build; update `DEVELOPMENT-LOG.md`, this file, and tick `ROADMAP.md` Milestone 1 boxes. After this, Milestone 1 is complete.

> All Settings screens read/write the single `Gym` row. Get the active gym via the session's `gymId` (every query scopes by `gym_id` — ADR-001/025).

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

> Resume Block23 Gym V2. Read `docs/SESSION_HANDOFF.md` first for current state. We are finishing **Milestone 1 — Foundation & Auth**: schema/DB/client (`#016`), Better Auth login/session/protection (US-1.1, `#017`), and the authenticated app shell (`#018`) are done. The **last unit is the Settings module** (US-1.2/1.3/1.4/1.7/1.8/1.9 — gym profile incl. IANA timezone, default walk-in fee, and the four threshold settings), built on the existing `/settings` placeholder via **Server Actions + Zod**, reading/writing the single `Gym` row scoped by the session's `gymId`. Follow the design-first workflow, keep docs synchronized, update `DEVELOPMENT-LOG.md`, run the full verification gate (type-check, lint, test, build), then tick the remaining ROADMAP Milestone 1 boxes — that completes Milestone 1.
