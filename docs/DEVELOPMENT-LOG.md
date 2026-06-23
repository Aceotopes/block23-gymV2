# Development Log — Block23 Gym Management System

One entry per commit. Each entry covers all changes from the previous commit to this one.
Newest entries at the top.

---

## [#005] Attendance Module Structure Revision — Design Review #4 — 2026-06-24

**Commit:** _(pending)_

**Changes from previous commit:**

- **DECISIONS.md:**
  - ADR-022 status updated to "Accepted — navigation placement amended by ADR-023." "Top-level navigation entry" clause removed; amendment note added.
  - ADR-023 added: Attendance module is a single top-level nav entry with three internal views (Check-In, Attendance History, Attendance Analytics). Check-In is the default view. All attendance-related workflows, records, analytics, and corrections live within this one module.

- **USER-STORIES.md:**
  - US-4.8: First AC updated — "top-level screen (not nested under Clients or Attendance)" replaced with "default view of the Attendance module." (ADR-023)
  - US-4.3: First AC updated — Attendance History is the second view within the Attendance module. Date filter presets added: Today (default on open) · Yesterday · Last 7 Days · Last 30 Days · Custom Date Range.
  - US-4.10 (NEW P0): Attendance Analytics view — KPI cards (Today/Week/Month check-ins, Member vs Walk-In Ratio), daily trend chart, day-of-week and peak-hour charts, Member Insights panel, Walk-In Insights panel, Operational Insights panel, and Alerts panel. Attendance-domain scope only; no CSV export from this view.
  - Summary table updated: Attendance 7→8, Total 58→59.

- **USER-FLOWS.md:**
  - Flow 14: Entry point updated from "Check-In Station screen (top-level navigation)" to "Attendance module → Check-In view (default view)."

- **MODULE-SPECS.md:**
  - Module 4 (Attendance): Module structure section added — three named views (Check-In, Attendance History, Attendance Analytics) under one top-level navbar entry.
  - Check-In Station: "Top-level navigation entry point" replaced with "Default view within the Attendance module." (ADR-023)
  - Attendance History: Date filter presets added (Today · Yesterday · Last 7 Days · Last 30 Days · Custom Date Range; default: Today; session-persistent).
  - Attendance Analytics: Full section added — KPI cards, three charts with period selector, Member Insights panel, Walk-In Insights panel, Operational Insights panel, Alerts panel. Scope boundary enforced: attendance-domain only, no revenue/inventory data, no CSV export.
  - Business Rule added: Analytics scope boundary — aggregate insights in Analytics; detailed exportable records in Reports module.
  - Deferred: Attendance decline alert threshold hardcoded at 20% for MVP; owner-configurable threshold deferred to a future Settings addition.

- **ROADMAP.md:**
  - Milestone 4 restructured: "Dedicated Check-In Station screen" bullet replaced with a three-view Attendance module entry covering Check-In (US-4.8), Attendance History (US-4.3), and Attendance Analytics (US-4.10).

**Decisions made:**

- Attendance module restructured as a single top-level nav entry with three views: Check-In (default), Attendance History, Analytics — ADR-023
- ADR-022 amended: Check-In screen UX unchanged; navigation placement changed from standalone top-level to default view within Attendance module
- Attendance Analytics confirmed as committed MVP scope — US-4.10

**Issues / Notes:**

- Attendance Analytics panels use the same derived definitions as existing Client List filters and Dashboard panels — "At risk" count, "Frequent walk-ins" count, and conversion rate all resolve from the same query logic established in ADR-019 and ADR-020. No new derivation rules introduced.
- The 20% attendance decline alert threshold is hardcoded for MVP. Owner-configurable threshold is a future Settings addition — the 20% value is a sensible operational default and unlikely to need tuning until the owner has several months of data.
- No CSV export from Attendance Analytics by design — this preserves a clear boundary between in-module operational intelligence (Analytics) and archive-quality reporting (Reports module, US-8.5, US-8.13, US-8.14). If the owner needs a list, they navigate to Reports.
- No new user flow added for Attendance Analytics — the view is a pure read interface with a period selector; it has no decision branches that warrant flow documentation.

---

## [#004] Attendance Module Deep Review — Planning Doc Sync — 2026-06-24

**Commit:** _(pending — design review session #3)_

**Changes from previous commit:**

- **DECISIONS.md:**
  - ADR-018 added: Expired MEMBER check-in triggers a renewal decision point — no silent routing to walk-in
  - ADR-019 added: Member attendance inactivity is a separate operational signal, not a status change
  - ADR-020 added: Walk-in conversion event is derived, not stored
  - ADR-021 added: `created_by` added to the Attendance entity
  - ADR-022 added: Dedicated Check-In Station screen as primary check-in interface

- **DOMAIN-MODEL.md:**
  - `Gym` entity: added `member_inactivity_warning_days` (int, default: 14; drives at-risk MEMBER signal) and `walkin_conversion_prompt_visits` (int, default: 5; triggers pre-fee conversion prompt)
  - `Client` entity: added at-risk signal note — derived operational signal for active MEMBER clients not attending; does not alter `Client.status` (ADR-019)
  - `Attendance` entity: added `created_by` (FK → User, required; ADR-021) and `correction_note` (text, nullable; populated when time_in is edited)
  - `Attendance` entity: added conversion derivation note (ADR-020)

- **USER-STORIES.md:**
  - US-1.8 (NEW P0): Member inactivity warning threshold setting — configurable at-risk threshold (default: 14 days)
  - US-2.11 (NEW P0): At-risk member filter chip on Client List + Dashboard live feed panel
  - US-4.8 (NEW P0): Dedicated Check-In Station screen — top-level nav, auto-focused search, result cards, today's list
  - US-4.9 (NEW P0): Today's check-ins standalone view in Attendance section
  - US-8.13 (NEW P0): Member engagement report — active members by visit frequency, least engaged first
  - US-8.14 (NEW P0): At-risk members report — active members not attending within threshold
  - US-4.1: four new acceptance criteria (result card preview, expired MEMBER prompt, expiry warning, duplicate confirmation)
  - US-4.2: two new acceptance criteria (quick-create modal fields, pre-fee conversion prompt)
  - US-4.3: two new acceptance criteria (gym-wide attendance screen, row columns)
  - US-8.8: conversion derivation clarification note added (ADR-020)
  - Summary table updated: Auth & Settings 5→6, Clients 8→9, Attendance 5→7, Dashboard & Reports 10→12, Total 52→58

- **USER-FLOWS.md:**
  - Flow 3: two new upstream branches added — expired MEMBER renewal decision prompt (ADR-018) and pre-fee walk-in conversion prompt
  - Flow 4: duplicate check-in confirmation step added; post-check-in expiry warning step added; return-to-search state specified
  - Flow 7: conversion trigger description updated (upstream + profile paths); conversion logging replaced with derivation definition (ADR-020)
  - Flow 14 (NEW): Check-In Station — full check-in screen flow with all three client branches
  - Flow 15 (NEW): Attendance Record Correction — same-day time_in edit with required reason note

- **MODULE-SPECS.md:**
  - Module 1 (Dashboard): 5th live feed panel "At-risk members" added (ADR-019, US-2.11); new business rule and two new edge cases added
  - Module 2 (Clients): "At risk" filter chip added to 7-chip set; "At risk" chip defined with ADR-019 reference; at-risk business rule added; three new edge cases added
  - Module 4 (Attendance): MVP Scope section fully rewritten — Check-In Station, Today's Check-Ins, Gym-wide History, Attendance Record Correction all specified; Business Rules expanded with 5 new rules (ADR-018, ADR-019 prompt, ADR-021, correction bounds); Edge Cases expanded from 2 to 9; Deferred section updated with 2 new explicit callouts
  - Module 8 (Reports): Member Engagement Report (US-8.13) and At-risk Members Report (US-8.14) added; Frequent Walk-In Report updated with ADR-020 conversion derivation reference; new business rule added
  - Module 9 (Settings): System Preferences updated with 2 new fields (`member_inactivity_warning_days`, `walkin_conversion_prompt_visits`); 2 new business rules added

- **ROADMAP.md:**
  - Milestone 1: US-1.8 added
  - Milestone 2: US-2.11 added
  - Milestone 4: rewritten — US-4.8 promoted to first item; US-4.1, US-4.2, US-4.3 descriptions updated; US-4.9 added; attendance record correction item added
  - Milestone 8: Dashboard item updated (5th panel); US-8.13 and US-8.14 added

**Decisions made:**

- Expired MEMBER check-in triggers a renewal decision point — not silent walk-in routing — ADR-018
- Member attendance inactivity is a separate operational signal (not a status change) — ADR-019
- Walk-in conversion event is derived from Attendance + Membership records, not stored — ADR-020
- `created_by` added to Attendance entity now, not deferred — ADR-021
- Dedicated Check-In Station screen added as top-level navigation — ADR-022

**Issues / Notes:**

- ADR-019 extends ADR-017 without contradiction: MEMBER client status derivation (Active/Expiring soon/Expired) is unchanged. At-risk is an orthogonal attendance-recency signal surfaced as a filter, dashboard panel, and report — not as a status value.
- The "At risk" filter chip does not overlap with "Inactive" (WALK_IN clients only). A client can simultaneously match "At risk" (membership current, not attending) and "Expiring soon" (near end_date).
- Attendance record deletion is intentionally not permitted at MVP — only same-day time_in correction with a required reason note.
- `walkin_conversion_prompt_visits` (default: 5) is configurable in Settings → System Preferences, consistent with the pattern of all other threshold settings.

---

## [#003] Clients Module Wireframe Review — Planning Doc Sync — 2026-06-23

**Commit:** _(done — design review session #2)_

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
