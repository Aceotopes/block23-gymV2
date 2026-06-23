# Module Specifications — Gym Management System

Each module is specified with: Purpose, MVP Scope, Key Fields/Forms, Business Rules Enforced, Edge Case Handling, and Deferred (Future) Items.

> **Design Review #1 (2026-06-22):** Module 5 renamed from "Sales" to "Client Payments" and scoped to membership fees and walk-in fees only. New Module 6 (POS & Product Sales) added for product transactions. Client Profile "Purchase History" tab removed. Product entity updated with cost_price, image, product_type, and servings_per_container. Three new reports added. See DECISIONS.md ADR-011 and ADR-012.

> **Design Review #2 (2026-06-23):** Clients Module overhauled after wireframe review — status filter chips, updated table columns, quick-stats strip, context-aware membership button, archive via overflow menu, walk-in conversion signals, attendance tab filters, voided payment indicator, "Show archived" toggle. Dashboard gains a 4th live feed panel (Frequent walk-ins). Membership Module gains Membership Plan catalog management. Settings Module gains "Membership Plans" section. See DECISIONS.md ADR-014, ADR-015, ADR-016.

> **Design Review #3 (2026-06-24):** Attendance Module deep review. Check-In Station screen added as top-level navigation entry (ADR-022). Renewal decision prompt added for expired MEMBER check-in (ADR-018). At-risk member signal introduced: new setting, "At risk" filter chip, Dashboard 5th panel, and report (ADR-019). Walk-in conversion event defined as derived (ADR-020). `created_by` and `correction_note` added to Attendance entity (ADR-021). Six new P0 stories (US-1.8, US-2.11, US-4.8, US-4.9, US-8.13, US-8.14). Total MVP story count: 52 → 58. See DECISIONS.md ADR-018 through ADR-022.

> **Design Review #4 (2026-06-24):** Attendance module restructured as a single top-level navbar module with three internal views: Check-In (default), Attendance History, and Attendance Analytics (ADR-023). ADR-022 amended. Check-In is no longer a standalone top-level navigation entry. Attendance History updated with date filter presets. Attendance Analytics view added as committed MVP scope (US-4.10). Total MVP story count: 58 → 59. See DECISIONS.md ADR-023.

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
- **Frequent walk-ins:** top 5 walk-in clients (no active membership) sorted by visit count descending, with last visit date and visit count. "View all →" links to the Client List filtered to "Walk-in only." Supports same-visit conversion outreach. (ADR-016)
- **At-risk members:** active MEMBER clients (`end_date >= today`) whose last visit exceeds `Gym.member_inactivity_warning_days`. Sorted by days since last visit descending. Shows up to 5 clients with: name, days since last visit, and membership expiry date. "View all →" links to the Client List filtered by "At risk." (ADR-019, US-2.11)

**Business Rules Enforced:**
- All chart and metric data excludes voided transactions (both `CLIENT_TRANSACTION` and `POS_SALE`).
- "Expiring Soon" threshold uses `Gym.expiration_warning_days` setting throughout.
- "At-risk members" panel uses `Gym.member_inactivity_warning_days` consistently with the Client List "At risk" filter and the At-risk Members Report.
- Revenue figures are always MTD when "Month" period is selected.
- Attendance charts distinguish total check-ins from unique visitors.

**Performance requirement:** Must load within 3 seconds (NFR).

**Edge Cases:**
- Empty state (brand-new gym, zero data) — all charts render with empty axes and a "no data yet" label; KPI cards show zeros.
- Partial period (e.g., "Month" selected on the 3rd) — chart shows available days only.
- Voided transactions excluded from all revenue metrics and charts consistently.
- At-risk members panel empty state: if no active MEMBER clients have exceeded the inactivity threshold, panel shows "All active members have visited recently."
- At-risk panel shows only clients with active memberships — expired members are excluded (they belong to the "Expiring soon" and renewal outreach workflows).

**Deferred:**
- Customizable widget layout.
- Scheduled summary email.
- Comparison mode (current period vs. prior period).

---

## 2. Clients Module

**Purpose:** Central client registry replacing scattered paper/Excel records.

**MVP Scope / Forms:**

**Client List:**
- Status filter chips always visible: `All` · `Active` · `At risk` · `Expiring soon` · `Expired` · `Walk-in only` · `Inactive`. Filters combine with name search. Filter state persists within the session. (ADR-014, ADR-017, ADR-019)
  - `Active` — MEMBER clients with an active membership + WALK_IN clients whose last visit is within `Gym.walkin_inactivity_threshold_days`
  - `At risk` — MEMBER clients with an active membership (`end_date >= today`) whose last `Attendance.visit_date` exceeds `Gym.member_inactivity_warning_days`, OR active MEMBER clients with no attendance records at all. Results sort by days since last visit descending by default. Does not overlap with "Inactive" (WALK_IN only). A client can match both "At risk" and "Expiring soon" simultaneously. (ADR-019)
  - `Expiring soon` — MEMBER clients within `Gym.expiration_warning_days` of membership end
  - `Expired` — MEMBER clients with no current active membership
  - `Walk-in only` — all WALK_IN type clients (Active and Inactive walk-ins combined)
  - `Inactive` — WALK_IN clients whose last visit exceeds `Gym.walkin_inactivity_threshold_days`, or who have never visited
- Table columns: Full Name, Type (MEMBER / WALK_IN badge), Status (derived), Membership Expiry (members only — blank for walk-in clients), Contact Number, Actions.
- Name search: partial-match, returns within 2 seconds (NFR).
- **Show archived toggle:** when enabled, archived clients appear in a visually distinct state (greyed out) interleaved with active results. Default off.
- "+ New Client" button in the toolbar. (No "+ Add membership" toolbar shortcut — membership is created from the Client Profile.)

**Register/Edit Client forms:**
- **Register Client:** `full_name` (required), `contact_number` (optional), `notes` (optional).
- **Edit Client:** all fields editable except system-generated `date_registered`.

**Client Profile:**
- **Type badge** displayed prominently in the profile header: `MEMBER` or `WALK_IN`. Status badge displayed alongside it (e.g., "MEMBER · Active", "WALK_IN · Inactive").
- **Quick-stats strip (header):** total all-time visits · visits this month · for MEMBER clients: days until membership expiry · for WALK_IN clients: walk-in visit count and days since last visit.
- **Walk-in conversion signal:** for WALK_IN type clients, the quick-stats strip prominently shows "X visits — no membership," serving as a direct conversion cue. (ADR-016)
- **Context-aware membership action button:**
  - "Add membership" — client has no membership history.
  - "Renew" — client's membership is expired or expiring soon (within warning threshold).
  - "Renew early" — client has an active membership not near expiry.
- **Overflow menu (⋯) on profile header:** Edit profile · Archive client · (if archived: Reactivate client).
- **Tabs:**
  - *Membership History:* chronological list of all Membership records. Rows where the associated payment transaction is voided display a "VOID" badge on the payment column — the membership record itself is unchanged, only the financial indicator is flagged.
  - *Attendance History:* chronological check-in log with date range filter and visit type filter (MEMBER / WALK_IN).

*(Purchase History tab removed — POS product sales are not linked to clients. See ADR-011.)*

**Archive Client (soft delete):**
- Accessible from the Client Profile overflow menu (⋯), not a primary button.
- Requires confirmation: "Archive [Name]? They will be hidden from the active client list. All history is preserved."
- Archived clients are hidden from the default Client List view; visible only with "Show archived" toggle enabled.
- Archived clients retain all attendance, membership, and payment history — fully intact and queryable.
- Reactivation (un-archive) available from the same overflow menu.

**Business Rules Enforced:**
- A client can exist indefinitely with zero memberships (pure walk-in history); their `client_type` is `WALK_IN`.
- Once a client has any Membership record, `client_type` is permanently `MEMBER` — it does not revert if the membership expires.
- Soft delete only (`deleted_at`) — a client is never hard-removed if they have any attendance or transaction history.
- `client_type` and `status` are both derived at query time (ADR-002, ADR-017) — no stored columns, no sync job.
- The "Expiring soon" filter uses the same `Gym.expiration_warning_days` threshold as the Dashboard widget.
- The "Inactive" filter uses `Gym.walkin_inactivity_threshold_days` — a separately configurable setting.
- The "At risk" filter uses `Gym.member_inactivity_warning_days` — a separately configurable setting distinct from walk-in inactivity. At-risk is an orthogonal attendance-recency signal that does not change `Client.status`. (ADR-019)

**Edge Cases:**
- **Possible duplicate on registration:** fuzzy name check warns before creating, but never blocks.
- **Client with no contact info at all:** fully valid, must not break search or profile views.
- **Newly registered walk-in client who has never visited:** `client_type = WALK_IN`, `status = INACTIVE` immediately (no attendance records = last visit exceeds any threshold). This is expected — they were registered but haven't come in yet.
- **Walk-in client viewed from the Dashboard "Frequent walk-ins" panel:** links directly to Client Profile; context-aware button shows "Add membership."
- **Future-dated membership:** profile header status badge reads "Upcoming," not "Active," until `start_date` arrives. `client_type` is `MEMBER` from the moment the membership record is created.
- **Archived client appears in attendance history query:** record is retained and visible in reports; the client row in the list is greyed out under "Show archived."
- **Walk-in filter + name search + sort by visit count:** all three can be applied simultaneously; each constraint narrows results cumulatively.
- **Inactivity threshold change:** when the owner updates `walkin_inactivity_threshold_days`, the derived status of all WALK_IN clients recalculates immediately — no backfill needed since it's computed on query.
- **Active MEMBER client with no attendance records:** treated as at-risk immediately — expected for new memberships before the first visit, including future-dated memberships before `start_date`.
- **At-risk member who visits again:** the at-risk signal clears on the next query automatically (derived at runtime, no stored state to update).
- **Client simultaneously matching "At risk" and "Expiring soon":** both filter chips show the client. Name search and either filter chip can be combined cumulatively.

**Deferred:**
- Merge-duplicate-clients tool.
- Photo/ID upload.
- Client self-service portal.

---

## 3. Membership Module

**Purpose:** Manage the full lifecycle of paid membership periods per client.

**MVP Scope / Forms:**

**Membership Plan Catalog (managed in Settings → Membership Plans):**
- The `MembershipPlan` table is the authoritative source for plan options in the Add/Renew modal. (ADR-015)
- Plans have: `name`, `duration_type` (1 month / 2 months / 3 months / Custom days), `default_price`, `is_active`.
- See Module 9 (Settings) for plan management UI specification.

**Create Membership:**
- Select `MembershipPlan` from the active plan catalog (populated from `MembershipPlan` where `is_active = true`).
- If "Custom duration" plan is selected, a "Duration (days)" numeric input field appears inline and is required.
- `price` defaults from the selected plan's `default_price`, but is always overridable per transaction (price snapshot, not a live reference — ADR-003).
- `start_date` defaults to today but can be future-dated (pre-purchase).
- **Blocking state:** if the client already has an active (non-expired) membership, the Create Membership action is blocked. The blocking message reads: "[Client name] has an active membership until [end date]. Did you mean to Renew instead?" with a "Go to Renew" action that routes directly to the renewal flow.

**Renew Membership:**
- Same plan/duration selector as Create, same price-override mechanic.
- System auto-computes new dates per the confirmed renewal math below.
- The new Membership record is linked to the prior one via `renewed_from_membership_id`, preserving the full renewal chain.

**View Membership History:**
- Chronological list of all Membership records for a client, including the renewal chain and VOID badge where the associated payment was voided.

**Monitor Expiration:**
- Surfaced via Dashboard (Expiring Soon panel) + a dedicated filterable list (Active / Expired / Expiring Soon).

**Business Rules Enforced:**
- **One active membership per client at a time** — creating a new membership while one is still active is blocked, with a redirect prompt to "Renew" instead.
- **Renewal date math (confirmed rule):**
  - Renewing while current membership is still active → new period extends from the *existing end date*.
  - Renewing after expiry → new period starts from *today*.
- Membership price is always a **snapshot** (`price_paid`), independent of the plan's current default price (ADR-003).
- Expired memberships remain fully visible and queryable — never hidden or deleted.
- An expired member is **not blocked from attendance**; they attend as a walk-in until they renew.
- Membership cannot be paused/frozen (explicit BRD exclusion).
- Editing a plan's `default_price` in Settings does not alter any existing `price_paid` snapshots.
- Retiring a plan (`is_active = false`) does not affect existing memberships created under that plan.

**Edge Cases:**
- **Future-dated membership start (pre-purchase):** must not count as "active" until `start_date` arrives; profile displays "Upcoming" badge.
- **Custom duration plans:** support the exact same renewal math as standard duration plans.
- **Plan retired after membership created:** existing memberships remain valid; plan just no longer appears in the modal selector.
- **Voided payment on a membership:** the membership record remains fully active. Cancelling or adjusting the membership is a separate manual action.

**Deferred:**
- Membership freeze/pause.
- Membership transfer between clients.
- Family/group membership.

---

## 4. Attendance Module

**Purpose:** Digital check-in log replacing the paper attendance sheet, while preserving accurate historical context of each visit.

**Module Structure (ADR-023):**
```
Attendance (single top-level nav entry)
├── Check-In           (default view)
├── Attendance History
└── Attendance Analytics
```

**MVP Scope / Forms:**

**Check-In Station screen (primary check-in interface — US-4.8, ADR-022):**
- Default view within the Attendance module; name search field is auto-focused on load. (ADR-023)
- Result cards show: name, type badge (MEMBER/WALK_IN), membership status, expiry date (MEMBER only), and a "checked in today" indicator if an Attendance record already exists for today.
- Three check-in branches on client selection:
  - **Active MEMBER:** duplicate check → single "Check In" action → attendance record created → expiry warning checked post-check-in.
  - **MEMBER-type, no active membership (expired member):** renewal decision prompt (ADR-018) — "Check in as walk-in" or "Renew membership now."
  - **WALK_IN or walk-in path:** conversion prompt check (if visit count ≥ `Gym.walkin_conversion_prompt_visits`) → walk-in fee collection → CLIENT_TRANSACTION created.
- After successful check-in: client appears in Today's Check-Ins list; screen returns to auto-focused search.

**Today's Check-Ins list (US-4.9):**
- Visible on the Check-In Station screen and as a standalone view in the Attendance section.
- Reverse-chronological list: client name, visit type, time in. Repeated same-day visits labeled "2nd visit."
- Shows total check-ins and unique visitors for the current day.

**Attendance History (US-4.3):**
- Second view within the Attendance module (distinct from the per-client Attendance History tab on the Client Profile).
- All attendance records across all clients, filterable by date range and visit type.
- Date filter presets: **Today** (default on open) · Yesterday · Last 7 Days · Last 30 Days · Custom Date Range. Selected filter persists within the session.
- Columns: client name, visit type, time in, visit date.

**Attendance Record Correction (Flow 15):**
- Limited to same-day records only; only `time_in` is editable.
- Required reason note stored in `Attendance.correction_note`.
- Prior-day records are read-only at MVP.
- Attendance records cannot be deleted — correction only.

**Attendance Analytics (US-4.10):**
- Third view within the Attendance module. Read-only aggregate metrics, trends, and operational signals.
- **KPI Cards (always visible, fixed periods):** Today's Check-Ins; This Week's Check-Ins; This Month's Check-Ins; Member vs. Walk-In Ratio (percentage split for current month).
- **Charts (all governed by a period selector — Last 7 Days / Last 30 Days / Last 3 Months / Custom Range):**
  - Daily Attendance Trend (line chart): total check-ins and unique visitors per day.
  - Attendance by Day of Week (bar chart): average check-ins per weekday — identifies peak days.
  - Attendance by Hour (bar chart): check-ins bucketed by hour of day — identifies peak hours.
- **Member Insights panel:** At-risk Members count (live; links to Client List "At risk" filter); Average Visits Per Member (active MEMBER clients, selected period); Member Utilization Rate (unique visiting members ÷ total active members, selected period).
- **Walk-In Insights panel:** Frequent Walk-Ins count (walk-in clients with ≥ `Gym.walkin_conversion_prompt_visits` visits and no membership, live; links to Client List "Walk-in only" sorted by visits); Walk-In Conversion Candidates count; Walk-In to Member Conversion Metrics (count and rate for selected period, derived per ADR-020).
- **Operational Insights panel:** Peak Hours (top 3 busiest hours by check-in volume, selected period); Peak Days (top 3 busiest days of the week, selected period); New vs. Returning Visitors (clients whose first Attendance record falls within the period = New; all others = Returning).
- **Alerts panel:** Active members inactive beyond `Gym.member_inactivity_warning_days` (live count + "View list" link); Walk-in clients exceeding `Gym.walkin_conversion_prompt_visits` with no membership (live count + "View list" link); Attendance decline warning if current period is ≥ 20% below the equivalent prior period.
- Attendance-domain scope only: no revenue data, membership financial history, or inventory data.
- No CSV export from Attendance Analytics — detailed exportable records belong in the Reports module (US-8.5, US-8.13, US-8.14).
- All derived counts and rates use the same definitions as the Client List filters and Dashboard panels — signals are consistent across the system.

**Business Rules Enforced:**
- Every attendance record captures `client`, `date`, `time_in`, `visit_type`, and `created_by`.
- `membership_id` is snapshotted onto the attendance record at check-in time, so later renewals/expirations never retroactively change what a past visit "was."
- Attendance history is retained regardless of the client's current membership status or even if the client is later soft-deleted.
- Multiple check-ins for the same client on the same day are **allowed** — but require explicit confirmation before the second record is created. Dashboard/report metrics distinguish "total check-ins" from "unique visitors per day."
- **Expired MEMBER at check-in (ADR-018):** When `client_type = MEMBER` and no active membership exists, the system presents a binary renewal decision prompt. Silent routing to walk-in is not permitted.
- **Expiry warning at check-in:** After a successful check-in where the member's active membership is within `Gym.expiration_warning_days`, a non-blocking dismissible renewal notice is displayed.
- **Pre-fee conversion prompt:** When a walk-in client's visit count reaches `Gym.walkin_conversion_prompt_visits` and they have no Membership record, a conversion prompt is shown before the fee is collected. Dismissible; the fee proceeds if dismissed.
- **`Attendance.created_by` is mandatory (ADR-021):** Set to the authenticated user at check-in time.
- **Attendance record correction is time-bounded:** Corrections limited to same-calendar-day records; require a reason note stored in `Attendance.correction_note`; only `time_in` is editable; no deletions permitted.
- **Attendance Analytics scope boundary:** Analytics panels surface aggregate counts, trends, and operational signals only. Detailed filterable record lists and CSV exports belong in the Reports module (US-8.5, US-8.13, US-8.14). This prevents duplication and maintains a clear boundary between in-module operational intelligence and archive-quality reporting.

**Edge Cases:**
- **Walk-in with no prior client record:** lightweight client quick-created with name (required) and contact number (optional) via an inline modal. Fuzzy duplicate name warning applies.
- **Expired MEMBER at check-in:** renewal decision prompt — binary choice between walk-in and renewal. No silent routing. (ADR-018)
- **Future-dated membership at check-in:** client has an upcoming membership (`start_date > today`). Check-in screen shows: "[Name]'s membership starts [date]. Checking in as walk-in today." Attendance record: `visit_type = WALK_IN`, `membership_id = null`.
- **Archived (soft-deleted) client check-in attempt:** archived clients are excluded from Check-In Station search results. The owner must first reactivate the client (Flow 12) before check-in is possible.
- **Walk-in fee voided after attendance recorded:** voiding the transaction (Flow 11) does NOT void or delete the Attendance record. The visit history is preserved. The discrepancy is visible in Client Payment History (VOID transaction alongside an existing attendance record).
- **Conversion prompt dismissed:** owner proceeds to walk-in fee normally. No re-prompt on the same visit. The visit count still increments; the prompt appears again on the next qualifying visit.
- **Same-day correction attempted on a prior-day record:** edit is disabled; record is read-only. No escalation path at MVP.
- **Duplicate check-in confirmed intentionally:** second Attendance record is created normally; labeled "2nd visit" in the Today's Check-Ins list. Total check-in count increments; unique visitor count does not.
- **Active MEMBER client who has never attended:** at-risk signal triggers immediately. Expected for pre-purchased memberships before the first visit.

**Deferred:**
- `time_out` capture and session-duration analytics (field reserved in schema now; analytics view will gain session-duration chart when time_out is available).
- QR code / RFID-based check-in (explicit BRD exclusion).
- Retroactive attendance entry (backfilling past dates when the system was unavailable) — explicitly out of scope at MVP.
- Attendance record deletion — records can be corrected for `time_in` with a required reason note; full deletion is not available at MVP.
- Owner-configurable attendance decline alert threshold — hardcoded at 20% below prior period for MVP; configurable threshold deferred to a future Settings addition.

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
- **Frequent Walk-In Report:** clients with high visit count and no active membership — ranked by visit count, directly supports the conversion-tracking goal. Conversion detection uses the derived definition: MEMBER clients with WALK_IN attendance records predating their earliest Membership.created_at (ADR-020).
- **Inventory Usage Report:** stock movement summary per product over a date range — units sold, restocked, and manually adjusted. Surfaces discrepancies between expected and actual stock.
- **Member Engagement Report:** for each active MEMBER client — total all-time visits, visits this month, visits last month, days since last visit. Default sort: days since last visit descending (least engaged first). Filterable by date range. (US-8.13)
- **At-risk Members Report:** active MEMBER clients (`end_date >= today`) whose last attendance date exceeds `Gym.member_inactivity_warning_days`. Columns: name, membership expiry date, last visit date, days since last visit, total all-time visits. Sorted by days since last visit descending. (US-8.14)
- **CSV Export:** every report listed above can be exported to CSV.

**Business Rules Enforced:**
- All reports read from the `Transaction` / `TransactionLineItem` ledger and the `Attendance` table directly.
- Reports respect the price-snapshot rule: a report for last month reflects what was actually charged last month, even if prices have since changed.
- Voided transactions (`status = VOID`) are excluded from all revenue totals consistently.
- Revenue by Payment Method and Revenue by Category span both transaction types (`CLIENT_TRANSACTION` and `POS_SALE`).
- Member Engagement and At-risk reports use `Gym.member_inactivity_warning_days` consistently with the Dashboard panel and Client List filter.

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
- **System Preferences:** membership expiration warning period (days); walk-in inactivity threshold (days, default: 7); at-risk member threshold (days since last visit, default: 14); walk-in conversion prompt threshold (visits, default: 5).
- **Membership Plans:** create, edit, and retire membership plan catalog entries. (ADR-015)

**Membership Plans section:**
- Displays all plans as a table: Name · Duration · Default Price · Status (Active / Inactive).
- **Add plan:** name (required), duration type (1 month / 2 months / 3 months / Custom days), default price (required), active status (default: active).
- **Edit plan:** all fields editable. Editing `default_price` does not alter past `price_paid` snapshots (ADR-003).
- **Retire plan:** sets `is_active = false`. Plan disappears from the Add/Renew membership modal. Existing memberships under the plan are unaffected.
- Retired plans remain listed in Settings (with an "Inactive" badge) and can be reactivated.
- At least one active plan must exist at all times — the UI prevents deactivating the last active plan.

**Business Rules Enforced:**
- Changing a default price in Gym Information or in a Membership Plan affects only *future* transactions — it must never retroactively alter `price_paid` snapshots on existing records (enforced structurally by the Domain Model's snapshot design, ADR-003).
- Deactivating a plan does not cascade to existing memberships created under that plan.
- When `member_inactivity_warning_days` is updated, the at-risk signal for all active MEMBER clients recalculates immediately on the next query — no backfill required (computed at runtime from Attendance records).
- Setting `member_inactivity_warning_days` or `walkin_conversion_prompt_visits` to zero or a negative value is blocked with a validation error (same rule as all other numeric threshold settings).

**Edge Cases:**
- Owner sets an unrealistic value (e.g., negative price, zero warning days, zero inactivity threshold) — basic input validation required for all numeric settings.
- Owner attempts to deactivate the last active plan — blocked with a message: "At least one active plan is required."

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
