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

**Amendment (2026-06-25):** The original `Product` entity in the domain model incorrectly implemented soft delete using `is_active: bool` rather than the `deleted_at` timestamp specified in this ADR. The domain model has been corrected to align with this ADR's stated rule: `Product.is_active` is removed; `Product.deleted_at` (nullable timestamp) is added. The POS grid and product catalog filter on `deleted_at IS NULL`; archived products (`deleted_at IS NOT NULL`) remain fully queryable for all historical reports and inventory auditing. The behavior is identical to `Client.deleted_at`.

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

---

> **Numbering note (2026-06-25):** ADR-030, ADR-031, and ADR-032 are intentionally unused. They were reserved during the Planning Phase Exit Review (Log #009) for technology-stack decisions. Those decisions were instead consolidated into `TECH-STACK.md` (see §5, "Rejected Technologies": Prisma over Drizzle, Better Auth over Auth.js, Vercel over Railway) rather than recorded as standalone ADRs. The gap is preserved so existing ADR references stay stable; the canonical ADR count is the number of recorded entries (41), not the highest number (044).

---

## ADR-033: Device Target Strategy

**Date:** 2026-06-24
**Status:** Accepted

**Decision:** The system is designed desktop-first with full mobile-responsive support as a secondary target. Tablet is not a dedicated design target.

- **Primary targets:** Desktop and laptop browsers.
- **Secondary target:** Mobile phone browsers — responsive adaptation, not a native app.
- **Tablet:** Not a primary design target; covered adequately by mobile-responsive layouts without dedicated breakpoints.

**Why:** All primary operational workflows — client management, membership management, attendance recording, POS checkout, inventory management, reports, analytics, and settings — are data-dense and best served by a full desktop viewport. The gym owner operates from a desk or front counter. Reports and data tables require full-width column sets; compressing them to a tablet-first or mobile-first design forces truncation or horizontal scrolling on the surfaces the owner uses most.

Mobile support is required for the owner's secondary usage patterns: monitoring the Dashboard from their phone while away from the desk, reviewing today's check-ins, checking revenue totals, and reviewing inventory alerts. These workflows are read-heavy and tolerate simplified layouts. No data-entry workflow is expected to be performed primarily on mobile.

**Implications:**
- All data tables, reports, and admin views are designed for a desktop viewport first.
- Mobile layouts adapt responsively — simplified column sets, stacked card layouts, and bottom-navigation patterns are acceptable.
- No tablet-specific design specifications or breakpoints are required.
- The Design System must establish mobile breakpoints for responsive adaptation, not tablet-specific experiences.
- No native mobile app is in scope for MVP.

**Rejected:** Tablet-first design. Rejected because (1) the owner's primary device is a laptop or desktop, not a tablet; (2) reports and data tables require full-width display that desktop-first serves better; (3) tablet-specific breakpoints add design and implementation cost without proportionate benefit when mobile-responsive design covers tablets adequately.

**Rejected:** Native mobile app. Out of scope for MVP — a web-responsive design covers the owner's secondary mobile monitoring workflows without the overhead of a separate application.

---

## ADR-034: `FORCED_SALE` Category for Negative-Stock Override

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** Add `FORCED_SALE` to the `InventoryTransaction.adjustment_reason_category` enum. When the owner overrides the stock-block to sell below zero (ADR-009), the resulting `InventoryTransaction` (type=`ADJUSTMENT`) is automatically assigned `adjustment_reason_category = FORCED_SALE` — no manual category selection is required from the owner for this system-generated entry.

**Why:** `adjustment_reason_category` is required for all `ADJUSTMENT`-type entries. The existing categories (`DAMAGE`, `EXPIRY`, `THEFT`, `COUNT_CORRECTION`, `NATURAL_WASTAGE`, `PROMOTION`, `OTHER`) are all manually initiated by the owner. A Force Sale override generates a system-created entry that none of these categories accurately describes. `COUNT_CORRECTION` is semantically wrong — it implies a physical count was done, not that a sale was forced through. A dedicated `FORCED_SALE` category enables: (1) clean audit trail distinguishing owner-caused stock discrepancies from demand-driven overrides; (2) future pattern analysis of how often the stock-block is bypassed; (3) separation from legitimate manual adjustments in shrinkage and void analysis reports.

**Consequence:** The Force Sale ADJUSTMENT entry is created automatically by the system — the owner is not prompted to select a category. The `note` field is populated with a system-generated description: "Forced sale override — stock went negative." The entry is visually distinct in Inventory Movement History with a "FORCED SALE" label. `FORCED_SALE` is a system-only category and does not appear in the owner-facing manual adjustment category selector.

**Rejected:** Using `COUNT_CORRECTION` as a proxy (semantically wrong). Treating Force Sale as a SALE entry that goes directly to negative stock without a separate ADJUSTMENT (loses the explicit audit signal for the override, contradicting ADR-009's requirement to log the discrepancy). Requiring the owner to select `OTHER` and type an explanation (adds friction to an already-interrupted flow; the override is confirmed by explicit UI; the system already knows what happened).

---

## ADR-035: UTC Timestamp Storage with Gym-Local Display

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** All `timestamp` (datetime) fields in the database are stored in UTC. All datetime values are displayed to the user in the gym's configured local timezone, determined by `Gym.timezone` — a new required field storing an IANA timezone identifier (e.g., `"Asia/Manila"`). Calendar `date` fields and `time` fields are stored as local values and require no UTC conversion.

**Field classification by type:**
- **UTC timestamps** (stored in UTC, displayed in `Gym.timezone`): `created_at`, `updated_at`, `deleted_at` on all entities; `Transaction.transaction_date`.
- **Local calendar dates** (stored as `DATE`, no conversion needed): `Membership.start_date`, `Membership.end_date`, `Attendance.visit_date`.
- **Local clock times** (stored as `TIME`, no conversion needed): `Attendance.time_in`, `Attendance.time_out`.
- **All "today" comparisons** (membership expiry, at-risk windows, today's check-ins, inactivity thresholds) use the current calendar date in `Gym.timezone`, not UTC date.

**Why:** UTC storage is the industry standard for avoiding ambiguous timestamps and daylight saving time edge cases. For the Philippines (UTC+8, no DST), DST is not a current concern, but UTC storage is a zero-cost investment that ensures correctness if timezone rules change, and is mandatory for the clean multi-tenant SaaS migration path (each future tenant may operate in a different timezone). Storing `Gym.timezone` as a database field means the system always knows the correct local context for display without hardcoding a timezone assumption.

**Rejected:** Storing all timestamps in local time. Non-standard, creates ambiguity, and requires the application to always know the gym's timezone before interpreting any stored timestamp — identical overhead to the UTC approach, but without the correctness guarantee. Storing `time_in`/`time_out` as UTC timestamps. These fields are clock readings of a physical check-in event; converting them to UTC would complicate every "peak hours" query (e.g., "check-ins between 6 AM and 8 AM") with mandatory timezone math, adding complexity for no benefit since these fields have no cross-timezone query requirement.

---

## ADR-036: Dashboard "Frequent Walk-Ins" Panel — Top-5 Ranking, Not Threshold-Filtered

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** The Dashboard "Frequent walk-ins" live feed panel displays the top 5 walk-in clients (no active membership) sorted by visit count descending, with no minimum visit count threshold. `Gym.walkin_conversion_prompt_visits` does not govern this panel.

**Why:** The panel's purpose is conversion opportunity discovery — showing the most active walk-in clients so the owner can take action in the moment. Applying the threshold filter would cause the panel to show zero results for a gym where all walk-ins are below the threshold (e.g., a new gym, or one with a high threshold setting), eliminating its operational value. The top-5 ranking always surfaces the best conversion candidates relative to the gym's current walk-in population, regardless of where the conversion prompt fires.

**Consequence:** `Gym.walkin_conversion_prompt_visits` governs exactly three surfaces: (1) the pre-check-in conversion prompt during attendance recording (Flow 3/14, US-4.2); (2) the Attendance Analytics "Walk-In Insights" frequent walk-ins count (US-4.10); (3) the Frequent Walk-Ins Report (US-8.8). The Dashboard panel is governed by top-5 ranking only. US-1.9 is updated to reflect this boundary.

**Rejected:** Threshold-filtered Dashboard panel (as originally stated in US-1.9 AC). This could produce an empty panel when walk-ins exist but none have reached the threshold — counterproductive for a panel meant to drive daily conversion outreach.

---

## ADR-037: "Upcoming" Membership Status and Client List Filter Chip

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** Add `UPCOMING` as a fourth status for `MEMBER`-type clients. Definition: `client_type = MEMBER`, no currently active membership (`start_date ≤ today ≤ end_date` is false for all records), and at least one future-dated membership (`start_date > today`). A new "Upcoming" filter chip is added to the Client List. The full MEMBER status derivation precedence order is: `EXPIRING_SOON` → `ACTIVE` → `UPCOMING` → `EXPIRED`.

**Why:** Without `UPCOMING`, clients who have pre-purchased a future membership are invisible in all filter chips except "All." This creates a usability gap: the owner cannot distinguish between a client whose membership genuinely lapsed and needs renewal outreach versus one who already purchased their next period and requires no action. The "Upcoming" chip lets the owner confirm pre-purchases are on record without these clients cluttering the "Expired" outreach list.

**Consequence:** The Client List filter chip set expands from 7 to 8: `All · Active · Upcoming · At risk · Expiring soon · Expired · Walk-in only · Inactive`. The Create Membership blocking rule is extended: creating a new membership is blocked if the client has any active OR upcoming membership (i.e., any Membership record where `end_date >= today` OR `start_date > today`). The blocking message for the upcoming case reads: "[Client name] has a membership starting [start_date]. No new membership can be created until that period ends." The "Renew" button context: UPCOMING clients show neither "Renew" nor "Renew early" — the context-aware button shows a disabled or informational state until the upcoming membership becomes active.

**Rejected:** Including `UPCOMING` clients in the `ACTIVE` filter (semantically incorrect — the membership is not yet in effect; the client should not be treated as a currently paying member for daily operational purposes). Leaving `UPCOMING` clients visible in "All" only (creates owner confusion between lapsed members and pre-purchased members, inflating apparent "needs action" populations).

---

## ADR-038: Walk-In to Member Conversion as a Business Workflow Mutation

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** Updating `Attendance.visit_type` from `WALK_IN` to `MEMBER` during the same-visit walk-in → member conversion (Flow 7) is a **business workflow mutation** — not a data correction and not governed by Flow 15's correction rules. Two distinct record mutation types are defined:

1. **Business workflow mutation (Flow 7):** updating `visit_type` to reflect a real change in the client's status that occurred during the visit. Intentional, part of a defined business event, no `correction_note` required, `updated_at` is not set by this mutation.
2. **Data correction (Flow 15):** fixing a `time_in` clerical error on the same calendar day. Unintentional mistake, requires a reason note in `correction_note`, sets `updated_at` to current timestamp.

**Why:** The visit started as a walk-in but the client purchased a membership before leaving — the `visit_type = MEMBER` update reflects business reality, not a correction of an error. Flow 15's `correction_note` + `updated_at` pattern exists specifically to mark clerical mistakes for audit. Applying that pattern to a normal business workflow would pollute the correction audit trail and add friction (mandatory reason note) to a legitimate, intentional operation. Prohibiting `visit_type` mutation would require deleting and recreating the Attendance record to handle conversion — destroying the original check-in timestamp and audit trail.

**Consequence:** The Attendance entity explicitly documents `visit_type` as mutable only via the conversion workflow (Flow 7 business event). All other Attendance fields except `time_in` (which is correctable via Flow 15) are immutable after creation. `Attendance.correction_note` and `Attendance.updated_at` are exclusively indicators of a Flow 15 correction — a null `updated_at` with a `MEMBER` `visit_type` on a record that originally had `WALK_IN` is a valid, non-anomalous state.

**Rejected:** Treating the Flow 7 conversion as a Flow 15-type correction (wrong semantic model — corrections fix mistakes; conversion records a legitimate business event). Making all Attendance fields fully immutable (forces deletion + recreation for conversions, destroying the original audit record).

---

## ADR-039: Remove `Gym.default_membership_fee`

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** `Gym.default_membership_fee` is removed from the `Gym` entity. Membership pricing is governed entirely by `MembershipPlan.default_price` (ADR-015). `Gym.default_walkin_fee` is retained — it is actively referenced in the walk-in fee prompt (Flow 3) and is not affected by this decision.

**Why:** ADR-015 established the `MembershipPlan` catalog as the authoritative source for membership pricing. `Gym.default_membership_fee` was a holdover from the original pre-ADR-015 design (where memberships had no plan catalog) and was never removed when plans were introduced. Retaining a dead configuration field creates ambiguity: if an owner sees "default membership fee" in Gym Settings alongside plan prices in the Membership Plans catalog, it is unclear which the system uses. The answer is always "the plan price" — and since no user flow, module specification, or report uses `Gym.default_membership_fee` as a price source, the field is dead configuration that should be removed.

**Consequence:** US-1.3 is updated to cover only the default walk-in fee. Settings → Pricing section removes the membership fee default field. Membership pricing is configured exclusively via Settings → Membership Plans (US-3.9, ADR-015).

**Rejected:** Retaining the field as a "fallback" for custom memberships not tied to a plan. No flow was defined that uses this fallback; the plan catalog's last-active-plan guard ensures at least one plan always exists, making the fallback scenario impossible under the current design.

---

## ADR-040: Canonical "in-effect" membership definition, `Membership.status` states, and renewal date math

**Date:** 2026-06-25
**Status:** Accepted

**Decision:**

1. **One canonical "in-effect" test.** A membership is *in effect* (grants access, counts as an active membership) when `start_date ≤ today ≤ end_date`. This single test replaces the `end_date >= today` test previously used in two places in `DOMAIN-MODEL.md` (the `Membership.status` derivation and the no-overlap invariant).

2. **`Membership.status` is derived (never stored) with three states** for a non-cancelled membership: `UPCOMING` (`start_date > today`), `ACTIVE` (`start_date ≤ today ≤ end_date`), `EXPIRED` (`end_date < today`). `EXPIRING_SOON` remains a Client-level display state (an ACTIVE membership within `Gym.expiration_warning_days` of `end_date`) — it is **not** a `Membership.status` value. Cancelled memberships (ADR-041) have no status.

3. **No-overlap invariant restated:** a client may have at most one **in-effect** membership (`start_date ≤ today ≤ end_date`) at a time. A client may simultaneously hold one ACTIVE and one or more UPCOMING memberships (produced by early renewal) — this is valid and is not an overlap.

4. **Unified renewal date math:** new `start_date = max(today, latest_end_date + 1 day)`, new `end_date = start_date + duration_days`, where `latest_end_date` is the greatest `end_date` among the client's non-cancelled memberships with `end_date >= today` (active or upcoming). Renewing while active or upcoming chains the new period onto the latest end date (the new record is UPCOMING until it begins); renewing after full expiry starts today; stacked early renewals chain onto the furthest-future end date. The previous record is never mutated; the new record links via `renewed_from_membership_id`.

**Why:** ADR-037 introduced `UPCOMING` using the in-effect test `start_date ≤ today ≤ end_date`, but the `Membership.status` derivation and the no-overlap invariant retained the older `end_date >= today` test. Under that test a future-dated (upcoming) membership is reported as ACTIVE, the "Active Members" KPI over-counts, and early renewal appears to violate the no-overlap rule. Standardizing on one in-effect test makes the headline KPI, status badges, and the Active/Upcoming filter chips single-valued and correct — exactly the surfaces the Design System renders.

**Rejected:**
- Keeping `end_date >= today` as the "active" test — mislabels upcoming memberships as active and over-counts active members.
- Setting an early-renewal `start_date = today` — creates a genuine overlap of two in-effect memberships, double-counting access and violating the invariant.

**Relationship:** Resolves the CB-1 / H-2 inconsistencies from the Architecture Readiness Review. Extends ADR-002 (derived status) and ADR-037 (UPCOMING). Cancelled-membership exclusion is governed by ADR-041.

---

## ADR-041: Membership cancellation (soft) for erroneous records

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** Add `Membership.cancelled_at` (nullable timestamp) and `Membership.cancellation_reason` (nullable text, required when cancelling). A **Cancel membership** action (Client Profile → Membership History row overflow) soft-cancels a membership created in error. A cancelled membership:
- is excluded from ALL status/active/upcoming/expiry/renewal derivations (as if it never granted access),
- does not count toward `client_type = MEMBER`,
- never blocks creating a new membership,
- remains in Membership History with a "Cancelled" badge,
- is never hard-deleted (downstream references exist: `Attendance.membership_id` snapshots, renewal chains, `TransactionLineItem.reference_membership_id`).

**Cancellation and payment void are independent.** Cancelling a membership does NOT auto-void its payment; voiding a payment does NOT cancel the membership (this preserves the existing rule). To reverse money, the owner voids the associated `CLIENT_TRANSACTION` separately (Flow 11).

**There is no free "edit membership."** Dates, plan, and price are immutable after creation (snapshot integrity, ADR-003). To correct a wrong duration/plan/client, cancel and recreate.

**Why:** `MODULE-SPECS.md` (and the Payments module) repeatedly referenced "cancel or adjust the membership … a separate action in the Membership module," but no such action existed anywhere. An erroneously created membership otherwise grants gym access with no remedy, and voiding the payment explicitly does not cancel it. A constrained soft-cancel resolves the gap while preserving the audit trail and snapshot guarantees.

**Rejected:**
- Hard delete — orphans attendance snapshots and renewal chains; violates the soft-delete philosophy of ADR-005.
- Free-form membership editing — mutating `start_date`/`end_date`/`price_paid` breaks snapshot and renewal-chain guarantees; cancel-and-recreate is safer and fully auditable.

**Consequence:** New P0 story US-3.10; new Flow 18 (Cancel Membership). Membership History shows a "Cancelled" badge. The ADR-040 renewal math ignores cancelled memberships when computing `latest_end_date`.

---

## ADR-042: Information Architecture & top-level navigation; Membership is a distributed capability

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** The application has **eight top-level navigation entries**: Dashboard · Clients · Attendance · Client Payments · POS · Inventory · Reports · Settings. The "Membership Management" functional module does **not** have its own top-level nav entry; its surfaces are distributed:
- membership create / renew / cancel / history → the **Client Profile** (within Clients),
- plan catalog management → **Settings**,
- expiry monitoring → the **Dashboard**,
- membership status lists → the **Client List** filter chips (operational outreach) and the **Reports** module (US-8.6, archival/exportable lists).

Attendance keeps its single nav entry with three internal views (ADR-023). The previously referenced Module 3 "dedicated filterable list (Active / Expired / Expiring Soon)" is realized by the Client List chips + US-8.6 — **not** a separate screen. The consolidated map lives in `INFORMATION-ARCHITECTURE.md`.

**Why:** The Design System's app shell, navigation, and layout require a single, explicit IA. The Membership module's "home" was ambiguous — membership status lists appeared to live in three different places. Declaring Membership a distributed capability removes the phantom screen and the surface overlap.

**Rejected:** A standalone Membership nav entry — duplicates Client List filtering and the US-8.6 report, and fragments the client-centric workflow where memberships are actually managed.

---

## ADR-043: Better Auth integration with the domain `User` entity

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** Better Auth is configured to use the domain `User` table as its user model. `gym_id` and `role` are declared as Better Auth **additional fields** on the user; the credentials provider manages `password_hash`. Better Auth owns its own session (and any verification) tables. The session payload exposes `{ userId, gymId, role }`. No parallel user table is introduced — the Prisma `User` model remains the single canonical user record and is auth-library-agnostic (consistent with the migration note in `TECH-STACK.md` §6).

**Why:** The domain `User` carries multi-tenant (`gym_id`) and authorization (`role`) fields that Better Auth does not define by default. Without an explicit integration decision, an implementer could create a second Better-Auth-owned user table, splitting identity across two tables. Better Auth's additional-fields mechanism keeps one user record and a clean path to the future organization plugin for multi-tenant sessions.

**Rejected:** A separate Better-Auth-owned user table linked by FK to the domain `User` — two sources of identity truth, extra joins, and drift risk between the auth record and the tenant/role record.

---

## ADR-044: Accessibility baseline — WCAG 2.1 AA

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** The system targets **WCAG 2.1 Level AA**. Baseline requirements (elaborated in `TECH-STACK.md` → Accessibility Standards):
- keyboard operability for all interactive elements (check-in search, POS cart, filter chips, dialogs, data tables),
- visible focus states on every focusable element,
- semantic markup and ARIA via shadcn/ui + Radix primitives (which provide roles and focus management),
- color contrast ≥ 4.5:1 for normal text and ≥ 3:1 for large text and UI affordances,
- status is never conveyed by color alone — status badges carry text labels (already specified across the modules),
- form fields have associated labels and programmatically associated error messages,
- chart and transition animations respect `prefers-reduced-motion`.

These constraints are inputs to the Design System's color and typography token choices.

**Why:** Accessibility was undocumented. Contrast, focus, color-only signaling, and reduced motion are token-level decisions that must precede the Design System; "Radix is accessible" covers component semantics but not system-level color and contrast choices.

**Rejected:** Leaving accessibility implicit in the component library — component accessibility is necessary but not sufficient; contrast ratios and color-independent status signaling are design-token decisions Radix cannot make on the project's behalf.

---

## ADR-045: Design language — dark-first, professional indigo on neutral slate

**Date:** 2026-06-25
**Status:** Accepted

**Decision:** The Design System is **dark-first** with a **professional indigo accent** (`indigo-500` on dark / `indigo-600` on light) on a **neutral slate** chrome. Semantic colors: emerald (success), amber (warning), red (danger), sky (info); at-risk uses orange to stay distinct from amber "expiring soon." Typography is **Geist Sans** (UI) + **Geist Mono** (tabular numbers/money). Base color `slate`, shadcn style `new-york`, icons `lucide`. All values are delivered as CSS variables (dark on `:root`, light override) so theme is a values flip, not a rebuild. The full specification — tokens, type scale, spacing/layout, component inventory, patterns, and the WCAG 2.1 AA application — lives in `DESIGN-SYSTEM.md`.

**Why:** The product is a data-dense, desktop-first management dashboard (ADR-033) used for long report/dashboard sessions. A dark, low-fatigue canvas with a calm indigo accent maximizes legibility and reads as professional SaaS, while neutral slate chrome keeps dense tables readable. Indigo provides clear primary affordances that meet AA (white on indigo-500 ≈ 4.6:1) without competing with the emerald/amber/red semantic signals the domain relies on (status badges, deltas, shrinkage). Defining tokens as CSS variables keeps light mode and a future user toggle a low-cost flip.

**Rejected:**
- **Energetic orange / lime-on-slate brands** — higher visual intensity competes with the semantic warning/success palette on data-dense screens and tires the eye over long sessions.
- **Emerald primary** — collides with the success semantic (status dots, positive deltas), muddying the status language.
- **Light-only** — forgoes the lower-fatigue default the owner's long dashboard/report sessions benefit from; dark-first with variable tokens keeps light fully available.

**Relationship:** Implements ADR-044 (accessibility baseline) at the token level and ADR-033 (desktop-first). Consumes ADR-042's information architecture for the app shell. Detailed in `DESIGN-SYSTEM.md`.
