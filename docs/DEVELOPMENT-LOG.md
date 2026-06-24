# Development Log — Block23 Gym Management System

One entry per commit. Each entry covers all changes from the previous commit to this one.
Newest entries at the top.

---

## [#009] Planning Phase Exit Review Patch + Device Strategy ADR — 2026-06-24

**Commit:** _(pending)_

**Changes from previous commit:**

- **DOMAIN-MODEL.md:**
  - `User` entity: `created_at` → `created_at / updated_at` for consistency with all other mutable entities (password changes and profile edits have no audit timestamp otherwise).
  - `MembershipPlan` entity: `created_at` → `created_at / updated_at` — plans are editable (US-3.9); price change history requires an `updated_at` for auditability.
  - `ProductCategory` entity: `created_at / updated_at` added — the only entity previously without timestamps; categories can be renamed (US-6.5).
  - `Attendance` entity: `updated_at` (nullable timestamp) added after `created_at`. Set to current timestamp when a correction is applied (Flow 15, US-4.11); null on all unedited records. **Resolves the BLOCKER identified in the Planning Phase Exit Review** — Flow 15 referenced `updated_at = now` but the entity definition did not include the field.

- **USER-STORIES.md:**
  - Design Review #7 banner added.
  - US-1.9 (NEW P0): Walk-In Conversion Prompt Threshold Setting — configurable in Settings → System Preferences with default of 5 visits. Governs the check-in conversion prompt (US-4.2, Flow 4), Dashboard "Frequent walk-ins" panel, Attendance Analytics Walk-In Insights (US-4.10), and Frequent Walk-Ins Report (US-8.8). Closes the gap: `Gym.walkin_conversion_prompt_visits` was referenced in 4 documents but no user story governed its configuration.
  - US-4.11 (NEW P0): Attendance Record Correction — same-day `time_in` edit only; required reason note stored in `Attendance.correction_note`; `Attendance.updated_at` set on save; prior-day records read-only; confirmation dialog required; no deletion permitted. Closes the gap: Flow 15 and the Roadmap item both existed but no acceptance criteria existed for the feature.
  - Summary table updated: Auth & Settings 6 → 7 P0; Attendance 8 → 9 P0; Total 77 → 79 P0.

- **DECISIONS.md:**
  - ADR-033 added: Device Target Strategy — desktop-first design; mobile-responsive support required for owner monitoring workflows (Dashboard, check-ins, revenue, inventory alerts); tablet is not a primary target; no native mobile app in scope. Rejected: tablet-first design; native mobile app.

- **MODULE-SPECS.md:**
  - Design Review #7 banner added.
  - Attendance module — Record Correction spec updated: references US-4.11 and `Attendance.updated_at` set on save; prior-day edit action not displayed (previously said "read-only" without specifying that the edit action is hidden).
  - Attendance module — Business Rule updated: Correction rule now references `Attendance.updated_at` and US-4.11.
  - Settings module — System Preferences list updated: each threshold now cross-references its governing user story; walk-in conversion prompt threshold now cites US-1.9 with a description of all surfaces it governs.

- **ROADMAP.md:**
  - Milestone 1: US-1.9 added (walk-in conversion prompt threshold setting).
  - Milestone 4: Attendance record correction item updated to reference US-4.11 and `Attendance.updated_at`.

- **CLAUDE.md:**
  - ADR count updated: ADR-001 through ADR-029 → ADR-001 through ADR-033.
  - Locked Design Decisions: ADR-033 (Device Target Strategy) entry added.
  - Domain Model Quick Reference — Attendance entry updated: `correction_note` and `updated_at` added with their constraints.

**Decisions made:**

- ADR-033: Device Target Strategy — desktop-first, mobile-responsive (see DECISIONS.md for full rationale and rejected alternatives)

**Issues / Notes:**

- All four domain model timestamp fixes are consistency patches only — no business rules, flows, or report derivations are affected.
- The `Attendance.updated_at` BLOCKER is resolved: the entity definition and Flow 15 are now consistent.
- US-1.9 and US-4.11 close all story coverage gaps identified in the Planning Phase Exit Review. Block23GymV2 is now cleared for exit from the Planning Phase.
- Next phases: tech stack selection (ADR-030 through ADR-032), ERD design, Design System.

---

## [#008] Reports Module Expansion — Design Review #6 — 2026-06-24

**Commit:** _(Done)_

**Changes from previous commit:**

- **DECISIONS.md:**
  - ADR-029 added: Reports Module Scope Expansion — Second Pass. Eight new P0 reports, annual revenue period, US-8.5 full ACs. Closes compliance gaps in ADR-020 and ADR-028 (void pattern detection was cited as a primary benefit but no report implemented it). Zero schema cost — all reports derive from existing fields.

- **DOMAIN-MODEL.md:**
  - `Membership.renewed_from_membership_id`: note updated — NULL = new membership, NOT NULL = renewal; cross-referenced to US-8.16 and US-8.19.
  - `InventoryTransaction.total_restock_cost`: note updated — aggregated by period in Restock Cost Report (US-8.18); null entries excluded from totals.
  - `Transaction.void_reason_category`: note updated — primary data source for Void Analysis Report (US-8.15), which delivers the pattern-detection benefit stated in ADR-028.

- **USER-STORIES.md:**
  - Design Review #6 banner added.
  - US-8.2 updated: period selector expanded to include This Year and Custom Date Range; acceptance criteria added.
  - US-8.5 updated: single-sentence story replaced with full acceptance criteria — period selector, member vs. walk-in breakdown columns, period-over-period comparison toggle, CSV export.
  - US-8.7 updated: acceptance criteria added — slow-moving ascending sort option; cross-reference to US-8.21.
  - US-8.15 (NEW P0): Void Analysis Report — voided transactions by void_reason_category and period; summary + detail sections; filterable by transaction type.
  - US-8.16 (NEW P0): New vs. Renewals Report — new memberships vs. renewals per period; renewal rate %; filterable by membership plan.
  - US-8.17 (NEW P0): Membership Plan Performance Report — per plan: memberships sold, total revenue, average price paid, plan status; limitation note on default-price comparison.
  - US-8.18 (NEW P0): Restock Cost Report — period-total inventory spend from InventoryTransaction.total_restock_cost; null entries excluded with count noted.
  - US-8.19 (NEW P0): Membership Net Change Report — new + renewals − expired per month; running cumulative active count; green/red net-change indicator.
  - US-8.20 (NEW P0): Period-over-Period Revenue Comparison — current vs. prior period side-by-side by source; % change column; four period presets + custom.
  - US-8.21 (NEW P0): Slow-Moving / Dead Stock Report — active products with zero sales in a 30/60/90-day lookback window; cost value locked in stock; longest-inactive first.
  - US-8.22 (NEW P0): Converted Walk-Ins Report — clients converted from walk-in to member (ADR-020 derivation) in period; conversion timeline; pre-conversion visit count; summary row.
  - Summary table updated: Dashboard & Reports 13 → 21 P0; Total 69 → 77 P0.

- **MODULE-SPECS.md:**
  - Design Review #6 banner added.
  - Module 8 (Reports) MVP Scope: Revenue Reports period options updated (This Year / Custom Range added). Attendance Reports spec fully rewritten with member/walk-in columns, period-over-period toggle, and CSV export. Best Sellers updated with slow-moving sort reference. Eight new report bullets added (US-8.15 through US-8.22).
  - Business Rules: eight new rules added covering void analysis derivation, new vs. renewals derivation, converted walk-ins derivation, period-over-period voided exclusion, restock cost null handling, and plan performance limitation.
  - Edge Cases: eleven new edge cases added covering zero-data states for all new reports.

- **ROADMAP.md:**
  - Milestone 8: Revenue reports item updated (This Year / Custom Range). Attendance reports item updated (full spec). Best sellers item updated (slow-moving sort). Eight new Milestone 8 items added (US-8.15 through US-8.22).

**Decisions made:**

- Reports Module expanded with eight new P0 reports; annual revenue period and full attendance report ACs added — ADR-029

**Issues / Notes:**

- US-8.17 (Membership Plan Performance): `price_paid` is snapshotted (ADR-003) but the plan's `default_price` at time of sale is not stored. The "average price paid" comparison uses the plan's current `default_price`, which may differ if the owner later edited the plan. The report surfaces this limitation explicitly in the UI. If precise override tracking is needed, a `default_price_at_purchase` field on `Membership` would resolve it — deferred to Phase 2.
- All eight new reports derive from existing schema fields with zero new entities, migrations, or field additions required.
- US-8.22 (Converted Walk-Ins) uses the ADR-020 derivation query — the same definition used in US-8.8 (Frequent Walk-In candidates), US-2.10 (profile conversion signal), and the Attendance Analytics Walk-In Insights panel. All four surfaces must stay consistent in their derivation logic.

---

## [#007] Payments, POS & Inventory Module Review — Design Review #5 — 2026-06-24

**Commit:** _(done)_

**Changes from previous commit:**

- **DECISIONS.md:**
  - ADR-026 added: `cost_price_snapshot` on `TransactionLineItem` — extends ADR-003's price-snapshot principle to cost price; historical gross profit figures must not be rewritten by future cost changes.
  - ADR-027 added: Whole-Container Sale Mode for `SERVING_BASED_PRODUCT` — `container_selling_price` field enables Per Container POS mode; rejected separate STANDARD_PRODUCT workaround.
  - ADR-028 added: Void Reason Category Enum on `Transaction` — `void_reason_category` enum replaces free-text-only void note; `void_reason` renamed to `void_reason_note` (now optional detail field).

- **DOMAIN-MODEL.md:**
  - `Product` entity: added `container_selling_price` (nullable decimal, SERVING_BASED_PRODUCT only; ADR-027) and `reorder_point` (nullable int; distinct from `low_stock_threshold`). Updated `cost_price` note to reference ADR-026 snapshot. Updated `low_stock_threshold` note to clarify distinction from `reorder_point`.
  - `Transaction` entity: `void_reason` renamed to `void_reason_note` (nullable, optional); added `void_reason_category` (nullable enum, required when status=VOID; ADR-028).
  - `InventoryTransaction` entity: added `adjustment_reason_category` (nullable enum, required when type=ADJUSTMENT); added `total_restock_cost` (nullable decimal, populated when type=PURCHASE); updated `note` field description (now optional supporting detail).
  - `TransactionLineItem` entity: added `cost_price_snapshot` (nullable decimal, copied from Product.cost_price at sale time; ADR-026); added `fee_override_note` (nullable text, for walk-in fee overrides). Updated `description` field example to include container-mode format. Updated reasoning to cover both unit_price and cost_price_snapshot snapshots.
  - Cross-Cutting Design Decisions: item 4 updated (snapshots now explicitly cover unit_price + cost_price_snapshot + price_paid); item 6 added (structured categories for void_reason_category and adjustment_reason_category).
  - "What's Not In This Model": SupplierCost note updated — per-unit supplier tracking is still deferred; `total_restock_cost` on InventoryTransaction covers MVP need.

- **USER-STORIES.md:**
  - Design Review #5 banner added.
  - US-5.3: updated — void now requires `void_reason_category` (structured enum); detail note optional except when category = OTHER; ACs expanded.
  - US-5.4 (NEW P0): end-of-day collections summary by payment method spanning all transaction types; date selector; voided excluded. Former P2 US-5.4 → US-5.6; former US-5.5 → US-5.7.
  - US-6.10: updated — void reason category required (from free-text only).
  - US-6.13 (NEW P0): cash change calculator in POS checkout.
  - US-6.14 (NEW P0): whole-container sale for SERVING_BASED_PRODUCT — Per Container mode toggle.
  - US-6.15 (NEW P0): gross margin display (₱ and %) on product create/edit form.
  - US-6.16 (NEW P0): category filter tabs on POS product grid.
  - US-7.5: promoted from P2 to P0, scope narrowed — total restock cost capture per PURCHASE event (not per-unit, not supplier entity).
  - US-7.6 (NEW P0): days-until-stockout estimate per product (current_stock ÷ avg daily sales, last 30 days).
  - US-7.7 (NEW P0): inventory valuation on Current Stock view and Dashboard KPI.
  - US-7.8 (NEW P0): shrinkage column on Current Stock view — negative ADJUSTMENT quantity this month, by category.
  - Former P2 US-7.6 → US-7.9.
  - US-8.1: ACs expanded — 6-card KPI strip specified, stockout estimates in inventory alerts, Today's Collections on Dashboard, voided exclusion rule stated.
  - US-8.9: ACs added — shrinkage section in Inventory Usage Report, breakdown by adjustment_reason_category, CSV export.
  - US-8.12: promoted from P2 to P0 — gross profit report (revenue, COGS via cost_price_snapshot, gross profit, margin %); full ACs added.
  - Summary table updated: Client Payments 3→4 P0; POS 10→14 P0; Inventory 4→8 P0; Dashboard & Reports 12→13 P0; total 59→69 P0, 16→14 P2.

- **USER-FLOWS.md:**
  - Design Review #5 header added.
  - Flow 8: category tabs and SERVING_BASED_PRODUCT container mode toggle added to product grid section; cash change calculator step added to checkout (Cash selected: "Cash received" input → "Change: ₱X" display); cost_price_snapshot captured alongside unit_price on each TransactionLineItem.
  - Flow 9: full restock flow rewritten — SERVING_BASED_PRODUCT container quantity clarified; optional total cost paid field added; InventoryTransaction fields (total_restock_cost, resulting_stock) made explicit.
  - Flow 11: void reason category selection step added before free-text note; `OTHER` requires detail note; void_reason_category stored on Transaction record.
  - Flow 16 (NEW): Whole-Container Sale — full flow from container mode toggle through POS sale creation and inventory deduction (quantity × servings_per_container).
  - Flow 17 (NEW): End-of-Day Collections Review — Collections Summary view, payment method table, voided exclusion, date selector, manual reconciliation note.

- **MODULE-SPECS.md:**
  - Design Review #5 banner added.
  - Module 1 (Dashboard): KPI strip expanded from 4 to 6 cards (added Today's Revenue, Inventory Value). Inventory alerts enhanced with days-until-stockout estimate per product. Today's Collections live feed panel added (6th panel). Business rules and edge cases expanded.
  - Module 5 (Client Payments): Collections Summary view fully specified (US-5.4, Flow 17). Void workflow updated with void_reason_category requirement (ADR-028). Business rules: void_reason_category required added; walk-in fee override note added. Edge cases: Collections Summary zero-state, void OTHER without note. Deferred references updated to US-5.6, US-5.7.
  - Module 6 (POS): Product create/edit — container_selling_price, reorder_point, gross margin display added. SERVING_BASED_PRODUCT section updated with container mode. POS screen — category tabs, container mode toggle, cash change calculator at checkout. POS History — summary strip (today's count + revenue) added. Void — void_reason_category required. Business rules — cost_price_snapshot, container mode deduction, void category, cash received validation. Edge cases expanded (6 new). Deferred references updated.
  - Module 7 (Inventory): Complete rewrite of MVP Scope — Restock, Current Stock View (with valuation, stockout estimate, reorder indicator, shrinkage column), Movement History, Manual Adjustment all updated. Business rules — adjustment_reason_category required, shrinkage derivation defined, reorder_point vs. low_stock_threshold distinction. Edge cases expanded (7 new). Deferred section updated.
  - Module 8 (Reports): Inventory Usage Report updated with shrinkage section. Gross Profit Report added (US-8.12, P0). Business rules updated — cost-snapshot rule added, shrinkage scope defined. Edge cases expanded. Deferred section simplified (US-8.12 promoted to P0, removed from deferred).
  - Resolved Scope Decisions table: 7 new rows added covering cost_price_snapshot, void categories, adjustment categories, container sale mode, collections summary, gross profit promotion, and daily revenue KPI.

- **ROADMAP.md:**
  - Milestone 5: added US-5.4 (collections summary); updated US-5.3 description (void_reason_category).
  - Milestone 6: added US-6.13 (change calculator), US-6.14 (container sale), US-6.15 (margin display), US-6.16 (category tabs); updated US-6.1–6.3 description; added container mode to Milestone 6 items; added whole-container sale flow reference.
  - Milestone 7: updated all items — restock cost capture (US-7.5), adjustment_reason_category, reorder_point indicator, days-until-stockout (US-7.6), inventory valuation (US-7.7), shrinkage column (US-7.8).
  - Milestone 8: Dashboard KPI strip updated to 6 cards with references; Inventory Usage Report updated with shrinkage; Gross Profit Report (US-8.12) added.
  - Phase 2 table: US-5.4 → US-5.6, US-5.5 → US-5.7, US-7.5 removed (promoted to P0), US-7.6 → US-7.9, US-8.12 removed (promoted to P0).

**Decisions made:**

- `cost_price_snapshot` added to `TransactionLineItem` — extends snapshot principle to cost price (ADR-026)
- Whole-container sale mode via `container_selling_price` on `SERVING_BASED_PRODUCT` (ADR-027)
- Void reason category enum on `Transaction`; `void_reason` renamed to `void_reason_note` (ADR-028)

**Issues / Notes:**

- `cost_price_snapshot` is nullable — products where the owner has not set `cost_price` will produce null snapshots. The Gross Profit Report flags these so the owner knows the margin figure may be understated. Historical transactions prior to this change will have null `cost_price_snapshot` — no backfill is performed.
- `void_reason_category = OTHER` requires a detail note (enforced at the application layer). All other categories make the note optional. This follows the same pattern as adjustment_reason_category.
- Days-until-stockout is advisory and derived at query time. It uses the last 30-day sales window; products with zero sales in that window show "No recent sales data" rather than an infinite estimate.
- US-7.9 (automated reorder notifications) was formerly US-7.6 in the Phase 2 table — this renumber accommodates the new P0 US-7.6 (days-until-stockout) without numbering collision.
- US-5.6 and US-5.7 were formerly US-5.4 and US-5.5 in the Phase 2 table — renumbered to accommodate the new P0 US-5.4 (collections summary).
- US-8.12 (Gross Profit Report) is promoted to P0 because the required foundation (`cost_price_snapshot` on TransactionLineItem, added in this session) is now in the schema. The report itself is computable from existing data with no further schema changes.

---

## [#006] Architecture Blockers Resolved — ADR-024 & ADR-025 — 2026-06-24

**Commit:** _(done)_

**Changes from previous commit:**

- **USER-FLOWS.md:**
  - Flow 7 header: Path A clarified — owner is redirected to Flow 5 (Add Membership) with no walk-in fee collected; one `MEMBERSHIP`-only transaction is created. Path B clarified — walk-in fee transaction already exists from Flow 3; a separate `MEMBERSHIP`-only transaction is created below.
  - Flow 7 main body: combined `WALK_IN_FEE + MEMBERSHIP` transaction step replaced with a separate `MEMBERSHIP`-only `CLIENT_TRANSACTION`. Walk-in fee transaction from Flow 3 remains intact. ADR-024 referenced.
  - Flow 7 Reasoning: updated to reflect the two-separate-transactions model and the rejection of the combined transaction.

- **DOMAIN-MODEL.md:**
  - `Membership` entity: `gym_id` (FK → Gym) added.
  - `TransactionLineItem` entity: `gym_id` (FK → Gym) added.
  - `InventoryTransaction` entity: `gym_id` (FK → Gym) added.
  - Cross-Cutting Design Decisions item 2: updated to explicitly include child/detail entities and reference ADR-025.

- **MODULE-SPECS.md:**
  - Module 5 (Client Payments) Business Rules: new rule added — a `CLIENT_TRANSACTION` never contains both `WALK_IN_FEE` and `MEMBERSHIP` line items simultaneously; these are always separate records (ADR-024).
  - Module 5 (Client Payments) Edge Cases: same-visit conversion edge case updated — original walk-in fee transaction remains intact; a separate `MEMBERSHIP` transaction is created; price override field covers any discount.

- **DECISIONS.md:**
  - ADR-012 Consequence: updated to remove combined transaction reference; now states that walk-in fees and membership purchases are always separate records, with ADR-024 cross-referenced.
  - ADR-024 added: Walk-In to Membership Conversion Always Creates Separate Transactions — defines three scenarios (pre-fee, post-fee same-visit, different-day) and formally rejects the combined transaction model.
  - ADR-025 added: `gym_id` on All Tables Including Child and Detail Entities — corrects the ADR-001 compliance gap on `Membership`, `TransactionLineItem`, and `InventoryTransaction`; documents RLS, reporting, and migration-cost rationale.

**Decisions made:**

- Walk-in fees and membership purchases are always separate `CLIENT_TRANSACTION` records — ADR-024
- `gym_id` added to `Membership`, `TransactionLineItem`, and `InventoryTransaction` to complete ADR-001 — ADR-025

**Issues / Notes:**

- The `TransactionLineItem` schema continues to permit both `WALK_IN_FEE` and `MEMBERSHIP` item types within a single `CLIENT_TRANSACTION` at the schema level — the rule against combining them is enforced at the application flow level, not via a schema constraint. This is intentional: a future admin tool may have a legitimate use case not yet in scope.
- ADR-025 corrects the domain model, not ADR-001. ADR-001's stated rule was always correct; the domain model implementation was incomplete. This entry resolves the inconsistency.
- These two resolutions clear the remaining architecture blockers. The project is ready to proceed to ERD and database design. Tech Stack Selection (ADR-026) is the recommended next planning activity before implementation begins.

---

## [#005] Attendance Module Structure Revision — Design Review #4 — 2026-06-24

**Commit:** _(done)_

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

**Commit:** _(done — design review session #3)_

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
