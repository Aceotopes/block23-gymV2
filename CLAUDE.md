# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**Planning, tech stack, and Design System complete — ready for implementation (Milestone 1).** Planning documents, the tech stack, and the design language are stable. No application code exists yet. See `docs/TECH-STACK.md` for the approved stack and development rules, `docs/DESIGN-SYSTEM.md` for tokens/components/patterns, and `docs/INFORMATION-ARCHITECTURE.md` for the navigation/screen map.

## Planning Workflow

This is a design-first project. Follow this process for every proposed change, no matter how small.

### 1. Change Impact Analysis (required before modifying any document)

Before touching any planning document, identify:
- Which other documents reference the thing being changed
- Whether the change affects user stories, flows, domain entities, module specs, or the roadmap
- Whether the change resolves, introduces, or surfaces a conflict between documents

State the impact analysis explicitly before making any edits.

### 2. Reason before writing

Explain *why* the proposed change is correct before modifying any file. If a change has a rejected alternative, name it. This is what separates a decision from a guess.

### 3. Challenge assumptions

When a requirement is stated, ask: Is this how the business actually operates? Does this edge case have a defined outcome? Does this decision foreclose a future option that the owner hasn't considered yet? Surface conflicts and missing requirements before committing them to documents.

### 4. SaaS expansion — consider, don't implement

The system is designed for a single gym (MVP) with a clean migration path to multi-tenant SaaS. When evaluating a design decision, note if it affects that migration path — but do not add complexity to serve multi-tenancy before it's in scope.

### 5. Keep all documents synchronized

No document should contradict another. After any change, verify consistency across all seven documents. See the synchronization map below.

## Planning Documents

Each document has a defined ownership scope. Write changes to the right document.

| Document | Owns |
|---|---|
| `docs/USER-STORIES.md` | Acceptance criteria and scope boundaries per story. Source of truth for what the owner needs. |
| `docs/USER-FLOWS.md` | End-to-end interaction sequences, decision branches, and edge case handling in the UI/workflow layer. |
| `docs/DOMAIN-MODEL.md` | Entity definitions, field-level rationale, relationships, and schema design decisions. |
| `docs/MODULE-SPECS.md` | Per-module business rules, form fields, edge cases, and deferred items. The operational layer between stories and the domain. |
| `docs/ROADMAP.md` | Milestone scope, delivery sequencing, and post-MVP backlog. |
| `docs/DECISIONS.md` | Numbered ADRs — what was decided, why, and what was rejected. Every significant design decision goes here. |
| `docs/DEVELOPMENT-LOG.md` | One entry per commit, newest first. Records what changed and which decisions were made. |
| `docs/TECH-STACK.md` | Approved technology stack, architecture guidelines, accessibility & NFR baselines, development rules, and Claude Code guidance. Single source of truth for all technology decisions. |
| `docs/INFORMATION-ARCHITECTURE.md` | Top-level navigation and screen map — the app shell structure. Single source of truth for IA and where each screen lives. |
| `docs/DESIGN-SYSTEM.md` | Design tokens, theming, typography, spacing/layout, component inventory, and UI patterns. Single source of truth for the visual/interaction language. |

## Document Synchronization Map

Changes in one document almost always require updates in others. Use this map.

| If you change… | Also check… |
|---|---|
| A domain entity (field added, renamed, removed) | DOMAIN-MODEL.md ↔ MODULE-SPECS.md ↔ USER-STORIES.md ↔ USER-FLOWS.md |
| A business rule or edge case | MODULE-SPECS.md ↔ USER-FLOWS.md ↔ USER-STORIES.md (acceptance criteria) |
| A user story's scope or acceptance criteria | USER-STORIES.md ↔ MODULE-SPECS.md ↔ ROADMAP.md (milestone scope) |
| A user flow | USER-FLOWS.md ↔ MODULE-SPECS.md ↔ DOMAIN-MODEL.md (does the flow require an entity change?) |
| A milestone's scope | ROADMAP.md ↔ USER-STORIES.md (story priority) ↔ DEVELOPMENT-LOG.md |
| An ADR | DECISIONS.md ↔ DEVELOPMENT-LOG.md (note the decision in the next log entry) |
| A module's purpose or boundaries | MODULE-SPECS.md ↔ USER-STORIES.md (module header) ↔ USER-FLOWS.md |

## Locked Design Decisions

These ADRs (in `DECISIONS.md`, currently ADR-001 through ADR-045; ADR-030–032 intentionally unused) represent resolved questions. Reopening one requires a new ADR with an explicit rejected-alternative and reasoning. Treat conflicts with these decisions as signals that a proposed change needs more analysis, not as reasons to silently override them.

**gym_id on every entity (ADR-001, ADR-025):** Multi-tenancy foundation. Every entity — including child/detail entities (`Membership`, `TransactionLineItem`, `InventoryTransaction`) — carries a `gym_id` FK. Enables database-level Row-Level Security without join-chain subqueries.

**Derived status fields (ADR-002):** `Client.status` and `Membership.status` are computed from dates, never stored. No sync job, no drift.

**Price and cost snapshots (ADR-003, ADR-026):** `price_paid`, `unit_price`, and `cost_price_snapshot` always record the value at the moment of the transaction. Past financial records must never be rewritten by future catalog changes. This applies to both selling prices AND cost prices — historical gross profit figures must be permanently correct.

**Inventory ledger (ADR-004):** Every stock movement is an `InventoryTransaction` row. `Product.current_stock` is a cached value recomputable from the ledger.

**Soft deletes (ADR-005):** `Client` and `Product` use `deleted_at`. Entities with financial or historical references are never hard-deleted.

**Unified transaction table (ADR-006):** One `Transaction` table with `transaction_type` enum (`CLIENT_TRANSACTION` | `POS_SALE`) — not separate tables. All revenue is queryable from one place.

**No mixed checkout (ADR-012):** Client transactions (membership/walk-in fees) and POS sales are always separate flows. A single transaction cannot span both types.

**Walk-in and membership always separate transactions (ADR-024):** Walk-in fees and membership purchases are always separate `CLIENT_TRANSACTION` records. A single `CLIENT_TRANSACTION` never contains both `WALK_IN_FEE` and `MEMBERSHIP` line items simultaneously.

**POS sales are client-anonymous (ADR-011):** `client_id` is null on all `POS_SALE` records. No client selection in the POS flow.

**Stock blocks, override confirms (ADR-009):** Selling below zero is blocked by default. An explicit owner override is required and logs a flagged `ADJUSTMENT` entry — never silent.

**Structured audit categories (ADR-028):** `Transaction.void_reason_category` and `InventoryTransaction.adjustment_reason_category` are required enum fields (not free text). Free text cannot be aggregated; enums enable void pattern and shrinkage-by-cause analysis. A companion detail note field is available for context.

**Whole-container sale mode (ADR-027):** `SERVING_BASED_PRODUCT` with a `container_selling_price` set supports Per Container mode in POS checkout. Stock deduction = quantity × `servings_per_container`. Do not model this as a separate `STANDARD_PRODUCT` — that breaks stock synchronization.

**Device target strategy (ADR-033):** Desktop-first design with mobile-responsive support. Tablet is NOT a primary design target. All data tables, reports, and admin views are designed for desktop viewports first. Mobile layouts adapt responsively. No native mobile app in scope for MVP.

**Force Sale audit category (ADR-034):** `FORCED_SALE` is a system-assigned `adjustment_reason_category` value, auto-populated when a stock-negative override is confirmed. It does NOT appear in the owner-facing manual adjustment category selector. This keeps shrinkage analysis (owner-initiated) separate from forced-sale events (system-generated).

**UTC timestamp storage (ADR-035):** All `timestamp` fields (created_at, updated_at, deleted_at, transaction_date) are stored in UTC. `Gym.timezone` (IANA identifier, e.g., "Asia/Manila") governs all display conversion and "today" boundary calculations. `date` fields (start_date, end_date, visit_date) and `time` fields (time_in, time_out) are stored as local calendar/clock values — no conversion needed.

**Dashboard frequent walk-ins (ADR-036):** The Dashboard "Frequent walk-ins" panel always shows the top 5 walk-in clients sorted by visit count descending, regardless of `Gym.walkin_conversion_prompt_visits`. The threshold setting governs only: (1) the check-in conversion prompt, (2) the Attendance Analytics Walk-In Insights count, and (3) the Frequent Walk-Ins Report.

**Upcoming membership status (ADR-037):** `UPCOMING` is a fourth MEMBER client status: no active membership, but at least one membership where `start_date > today`. Status precedence: EXPIRING_SOON → ACTIVE → UPCOMING → EXPIRED. An eighth filter chip (`Upcoming`) is added to the Client List. Creating a new membership is blocked when the client already has an upcoming membership (separate informational message, no "Go to Renew" redirect).

**visit_type mutability exception (ADR-038):** Updating `Attendance.visit_type` from `WALK_IN` to `MEMBER` during Flow 7 (walk-in → member conversion) is a business workflow mutation, not a data correction. `correction_note` and `updated_at` are NOT set by this mutation — those fields are exclusively set by Flow 15 (time correction). This is the only permitted mutation path for `visit_type`.

**Remove Gym.default_membership_fee (ADR-039):** `Gym.default_membership_fee` is removed. `MembershipPlan.default_price` is the authoritative source for membership pricing. `Gym.default_walkin_fee` is retained — walk-in fees are not plan-based.

**Canonical in-effect membership + renewal math (ADR-040):** A membership is "in effect" when `start_date ≤ today ≤ end_date` (the one canonical test — replaces the old `end_date >= today`). `Membership.status` is derived: `UPCOMING` / `ACTIVE` / `EXPIRED`. At most one in-effect membership per client; one ACTIVE plus one or more UPCOMING (from early renewal) is valid. Renewal: new `start_date = max(today, latest_end_date + 1 day)`, new `end_date = start_date + duration_days`.

**Membership cancellation (ADR-041):** `Membership.cancelled_at` + `cancellation_reason` soft-cancel an erroneous membership. A cancelled membership is excluded from ALL derivations (status, active, upcoming, expiry, renewal, `client_type`), never blocks a new membership, and is retained with a "Cancelled" badge. Cancellation and payment void are independent. No free edit of membership dates/plan/price — cancel and recreate.

**Information architecture (ADR-042):** Eight top-level nav entries: Dashboard · Clients · Attendance · Client Payments · POS · Inventory · Reports · Settings. Membership has NO standalone nav entry — it is distributed (Client Profile, Settings, Dashboard, Reports). See `INFORMATION-ARCHITECTURE.md`.

**Better Auth uses the domain `User` table (ADR-043):** `gym_id` and `role` are Better Auth additional fields; the credentials provider manages `password_hash`. No parallel user table. Session = `{ userId, gymId, role }`.

**Accessibility baseline (ADR-044):** Target WCAG 2.1 AA — keyboard operability, visible focus, contrast ≥ 4.5:1 (text) / 3:1 (large/UI), status never color-alone, labelled fields, `prefers-reduced-motion`. Detailed in `TECH-STACK.md` → Accessibility Standards.

**Design language (ADR-045):** Dark-first, professional indigo accent (`indigo-500` dark / `indigo-600` light) on neutral slate chrome; semantic emerald/amber/red/sky (at-risk = orange to stay distinct from amber); Geist Sans + Geist Mono (tabular money/numbers); shadcn `new-york` / base color `slate` / lucide icons; tokens as CSS variables (theme = values flip). Full spec in `DESIGN-SYSTEM.md`. Status badges always carry a text label + icon — never color alone.

## Domain Model Quick Reference

Non-obvious field constraints that affect business rules across multiple documents:

- **Membership** — `price_paid` (snapshot at purchase time), `status` (derived, never stored: `UPCOMING`/`ACTIVE`/`EXPIRED`; in-effect = `start_date ≤ today ≤ end_date` — ADR-040), `renewed_from_membership_id` (self-FK — renewal chains, old record never mutated), `cancelled_at`/`cancellation_reason` (soft-cancel an erroneous membership — ADR-041; cancelled records excluded from all derivations), `membership_plan_id` (nullable — null = ad-hoc custom duration, "Custom (ad-hoc)")
- **Attendance** — `membership_id` (snapshot of which membership was active at check-in; never retroactively updated), `time_out` (nullable; reserved for future analytics — no MVP business logic touches it), `correction_note` (nullable; populated when `time_in` is corrected via Flow 15 / US-4.11), `updated_at` (nullable; set when a correction is applied — null on unedited records; non-null value is the sole marker of a corrected record)
- **Gym** — `default_walkin_fee` (active; walk-in fees are not plan-based), `timezone` (IANA identifier; governs all date/time display and "today" boundary, ADR-035). `default_membership_fee` does NOT exist — membership pricing is per-plan only (ADR-039).
- **Product** — `product_type` (`STANDARD_PRODUCT` | `SERVING_BASED_PRODUCT`), `selling_price` (per unit or per serving), `current_stock` (units or remaining servings), `servings_per_container` (SERVING_BASED only), `container_selling_price` (nullable; SERVING_BASED only — enables Per Container POS mode), `low_stock_threshold` (dashboard alert trigger, distinct from `reorder_point`), `reorder_point` (nullable; inventory planning signal, accounts for lead time), `deleted_at` (nullable timestamp; null = active, non-null = archived — soft delete per ADR-005, not `is_active`)
- **Transaction** — `transaction_type` (`CLIENT_TRANSACTION` | `POS_SALE`), `status` (`COMPLETED` | `VOID`), `void_reason_category` (enum, required when status=VOID: `DUPLICATE_ENTRY` | `WRONG_AMOUNT` | `WRONG_PRODUCT` | `CLIENT_CANCELLED` | `SYSTEM_ERROR` | `OTHER`), `void_reason_note` (optional detail; required when category=OTHER)
- **TransactionLineItem** — `item_type` must match parent `transaction_type`; `unit_price` is always a price snapshot; `cost_price_snapshot` is always a cost snapshot (nullable — null if `Product.cost_price` was not set at time of sale); `fee_override_note` (nullable; populated on `WALK_IN_FEE` items when amount differs from `Gym.default_walkin_fee`)
- **InventoryTransaction** — `type` (`PURCHASE` | `SALE` | `ADJUSTMENT`); `adjustment_reason_category` (enum, required when type=ADJUSTMENT: `DAMAGE` | `EXPIRY` | `THEFT` | `COUNT_CORRECTION` | `NATURAL_WASTAGE` | `PROMOTION` | `OTHER` | `FORCED_SALE`); `FORCED_SALE` is system-assigned on stock-negative overrides (ADR-034) and does NOT appear in the owner-facing selector; `total_restock_cost` (nullable decimal, populated on PURCHASE events)

## Key Business Rules

Rules that span multiple documents and are easy to get wrong in isolation:

**Membership renewal date math (US-3.2, Flow 6, ADR-040):** new `start_date = max(today, latest_end_date + 1 day)`, new `end_date = start_date + duration_days`, where `latest_end_date` = greatest `end_date` among the client's non-cancelled memberships with `end_date >= today`. Renewing while active/upcoming chains onto the latest end (new record is UPCOMING until it begins); renewing after full expiry starts today; stacked early renewals chain onto the furthest-future end. Both paths create a new `Membership` linked via `renewed_from_membership_id`; the previous record is never modified.

**Walk-in → Member conversion (Flow 7, ADR-024, ADR-038):** Walk-in fees and membership purchases are ALWAYS separate `CLIENT_TRANSACTION` records. Pre-fee conversion: owner is redirected to Flow 5 with no walk-in fee collected. Post-fee conversion: the original walk-in fee transaction remains intact; a new membership-only `CLIENT_TRANSACTION` is created separately. No automatic walk-in fee credit — owner overrides the membership price manually if desired. The attendance record's `visit_type` is updated to `MEMBER` after conversion. This mutation is a business workflow exception — `correction_note` and `updated_at` are NOT set (those are Flow 15 only).

**Serving-based restock (Flow 9, US-7.1):** Restocking N containers adds `N × servings_per_container` servings to `current_stock` — not N units.

**Void is additive (Flow 11):** Voiding creates new reversal entries in the inventory ledger. Original records are never modified or deleted. Voided transactions are excluded from revenue totals but remain in the audit trail. Voiding a payment does not cancel the associated membership.

**Membership creation blocking (US-3.1, ADR-037):** Creating a membership is blocked if the client has an active membership (redirects to Renew) OR an upcoming membership (informational block only, no Renew redirect). These are two distinct messages. Cancelled memberships (ADR-041) do not count toward the block.

**Membership cancellation vs payment void (US-3.10, Flow 18, ADR-041):** To remove an erroneous membership, cancel it (soft, `cancelled_at`); to reverse money, void the payment (Flow 11). The two are independent — neither cascades into the other. There is no free edit of an existing membership's dates/plan/price (snapshot integrity) — cancel and recreate.

**Future-dated memberships (Module Spec 3, ADR-037):** A pre-purchased membership with a future `start_date` carries `UPCOMING` status until that date arrives — it is not counted as active. An existing UPCOMING membership blocks creating a new one.

## MVP Milestone Sequence

Milestones have dependency order — each module's entities are used by the next:

1. Foundation & Auth
2. Client Management
3. Membership Management
4. Attendance
5. Client Payments
6. POS & Product Sales
7. Inventory
8. Dashboard & Reports
