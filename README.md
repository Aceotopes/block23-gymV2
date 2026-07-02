# Block23 Gym Management System

A web-based management system for Block 23 Gym — handling member registration, memberships, attendance, sales, inventory, and reports in a single platform.

## Current Phase

**MVP complete — all 8 milestones delivered (`#015`–`#031`).** Planning, tech stack, and Design System are complete and stable. **Milestone 1 (Foundation & Auth)** — Next.js 15 scaffold, Neon PostgreSQL + Prisma 7 (11-entity schema), Better Auth owner login + session + route protection, the 8-entry app shell, and Settings. **Milestone 2 (Client Management)** — client registration/edit, the Client List (partial-name search + 8 status/type filter chips + show-archived, URL-driven server-rendered tables per ADR-047), the Client Profile, and soft-delete/archive. **Milestone 3 (Membership Management)** — create/renew/cancel memberships with canonical date math (ADR-040), ad-hoc custom durations, and the Membership Plan catalog in Settings. **Milestone 4 (Attendance)** — the three-view module (ADR-023): Check-In Station with branch flows + Today's list, Attendance History with URL filters, same-day check-in time correction, and Attendance Analytics (Recharts trends + insight/alert panels). **Milestone 5 (Client Payments)** — payment method on every client transaction (membership create/renew and walk-in check-in create the `CLIENT_TRANSACTION` + line item atomically), Payment History with URL filters, additive Void with a required reason category, and the End-of-Day Collections summary by payment method. **Milestone 6 (POS & Product Sales)** — the product catalog (CRUD + archive/restore, standard vs serving-based with conditional fields and live gross margin) and category management, plus the POS sell screen (category tabs, product grid, search, cart, container-mode toggle), checkout (payment method + cash-change calculator), `POS_SALE` recording with price/cost snapshots and inventory-ledger stock deduction, Force Sale override, and POS History with additive void. **Milestone 7 (Inventory)** — restock (`PURCHASE` ledger entry) and manual adjustments (required reason category, below-zero blocked), the Current Stock view (low-stock/reorder flags, remaining-servings, days-until-stockout, shrinkage, valuation footer — all derived at query time), and the per-product Movement History ledger. **Milestone 8 (Dashboard & Reports)** — the Dashboard (6-card KPI strip, period-driven Recharts charts, six live-feed panels) and the full 19-report suite under `/reports` (revenue & financial, membership, attendance & clients, and products & inventory — each filterable and CSV-exportable). 46 architecture decisions are recorded (ADR-001 through ADR-049; ADR-030–032 intentionally unused — see DECISIONS.md). **A Design System Refresh is underway** — the app is being re-themed to the approved "Block 23 Console" language (warm near-black canvas, violet primary, Space Grotesk + IBM Plex; ADR-049, superseding ADR-045's indigo/slate). Token foundation, Settings, and the app shell (incl. a ⌘K command palette) are done; remaining screens follow (see ROADMAP → Design System Refresh). See `docs/SESSION_HANDOFF.md` for the live status and resume point.

## What This System Does

Replaces paper sign-in sheets and Excel sales logs with a centralized digital system. Built for a single gym (MVP) with a clean architectural migration path to multi-tenant SaaS.

## Project Documents

| Document | Description |
|---|---|
| [User Stories](docs/USER-STORIES.md) | 80 P0 (MVP) + 14 P2 (post-MVP) stories across 8 modules |
| [User Flows](docs/USER-FLOWS.md) | 20 end-to-end interaction flows covering all modules and edge cases |
| [Domain Model](docs/DOMAIN-MODEL.md) | Entity definitions, field-level rationale, and schema design decisions |
| [Module Specs](docs/MODULE-SPECS.md) | Field-level specs, business rules, and edge cases per module |
| [Information Architecture](docs/INFORMATION-ARCHITECTURE.md) | Top-level navigation and screen map — the app shell structure |
| [Design System](docs/DESIGN-SYSTEM.md) | Tokens, theming, typography, layout, component inventory, and patterns (dark-only; warm-violet "Block 23 Console" — ADR-049, values in `docs/DESIGN-TOKENS.MD`) |
| [Tech Stack](docs/TECH-STACK.md) | Approved technologies, architecture guidelines, accessibility & NFR baselines, development rules |
| [Roadmap](docs/ROADMAP.md) | 8-milestone delivery sequence |
| [Decisions](docs/DECISIONS.md) | 46 architecture decision records (ADR-001 – ADR-049; ADR-030–032 unused) |
| [Development Log](docs/DEVELOPMENT-LOG.md) | Per-commit change history |
| [Session Handoff](docs/SESSION_HANDOFF.md) | Live implementation status and resume point for the next session |

## Modules (MVP Scope)

1. Auth & Settings
2. Client Management
3. Membership Management
4. Attendance
5. Client Payments
6. POS & Product Sales
7. Inventory
8. Dashboard & Reports

## Tech Stack

Next.js 15 (App Router) · TypeScript · PostgreSQL 16 · Prisma · Better Auth · shadcn/ui + Tailwind CSS v4 · Zod · React Hook Form · TanStack Table/Query · Zustand · Recharts · Vercel (MVP) → Coolify/Hetzner (self-host). See [Tech Stack](docs/TECH-STACK.md) for the full decision matrix and binding development rules.
