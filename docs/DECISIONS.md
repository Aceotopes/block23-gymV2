# Architecture Decisions — Block23 Gym Management System

Significant architectural and scope decisions, recorded in the order they were made.
Each entry: what was decided, why, and what alternative was rejected.

---

## ADR-001: `gym_id` on every table from day one

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** Every table in the schema carries a `gym_id` foreign key to the `Gym` table, even though MVP will have exactly one gym and one row in that table.

**Why:** Adding `gym_id` post-launch — after real production data exists — would require rewriting every query and risks cross-tenant data leakage during migration. Adding it now costs nothing: one extra column, one extra FK constraint.

**Rejected:** Omitting `gym_id` until multi-tenant is needed. The migration cost at that point is disproportionate to the zero cost of adding it now.

---

## ADR-002: Derived status fields, not stored flags

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** `Client.status` and `Membership.status` are computed at query time from dates and related records, never stored as a column.

**Why:** A stored flag requires a background sync job to stay current with expiry dates. That job *will* drift — memberships will show as active past their end date, or as expired before. Computing status from `end_date >= today` or active-membership existence guarantees correctness at negligible query cost for single-gym scale.

**Rejected:** Storing a `status` enum column updated by a cron job or application hook. Drift bugs are guaranteed over time.

---

## ADR-003: Price snapshots over live references for all monetary fields

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** `Membership.price_paid` and `TransactionLineItem.unit_price` always store the price at the moment of the transaction, copied from the catalog. They never reference `MembershipPlan.default_price` or `Product.current_price` live.

**Why:** If a plan price or product price changes later, live references would silently rewrite the financial meaning of every past transaction. Price history would become unrecoverable. This is the single most important correctness rule in the schema.

**Rejected:** Joining to the live catalog price for display. This would make past reports wrong every time the price catalog changes.

---

## ADR-004: Inventory ledger over a single mutable counter

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** Every stock change (sale, restock, manual adjustment) is recorded as a row in `InventoryTransaction`. `Product.current_stock` is a cached/derived value recomputable from the ledger.

**Why:** A single counter that gets incremented/decremented cannot be audited. If the count is ever wrong, there is no way to find out why or when. An append-only ledger with a `resulting_stock` snapshot per row gives full point-in-time auditability.

**Rejected:** Maintaining only `Product.current_stock` with no movement log. Any discrepancy becomes permanent and unexplainable.

---

## ADR-005: Soft deletes for all entities with financial or historical references

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** `Client` and `Product` use soft delete (`deleted_at` timestamp) instead of hard delete. Hard deletes are only allowed for entities with zero downstream references.

**Why:** Deleting a client would orphan attendance records, membership records, and transaction line items. Deleting a product would orphan inventory transactions and past sales. The historical and financial data must remain intact.

**Rejected:** Hard delete with cascading nullification of foreign keys. This destroys the audit trail and makes past reports incorrect.

---

## ADR-006: Single `Transaction` table with typed line items and `transaction_type` enum

**Date:** 2026-06-22 (updated Design Review #1)
**Status:** Accepted — reasoning updated

**Decision:** All revenue (client payments and POS sales) is recorded through a single `Transaction` table with typed `TransactionLineItem` rows, distinguished by a `transaction_type` enum (`CLIENT_TRANSACTION` or `POS_SALE`).

**Why (updated):** A single Transaction table provides one unified revenue ledger — all income is queryable from one place regardless of whether it came from a membership fee or a product sale. The `transaction_type` enum makes the two distinct patterns explicit at the data level without requiring separate tables. Revenue reports, payment method breakdowns, and category reports all read from one source.

**Note — original reasoning retired:** The original justification ("real-world checkouts mix membership + product in the same cart") has been explicitly rejected. Mixed checkout does not reflect how the gym actually operates. The single-table conclusion stands, but for the unified-ledger reason above.

**Rejected:** Separate tables (`ClientPaymentTable`, `POSSaleTable`). Would require unions for every revenue report. Does not simplify reporting compared to a single table with a `transaction_type` filter.

---

## ADR-007: All P1 stories promoted to P0 (committed MVP scope)

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** Seven stories formerly tagged P1 ("should have, can slip") are now committed MVP scope: US-2.6 (soft delete clients), US-3.6 (expiring-soon list), US-4.5 (multiple check-ins per day), US-5.4 (void transactions), US-6.5 (inventory movement ledger), US-7.5 (best-selling products), US-7.6 (walk-in conversion report).

**Why:** The Domain Model and Module Specs had already architected for all of these as core behavior. The P1 label was a story-prioritization artifact, not a reflection of architectural optionality. Shipping without them would mean shipping a system that silently loses audit trails and misrepresents financial history.

**Consequence:** No more P1 escape hatch if the timeline slips. Decide informally what would be cut under time pressure before build begins.

---

## ADR-008: `time_out` captured as nullable in `Attendance` now, unused in MVP

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** `Attendance.time_out` is added to the schema as a nullable field even though it is not used in any MVP fee calculation or report.

**Why:** Capturing it now at zero schema cost means future occupancy and session-duration analytics (US-4.6, post-MVP) won't require a schema migration against a populated table. Not capturing it now means that historical data would be permanently absent from those future reports.

---

## ADR-009: Insufficient stock blocks the sale, with override confirmation

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** Attempting to sell a product when stock would go below zero blocks the transaction and requires explicit owner confirmation to proceed.

**Why:** Silent negative stock is not acceptable — it means the system claims to have sold inventory it doesn't have, corrupting the ledger. The block-with-override gives the owner an escape hatch for edge cases without making negative stock the silent default.

**Rejected:** Silently allow the sale and let stock go negative. This makes the inventory ledger untrustworthy.

---

## ADR-010: CSV export is MVP scope; PDF export is deferred

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** CSV export of all reports is committed MVP scope (US-8.10). PDF export (US-8.11) is Post-MVP.

**Why:** CSV covers the core owner need — getting data out, opening in Excel, keeping offline copies. PDF formatting is a separate, higher-effort enhancement with no blocking need in MVP.

---

## ADR-011: POS product sales do not require a client

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** Product sales through the POS module are anonymous by default. `Transaction.client_id` is null for all `POS_SALE` records. No client selection step exists in the POS checkout flow.

**Why:** The business value of product sales is revenue tracking and inventory management — not per-customer purchase history. The gym owner's stated priorities are daily revenue, top-selling products, inventory levels, and remaining protein servings. Knowing which specific client bought a Gatorade provides no actionable value. Requiring a client selection step for every quick cash sale creates friction that directly degrades the POS experience.

**Rejected:** Requiring a client for all transactions (the original unified checkout design). This would slow down every product sale and misalign the system with how quick counter sales actually work.

---

## ADR-012: Mixed checkout removed — client transactions and POS sales are separate flows

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** A single transaction cannot contain both client-linked items (`MEMBERSHIP`, `WALK_IN_FEE`) and product items (`PRODUCT`). Client payments and POS sales are always separate, independent flows.

**Why:** Real gym operations naturally separate these. Membership payments and walk-in fees happen at check-in as part of a client-centric workflow. Product sales happen at a counter as quick, often client-anonymous transactions. Combining them into one cart was a theoretical optimization that doesn't match actual behavior and added UI complexity to the dominant use case (quick product sale).

**Consequence:** Walk-in fees and membership purchases are always recorded as separate `CLIENT_TRANSACTION` records. A `CLIENT_TRANSACTION` never contains both `WALK_IN_FEE` and `MEMBERSHIP` line items simultaneously — these are distinct financial events recorded independently. See ADR-024. If the client also wants to buy a product during that visit, a separate POS sale is opened.

**Rejected:** Unified mixed checkout (the original design). The example "member renews and buys protein shake in one transaction" was the primary driver of ADR-006's original reasoning. That example is now the rejected alternative: it doesn't reflect how this gym operates.

---

## ADR-013: `cost_price` promoted to MVP scope

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** `Product.cost_price` is a standard product field at MVP (was US-6.6, P2 in the original design).

**Why:** The POS module is being built from the ground up in this design review. Adding `cost_price` to the product creation form at this point costs almost nothing — it's one additional field. The marginal build cost is near zero, while the cost of adding it later (after products are created and populated) is a schema migration plus a data-backfill exercise. Profit-margin reporting (which uses this field) remains Post-MVP.

**Consequence:** `cost_price` on `Product` is MVP; `Product.cost_price` may be null for products where the owner doesn't track cost. The Gross Profit Report (US-8.12) was originally P2 but was promoted to P0 once `cost_price_snapshot` was added to `TransactionLineItem` (ADR-026), making historical gross profit computable from existing data.

---

## ADR-014: Client list includes status filters and membership expiry column

**Date:** 2026-06-23
**Status:** Accepted

**Decision:** The Client List page includes persistent filter chips (All / Active / Expiring soon / Expired / Walk-in) and replaces the "Joined" column with a "Membership expiry" column. Filters combine with name search.

**Why:** The primary daily use of the Client List is identifying who needs renewal outreach or immediate action. Without status filters, the list forces the owner to scroll all records to find a relevant subset. The "Joined" date is permanent, low-value data for routine operations; membership expiry is actionable daily information. Filters map directly to the derived status values already computed by ADR-002 — no additional storage or queries are required.

**Rejected:** Unfiltered client list with a "Joined" column. This was the initial wireframe design, rejected after Clients Module design review as insufficient for daily use at scale.

---

## ADR-015: Membership Plan catalog management is MVP scope, placed in Settings

**Date:** 2026-06-23
**Status:** Accepted

**Decision:** Plan creation, editing, and retirement are committed MVP scope (US-3.9). The plan management UI lives in the Settings module under a "Membership Plans" section. The `MembershipPlan` entity (already in the domain model with `name`, `duration_days`, `default_price`, `is_active`) now has a corresponding management interface.

**Why:** The wireframe revealed that the Add/Renew membership modal displayed hardcoded plan options with no owner control. Without plan management, the system cannot reflect the owner's actual pricing structure — a critical gap for a system designed to replace paper/Excel workflows. The entity has always existed in the schema; only the UI was missing.

**Consequence:** US-3.9 added as P0 story. Changing a plan's `default_price` affects only future transactions — existing `price_paid` snapshots are never altered (ADR-003 guarantees this structurally). Retiring a plan sets `is_active = false`; all existing memberships created under that plan remain intact.

**Rejected:** Hardcoded plan options with no management UI. This contradicts the `MembershipPlan` entity's design intent and would make the system non-configurable.

---

## ADR-016: Walk-in conversion signals surface in the Clients module, not only in Reports

**Date:** 2026-06-23
**Status:** Accepted

**Decision:** Walk-in visit counts and conversion signals appear directly on the Client Profile header for walk-in-status clients. A "Walk-in only" filter on the Client List, sortable by visit count, supports in-context conversion outreach. The Dashboard adds a "Frequent walk-ins" live feed panel (top 5 walk-in clients with no active membership, sorted by visit count). The Reports module's US-8.8 (Frequent Walk-In Report) remains and provides the full detailed view.

**Why:** The BRD's stated conversion goal occurs at the point of client interaction, not at report-review time. An owner interacting with a client during a walk-in visit has no conversion prompt under the original design — they would need to separately open Reports to discover the opportunity. The underlying data (Attendance records, Client status) already exists; surfacing it in the Clients module is zero schema cost and zero additional data storage.

**Rejected:** Walk-in conversion data surfaced in Reports only. This was the original design. Signals that arrive after the client has left cannot drive same-visit conversion — the primary conversion opportunity.

---

## ADR-017: Explicit `client_type` and walk-in inactivity status

**Date:** 2026-06-23
**Status:** Accepted

**Decision:** Two new derived concepts are added to the Client entity:

1. **`client_type`** (`MEMBER` | `WALK_IN`) — derived at query time: a client is `MEMBER` if they have at least one `Membership` record (regardless of whether it is active or expired); `WALK_IN` if they have zero Membership records. An expired member who now only visits as a walk-in retains `MEMBER` type — they are a known returning customer, not a first-time visitor. Neither value is stored as a column.

2. **Walk-in inactivity status** — the `Client.status` derivation now branches by `client_type`:
   - `MEMBER` clients: existing logic unchanged (Active / Expiring soon / Expired, from membership end_date).
   - `WALK_IN` clients: `ACTIVE` if last attendance date is within `Gym.walkin_inactivity_threshold_days` of today; `INACTIVE` if last visit exceeds the threshold or the client has no attendance records.

3. **New gym setting**: `Gym.walkin_inactivity_threshold_days` (int, default: 7) — configurable by the owner in Settings → System Preferences.

4. **Filter chip update**: Client List gains an "Inactive" chip that surfaces `WALK_IN` clients with `INACTIVE` status. The "Active" chip covers both active members and active walk-ins. "Inactive" covers inactive walk-ins only — not expired members (who are captured by "Expired").

**Why:** Walk-in clients with no visits for 7+ days represent lapsed interest. Without a distinct status, the owner has no lightweight signal for which walk-in clients to prioritize for outreach vs. which are actively using the gym. The type/status split also makes the Client List semantically unambiguous — "Active" means "currently engaging with the gym," regardless of how that engagement is structured. Computing both values from existing records (Membership and Attendance tables) requires no new stored columns and adds no sync risk.

**Rejected:**
- Storing `client_type` as a column on `Client`. Same drift risk as the stored-status flag rejected in ADR-002.
- Applying inactivity logic to `MEMBER` clients. Members have a paid commitment with a defined end date — "Expired" already captures lapsed membership. Inactivity during a paid period is not a signal the owner needs to act on.
- Using a fixed 30-day default for the inactivity threshold. Owner preference is 7 days; the setting is configurable in any case.

---

## ADR-018: Expired MEMBER check-in triggers a renewal decision point

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** When a client with `client_type = MEMBER` and no active membership (`most recent end_date < today`) is selected for check-in, the system presents a binary choice: "Check in as walk-in" or "Renew membership now." Silent routing to the walk-in flow is not permitted.

**Why:** Every expired-member check-in is the highest-conversion moment in the gym workflow — the member is physically present. The prior design (Flow 3) silently routed them into walk-in fee collection with no signal to the owner that a renewal opportunity existed. All data to detect this state already exists in the domain model; surfacing it costs zero schema changes.

**Rejected:** Silent routing to walk-in for all clients with no active membership regardless of `client_type`. This treats a returning lapsed member identically to a first-time visitor — an identical UX for two fundamentally different commercial situations.

---

## ADR-019: Member attendance inactivity is a separate operational signal, not a status change

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** A new configurable setting `Gym.member_inactivity_warning_days` (default: 14) identifies active MEMBER clients who have not visited recently. This signal is surfaced as:
- An "At risk" filter chip on the Client List
- A Dashboard "At-risk members" live feed panel
- An at-risk members report (US-8.14)

The signal does **not** change `Client.status` — an at-risk member's status remains Active or Expiring Soon as determined by their membership dates. At-risk is an orthogonal attendance-recency dimension.

**Why:** ADR-017 correctly rejected attendance inactivity as part of MEMBER client status derivation — the reasoning ("members have a paid commitment with a defined end date") remains valid for status. However, a paying member who stops attending is the system's primary churn signal, completely invisible under the prior design. Surfacing this as a separate filter and alert — not as a status — provides actionable retention intelligence without overloading the status semantics.

**Rejected:**
- Making "At risk" a 4th `Client.status` value for MEMBER clients. This creates semantic conflict: "Active" and "At risk" would be simultaneously true, breaking the mutual-exclusivity assumption of the status derivation.
- No at-risk signal at all, relying on owner judgment. A paid gym management system should proactively surface its highest churn signal.

**Relationship to ADR-017:** Extends, does not contradict. The status derivation for MEMBER clients is unchanged. At-risk is an additional derived dimension with its own setting and surfaces.

---

## ADR-020: Walk-in conversion event is derived, not stored

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** Walk-in → Member conversion is detected at query time: clients with `client_type = MEMBER` who have ≥ 1 Attendance record with `visit_type = WALK_IN` where `visit_date` predates their earliest `Membership.created_at`. No `converted_on` field on Client, no ConversionEvent table.

**Why:** The data required to detect a conversion is already present in the Attendance and Membership tables. Storing a derived value creates a stored-vs-reality drift risk (ADR-002 pattern): if past attendance or membership records are corrected, a stored conversion date would become stale. The derivation query is deterministic and inexpensive at single-gym scale.

**Rejected:** Adding a `converted_on` field to the Client entity or a separate ConversionEvent table. Both create the drift risk described above and store a value computable with a deterministic query — contrary to the principle established in ADR-002.

**Consequence:** The conversion derivation query is the authoritative definition of "converted walk-in" and must be applied consistently everywhere conversion data is surfaced: US-8.8 (Frequent Walk-In Report), US-2.10 (profile conversion signal), Dashboard "Frequent walk-ins" panel.

---

## ADR-021: `created_by` added to the Attendance entity

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** `Attendance.created_by` (FK → User, required) is added to the schema, following the same pattern as `Transaction.created_by`. At MVP all records carry the single Owner account. The field is forward-compatible with staff accounts (US-1.5, P2) at zero migration cost.

**Why:** When staff accounts are introduced, accountability for who logged each check-in is essential for operational oversight. Adding this FK now costs one column and one constraint, with zero behavior change at MVP. Adding it after the table is populated with real data requires a migration and permanently null historical records — unauditable.

**Rejected:** Deferring `created_by` to when staff accounts are built. Same cost asymmetry that justified `gym_id` on every table (ADR-001): the migration cost at the point of need is disproportionate to the cost of a single FK column added now.

---

## ADR-022: Dedicated Check-In Station screen as primary check-in interface

**Date:** 2026-06-24
**Status:** Accepted — navigation placement amended by ADR-023

**Decision:** A dedicated Check-In screen is the primary interface for daily attendance recording. It provides: persistent auto-focused name search, result cards showing membership status + expiry + today indicator, immediate action branching on client selection, and a today's check-ins running list.

**Amendment (Design Review #4):** The original decision stated "top-level navigation entry." This is superseded by ADR-023, which places the Check-In screen as the default view within the Attendance module — not as a standalone top-level navbar entry. The UX specification of the screen itself is unchanged.

**Why:** Check-in is the highest-frequency operation in the system — potentially 30–100 executions per day. The prior design had no dedicated screen; the owner navigated from the Client List (a management view) to perform an operational task, adding 2–3 navigation steps to every check-in. A purpose-built screen eliminates that overhead and surfaces contextual membership information without requiring a profile navigation.

**Rejected:** Check-in exclusively via the Client List or Client Profile. This conflates administrative client management with real-time operational check-in. A management screen is designed for record browsing and editing, not sub-second transactional interactions.

---

## ADR-023: Attendance module uses a single top-level nav entry with three views

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** The Attendance module is a single top-level navbar entry containing three internal views:
1. **Check-In** (default view — loads when Attendance is opened)
2. **Attendance History** (gym-wide historical record with date filter presets)
3. **Attendance Analytics** (aggregate metrics, trends, and operational signals)

Check-In is not a separate top-level module. All attendance-related workflows, records, analytics, and corrections live within this one module.

**Why:** A gym owner's mental model of "attendance" is unified — checking clients in, reviewing who came in, and analyzing engagement patterns are all facets of one operational domain. Splitting Check-In into a separate top-level navbar entry fragments this domain and implies Check-In and Attendance History are unrelated concerns. The Check-In view's "today's check-ins" running list already bridges operational (who is here now) and historical (today's record) concerns — it is visually adjacent to Attendance History, not to a separate module. Grouping all three views under one navbar entry reduces cognitive overhead and matches how the owner naturally thinks about attendance work.

**Consequence:** ADR-022's "top-level navigation entry" clause is superseded. The UX of the Check-In screen itself — auto-focused search, result cards, branching logic, today's list — is entirely unchanged; only its placement in the navigation hierarchy changes.

**Rejected:** Check-In as a separate top-level navbar item (ADR-022's original navigation claim). Rejected because it fragments a single operational domain across two navbar entries, creates two navigation targets for attendance-related work, and implies Check-In and Attendance History are unrelated workflows — which they are not.

---

## ADR-024: Walk-In to Membership Conversion Always Creates Separate Transactions

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** Walk-in fees and membership purchases are always separate `CLIENT_TRANSACTION` records, regardless of whether they occur in the same visit or on different days. Three conversion scenarios are defined:

- **Pre-fee conversion (Scenario 1):** The check-in conversion prompt (Flow 3/14) fires before any walk-in fee is collected. Owner is redirected to Flow 5 (Add Membership). One `CLIENT_TRANSACTION` is created with one `MEMBERSHIP` line item. No walk-in fee is charged. Attendance is recorded as `visit_type = MEMBER`.

- **Post-fee, same-visit conversion (Scenario 2):** The walk-in fee `CLIENT_TRANSACTION` already exists from Flow 3. Owner opens the Client Profile and clicks "Add membership." A separate `CLIENT_TRANSACTION` is created with one `MEMBERSHIP` line item. The original walk-in fee record is not voided or modified. If the owner wishes to offset the walk-in fee already collected, the price override field on the membership form handles this manually.

- **Different-day conversion (Scenario 3):** Walk-in fee transaction exists from a prior visit. The current-day membership purchase is a standalone `CLIENT_TRANSACTION` with one `MEMBERSHIP` line item.

**Why:** The previously documented combined `WALK_IN_FEE + MEMBERSHIP` single-transaction model cannot be produced cleanly in the post-fee scenario without either double-counting walk-in revenue or voiding a legitimately correct transaction. Voiding a completed, accurate walk-in fee transaction to replace it with a combined record misuses the void mechanism (reserved for data-entry errors) and adds false audit noise to a normal business flow. Two transactions representing two distinct financial events is the accurate model and requires no additional implementation complexity.

**Rejected:** Combined `CLIENT_TRANSACTION` with both `WALK_IN_FEE` and `MEMBERSHIP` line items (previously stated in Flow 7 and ADR-012's consequence section). In Scenario 2 the walk-in fee transaction is already committed; creating a second transaction containing a `WALK_IN_FEE` line item double-counts walk-in revenue. No clean creation path exists after Flow 3 has completed.

**Consequence:** The `TransactionLineItem` schema continues to permit both `WALK_IN_FEE` and `MEMBERSHIP` item types within a `CLIENT_TRANSACTION` — the rule against combining them is at the application flow level, not the schema level. ADR-012's consequence paragraph is superseded for the conversion scenario.

---

## ADR-025: `gym_id` on All Tables Including Child and Detail Entities

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** `gym_id` (FK → Gym) is added to `Membership`, `TransactionLineItem`, and `InventoryTransaction`, completing the full implementation of ADR-001's stated rule across every table in the domain model.

**Why:** Database-level Row-Level Security (RLS) — the recommended mechanism for tenant isolation in a shared-schema multi-tenant system — requires a direct `gym_id` column on every table. An RLS policy on a table without `gym_id` must use a subquery join to resolve tenant ownership, producing policies that are slower, harder to audit, and more likely to be misconfigured than single-column equality checks. Additional reasons:

- **Tenant data operations** (export, archival, deletion) on `Membership`, `TransactionLineItem`, or `InventoryTransaction` become a simple `WHERE gym_id = :id` rather than a join-chain operation against high-volume tables.
- **Reporting queries** on these three high-volume tables benefit from a direct `gym_id` index for tenant-filtered aggregation.
- **Migration cost asymmetry:** adding three UUID FK columns now costs nothing; adding them after production data exists requires a backfill migration against the system's highest-volume tables.
- **MVP impact:** zero behavioral change. A single-gym system writes the same `gym_id` value on every row.

**Rejected:** Deriving tenant from parent FK join only. This approach is insufficient for database-level RLS, produces join-chain operations for tenant-filtered reporting, and significantly increases the migration cost and risk when multi-tenancy is activated.

**Relationship to ADR-001:** This ADR resolves the inconsistency between ADR-001's stated rule and the original domain model. ADR-001's rule stands unchanged. This ADR documents the correction of the three omitted tables.

---

## ADR-026: `cost_price_snapshot` on `TransactionLineItem` — extends the snapshot principle to cost price

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** `TransactionLineItem` carries a `cost_price_snapshot` field (nullable decimal) that is copied from `Product.cost_price` at the moment the sale is recorded. It follows the exact same snapshot principle as `unit_price` (ADR-003).

**Why:** ADR-003 established that `unit_price` is snapshotted at sale time so that future price changes never rewrite the financial meaning of past transactions. The same correctness principle applies to cost price. If `Product.cost_price` changes — because the supplier raised prices, because the owner corrected an error, or any other reason — any historical gross profit calculation that reads the live `cost_price` from the Product record would silently produce wrong figures. A snapshot at sale time guarantees that "profit on sales from 3 months ago" is always correct regardless of what cost_price is today.

**Consequence:** `TransactionLineItem.cost_price_snapshot` is nullable. It is null when `Product.cost_price` was null at the time of sale (i.e., the owner did not track cost for that product). Reports that compute gross profit must handle the null case by either excluding those line items from margin calculations or treating them as "unknown margin." The field is never backfilled — historical transactions with null cost_price_snapshot remain null.

**Rejected:** Reading `Product.cost_price` live when computing gross profit for historical transactions. This violates the same principle ADR-003 established for selling prices and produces incorrect historical profit figures whenever cost_price changes.

**Relationship to ADR-003:** Extends ADR-003's snapshot principle from selling price to cost price. The motivating reasoning is identical; only the field differs.

---

## ADR-027: Whole-Container Sale Mode for `SERVING_BASED_PRODUCT`

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** `Product` gains a `container_selling_price` field (nullable decimal, `SERVING_BASED_PRODUCT` only). When set, the POS grid shows a mode toggle for that product: "Per Serving / Per Container." In Per Container mode, the cart records `container_selling_price × quantity` as the line total, and stock deduction is `quantity × servings_per_container` servings.

**Why:** Without this, a gym owner who wants to sell a whole protein tub must enter 70 (or whatever `servings_per_container` is) as the quantity in Per Serving mode. This produces a misleading cart description ("Whey Protein × 70"), requires the owner to mentally calculate the container price from the per-serving price, and creates a transaction that looks like 70 individual scoop sales. A dedicated container mode eliminates all three problems. The schema requires one additional nullable field; the flow adds one branch; the inventory deduction logic is unchanged in result.

**Consequence:** `container_selling_price` is nullable. Products without it do not show the container mode toggle. `unit_price` on `TransactionLineItem` is snapshotted from `container_selling_price` when container mode is used. The description field is populated with the human-readable container description. Stock deduction is identical in effect to a per-serving sale of `quantity × servings_per_container` — the ledger doesn't distinguish between modes.

**Rejected:** Creating a separate `STANDARD_PRODUCT` entry for each "container size" of a serving-based product. This breaks the stock synchronization — selling 1 unit of a "container product" would need to somehow decrement servings on the original `SERVING_BASED_PRODUCT`, requiring a join and custom logic. The container_selling_price field on the same product entity keeps the data coherent.

---

## ADR-028: Void Reason Category Enum on `Transaction`

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** `Transaction` gains a `void_reason_category` enum field (required when `status = VOID`). The existing `void_reason` free-text field is renamed to `void_reason_note` and becomes optional. The valid categories are: `DUPLICATE_ENTRY`, `WRONG_AMOUNT`, `WRONG_PRODUCT`, `CLIENT_CANCELLED`, `SYSTEM_ERROR`, `OTHER`.

**Why:** The prior design used only a free-text reason note. Free text produces uncategorized audit noise — void reasons like "duplicate", "dup", "entered twice", and "made twice" are all the same category but cannot be aggregated or analyzed. Structured void reason categories enable: (1) void pattern detection ("DUPLICATE_ENTRY is rising — the owner is making more data entry errors"), (2) audit quality improvement, and (3) future automated alerts if void rate exceeds a threshold. The free-text note field is preserved as an optional detail field for context that doesn't fit the category list.

**Consequence:** The application enforces `void_reason_category` selection before a void can be confirmed. The `OTHER` category must always be accompanied by a `void_reason_note` (enforced at the application layer). Both POS sales and client transaction voids use the same category enum. This applies to Flow 11 (Transaction Void) and all void surfaces in the Payments and POS modules.

**Rejected:** Free-text-only void reason (the prior design). This was retained from the original design as a minimal MVP approach. Rejected now because structured categories cost essentially nothing to implement at build time and produce meaningless audit data if left as free text across hundreds of transactions.

---

## ADR-029: Reports Module Scope Expansion — Second Pass

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** Eight new P0 reports added to MVP scope; US-8.2 updated with annual and custom-range period options; US-8.5 updated with full acceptance criteria; US-8.7 updated with a slow-moving sort option. New reports:

- **US-8.15** — Void Analysis Report: aggregate voided transactions by `void_reason_category`, transaction type, and period; delivers the pattern-detection benefit stated in ADR-028.
- **US-8.16** — New vs. Renewals Report: new memberships (`renewed_from_membership_id IS NULL`) vs. renewals (`IS NOT NULL`), with revenue breakdown and renewal rate %.
- **US-8.17** — Membership Plan Performance Report: per plan — memberships sold, total revenue, average price paid, plan status.
- **US-8.18** — Restock Cost Report: period-total inventory spend aggregated from `InventoryTransaction.total_restock_cost`.
- **US-8.19** — Membership Net Change Report: new memberships minus expired memberships per month, with running cumulative active-member count.
- **US-8.20** — Period-over-Period Revenue Comparison: current period revenue vs. equivalent prior period, by source, with % change column.
- **US-8.21** — Slow-Moving / Dead Stock Report: active products with zero sales in a configurable lookback window (30/60/90 days), with cost value locked in stock.
- **US-8.22** — Converted Walk-Ins Report: clients who converted from walk-in to member in a selected period, with conversion timeline data (derived per ADR-020).

**Why:** A systematic review of the Reports Module against business questions revealed six structural gaps:

1. **ADR-028 compliance gap:** `void_reason_category` was justified by its "void pattern detection" analytical benefit — but no report implemented this. US-8.15 closes that gap.
2. **`renewed_from_membership_id` unused in reporting:** This self-FK cleanly distinguishes new acquisition from renewal retention but powered no report. US-8.16 and US-8.19 resolve this.
3. **`total_restock_cost` unused in reporting:** Added in Design Review #5 for spending visibility; had no aggregate report surface. US-8.18 resolves this.
4. **Annual revenue period missing:** US-8.2 offered Daily/Weekly/Monthly only — no annual or YTD option for financial review or tax preparation.
5. **US-8.5 had no acceptance criteria:** The attendance report was a single sentence — an unspecified blank check for implementation.
6. **No period-over-period analysis anywhere:** The growth question ("Am I making more than last month?") was unanswerable from Reports. US-8.20 resolves this.

All eight new reports are derivable from existing schema fields with zero new entities or fields required.

**Rejected:** Deferring to Phase 2. The schema fields these reports use were added in Design Reviews #1–5 with specific analytical justifications. Shipping without the corresponding reports means those justifications are partially unfulfilled at launch. The implementation cost delta between MVP and Phase 2 is low; the owner experience gap is high.

**Relationship to prior ADRs:**
- **ADR-020 (conversion derivation):** US-8.22 uses the ADR-020 derivation for conversion outcomes, extending it from candidate identification (US-8.8) to outcome reporting.
- **ADR-028 (void categories):** US-8.15 delivers the void pattern detection benefit ADR-028 cited as its primary justification.
- **ADR-003 / ADR-026 (snapshots):** All new financial reports respect snapshot rules — no report reads live catalog prices or cost prices for historical periods.
- **ADR-015 (membership plans):** US-8.17 uses `Membership.membership_plan_id` + `price_paid` — both designed for this query pattern.
