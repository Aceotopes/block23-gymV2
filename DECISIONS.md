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

## ADR-006: Single `Transaction` table with typed line items

**Date:** 2026-06-22
**Status:** Accepted

**Decision:** All sales (membership purchase, walk-in fee, product sale) are recorded as a single `Transaction` header with typed `TransactionLineItem` rows, not as three separate tables.

**Why:** Real-world checkouts routinely mix types — a client renews their membership and buys a drink in the same visit. Three separate tables would require unioning them for every revenue report, and would make it impossible to represent a mixed checkout as a single financial event.

**Rejected:** Separate `MembershipSale`, `WalkInSale`, `ProductSale` tables as implied by the BRD's module structure. This accurately reflects the UI's module separation but misrepresents financial reality.

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

**Decision:** CSV export of all reports is committed MVP scope (US-7.9). PDF export (US-7.7) is Post-MVP.

**Why:** CSV covers the core owner need — getting data out, opening in Excel, keeping offline copies. PDF formatting is a separate, higher-effort enhancement with no blocking need in MVP.
