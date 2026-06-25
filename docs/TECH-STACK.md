# Technology Stack — Block23 Gym Management System

This document is the single source of truth for all technology decisions in Block23 Gym V2. It defines the approved stack, establishes implementation standards, and records why alternatives were rejected. All development — including Claude Code sessions — must align with this document.

---

## 1. Executive Summary

### Why This Stack Was Selected

Block23 Gym V2 is a **desktop-first gym management system** built by a **single developer** with a **future path to multi-gym SaaS and self-hosted deployment**. The stack was selected to optimize for three constraints simultaneously: development velocity (solo developer with Claude Code), correctness (80 P0 stories with complex business rules), and migration safety (gym_id on every entity, UTC timestamps, soft deletes — all architectural decisions that cost nothing now and are expensive to retrofit later).

### Why It Fits Block23 Gym V2

- **Next.js 15 App Router** aligns with the system's data characteristics: 22 reports and most management views are server-rendered data tables. Server Components handle these with near-zero client JavaScript. Client-side interactivity is limited to defined islands — the POS cart, filter chips, and the check-in station.
- **Prisma** provides the type safety and developer experience needed to implement the domain model reliably. Every entity, enum, and relationship defined in DOMAIN-MODEL.md is enforced at the schema level. Migrations are explicit and version-controlled.
- **Better Auth** provides a clean, TypeScript-first authentication layer that supports the current single-owner credential model and can extend to staff roles and multi-tenant sessions without a framework swap.
- **shadcn/ui + Tailwind CSS v4** match the desktop-first design target. shadcn/ui components (DataTable, Dialog, Select, Form) map directly to every UI surface in MODULE-SPECS.md. The component code lives in the repository — no external dependency to break.

### How It Supports MVP Development

Every technology in this stack is well-represented in Claude Code's training data. The combination of Next.js App Router, Prisma, shadcn/ui, React Hook Form, and Zod is the highest-density pattern in modern TypeScript web development. This means code generation quality is highest here, reducing correction cycles for a solo developer. Vercel deployment eliminates DevOps overhead at MVP stage — push to GitHub, and the system is live.

### How It Supports Future Growth

- **Multi-gym SaaS:** `gym_id` on every entity (ADR-001, ADR-025) and UTC timestamp storage with `Gym.timezone` (ADR-035) are already in the schema. Adding PostgreSQL Row-Level Security policies at the SaaS migration requires database-layer changes only — no application code rewrites.
- **Self-hosting:** The Next.js application runs as a standard Node.js process. Coolify on a Hetzner VPS deploys it identically to Vercel. Cloudflare R2 uses the S3-compatible API — swap the endpoint for a self-hosted MinIO instance and change one environment variable.
- **Team expansion:** Better Auth's role model (`OWNER` at MVP, future `STAFF` / `MANAGER`) is in the `User` entity already. Adding roles is a schema migration and a Better Auth policy addition — not an auth framework replacement.

---

## 2. Technology Decision Matrix

| Layer | Technology | Version | Purpose | Reason for Selection |
|---|---|---|---|---|
| Language | TypeScript | 5.x | Full-stack type safety | Shared types across schema, validation, and UI eliminate a category of runtime errors; Claude Code generates highest-quality TypeScript |
| Framework | Next.js | 15.x (App Router) | Full-stack React framework | Server Components for report-heavy views; Server Actions for mutations; self-hostable Node.js process; deepest Claude Code coverage |
| Database | PostgreSQL | 16.x | Primary data store | User-specified; supports RLS, window functions, CTEs, JSONB, and all patterns required by the domain model |
| ORM | Prisma | Latest | Database access layer | Type-safe schema definition; Prisma Migrate for version-controlled migrations; strongest Claude Code training data of any TypeScript ORM |
| Migrations | Prisma Migrate | (bundled) | Schema version control | Part of Prisma; migration files are plain SQL diffs committed to git; rollback is explicit and auditable |
| Dev Database | Neon | Latest | Development & staging PostgreSQL | Serverless PostgreSQL with database branching; branch per feature; Neon's built-in connection pooler integrates with Prisma for Vercel deployment |
| Authentication | Better Auth | Latest | Session management and access control | TypeScript-native; cleaner API than Auth.js v5; built-in support for credentials, sessions, and future role-based access; active development |
| UI Components | shadcn/ui | Latest | Component library | Copy-paste components (no vendor lock-in); built on Radix UI (accessible); maps directly to every UI surface in MODULE-SPECS.md; Claude Code sweet spot |
| Styling | Tailwind CSS | v4 | Utility-first CSS | Co-designed with shadcn/ui; Claude Code generates Tailwind at very high quality; desktop-first utilities suit the design target |
| Forms | React Hook Form | Latest | Form state management | Uncontrolled form inputs, minimal re-renders; integrates with Zod via `@hookform/resolvers` |
| Validation | Zod | Latest | Schema validation | Shared validation between client-side forms and server-side Server Actions; enum schemas mirror Prisma enums; TypeScript inference built-in |
| Data Tables | TanStack Table | v8 | Headless table logic | Sorting, filtering, pagination for Client List, Inventory, and all 22 reports; pairs with shadcn/ui DataTable pattern |
| Client State | Zustand | v5 | Client-side UI state | POS cart state; session-persistent filter state (per MODULE-SPECS.md); minimal API, no provider required |
| Server State | TanStack Query | v5 | Client-side data fetching | Background refresh for Check-In Station and Dashboard live panels; cache invalidation after mutations; used only where Server Components cannot serve the need |
| Charts | Recharts | Latest | Data visualization | React-native composable chart components; Dashboard KPI trends, Attendance Analytics charts; compatible with Tailwind color tokens |
| File Storage | Cloudflare R2 | — | Product image storage | S3-compatible API (self-hosting swap to MinIO is one env variable); no egress fees; integrated CDN; free tier covers MVP |
| Hosting (MVP) | Vercel | — | Application deployment | Built by the Next.js team; deepest App Router and Server Action support; zero-config CI/CD from GitHub; Edge Network for global CDN |
| Hosting (future) | Coolify | Latest | Self-hosted PaaS | Open-source; manages Docker, reverse proxy, SSL, and PostgreSQL; identical deployment model to Vercel; runs on Hetzner VPS or home server |
| Infra (future) | Hetzner Cloud VPS | — | Self-hosted compute | Cost-efficient European cloud; CX22 (2 vCPU, 4GB) sufficient for single-gym SaaS at ~$5–6/month |
| Package manager | pnpm | Latest | Dependency management | 2–3× faster installs than npm; content-addressable store minimizes disk usage; native workspace support for future monorepo; supported by Vercel and Coolify natively |
| Testing | Vitest | Latest | Unit and integration tests | ESM-native, TypeScript-native, 5–10× faster than Jest; no Babel transform required for Next.js App Router; co-located test files |
| E2E testing | Playwright | Latest | End-to-end regression tests | Deferred to post-Milestone-3; added once core flows (check-in, membership, POS) are stable and worth protecting from regression |
| Linting | ESLint (eslint-config-next) | Latest | Static code analysis | Ships with Next.js; includes eslint-plugin-react-hooks and eslint-plugin-next which catch App Router-specific bugs |
| Formatting | Prettier + prettier-plugin-tailwindcss | Latest | Code formatting | Prettier handles all formatting; tailwindcss plugin auto-sorts Tailwind class order — eliminates a class of noisy diffs |
| DB pooling | Neon built-in pooler | (Neon service) | Serverless connection pooling | Free, zero additional service, already part of Neon setup; `DATABASE_URL` (pooled) for the app, `DATABASE_URL_UNPOOLED` (direct) for migrations |

---

## 3. Architecture Guidelines

### Frontend Standards

**Server Components are the default.** Every page and layout begins as a React Server Component. Client Components are introduced only when the component requires interactivity (event handlers, browser APIs, hooks that rely on client state).

Client Component boundaries in this system:
- POS screen (cart state, quantity controls, checkout flow)
- Check-In Station (real-time attendance submission)
- Client List filter chips and name search (live filtering)
- Attendance Record Correction form (time picker interactivity)
- Dashboard live feed panels (background refresh)

All report views, membership history, attendance history, and settings pages are Server Components.

**Server Actions are the primary mutation mechanism.** Form submissions use `action=` with Server Actions. Mutations triggered from Client Components call Server Actions directly — not a custom API route. This keeps business logic on the server and eliminates a class of client/server synchronization bugs.

**API Routes are for external integrations only.** Do not create an API Route for a mutation that could be a Server Action. API Routes are appropriate for: webhooks (future payment integrations), file upload endpoints (Cloudflare R2 signed URL generation), and any endpoint consumed by a non-Next.js client.

**shadcn/ui is the component source.** All interactive UI elements use shadcn/ui primitives. Do not introduce a second component library. Custom components extend shadcn/ui — they do not replace it.

**Tailwind CSS v4 is the only styling mechanism.** No CSS Modules, no styled-components, no inline `style` props except for dynamic values that cannot be expressed as Tailwind classes. All design tokens (colors, spacing, radius) are defined in the Tailwind config and used via utility classes.

**TypeScript strict mode is always on.** No `any` types. No `@ts-ignore`. If a type is genuinely unknown, use `unknown` and narrow it explicitly.

---

### Backend Standards

**Prisma is the only database access mechanism.** No raw `pg` queries, no other query builders. If a query cannot be expressed cleanly in Prisma's query API, use `prisma.$queryRaw` with Prisma's `sql` template tag — this keeps parameterization safe and results typed. Do not install `pg`, `postgres`, or `knex` alongside Prisma.

**All Server Actions validate input with Zod before touching Prisma.** The Zod schema is the contract between the client and the server. Validate first, query second — never the reverse.

**Business rules from MODULE-SPECS.md are enforced in Server Actions, not in the UI.** The UI may show a disabled button for a blocked action, but the Server Action must independently verify the rule (e.g., membership blocking, stock availability) and return an error if violated. UI state is not trusted.

**Enum values are defined once in Prisma schema and referenced everywhere.** `void_reason_category`, `adjustment_reason_category`, `transaction_type`, `item_type`, `product_type`, `visit_type` — all defined in `schema.prisma`. Zod enums for these are derived from the Prisma-generated types, not defined separately.

**Connection pooling is required for Vercel deployment.** Vercel's serverless functions do not hold persistent database connections. Use Neon's built-in connection pooler (pooled connection string, not the direct connection string) for Vercel deployments. The Prisma client must be instantiated as a singleton to avoid exhausting connections during local development.

---

### Database Standards

**PostgreSQL 16 is the only database.** Do not use SQLite for development or testing. Use Neon for all non-production environments. Schema behavior must be identical across environments.

**All schema changes go through Prisma Migrate.** Run `prisma migrate dev` during development. Run `prisma migrate deploy` in CI before deployment. Never alter the database schema manually. Migration files are committed to git and treated as permanent history.

**`gym_id` is on every entity — no exceptions (ADR-001, ADR-025).** This includes child entities: `Membership`, `TransactionLineItem`, `InventoryTransaction`, `Attendance`. This is the multi-tenancy foundation. Every Prisma query must scope by `gym_id`.

**All `DateTime` fields are stored in UTC (ADR-035).** Prisma stores `DateTime` as UTC automatically. Do not store local times in `DateTime` fields. The `Gym.timezone` field (IANA identifier) governs all display conversion. `date`-only fields (start_date, end_date, visit_date) and `time`-only fields (time_in, time_out) are stored as local calendar/clock values using Prisma's `@db.Date` and `@db.Time` annotations.

**Soft deletes use `deleted_at` — never hard-delete Client or Product records (ADR-005).** `deleted_at DateTime?` is the soft-delete field. `null` means active; non-null means archived. All Prisma queries on Client and Product must filter `deleted_at: null` unless explicitly querying archived records. Do not use `is_active: Boolean` — this conflicts with the approved design.

**Derived status fields are never stored (ADR-002).** `Client.status` and `Membership.status` do not exist as columns in the database. They are computed at query time from dates and returned as computed values in the application layer. Do not add a `status` column to either table.

**Price and cost snapshots are immutable after creation (ADR-003, ADR-026).** `TransactionLineItem.unit_price` and `TransactionLineItem.cost_price_snapshot` are written once at transaction time and never updated. Prisma mutations must never touch these fields after creation.

---

### Authentication Standards

**Better Auth is the only authentication library.** Do not use Auth.js, Lucia, or any other session management library alongside it. Better Auth manages sessions, credential hashing, and middleware protection.

**Credentials-only at MVP.** The `User` entity has `username` and `password_hash`. Better Auth's credentials provider handles login. No OAuth providers at MVP. Social login (Google, etc.) is a post-MVP addition that Better Auth supports without an architecture change.

**Better Auth uses the domain `User` table — no parallel user table (ADR-043).** Better Auth is configured against the existing Prisma `User` model; `gym_id` and `role` are declared as Better Auth **additional fields**, and the credentials provider manages `password_hash`. Better Auth owns its own session (and any verification) tables. The session payload exposes `{ userId, gymId, role }`. The Prisma `User` model remains the single canonical user record and stays auth-library-agnostic — do not create a second Better-Auth-owned user table linked to the domain `User`.

**All application routes are protected by default.** Better Auth middleware runs on all routes. Public routes (login page only at MVP) are explicitly opted out. Do not rely on UI-level route hiding for access control — the middleware must enforce it.

**Sessions are server-managed.** Better Auth handles session creation, renewal, and invalidation server-side. Do not store user identity in localStorage or client-side cookies that the server cannot invalidate.

**The `role` field on `User` is the access control gate for future staff permissions.** MVP has `OWNER` only. Future: `STAFF`, `MANAGER`. All permission checks read from the session's `role` value — not from a separate permissions table at MVP.

---

### State Management Standards

**Read the decision tree before choosing a state mechanism:**

```
Is the data primarily read-only and not user-triggered?
  → Use a Server Component (RSC fetch)

Does the data change via a form or user action?
  → Use a Server Action (mutation)

Does the client need to refetch data without a full page reload
(e.g., dashboard live panels, check-in station polling)?
  → Use TanStack Query

Does the component need local UI state that does not need
to survive a page navigation (e.g., modal open/closed)?
  → Use useState (local React state)

Does the state need to persist across components within a session
without a server round-trip (e.g., POS cart, active filter)?
  → Use Zustand
```

**Zustand stores are scoped by concern.** Do not create a single global store. Create separate stores per domain: `useCartStore`, `useFilterStore`. Each store holds only the state it owns.

**TanStack Query is not a replacement for Server Components.** Do not use TanStack Query to fetch data that a Server Component can fetch directly. TanStack Query is for client-initiated fetches that need background refresh, optimistic updates, or cache invalidation after a mutation from a Client Component.

---

### Storage Standards

**Cloudflare R2 handles all file uploads.** Product images are the only file type at MVP. Do not store binary files in PostgreSQL. Do not store files on the local filesystem of the application server (incompatible with Vercel and future multi-instance deployments).

**Upload flow: signed URL pattern.** The client requests a signed upload URL from a Next.js API Route. The client uploads directly to R2 using the signed URL. The API Route writes the resulting R2 object key to the database via Prisma. The application serves images via R2's public URL or a Cloudflare CDN URL.

**S3-compatible API is always used, never R2-specific APIs.** This ensures the swap from R2 to self-hosted MinIO at the self-hosting migration is a single environment variable change (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`). Do not use any R2-exclusive SDK methods.

---

### Deployment Standards

**MVP: Vercel.** The `main` branch deploys to production automatically. Feature branches create Preview Deployments. Environment variables are set in the Vercel dashboard — never committed to the repository.

**Environment variable naming convention:**
```
DATABASE_URL          # Neon pooled connection string (Vercel / production)
DATABASE_URL_UNPOOLED # Neon direct connection string (Prisma Migrate only)
BETTER_AUTH_SECRET    # Random 32-byte secret for session signing
R2_ENDPOINT           # Cloudflare R2 endpoint
R2_ACCESS_KEY_ID      # R2 credentials
R2_SECRET_ACCESS_KEY  # R2 credentials
R2_BUCKET_NAME        # R2 bucket name
R2_PUBLIC_URL         # Public base URL for serving R2 assets
```

**Database migrations run before deployment.** The Vercel build command is: `prisma migrate deploy && next build`. Migration failures block deployment — the database and application are always in sync.

**Future self-hosting: Coolify on Hetzner VPS.** The Next.js app is containerized (Dockerfile or Nixpacks). Coolify manages the Docker deployment, Traefik reverse proxy, and Let's Encrypt SSL. The PostgreSQL instance runs as a separate Coolify-managed service on the same VPS. The migration from Vercel to Coolify requires: (1) adding a Dockerfile, (2) updating environment variables, (3) pointing DNS. No code changes.

**Home server deployment** uses the same Coolify pattern. Any Linux machine running Docker and Coolify can host the stack. The only additional requirement is a reverse tunnel (Cloudflare Tunnel or similar) if the server is behind a NAT without a public IP.

---

### Accessibility Standards

**Target: WCAG 2.1 Level AA (ADR-044).** This is a binding baseline and a direct input to the Design System's color and typography tokens.

- **Keyboard operability.** Every interactive element is keyboard-operable: the auto-focused check-in search, POS cart and quantity controls, filter chips, dialogs, and data tables. No mouse-only interactions.
- **Visible focus.** Every focusable element has a visible focus indicator. Do not remove focus outlines without an equivalent replacement.
- **Semantics via shadcn/ui + Radix.** Use the accessible primitives for their roles, labelling, and focus management (Dialog focus trap, Select/Combobox ARIA, etc.). Do not hand-roll interactive widgets that Radix already provides accessibly.
- **Contrast.** Color contrast ≥ 4.5:1 for normal text and ≥ 3:1 for large text and meaningful UI affordances (borders of inputs, icons that convey state). Design tokens must be chosen to satisfy this.
- **Never color alone.** Status is never conveyed by color only — status badges carry text labels (already specified across the modules: "MEMBER · Active", "Upcoming", "VOID", "Cancelled", red/amber shrinkage with values, etc.).
- **Forms.** Every field has an associated `<label>`; validation errors are programmatically associated with their field (`aria-describedby`) and announced, not just colored.
- **Motion.** Chart and transition animations respect `prefers-reduced-motion`.

These requirements are validated during the Design System and component build, not deferred to a post-launch audit.

---

### Non-Functional Requirements (consolidated)

The performance and reliability NFRs referenced throughout the stories are gathered here for one canonical reference:

| NFR | Target | Source |
|---|---|---|
| Dashboard load | ≤ 3 seconds | US-8.1, Module 1 |
| Client name search | ≤ 2 seconds, partial match | US-2.3, Module 2 |
| Audit preservation | No hard deletes of financial/historical records; corrections are additive (void, soft-cancel, soft-delete) | ADR-004, ADR-005, ADR-041 |
| Tenant isolation | Every query scoped by `gym_id`; RLS-ready for SaaS | ADR-001, ADR-025 |
| Financial correctness | Price/cost snapshots immutable; reports never read live catalog for historical periods | ADR-003, ADR-026 |
| Time correctness | UTC storage; gym-local display and "today" boundary via `Gym.timezone` | ADR-035 |
| Accessibility | WCAG 2.1 AA | ADR-044 |

These are not new requirements — they consolidate targets already stated in the stories and ADRs so implementation and testing have a single checklist.

---

### Testing Standards

**Vitest for all tests.** Do not install Jest. Vitest runs TypeScript files natively without a Babel transform — tests share the same TypeScript config as the application.

**Test what is hard to get right, skip what is obvious.** This system's bugs will live in business logic, not in framework plumbing. Prioritize tests in this order:

| Priority | What to test | Why |
|---|---|---|
| 1 | Zod schemas | Validation rules are business rules — a wrong regex or missing refinement ships broken behavior silently |
| 2 | Derived status logic | `UPCOMING`, `EXPIRING_SOON`, `ACTIVE`, `EXPIRED` precedence is easy to break with an off-by-one on date comparisons |
| 3 | Server Action business rules | Membership renewal date math, inventory ledger writes, void logic, conversion derivation — complex, high-stakes, pure functions |
| 4 | Prisma query integration | Run against a real Neon test branch; verifies complex `$queryRaw` report queries return expected shapes |
| Skip | React component rendering | Brittle, slow to maintain, not where bugs live in this system |

**Test file co-location.** Place test files alongside the code they test: `membership.ts` → `membership.test.ts`. Do not create a separate `__tests__` directory tree.

**No SQLite in tests.** Tests that touch the database use a real Neon branch, not SQLite. SQLite does not support `@db.Date`, `@db.Time`, enum types, or PostgreSQL-specific functions used in report queries.

**Playwright — deferred to post-Milestone-3.** E2E tests are added after the core flows (client check-in, membership create/renew, POS checkout) are stable and worth protecting from regression. Do not set up Playwright before that point.

---

## 4. Development Rules

These rules are binding for all development on this project. Deviations require an explicit decision recorded in `DECISIONS.md`.

### Technology Rules

1. **TypeScript strict mode is always on.** No `any`. No `@ts-ignore`. Use `unknown` and explicit type guards when types are genuinely uncertain.

2. **Prisma is the only ORM and the only database access layer.** Do not install `pg`, `drizzle-orm`, `knex`, `typeorm`, or any other database library. If a query requires raw SQL, use `prisma.$queryRaw` with the `sql` template tag.

3. **PostgreSQL is the only database.** Do not use SQLite, even for tests. Use Neon for all non-production environments so behavior is identical to production.

4. **Better Auth is the only authentication library.** Do not install `next-auth`, `lucia`, or any other session or auth library.

5. **shadcn/ui is the only component library.** Do not install MUI, Mantine, Chakra UI, Ant Design, or any other component library. New UI requirements are solved with shadcn/ui primitives, Radix UI, or custom Tailwind components.

6. **Tailwind CSS is the only styling mechanism.** No CSS Modules, no styled-components, no Emotion. Inline `style` props are permitted only for values that cannot be expressed as Tailwind utility classes (e.g., dynamic pixel values from JS).

7. **Zod is the only validation library.** Do not use Yup, Joi, or Valibot. Zod schemas are the single contract between client forms and server actions.

### Architecture Rules

8. **Prefer Server Components.** Every new page and component starts as a Server Component. Add `'use client'` only when the component requires: event handlers, React hooks (`useState`, `useEffect`, `useRef`), browser-only APIs, or TanStack Query.

9. **Prefer Server Actions over API Routes for mutations.** Form submissions and data mutations use Server Actions. API Routes are created only for: external webhooks, file upload signed URL generation, and endpoints consumed by non-Next.js clients.

10. **Validate all Server Action inputs with Zod before any database operation.** Never trust data from the client. Parse and validate first; proceed only if validation passes.

11. **Use Zustand only for client UI state that must persist across component boundaries within a session.** Do not use Zustand to cache server data — that is TanStack Query's job. Zustand stores: POS cart, active filter state per list view.

12. **Use TanStack Query only when Server Components cannot satisfy the need.** Justified uses: background polling (Dashboard live panels, Check-In Station), optimistic updates on rapid mutations, client-triggered refetch after a Server Action in a complex Client Component tree. Do not use TanStack Query as a general data fetching layer.

### Domain Rules

13. **Every Prisma query on a multi-tenant entity must scope by `gym_id`.** No exceptions. This applies to all entities. Include `where: { gym_id: gymId }` in every query. This rule is enforced at MVP even though there is only one gym — it prevents a class of bugs at the SaaS migration.

14. **Never store derived status fields in the database.** `Client.status` and `Membership.status` are computed at the application layer from date fields. Do not add these as Prisma schema columns.

15. **Price and cost snapshots are write-once.** `TransactionLineItem.unit_price` and `TransactionLineItem.cost_price_snapshot` are set at transaction creation and never updated. Do not include these fields in Prisma update operations.

16. **All soft deletes use `deleted_at`.** Client and Product records use `deleted_at: DateTime?`. Queries against active records always include `where: { deleted_at: null }`. Never use `is_active: Boolean` for this purpose.

17. **Enum values originate from the Prisma schema.** `void_reason_category`, `adjustment_reason_category`, `transaction_type`, `item_type`, `product_type`, `visit_type` are defined in `schema.prisma`. Derive Zod enums from Prisma-generated types — do not define them independently.

18. **`FORCED_SALE` adjustment category is system-assigned, never user-selectable (ADR-034).** When implementing the Force Sale override flow, the Server Action sets `adjustment_reason_category: 'FORCED_SALE'` automatically. This value must not appear in any owner-facing dropdown or selector component.

19. **`visit_type` on Attendance is mutable only via the Flow 7 conversion path (ADR-038).** No other code path may update `Attendance.visit_type`. When implementing this mutation, do not set `correction_note` or `updated_at` — those are exclusively set by Flow 15 (time correction).

### Tooling Rules

20. **pnpm is the only package manager.** Use `pnpm add`, `pnpm install`, `pnpm dlx`. Do not use `npm install`, `yarn add`, or `npx` — these bypass the pnpm lockfile and can produce inconsistent installs. The `package.json` should include `"packageManager": "pnpm@latest"` to enforce this.

21. **Vitest is the only test runner.** Do not install Jest, Mocha, or any other test runner. Test files use the `.test.ts` extension and are co-located with the files they test. Do not create a separate `__tests__` directory.

22. **Tests that touch the database use a Neon test branch, never SQLite.** Create a dedicated `test` branch in the Neon dashboard. Set `DATABASE_URL_TEST` in local `.env.test`. Schema is applied via `prisma migrate deploy` before the test suite runs.

23. **ESLint runs on every file before commit; Prettier formats on save.** Configure the editor to run Prettier on save. ESLint errors block commits — do not bypass with `--no-verify`. ESLint warnings are addressed before a PR is merged, not accumulated.

24. **Tailwind class order is managed by prettier-plugin-tailwindcss automatically.** Do not manually reorder Tailwind classes. Let Prettier handle it. Never debate class order in code review — it is not a human decision.

---

## 5. Rejected Technologies

### Drizzle ORM — Rejected in Favor of Prisma

**Decision:** Prisma over Drizzle ORM.

**What Drizzle does well:** Drizzle's query builder is SQL-shaped, which makes complex aggregation queries (window functions, CTEs, period-over-period comparisons) feel natural. It has zero overhead between the query builder and the SQL it generates. It makes dropping to raw SQL first-class with strong type inference.

**Why Prisma was selected instead:**
- **Claude Code coverage.** Prisma is the most widely represented TypeScript ORM in Claude's training data by a large margin. Code generation quality, error diagnosis, and schema reasoning are all higher with Prisma. For a solo developer, this has a direct productivity impact.
- **Documentation and ecosystem maturity.** Prisma's documentation is comprehensive and stable. Drizzle's documentation is improving but has coverage gaps, particularly around edge cases in migrations.
- **Schema as the source of truth.** Prisma's `schema.prisma` file is a single, readable definition of the entire data model that non-TypeScript tools can parse. It generates a typed client, migration files, and serves as documentation.
- **Prisma Migrate is explicit.** Migration files are plain SQL diffs. Every schema change has a permanent, reviewable, revertible history.

**Acknowledged tradeoff:** The reports module (22 reports with complex aggregations) will require `prisma.$queryRaw` with the `sql` template tag for the most complex queries — period-over-period comparisons, shrinkage breakdowns, and gross profit calculations with null handling. This is an accepted cost. Prisma's `$queryRaw` preserves parameterization safety and returns typed results.

**Drizzle remains the better technical fit for query-heavy systems.** This decision is based on the specific context of a solo developer with Claude Code assistance. If the team grows and the query complexity of the reports module becomes a maintenance burden, revisiting this decision is warranted.

---

### Auth.js (NextAuth v5) — Rejected in Favor of Better Auth

**Decision:** Better Auth over Auth.js v5.

**What Auth.js does well:** Auth.js is the established standard for Next.js authentication. It has deep App Router integration, broad OAuth provider support, and the largest community of any Next.js auth library. The credentials provider covers the MVP username/password requirement with minimal configuration.

**Why Better Auth was selected instead:**
- **TypeScript-native design.** Better Auth was designed TypeScript-first. Its configuration, plugins, and session types are typed end-to-end without the configuration inconsistencies present in Auth.js v5's transition from the Pages Router to App Router.
- **Cleaner API.** Better Auth's plugin and role model API is more explicit and predictable. Adding staff roles and multi-tenant session scoping are first-class features of Better Auth's plugin system — not workarounds.
- **Active development trajectory.** Auth.js v5 is a significant rewrite that introduced breaking changes and documentation gaps during the App Router transition. Better Auth's development is proceeding more consistently.
- **Self-hosting compatibility.** Better Auth stores sessions in the database by default. No external session store (Redis) is required at MVP, and sessions survive application restarts.

**Acknowledged tradeoff:** Better Auth is newer and has a smaller community than Auth.js. Community-answered edge cases are harder to find. Mitigate by reading the Better Auth documentation directly and consulting it as the source of truth over Stack Overflow answers that may reference Auth.js.

---

### Railway — Rejected in Favor of Vercel

**Decision:** Vercel over Railway for MVP hosting.

**What Railway does well:** Railway provides a unified platform (Next.js application + PostgreSQL in one dashboard) with a straightforward deployment model. It runs the Next.js application as a persistent Node.js process, which avoids the serverless connection management considerations present on Vercel. Its PostgreSQL is a standard managed instance with no serverless emulation.

**Why Vercel was selected instead:**
- **Deepest Next.js App Router support.** Vercel built Next.js. App Router features — Server Components, Server Actions, Partial Prerendering, Image Optimization — are tested and deployed on Vercel first. Edge cases and performance characteristics are best understood and supported here.
- **Zero-configuration CI/CD.** GitHub push → build → deploy with Preview Deployments per branch. No pipeline configuration required.
- **Edge Network.** Vercel's CDN accelerates static assets, optimized images, and cached responses globally without additional configuration.
- **Connection pooling is solved.** Vercel's serverless function model requires connection pooling. Neon's built-in pooler (included as a separate connection string) resolves this without additional infrastructure. The `DATABASE_URL` (pooled) is used by the application; `DATABASE_URL_UNPOOLED` (direct) is used by `prisma migrate deploy` only. This is a documented, supported pattern.

**Acknowledged tradeoff:** Vercel's serverless model means functions spin down between requests. Cold starts add latency to the first request after inactivity — most visible in a low-traffic system like a single gym. This is an acceptable tradeoff for a management system used during gym operating hours. The owner does not run queries at 3am. If cold start latency becomes a problem, Vercel's `maxDuration` and warming strategies address it without a platform migration.

**Migration path preserved.** The self-hosting transition to Coolify does not require Vercel-specific code. Next.js is a standard Node.js application. Coolify's Nixpacks builder handles the build without a custom Dockerfile. The migration is a deployment configuration change, not an application code change.

---

## 6. Future Architecture Considerations

### Multi-Gym SaaS

The schema is ready for multi-tenancy today. `gym_id` exists on every entity. The transition to multi-gym SaaS requires:

1. **Row-Level Security (RLS):** Add PostgreSQL RLS policies scoped by `gym_id`. This is a database migration only — no Prisma schema changes. The application layer sets the RLS context via `SET LOCAL app.current_gym_id = ?` at the start of each request, or continues to scope via `WHERE gym_id = ?` in Prisma queries (simpler but application-enforced rather than database-enforced).

2. **Multi-tenant auth:** Better Auth's organization plugin (or equivalent) extends the session model to include the active `gym_id`. Sessions become `{ userId, gymId, role }`.

3. **Gym onboarding flow:** A new module for gym registration and tenant provisioning. The `Gym` table already exists — this is a user flow addition.

4. **Billing:** A payment integration (Stripe) scoped per `Gym` record. Post-MVP.

No application code written for MVP needs to be rewritten for SaaS. The gym_id scoping rules (Development Rule #13) ensure every query is already multi-tenant-safe.

### Self-Hosting Strategy

**Vercel → Coolify migration path:**

1. Add a `Dockerfile` or rely on Coolify's Nixpacks auto-detection (Next.js is detected automatically).
2. Provision a Hetzner CX22 VPS (~$5/month) and install Coolify.
3. In Coolify: create a PostgreSQL service, create a Next.js application service, link the GitHub repository.
4. Set environment variables in Coolify to match the Vercel environment.
5. Run `prisma migrate deploy` against the new PostgreSQL instance.
6. Point DNS to the new server.
7. Deactivate Vercel deployment.

**File storage self-hosting:** Replace Cloudflare R2 with a self-hosted MinIO instance running as a Coolify-managed Docker service. Change `R2_ENDPOINT` to the MinIO endpoint. No application code changes.

**Home server deployment:** Identical to Hetzner VPS. Requires: Docker, Coolify, and a Cloudflare Tunnel (free) for public HTTPS access if behind a residential NAT without a public IP.

### Scaling Considerations

The system is designed for single-gym operation. At MVP, the database will have:
- ~100–500 clients
- ~10,000 attendance records per year
- ~50,000 transaction line items per year

This is well within PostgreSQL's capability on a minimal instance. Scaling considerations become relevant at multi-gym SaaS with hundreds of tenants:

- **Connection pooling:** PgBouncer (via Coolify) for self-hosted, Neon pooler for cloud.
- **Read replicas:** Add a Neon read replica or a PostgreSQL streaming replica for report queries to avoid competing with transactional writes.
- **Caching:** Reports with expensive aggregations can be cached with a short TTL (Redis or Vercel's Data Cache). Not needed at MVP.
- **Compute:** Hetzner CX32 (4 vCPU, 8GB, ~$10/month) handles 50–100 concurrent gym tenants comfortably based on the system's query patterns.

### Migration Considerations

**If Prisma becomes a bottleneck** (report query complexity exceeds what `$queryRaw` can comfortably manage): Drizzle ORM can be introduced alongside Prisma for report-only queries. The database schema remains identical — Drizzle reads the same tables. This is an additive change, not a replacement migration.

**If Better Auth needs replacement:** Better Auth stores sessions in the database as a standard table. A migration to a different auth library requires: (1) moving session data to the new library's format, (2) updating middleware. The `User` table and `password_hash` field are library-agnostic — they remain in the Prisma schema regardless of which auth library reads them.

**If Vercel pricing becomes prohibitive at SaaS scale:** The Coolify self-hosting path is ready. The migration is days of work, not weeks.

---

## 7. Claude Code Guidance

This section is written specifically for future Claude Code sessions working on this codebase. Read it before generating any code.

### Non-Negotiable Rules

- **Do not introduce new npm packages without explicit user approval.** If a task seems to require a new dependency, name the package and justify it first. Wait for approval before installing.
- **Do not suggest replacing any approved technology.** If a technology in this document seems suboptimal for a specific task, note the limitation and solve the task with the approved technology. Do not recommend swapping Prisma for Drizzle, Auth.js for Better Auth, or any other substitution.
- **TECH-STACK.md is the source of truth.** If this document conflicts with something you believe to be a best practice, follow this document and flag the conflict to the user.
- **Do not generate application code without a committed tech stack.** The project's design documents (DOMAIN-MODEL.md, MODULE-SPECS.md, USER-STORIES.md, USER-FLOWS.md) define what to build. This document defines how. Both must be stable before implementation.

### Code Generation Standards

- **Prisma queries:** Always include `where: { gym_id: gymId }` in every query against a tenant-scoped entity. Never omit it. If you don't have the `gymId` in context, surface it from the session before querying.
- **Server Actions:** Begin every Server Action with Zod validation. Do not proceed to Prisma operations if validation fails. Return typed results — not `{ success: boolean, message: string }` strings.
- **Enum usage:** Import enum values from Prisma's generated client (`import { VoidReasonCategory } from '@prisma/client'`). Do not redefine enums as TypeScript string literals.
- **Soft deletes:** All queries against `Client` and `Product` must include `where: { deleted_at: null }` unless explicitly fetching archived records. Never omit this filter.
- **Component creation:** New UI components use shadcn/ui primitives. New data tables use the TanStack Table + shadcn/ui DataTable pattern established in the project. Do not introduce new patterns without justification.
- **Client Components:** Add `'use client'` only when required. When you add it, leave a one-line comment explaining why the component cannot be a Server Component.
- **State:** Follow the state decision tree in Section 3 (State Management Standards). Do not default to TanStack Query or Zustand — ask whether a Server Component covers the need first.

### Architecture Awareness

- The domain model has derived computed fields (`Client.status`, `Membership.status`) that are never stored in the database. When implementing queries that surface these fields, compute them in the application layer from date comparisons — do not attempt to read a status column from Prisma.
- The `FORCED_SALE` adjustment category is system-assigned. Any implementation of the Force Sale override flow must set this value automatically in the Server Action. It must never appear in a dropdown or selector component rendered to the user.
- The `Attendance.visit_type` field may only be mutated by the Flow 7 walk-in → member conversion path. Any other code path that modifies this field is a bug. When you see `visit_type` being updated, verify it is within the Flow 7 implementation.
- Price and cost snapshot fields (`unit_price`, `cost_price_snapshot`, `price_paid`) are set once at creation. If you see them in an update operation, flag it — that is a domain rule violation.

### When You Are Uncertain

If a task requires a decision not covered by this document (CI/CD pipeline specifics, error monitoring configuration, a new module's state model), surface the question to the user rather than picking an approach silently. Document decisions in `DECISIONS.md` as new ADRs.

---

## Remaining Technology Decisions

The following decisions are open. They do not block project initialization or the first milestone, but should be resolved before the relevant phase begins.

| Decision | Resolve Before | Notes |
|---|---|---|
| **CI/CD pipeline** | First PR merge | Vercel's built-in CI handles build and preview deployments; GitHub Actions may be added to run the Vitest suite before merge — decide when the first tests are written |
| **Error monitoring** (Sentry / none) | Pre-launch (before real users) | Sentry has a generous free tier and a Next.js integration; needed to catch runtime errors in production; does not affect development |
| **Email service** (Resend / none) | Post-MVP (P2 scope) | Membership expiry notifications and scheduled report emails are P2-deferred; Resend is the recommended choice when scope arrives |

All pre-initialization decisions are resolved. The project is ready to proceed.

---

*Document established: 2026-06-25. Last updated: 2026-06-25. Update this document when any technology decision changes. Record the change in `DECISIONS.md` as a new ADR and add an entry to `DEVELOPMENT-LOG.md`.*
