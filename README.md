# Block23 Gym Management System

A web-based management system for Block 23 Gym — handling member registration, memberships, attendance, sales, inventory, and reports in a single platform.

## Current Phase

**Planning, tech stack, and Design System complete — ready for implementation (Milestone 1).** 42 architecture decisions are recorded (ADR-001 through ADR-045; ADR-030–032 intentionally unused — see DECISIONS.md). No application code yet.

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
| [Design System](docs/DESIGN-SYSTEM.md) | Tokens, theming, typography, layout, component inventory, and patterns (dark-first, indigo) |
| [Tech Stack](docs/TECH-STACK.md) | Approved technologies, architecture guidelines, accessibility & NFR baselines, development rules |
| [Roadmap](docs/ROADMAP.md) | 8-milestone delivery sequence |
| [Decisions](docs/DECISIONS.md) | 42 architecture decision records (ADR-001 – ADR-045; ADR-030–032 unused) |
| [Development Log](docs/DEVELOPMENT-LOG.md) | Per-commit change history |

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
