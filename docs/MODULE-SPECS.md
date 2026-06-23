# Module Specifications — Gym Management System

Each module is specified with: Purpose, MVP Scope, Key Fields/Forms, Business Rules Enforced, Edge Case Handling, and Deferred (Future) Items.

> **Design Review #1 (2026-06-22):** Module 5 renamed from "Sales" to "Client Payments" and scoped to membership fees and walk-in fees only. New Module 6 (POS & Product Sales) added for product transactions. Client Profile "Purchase History" tab removed. Product entity updated with cost_price, image, product_type, and servings_per_container. Three new reports added. See DECISIONS.md ADR-011 and ADR-012.

---

## 1. Dashboard Module

**Purpose:** Professional SaaS-style monitoring screen — the owner's daily command center combining operational metrics, trend charts, and actionable alerts in one view.

**MVP Scope:**

**KPI Strip (4 cards, always visible at top):**
- Active members — with delta vs. last month (e.g., "+3 from last month")
- Today's check-ins — with delta vs. yesterday
- MTD (month-to-date) revenue — with % change vs. same period last month
- Expiring soon count — highlighted in warning color, using `Gym.expiration_warning_days`

**Period selector:** Today / Week / Month toggle filters all chart data accordingly. KPI cards always show the most contextually relevant period (today for check-ins, MTD for revenue).

**Charts (all rendered client-side from API data):**
- **Revenue trend** (line chart, multi-series): daily revenue over the selected period, broken into 3 lines — Membership, Walk-In, Product. Sourced from both `CLIENT_TRANSACTION` and `POS_SALE` records.
- **Membership status breakdown** (donut chart): Active / Expiring Soon / Expired with legend and counts.
- **Daily attendance** (grouped bar chart): Member vs. Walk-in check-ins per day over the selected period.
- **Top products** (horizontal bar chart): top 5 products by units/servings sold over the selected period.

**Live feed panels (below charts):**
- **Recent POS sales:** last 5 product transactions with item summary, payment method, amount, and time-ago.
- **Expiring soon members:** list of members whose memberships expire within the warning window, sorted by soonest first, with days-remaining indicator and color-coded urgency (red < 7 days, amber 7–14 days).
- **Inventory alerts:** products below low-stock threshold with remaining count. For `SERVING_BASED_PRODUCT` items, shows remaining servings (e.g., "Whey Protein: 8 servings remaining").

**Business Rules Enforced:**
- All chart and metric data excludes voided transactions (both `CLIENT_TRANSACTION` and `POS_SALE`).
- "Expiring Soon" threshold uses `Gym.expiration_warning_days` setting throughout.
- Revenue figures are always MTD when "Month" period is selected.
- Attendance charts distinguish total check-ins from unique visitors.

**Performance requirement:** Must load within 3 seconds (NFR).

**Edge Cases:**
- Empty state (brand-new gym, zero data) — all charts render with empty axes and a "no data yet" label; KPI cards show zeros.
- Partial period (e.g., "Month" selected on the 3rd) — chart shows available days only.
- Voided transactions excluded from all revenue metrics and charts consistently.

**Deferred:**
- Customizable widget layout.
- Scheduled summary email.
- Comparison mode (current period vs. prior period).

---

## 2. Clients Module

**Purpose:** Central client registry replacing scattered paper/Excel records.

**MVP Scope / Forms:**
- **Register Client:** `full_name` (required), `contact_number` (optional), `notes` (optional).
- **Edit Client:** all fields editable except system-generated `date_registered`.
- **Search Client:** partial-match search on `full_name`, returns within 2 seconds (NFR).
- **Client Profile view:** personal info + tabs for Membership History and Attendance History.

*(Purchase History tab removed — POS product sales are not linked to clients. See ADR-011.)*

**Business Rules Enforced:**
- A client can exist indefinitely with zero memberships (pure walk-in history).
- Soft delete only (`deleted_at`) — a client is never hard-removed if they have any attendance or transaction history.

**Edge Cases:**
- **Possible duplicate on registration:** system performs a fuzzy name check and warns before creating a new record, but never blocks.
- **Client with no contact info at all:** fully valid state, must not break search or profile views.

**Deferred:**
- Merge-duplicate-clients tool.
- Photo/ID upload.
- Client self-service portal.

---

## 3. Membership Module

**Purpose:** Manage the full lifecycle of paid membership periods per client.

**MVP Scope / Forms:**
- **Create Membership:** select `MembershipPlan` (or define custom duration inline), `price` (defaults from plan, overridable), `start_date` (defaults today, can be future-dated).
- **Renew Membership:** select plan/duration + price; system auto-computes new dates per the renewal rule below.
- **View Membership History:** chronological list of all Membership records for a client, including the renewal chain.
- **Monitor Expiration:** surfaced via Dashboard + a dedicated filterable list (Active / Expired / Expiring Soon).

**Business Rules Enforced:**
- **One active membership per client at a time** — creating a new membership while one is still active is blocked, with a redirect prompt to "Renew" instead.
- **Renewal date math (confirmed rule):**
  - Renewing while current membership is still active → new period extends from the *existing end date*.
  - Renewing after expiry → new period starts from *today*.
- Membership price is always a **snapshot** (`price_paid`), independent of the plan's current default price.
- Expired memberships remain fully visible and queryable — never hidden or deleted.
- An expired member is **not blocked from attendance**; they simply attend as a walk-in until they renew.
- Membership cannot be paused/frozen (explicit BRD exclusion).

**Edge Cases:**
- Future-dated membership start (pre-purchase) — must not count as "active" until its start_date arrives.
- Custom duration plans must support the exact same renewal math as standard plans.

**Deferred:**
- Membership freeze/pause.
- Membership transfer between clients.
- Family/group membership.

---

## 4. Attendance Module

**Purpose:** Digital check-in log replacing the paper attendance sheet, while preserving accurate historical context of each visit.

**MVP Scope / Forms:**
- **Record Attendance:** search client → system auto-determines `visit_type` based on current membership status → for WALK_IN, prompt for fee and record a `CLIENT_TRANSACTION` (walk-in fee, payment method required).
- **View Attendance History:** chronological per-client and gym-wide views.
- **Filter Attendance Records:** by date range and visit type.

**Business Rules Enforced:**
- Every attendance record captures `client`, `date`, `time_in`, `visit_type`.
- `membership_id` is snapshotted onto the attendance record at check-in time, so later renewals/expirations never retroactively change what a past visit "was."
- Attendance history is retained regardless of the client's current membership status or even if the client is later soft-deleted.
- Multiple check-ins for the same client on the same day are **allowed** — Dashboard/report metrics distinguish "total check-ins" from "unique visitors per day."

**Edge Cases:**
- Walk-in with no prior client record: lightweight client auto-created with just the name.
- Data-entry correction: owner needs a way to edit a same-day attendance record's time — exposed as an edit action with the change reflected via `updated_at`, not a silent overwrite.

**Deferred:**
- `time_out` capture and session-duration analytics (field reserved in schema now).
- QR code / RFID-based check-in (explicit BRD exclusion).

---

## 5. Client Payments Module

**Purpose:** Record and audit all money collected directly from clients — membership fees and walk-in fees. Both always require a client. Product sales are handled by the POS module (Module 6) and are entirely separate.

**MVP Scope / Forms:**
- **Payment Method Selection:** Cash / GCash / Card / Other — captured on every client transaction (walk-in fee or membership payment).
- **Client Payment History:** chronological list of all `CLIENT_TRANSACTION` records, filterable by date, client, and payment method.
- **Void Transaction:** owner-initiated reversal with a required reason note.

**How client payments are created:**
Client payment records are always created as a byproduct of other flows — never standalone from this module:
- A **walk-in fee** transaction is created within the Walk-In Attendance flow (Flow 3).
- A **membership fee** transaction is created within the Membership Creation or Renewal flow (Flows 5 and 6).
This module's primary function is the **history/audit view** and the **void action**.

**Business Rules Enforced:**
- Every `CLIENT_TRANSACTION` requires a `client_id` — anonymous client transactions do not exist.
- A `CLIENT_TRANSACTION` may only contain `MEMBERSHIP` and `WALK_IN_FEE` line items — `PRODUCT` items are not permitted in client transactions.
- Price snapshot rule: the price at time of transaction is stored; live catalog prices are never queried to reconstruct past amounts.
- Voided transactions are excluded from all revenue totals and reports but remain visible in the raw list with a `VOID` status badge and reason.
- **Voiding a payment does not cancel the associated membership.** Financial correction and membership management are separate actions — the owner handles the membership record independently.

**Edge Cases:**
- Owner voids a membership payment: the membership record itself is unaffected and remains active. If the owner also needs to cancel or adjust the membership, that is a separate action in the Membership module.
- Walk-in fee already charged, same visit client decides to buy a membership: see Flow 7 (Walk-in → Member Conversion). The walk-in fee and membership are recorded as a single `CLIENT_TRANSACTION` with two line items (WALK_IN_FEE + MEMBERSHIP). No automatic credit calculation — owner adjusts membership price manually if desired.

**Deferred:**
- Partial refund workflow (void covers MVP's correction need).
- Discount/promo code engine (manual price override covers MVP need).
- Receipt printing/emailing.

---

## 6. POS Module

**Purpose:** Lightweight point-of-sale for product transactions. A client is not required — this screen operates independently of the client and membership management flows. Also covers all product catalog management.

**MVP Scope / Forms:**

**Product Management:**
- **Create/Edit Product:**
  - `name` (required)
  - `category` (required — select from ProductCategory)
  - `image` (optional — upload product photo for POS grid display)
  - `selling_price` (required — price per unit or per serving)
  - `cost_price` (required — purchase cost per unit or serving; used for future margin reporting)
  - `product_type` (required — `STANDARD_PRODUCT` or `SERVING_BASED_PRODUCT`)
  - `servings_per_container` (required if `SERVING_BASED_PRODUCT` — e.g., 70 for a tub of protein)
  - `low_stock_threshold` (required — triggers dashboard alert)
  - `is_active` (toggle — controls POS grid visibility)
- **Archive Product:** sets `is_active = false`; product disappears from POS grid but all sales and inventory history remain fully intact.
- **Product Categories:** create/edit product categories (e.g., Beverages, Supplements).

**Product Types:**
- `STANDARD_PRODUCT`: sold per unit (e.g., Water ₱25/bottle, Gatorade ₱45/bottle, Sting ₱25/can). `current_stock` = unit count.
- `SERVING_BASED_PRODUCT`: sold per scoop/serving (e.g., Gold Standard Whey ₱50/scoop, 70 servings per tub). `current_stock` = remaining serving count.

**POS Screen:**
- **Product Grid:** displays all `is_active = true` products with image, name, and price. Tap to add to cart.
- **Product Search:** real-time name filter within the POS screen.
- **Shopping Cart:** running list of added items with quantity, unit price, and line total.
- **Quantity Adjustment:** increase/decrease quantity or remove items from cart before checkout.
- **Checkout:** shows cart total → owner selects payment method → confirms → sale is recorded.
- **Quick Sale Buttons:** optionally configurable shortcuts for top-selling items (UX implementation detail).

**POS History:**
- Chronological log of all `POS_SALE` records, filterable by date and payment method.
- **Void POS Sale:** requires a reason note; reversal is additive (adjustment entries in inventory ledger), original sale record preserved.

**Business Rules Enforced:**
- A client is not required for a POS sale. `client_id` is null on all `POS_SALE` transactions.
- **Price snapshot:** `unit_price` is copied from `Product.selling_price` at the moment the item is added to the cart. Changing a product's price later never alters a past sale.
- Each `PRODUCT` line item in a completed POS sale triggers an `InventoryTransaction` (type=`SALE`) that decrements `current_stock`.
- **Stock validation:** selling a quantity that would take stock below zero is blocked by default. Owner can proceed via an explicit "Force Sale" confirmation, which logs a flagged `ADJUSTMENT` entry — the override is never silent.
- Archived products (`is_active = false`) do not appear in the POS grid. They remain available in inventory management and historical reports.
- Cart state is not persisted between sessions — navigating away without completing checkout discards the cart without creating any transaction record.

**Edge Cases:**
- **Selling the last serving exactly to zero:** valid, must not be treated as an error.
- **SERVING_BASED_PRODUCT stock management:** `current_stock` tracks whole servings only. If a partial serving remains in a container after the last "full" serving is recorded as sold, the owner handles any write-off via a manual inventory adjustment.
- **Product archived mid-transaction:** if a product is archived while it exists in an open cart on another session, the cart completes normally — archiving is a catalog-forward action, not a retroactive block.

**Deferred:**
- Discount code / promotional pricing engine.
- Receipt printing/emailing.
- Barcode scanning for product entry.
- Client-linked POS sale (optional client association for loyalty tracking).

---

## 7. Inventory Module

**Purpose:** Track and audit all stock movements — POS sales deductions, restocks, and manual corrections — with full auditability of how stock levels changed over time.

**MVP Scope / Forms:**
- **Restock (Record Purchase):** select product → enter quantity received.
  - For `STANDARD_PRODUCT`: quantity in units (e.g., 24 bottles of water).
  - For `SERVING_BASED_PRODUCT`: quantity in containers → system multiplies by `servings_per_container` (e.g., 2 tubs × 70 servings = +140 servings to `current_stock`).
  - Creates an `InventoryTransaction` (type=`PURCHASE`).
- **Current Stock View:** all products with current stock level, low-stock visual flagging. `SERVING_BASED_PRODUCT` items show "X of Y servings remaining."
- **Inventory Movement History:** chronological log of all `InventoryTransaction` records per product (`PURCHASE` / `SALE` / `ADJUSTMENT`).
- **Manual Adjustment:** enter delta quantity + required reason note → creates `InventoryTransaction` (type=`ADJUSTMENT`).

**Business Rules Enforced:**
- Every stock change — POS sale, restock, or manual correction — is recorded as a discrete `InventoryTransaction` row. `Product.current_stock` is a cached value that must always be reconstructable by summing the movement ledger.
- Manual adjustments require a reason note — non-negotiable for auditability.
- `SERVING_BASED_PRODUCT`: restocking adds `quantity_received × servings_per_container` servings to `current_stock`.
- Discontinued products (`is_active = false`) remain visible in Inventory Management and movement history even after archiving.

**Edge Cases:**
- **Selling the last serving exactly to zero:** valid, no error.
- **Force Sale override:** if stock would go below zero, owner must explicitly confirm. The override logs a flagged `ADJUSTMENT` entry so the discrepancy is visible.
- **Discontinued product with remaining stock:** product is archived but stock is not zeroed. Owner manually adjusts if needed.

**Deferred:**
- Per-restock cost tracking and supplier information (cost_price is on Product for margin foundation; per-restock cost detail is deferred).
- Automated reorder threshold notifications.
- Barcode scanning for restock entry.

---

## 8. Reports Module

**Purpose:** Turn raw transactional and attendance data into the business insight the owner needs.

**MVP Scope:**

- **Revenue Reports:** Daily / Weekly / Monthly, broken down by source (Membership / Walk-In / Product). Draws from both `CLIENT_TRANSACTION` and `POS_SALE` records. Voided transactions excluded.
- **Revenue by Payment Method:** total revenue per payment method (Cash / GCash / Card / Other) over any selected period. Covers both client transactions and POS sales.
- **Revenue by Product Category:** total product revenue per category (Beverages, Supplements, etc.) over any selected period.
- **Attendance Reports:** Daily / Weekly / Monthly, with unique-visitor vs. total-check-in distinction.
- **Membership Reports:** Active / Expired / Expiring Soon lists, filterable and exportable.
- **Best Sellers:** top products by units/servings sold and by revenue over a selected period.
- **Frequent Walk-In Report:** clients with high visit count and no active membership — ranked by visit count, directly supports the conversion-tracking goal.
- **Inventory Usage Report:** stock movement summary per product over a date range — units sold, restocked, and manually adjusted. Surfaces discrepancies between expected and actual stock.
- **CSV Export:** every report listed above can be exported to CSV.

**Business Rules Enforced:**
- All reports read from the `Transaction` / `TransactionLineItem` ledger and the `Attendance` table directly.
- Reports respect the price-snapshot rule: a report for last month reflects what was actually charged last month, even if prices have since changed.
- Voided transactions (`status = VOID`) are excluded from all revenue totals consistently.
- Revenue by Payment Method and Revenue by Category span both transaction types (`CLIENT_TRANSACTION` and `POS_SALE`).

**Edge Cases:**
- Date range spanning a price change — report shows historically accurate figures (guaranteed by snapshot design).
- Empty date ranges — render a clear "no data for this period" state, not a blank crash.

**Deferred:**
- PDF report export.
- Profit-margin reporting — requires `cost_price × quantity_sold` aggregation. Foundation is laid at MVP by storing `cost_price` on `Product`; the report itself is deferred until the owner prioritizes it (US-8.12).
- Scheduled / automated report emails.

---

## 9. Settings Module

**Purpose:** Centralize gym-specific configuration.

**MVP Scope / Forms:**
- **Gym Information:** name, address, contact info.
- **Pricing:** default membership fee, default walk-in fee.
- **System Preferences:** membership expiration warning period (days).

**Business Rules Enforced:**
- Changing a default price here affects only *future* transactions — it must never retroactively alter `price_paid` snapshots on existing records (enforced structurally by the Domain Model's snapshot design).

**Edge Cases:**
- Owner sets an unrealistic value (e.g., negative price, zero warning days) — basic input validation required.

**Deferred:**
- Multi-user permission settings.
- Branch-level settings.
- Localization/language settings.

---

## Resolved Scope Decisions

| Decision | Resolution | Reasoning |
|---|---|---|
| Insufficient stock at sale time | Block by default, with an explicit logged "Force Sale" override | Prevents silent data corruption while still allowing the rare legitimate edge case |
| Same-day multiple check-ins | Allowed; dashboard/reports distinguish total check-ins from unique visitors | Matches real-world usage |
| Walk-in-fee credit toward membership (Flow 7) | No automatic credit; manual price-override field covers it | Keeps checkout logic simple |
| Reports export | CSV export is committed MVP scope; PDF/formatted export remains deferred | High value relative to build cost for an owner transitioning off Excel |
| POS sales and client linking | POS sales do not require a client | Product purchases are quick cash transactions; the business value is inventory and revenue tracking, not per-customer purchase history |
| Mixed checkout (client + products in one transaction) | Removed — client transactions and POS sales are separate flows | Does not reflect how the gym actually operates; adds UI complexity for the dominant use case |
| cost_price on Product | Promoted to MVP scope | Zero marginal cost when building the POS module; enables future margin reporting without a schema migration |
