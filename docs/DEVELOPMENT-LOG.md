# Development Log — Block23 Gym Management System

One entry per commit. Each entry covers all changes from the previous commit to this one.
Newest entries at the top.

---

## [#003] Clients Module Wireframe Review — Planning Doc Sync — 2026-06-23

**Commit:** _(pending — design review session #2)_

**Changes from previous commit:**

- **Clients Module (MODULE-SPECS.md)** — major overhaul:
  - Client List: status filter chips (All / Active / Expiring soon / Expired / Walk-in only); "Membership Expiry" column replaces "Joined"; "Show archived" toggle; toolbar "+ Add membership" shortcut removed
  - Client Profile: quick-stats strip (total visits, visits this month, days to expiry, walk-in count); walk-in conversion signal ("X visits — no membership"); context-aware membership action button (Add membership / Renew / Renew early); archive via overflow menu (⋯); voided payment indicator (VOID badge) in Membership History tab; Attendance History tab now includes date range + visit type filters
  - Archive client flow: confirmation dialog with specific text; reactivation from overflow menu
  - Edge cases expanded: future-dated "Upcoming" badge, Dashboard feed navigation, walk-in filter + search + sort combinations
- **Dashboard Module (MODULE-SPECS.md):**
  - Added 4th live feed panel: "Frequent walk-ins" — top 5 walk-in clients (no active membership), sorted by visit count, with last visit date. Links to Client List filtered by "Walk-in only."
- **Membership Module (MODULE-SPECS.md):**
  - Added Membership Plan Catalog subsection; plan selector now sourced from `MembershipPlan.is_active = true`
  - Create Membership form: "Duration (days)" numeric input appears inline when "Custom duration" selected
  - Blocking state: message text specified, "Go to Renew" action added
  - Edge cases expanded: plan retirement, voided payment handling
- **Settings Module (MODULE-SPECS.md):**
  - Added "Membership Plans" section: list view, add plan, edit plan, retire plan, last-active plan guard
- **USER-STORIES.md:**
  - US-2.3: combined filter + search AC added
  - US-2.4: quick-stats strip, voided indicator, attendance filters, "Upcoming" badge AC added
  - US-2.6: archive action location, confirmation text, archived list behavior, reactivation AC added
  - US-2.9 (NEW P0): Status filter chips on Client List
  - US-2.10 (NEW P0): Walk-in conversion signals on Client Profile + Dashboard feed
  - US-3.1: blocking message text, "Go to Renew" redirect AC added
  - US-3.2: context-aware button labels AC added
  - US-3.3: custom days inline input AC added
  - US-3.9 (NEW P0): Membership plan catalog management in Settings
  - Summary table updated: Clients 6→8, Membership 6→7, Total 48→51 P0 stories
- **USER-FLOWS.md:**
  - Flow 5: context-aware button entry points added; blocking message text specified; custom duration inline input noted
  - Flow 6: context-aware button labels ("Renew" / "Renew early") added to entry
  - Flow 7: conversion signal UX path added (profile quick-stats strip → "X visits — no membership" → "Add membership" button)
  - Flow 12 (NEW): Archive Client — archive flow, confirmation dialog, archived state, reactivation path
  - Flow 13 (NEW): Manage Membership Plans — add plan, edit plan, retire plan (with last-active guard)
  - Design Review #2 header note added
- **ROADMAP.md:**
  - Milestone 2: added US-2.9 and US-2.10; updated description of US-2.3, US-2.4, US-2.6
  - Milestone 3: added US-3.9; updated description of US-3.1, US-3.2, US-3.3
  - Milestone 8: added US-2.10 reference to Dashboard item
- **DOMAIN-MODEL.md:**
  - `MembershipPlan` entity: added management UI note referencing Settings module and ADR-015
- **DECISIONS.md:**
  - ADR-014 added: Client list status filters and membership expiry column
  - ADR-015 added: Membership Plan catalog management is MVP scope, placed in Settings
  - ADR-016 added: Walk-in conversion signals surface in Clients module, not only in Reports

- **Client type and walk-in inactivity status (all docs):**
  - `client_type` added as a derived field on `Client`: `MEMBER` (has ≥1 Membership record) | `WALK_IN` (zero memberships). Never stored.
  - `Client.status` derivation now branches by `client_type`:
    - MEMBER → Active / Expiring soon / Expired (from membership end_date, unchanged)
    - WALK_IN → Active (last visit within threshold) | Inactive (last visit > threshold or never visited)
  - `Gym.walkin_inactivity_threshold_days` added (default: 7) — new field on Gym entity, new setting in Settings → System Preferences
  - Client List gains "Inactive" filter chip; type badge (MEMBER / WALK_IN) added to list and profile
  - Client Profile: type badge + status badge in header; quick-stats strip updated for WALK_IN clients (days since last visit)
  - US-1.7 (NEW P0): walk-in inactivity threshold setting in Settings
  - US-2.4: type badge and WALK_IN-specific stats added to profile AC
  - US-2.9: "Inactive" filter chip added; chip definitions expanded for both MEMBER and WALK_IN branches
  - Summary table updated: Auth & Settings 4→5, Total 51→52
  - ADR-017 added: explicit client_type and walk-in inactivity status

**Decisions made:**

- Status filter chips on Client List are MVP scope, resolve against derived status (ADR-002) — ADR-014
- Membership Plan catalog management is MVP scope, UI in Settings — ADR-015
- Walk-in conversion signals surface in Clients module AND Dashboard, not only in Reports — ADR-016
- `client_type` (MEMBER/WALK_IN) and walk-in inactivity status are both derived from existing records, not stored — ADR-017

**Issues / Notes:**

- The "Membership Expiry" column replaces "Joined" for actionability in daily use; date_registered remains stored and accessible on the profile
- The last-active plan guard (Settings → Membership Plans) prevents a state where the Add/Renew modal has zero plan options
- Voiding a payment does not alter the associated membership; voiding a membership payment only adds a VOID badge to the membership history row — both financial and membership corrections remain manual and independent

---

## [#002] Sales Module Redesign — POS Model — 2026-06-22

**Commit:** _(done — design review session #1)_

**Changes from previous commit:**

- Sales Module split into two separate modules:
  - Module 5 "Client Payments": membership fees and walk-in fees only — always client-linked
  - Module 6 "POS & Product Sales": product sales — no client required
- Mixed checkout concept removed (was the original justification for ADR-006)
- Client Profile "Purchase History" tab removed — POS sales are not linked to clients
- `Product` entity updated:
  - `unit_type` renamed to `product_type` (values: `STANDARD_PRODUCT`, `SERVING_BASED_PRODUCT`)
  - `current_price` renamed to `selling_price`
  - Added `cost_price` (nullable decimal — promoted from P2 to MVP)
  - Added `image_url` (nullable string — for POS grid display)
  - Added `servings_per_container` (nullable int — SERVING_BASED_PRODUCT only)
- `Transaction` entity updated:
  - Added `transaction_type` enum (`CLIENT_TRANSACTION` | `POS_SALE`)
  - `client_id` now explicitly null for `POS_SALE` transactions
- `TransactionLineItem` constraint added: item_type must match parent transaction_type
- Three new report types added: Revenue by Payment Method, Revenue by Product Category, Inventory Usage Report
- Roadmap updated: 8 milestones (was 7) — POS is now a dedicated milestone
- Flow 8 (Product Sale) rewritten as standalone POS flow — no client
- Flow 7 (Walk-in → Member Conversion) preserved unchanged in logic — WALK_IN_FEE + MEMBERSHIP is a valid CLIENT_TRANSACTION
- USER-STORIES.md: module count goes from 7 to 8; MVP story count increases from 37 to 48
- ADR-006 reasoning updated (unified ledger, not mixed checkout)
- ADR-011 added: POS sales are anonymous by default
- ADR-012 added: Mixed checkout removed — client and POS flows are always separate
- ADR-013 added: cost_price promoted to MVP scope

**Decisions made:**

- POS product sales do not require a client — ADR-011
- Mixed checkout removed — client transactions and POS sales are separate flows — ADR-012
- cost_price promoted from P2 to MVP scope — ADR-013

**Issues / Notes:**

- Voiding a client payment (e.g., membership fee) does not auto-cancel the associated membership — financial correction and membership management are intentionally separate actions
- Remaining servings for SERVING_BASED_PRODUCT are now surfaced on the dashboard inventory alerts panel

---

## [#001] Project Scaffolding — 2026-06-22

**Commit:** _(done — first commit)_

**Changes from previous commit:**

- First commit — no previous state
- Created `docs/` folder and moved all planning documents into it:
  - `DOMAIN-MODEL.md`
  - `MODULE-SPECS.md`
  - `USER-FLOWS.md`
  - `USER-STORIES.md`
- Created root-level project files:
  - `README.md` — project overview, module list, doc links
  - `ROADMAP.md` — MVP milestones (7) and Post-MVP items (15 stories)
  - `DECISIONS.md` — 10 architecture decisions (ADR-001 through ADR-010)
  - `DEVELOPMENT-LOG.md` — this file
  - `.gitignore`
- Initialized Git repository

**Decisions made:**

- None new — all decisions already recorded in `DECISIONS.md` were made during the planning phase prior to this commit

**Issues / Notes:**

- Tech stack not yet decided; `.gitignore` covers common stacks and will be updated once the stack is confirmed
- No application code exists yet
