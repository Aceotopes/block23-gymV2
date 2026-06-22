# Module Specifications — Gym Management System

Each module is specified with: Purpose, MVP Scope, Key Fields/Forms, Business Rules Enforced, Edge Case Handling, and Deferred (Future) Items.

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
- **Revenue trend** (line chart, multi-series): daily revenue over the selected period, broken into 3 lines — Membership, Walk-In, Product. Gives the owner an immediate sense of which revenue source is driving or dragging.
- **Membership status breakdown** (donut chart): Active / Expiring Soon / Expired with legend and counts. Provides an at-a-glance membership health ratio.
- **Daily attendance** (grouped bar chart): Member vs. Walk-in check-ins per day over the selected period. Reveals usage patterns and walk-in vs. member split.
- **Top products** (horizontal bar chart): top 5 products by units/servings sold over the selected period. Supports inventory planning and upsell decisions.

**Live feed panels (below charts):**
- **Recent transactions:** last 5 sales with client avatar/initials, item summary, payment method, amount, and time-ago. Links to full transaction history.
- **Expiring soon members:** list of members whose memberships expire within the warning window, sorted by soonest first, with days-remaining indicator and color-coded urgency (red < 7 days, amber 7–14 days). "View all" links to the full expiring-soon report.
- **Inventory alerts:** products below low-stock threshold with remaining count.

**Business Rules Enforced:**
- All chart and metric data excludes voided transactions.
- "Expiring Soon" threshold uses `Gym.expiration_warning_days` setting throughout (KPI card, chart, and member list are consistent).
- Revenue figures are always MTD when "Month" period is selected; chart x-axis shows daily breakdowns within the period.
- Attendance charts distinguish total check-ins from unique visitors (multiple same-day check-ins don't silently inflate the bar).

**Performance requirement:** Must load within 3 seconds (NFR). At MVP scale (single gym, hundreds-to-low-thousands of records), live aggregation on indexed queries is sufficient. If data volume grows, introduce a pre-aggregated `daily_stats` table (populated nightly) as a drop-in replacement for the live queries — the API response shape stays identical so the frontend doesn't change.

**Edge Cases:**
- Empty state (brand-new gym, zero data) — all charts render with empty axes and a "no data yet" label; KPI cards show zeros. No errors or blank crashes.
- Partial period (e.g., "Month" selected on the 3rd of the month) — chart shows available days only; revenue KPI shows correct MTD, not a projected full-month figure.
- Voided transactions excluded from all revenue metrics and charts consistently.

**Deferred:**
- Customizable/configurable widget layout (drag-to-reorder, show/hide panels).
- Scheduled summary email (e.g., daily digest delivered to owner's inbox).
- Comparison mode (current period vs. prior period side-by-side on the same chart).

---

## 2. Clients Module

**Purpose:** Central client registry replacing scattered paper/Excel records.

**MVP Scope / Forms:**
- **Register Client:** `full_name` (required), `contact_number` (optional), `notes` (optional).
- **Edit Client:** all fields editable except system-generated `date_registered`.
- **Search Client:** partial-match search on `full_name`, returns within 2 seconds (NFR).
- **Client Profile view:** personal info + tabs for Membership History, Attendance History, Purchase History.

**Business Rules Enforced:**
- A client can exist indefinitely with zero memberships (pure walk-in history).
- Soft delete only (`deleted_at`) — a client is never hard-removed if they have any attendance or transaction history.

**Edge Cases:**
- **Possible duplicate on registration:** system performs a fuzzy name check and warns before creating a new record, but never blocks (owner has final judgment — see Flow 2).
- **Client with no contact info at all:** fully valid state, must not break search or profile views.

**Deferred:**
- Merge-duplicate-clients tool.
- Photo/ID upload.
- Client self-service portal (clients viewing their own profile) — not relevant until/unless multi-user/SaaS direction is pursued.

---

## 3. Membership Module

**Purpose:** Manage the full lifecycle of paid membership periods per client.

**MVP Scope / Forms:**
- **Create Membership:** select `MembershipPlan` (or define custom duration inline), `price` (defaults from plan, overridable), `start_date` (defaults today, can be future-dated).
- **Renew Membership:** select plan/duration + price; system auto-computes new dates per the renewal rule below.
- **View Membership History:** chronological list of all Membership records for a client, including the renewal chain.
- **Monitor Expiration:** surfaced via Dashboard + a dedicated filterable list (Active / Expired / Expiring Soon).

**Business Rules Enforced:**
- **One active membership per client at a time** — creating a new membership while one is still active is blocked, with a redirect prompt to "Renew" instead (Flow 5).
- **Renewal date math (confirmed rule):**
  - Renewing while current membership is still active → new period extends from the *existing end date*.
  - Renewing after expiry → new period starts from *today*.
- Membership price is always a **snapshot** (`price_paid`), independent of the plan's current default price.
- Expired memberships remain fully visible and queryable — never hidden or deleted.
- An expired member is **not blocked from attendance**; they simply attend as a walk-in (with the fee charged) until they renew.
- Membership cannot be paused/frozen (explicit BRD exclusion, retained).

**Edge Cases:**
- Future-dated membership start (pre-purchase) — must not count as "active" until its start_date arrives.
- Custom duration plans (e.g., 45 days) must support the exact same renewal math as standard plans.

**Deferred:**
- Membership freeze/pause.
- Membership transfer between clients.
- Family/group membership (one payment, multiple linked clients).

---

## 4. Attendance Module

**Purpose:** Digital check-in log replacing the paper attendance sheet, while preserving accurate historical context of each visit.

**MVP Scope / Forms:**
- **Record Attendance:** search client → system auto-determines `visit_type` based on current membership status → for WALK_IN, prompt for fee and route into a Transaction (see Sales module).
- **View Attendance History:** chronological per-client and gym-wide views.
- **Filter Attendance Records:** by date range and visit type.

**Business Rules Enforced:**
- Every attendance record captures `client`, `date`, `time_in`, `visit_type` (per BRD).
- `membership_id` is snapshotted onto the attendance record at check-in time, so later renewals/expirations never retroactively change what a past visit "was."
- Attendance history is retained regardless of the client's current membership status or even if the client is later soft-deleted.
- Multiple check-ins for the same client on the same day are **allowed**, not blocked (real-world morning + evening sessions happen) — but Dashboard/report metrics distinguish "total check-ins" from "unique visitors per day" so this doesn't silently inflate traffic numbers.

**Edge Cases:**
- Walk-in with no prior client record: lightweight client auto-created with just the name (Flow 3).
- Data-entry correction: owner needs a way to edit a same-day attendance record's time (e.g., logged 9am instead of 9pm) — exposed as an edit action with the change reflected via `updated_at`, not a hidden silent overwrite.

**Deferred:**
- `time_out` capture and session-duration analytics (field reserved in schema now, feature built later).
- QR code / RFID-based check-in (explicit BRD exclusion, retained).

---

## 5. Sales Module

**Purpose:** Unified transaction recording for memberships, walk-in fees, and product sales — replacing three disconnected manual logs.

**MVP Scope / Forms:**
- **New Sale / Checkout:** a single cart that can hold any combination of line item types: `MEMBERSHIP`, `WALK_IN_FEE`, `PRODUCT` (with quantity).
- **Payment method selection:** Cash / GCash / Card / Other — captured per transaction.
- **Transaction History:** complete chronological ledger, filterable by date and item type.
- **Void Transaction:** owner-initiated reversal with a required reason note (Flow 11).

**Business Rules Enforced:**
- Every line item stores a **price snapshot** (`unit_price`) at time of sale — never a live lookup against current catalog prices.
- A `PRODUCT` line item triggers a corresponding `InventoryTransaction` (type=SALE) that decrements stock.
- Stock validation: a product line item cannot exceed available stock without an explicit "Force Sale" override, which is itself logged as a flagged adjustment (see Inventory module). **Confirmed decision:** block by default; override is available but must be an explicit, separate action.
- Voided transactions are excluded from all revenue totals/reports but remain visible in the raw transaction list with a `VOID` status badge and reason — they are never deleted.

**Edge Cases:**
- Same-visit walk-in→membership conversion (Flow 7) — must produce one coherent Transaction, not two disconnected ones, so reporting isn't fragmented. **Confirmed decision:** no automatic fee-credit calculation. If the owner wants to discount the membership because a walk-in fee was already paid that day, they do so manually via the existing price-override field on the MEMBERSHIP line item — this avoids adding partial-credit math to the checkout logic.
- Partial cart abandonment (owner starts a sale, navigates away) — cart state should not silently create a phantom transaction; only an explicit "Complete Sale" action commits the Transaction record.

**Deferred:**
- Formal refund workflow with partial-amount handling and reason taxonomy (void covers MVP's correction need; refund is a richer future feature).
- Discount/promo code engine (manual price override already covers MVP need).
- Receipt printing/emailing (explicit BRD exclusion, retained).
- Installment/partial payment tracking on a single membership purchase.

---

## 6. Inventory Module

**Purpose:** Track product stock (by unit) and supplement servings, with full auditability of how stock levels changed over time.

**MVP Scope / Forms:**
- **Create/Update Product:** `name`, `category`, `unit_type` (UNIT or SERVING), `current_price`, `low_stock_threshold`.
- **Record Inventory Purchase (Restock):** quantity received → creates an `InventoryTransaction` (type=PURCHASE), increases stock.
- **Monitor Current Stock:** per-product current level, with low-stock visual flagging.
- **Monitor Remaining Servings:** for SERVING-type products (e.g., "Gold Standard Whey: 42 of 70 servings remaining").

**Business Rules Enforced:**
- Every stock change — sale, restock, or manual correction — is recorded as a discrete `InventoryTransaction` row, not just a silent counter update. `Product.current_stock` is a cached value that should always be reconstructable by summing its movement ledger.
- Manual stock adjustments (e.g., correcting a miscount) require a note explaining the reason — this is the only way to maintain trust in the numbers over time.
- A SERVING-type product's stock decrements by the scoop/serving count sold, not by container count.

**Edge Cases:**
- **Selling the last serving exactly to zero** — valid, must not be treated as an error.
- **Attempting to sell more than available stock** — **confirmed decision:** blocked by default. The owner can override via an explicit "Force Sale" action, which is itself logged as a flagged `ADJUSTMENT` entry in the inventory ledger so the override is visible for later review, never silent.
- Product discontinued (`is_active = false`) but has remaining stock or a sales history — must remain visible in historical reports even though it's hidden from the active "New Sale" product picker.

**Deferred:**
- Supplier cost tracking and profit-margin calculation.
- Automated reorder thresholds / supplier notifications.
- Barcode scanning for product entry.

---

## 7. Reports Module

**Purpose:** Turn raw transactional/attendance data into the business insight the BRD's "Reporting Goals" call for.

**MVP Scope:**
- **Revenue Reports:** Daily / Weekly / Monthly, broken down by source (Membership / Walk-In / Product). Voided transactions excluded.
- **Attendance Reports:** Daily / Weekly / Monthly, with unique-visitor vs. total-check-in distinction (see Attendance module).
- **Membership Reports:** Active / Expired / Expiring Soon lists, filterable and exportable to the Dashboard's "Expiring Soon" follow-up workflow.
- **Product Reports:** Best Sellers (by revenue and by quantity), Inventory Usage (movement summary over a date range).
- **Walk-In Conversion Report:** frequent walk-in visitors who have not converted to membership, ranked by visit count/spend — directly supports the BRD's stated conversion-tracking goal (this report doesn't exist anywhere explicitly in the BRD's module list but is implied by Business Rules section 7 — "Walk-In Conversion Rules" — and should be treated as MVP, not future, since it's the payoff of data the system is already required to track).
- **CSV Export:** every report listed above can be exported to CSV. **Confirmed decision (scope addition):** formatted/branded PDF export remains deferred (see below), but raw CSV export is committed MVP scope — it's low build cost relative to value for an owner migrating off Excel, who will likely want to keep familiar spreadsheet workflows alongside the new system.

**Business Rules Enforced:**
- All reports read from the Transaction/TransactionLineItem ledger and the Attendance table directly — no separate "reporting database" needed at MVP scale.
- Reports respect the price-snapshot rule: a report for last month reflects what was actually charged last month, even if prices have since changed.

**Edge Cases:**
- Date range spanning a membership price change — report must show historically accurate figures (guaranteed by the snapshot design in Domain Model).
- Empty date ranges (no data) must render a clear "no data for this period" state, not an error or blank crash.

**Deferred:**
- Exportable PDF report output (CSV export is now committed MVP scope — see above; PDF/formatted-document export remains deferred).
- Profit-margin reporting (requires supplier cost data, deferred with Inventory module).
- Scheduled/automated report emails.

---

## 8. Settings Module

**Purpose:** Centralize gym-specific configuration.

**MVP Scope / Forms:**
- **Gym Information:** name, address, contact info.
- **Pricing:** default membership fee, default walk-in fee.
- **System Preferences:** membership expiration warning period (days).

**Business Rules Enforced:**
- Changing a default price here affects only *future* transactions/plans — it must never retroactively alter `price_paid` snapshots on existing Membership or TransactionLineItem records (enforced structurally by the Domain Model's snapshot design, not by application logic alone).

**Edge Cases:**
- Owner sets an unrealistic value (e.g., negative price, zero warning days) — basic input validation required (non-negative numbers, sensible ranges).

**Deferred:**
- Multi-user permission settings (irrelevant until multi-staff accounts exist).
- Branch-level settings (irrelevant until multi-branch is in scope).
- Localization/language settings.

---

## Resolved Scope Decisions

These were flagged as open implementation questions and have since been confirmed:

| Decision | Resolution | Reasoning |
|---|---|---|
| Insufficient stock at sale time | Block by default, with an explicit logged "Force Sale" override | Prevents silent data corruption while still allowing the rare legitimate edge case (e.g., miscounted backstock), with full auditability via the inventory ledger |
| Same-day multiple check-ins | Allowed by default; dashboard/reports distinguish total check-ins from unique visitors | Matches real-world usage (morning + evening sessions); low risk to reverse later if needed |
| Walk-in-fee credit toward membership (Flow 7) | No automatic credit calculation; manual price-override field covers it | Keeps checkout transaction logic simple; the valuable part (conversion tracking via the Walk-In Conversion Report) doesn't depend on automated credit math |
| Reports export | CSV export is committed MVP scope; PDF/formatted export remains deferred | High value relative to build cost for an owner transitioning off Excel; PDF adds real formatting/layout work that doesn't pay for itself at MVP stage |

No further open questions block the start of UI/wireframe work or the API contract.
