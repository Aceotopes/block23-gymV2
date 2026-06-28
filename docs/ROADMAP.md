# Roadmap — Block23 Gym Management System

## Phase 1 — MVP

Goal: replace paper sign-in sheets and Excel sales logs with a fully working digital system for a single gym.
All items in this phase are committed scope (P0). See [User Stories](docs/USER-STORIES.md) for full acceptance criteria.

---

### Milestone 1 — Foundation & Auth
- [x] Project setup (repo, database, backend, frontend scaffold) — #015 (repo + Next.js scaffold + design tokens), #016 (Neon DB + Prisma 7 + 11-entity schema/migrations), #017 (Prisma client + Better Auth backend)
- [x] Owner login with hashed credentials and session management (US-1.1) — Better Auth (username + password), default-deny route protection, owner seed (#017, ADR-046)
- [x] Gym settings: name, address, contact info, and timezone (IANA identifier — governs all date/time display and "today" comparisons, ADR-035) (US-1.2) — #019 (Settings → Gym Information; searchable IANA combobox)
- [x] Default walk-in fee configuration (US-1.3) — membership pricing is managed per plan; no gym-level default membership fee (ADR-039) — #019 (Settings → Pricing)
- [x] Expiring-soon warning threshold setting (US-1.4) — #019 (Settings → System Preferences)
- [x] Walk-in inactivity threshold setting — drives the "Inactive" client status (US-1.7) — #019
- [x] Member inactivity warning threshold setting — drives the "At risk" MEMBER client signal (US-1.8) — #019
- [x] Walk-in conversion prompt threshold setting — governs the check-in conversion prompt, Attendance Analytics Walk-In Insights, and Frequent Walk-Ins Report (US-1.9) — does NOT govern Dashboard "Frequent walk-ins" panel (ADR-036) — #019

### Milestone 2 — Client Management
> List-state mechanism resolved first: **ADR-047** (URL search params; server-rendered tables). Status/type/at-risk derived centrally in `lib/clients/derive.ts` (ADR-002/017/019/037/040/041), never stored. — #020
- [x] New client registration — name required, contact optional; non-blocking fuzzy duplicate warning (US-2.1) — #020
- [x] Edit client profile (US-2.2) — #020
- [x] Client search by name with partial match; combined with status filter chips (US-2.3) — #020
- [x] Client profile view: personal info, quick-stats strip, membership history (Cancelled + VOID badges), attendance history, context-aware membership button (US-2.4) — #020 · membership Add/Renew flows land in M3 (button present, disabled); attendance date-range/visit-type filters land in M4
- [x] Support pure walk-in clients with no membership (US-2.5) — #020
- [x] Soft-delete / archive clients via overflow menu; "Show archived" toggle on Client List (US-2.6) — #020
- [x] Status and type filter chips on Client List: All / Active / Upcoming / At risk / Expiring soon / Expired / Walk-in only / Inactive; client type (MEMBER/WALK_IN) badge on list and profile (US-2.9, ADR-037) — #020
- [x] Walk-in conversion signals on Client Profile (US-2.10) — #020 · Dashboard "Frequent walk-ins" feed lands in M8 (Dashboard)
- [x] At-risk member "At risk" filter chip on Client List (US-2.11) — #020 · Dashboard "At-risk members" live feed panel lands in M8

### Milestone 3 — Membership Management ✅
- [x] Create membership with plan selection and price override; blocked if client has an active membership ("Go to Renew" redirect) or an upcoming membership (informational block, no redirect) (US-3.1, ADR-037)
- [x] Renew membership with context-aware button labels — canonical renewal date math: chain onto latest end_date + 1 if active/upcoming, start today if fully expired; new record may be Upcoming (US-3.2, ADR-040)
- [x] Custom plan duration — inline "Duration (days)" option creates an ad-hoc membership (`membership_plan_id` null); reusable custom packages saved as catalog plans (US-3.3, ADR-015)
- [x] Full membership history per client — with VOID (payment) and Cancelled (membership) badges (US-3.4) — Cancelled badge live; VOID badge wired to the payment relationship (lights up with M5)
- [x] Cancel an erroneously created membership (soft cancel via `cancelled_at`, reason required) — excluded from all derivations, retained in history with a "Cancelled" badge; independent of payment void (US-3.10, Flow 18, ADR-041)
- [x] Expired memberships remain visible (Membership History; never hidden/deleted) (US-3.5) — the "still allowed as walk-in" half is enforced at check-in (Milestone 4)
- [x] Expiring-soon membership surfaced via the Client List "Expiring soon" chip (US-3.6) — archival/exportable list is Reports (Milestone 8)
- [x] Membership plan catalog management in Settings: create, edit, retire plans (US-3.9)

> **Membership payment record** (`CLIENT_TRANSACTION` + payment method) **delivered in Milestone 5** (`#024`, US-5.1) — create/renew now write the transaction + `MEMBERSHIP` line item atomically with the `Membership`. M3 records the immutable `price_paid` snapshot on the `Membership` (ADR-003). Month→days convention pinned by ADR-048 (30/60/90).

### Milestone 4 — Attendance ✅
- [x] Attendance module — three internal views (ADR-023):
  - [x] **Check-In view (default):** auto-focused search, result cards (status + expiry + today indicator), check-in branching, today's check-ins running list (US-4.8)
  - [x] **Attendance History view:** all records filterable by date presets (Today · Yesterday · Last 7 Days · Last 30 Days · Custom Date Range) and visit type (US-4.3)
  - [x] **Attendance Analytics view:** KPI cards (Today/Week/Month check-ins, Member vs Walk-In Ratio), daily trend chart, day-of-week and peak-hour charts, Member Insights, Walk-In Insights, Operational Insights, and Alerts panel (US-4.10)
- [x] Record member check-in — expired MEMBER renewal prompt (ADR-018), expiry warning post-check-in, duplicate check-in confirmation (US-4.1)
- [x] Record walk-in visit: pre-fee conversion prompt for high-frequency walk-ins, quick-create inline modal (name + optional contact), create lightweight client if not found (US-4.2) — walk-in fee payment record (CLIENT_TRANSACTION + method + `WALK_IN_FEE` line item) delivered in Milestone 5 (`#024`, US-5.1); M4 records `fee_charged` on the attendance
- [x] Today's check-ins standalone view in Attendance History (US-4.9)
- [x] Attendance records preserved after membership expiry or client soft-delete (US-4.4) — structural (attendance never cascades)
- [x] Allow multiple check-ins per client per day — explicit confirmation required for same-day duplicates (US-4.5)
- [x] Attendance record correction: same-day `time_in` edit only; required reason note stored in `Attendance.correction_note`; `Attendance.updated_at` set on save; prior-day records read-only (US-4.11, Flow 15)

### Milestone 5 — Client Payments ✅ complete (`#024`)
- [x] Payment method (Cash, GCash, Card, Other) recorded on every membership and walk-in fee transaction (US-5.1) — retrofitted the M3 membership create/renew and M4 walk-in check-in to create a `CLIENT_TRANSACTION` + line item atomically (membership = `MEMBERSHIP` @ price snapshot; walk-in = `WALK_IN_FEE` @ fee, `fee_override_note` when ≠ default); separate transactions (ADR-024), never mixed (ADR-012)
- [x] Chronological client payment history filterable by date, client, and payment method (US-5.2) — URL state (ADR-047), client name search
- [x] Void client payment with required void_reason_category and optional detail note — record preserved, excluded from revenue totals (US-5.3) — additive (Flow 11); never cancels the membership (ADR-041) or deletes the attendance
- [x] End-of-day collections summary: today's revenue totals by payment method (Cash / GCash / Card / Other) spanning CLIENT_TRANSACTION and POS_SALE, with date selector for prior days (US-5.4) — spans both transaction types by query (POS_SALE auto-included at M6)

### Milestone 6 — POS & Product Sales ✅ complete (Part 1 `#025` catalog · Part 2 `#026` sell/checkout/void)
- [x] Product catalog: create, edit, soft-delete (archive) products via `deleted_at` — archived products excluded from POS grid and active-stock reports but retained for historical records (US-6.1 – US-6.3, US-6.15, ADR-005) — Part 1
- [x] Serving-based product configuration: servings-per-container, price-per-serving, container_selling_price (optional), remaining servings tracking (US-6.4; container-mode sale US-6.14 in Part 2)
- [x] Product categories (US-6.5) — Part 1
- [x] POS screen: category filter tabs, product grid with images, product search, SERVING_BASED_PRODUCT container mode toggle, shopping cart, quantity adjustment (US-6.6 – US-6.8, US-6.16) — Part 2
- [x] POS checkout with payment method selection, cash change calculator (cash received → change due), no client required (US-6.9, US-6.13) — Part 2
- [x] Whole-container sale for SERVING_BASED_PRODUCT: container mode checkout, stock deduction = quantity × servings_per_container (US-6.14, Flow 16) — Part 2
- [x] Void POS sale with required void_reason_category and optional detail note (US-6.10) — Part 2; additive ledger reversal (Flow 11)

> **Part 1 (`#025`)**: product CRUD + archive/restore, STANDARD vs SERVING_BASED with conditional fields, live gross margin (US-6.15), category management. **Part 2 (`#026`)**: the POS sell screen (tabs/grid/search/cart + container-mode toggle), checkout (payment method + cash-change), `POS_SALE` creation with `unit_price`/`cost_price_snapshot` snapshots (ADR-003/026) + `SALE` inventory entries decrementing `current_stock` (ADR-004), Force Sale override logging a `FORCED_SALE` adjustment (ADR-009/034), and POS History + additive void (ADR-028, Flow 11). `current_stock` was seeded directly in the smoke — **in-app restock is M7 (US-7.1)**; the Collections summary (M5) already spans `POS_SALE`. Product image is a URL field (R2 upload deferred).

### Milestone 7 — Inventory ✅ complete (`#027`)
- [x] Record product restocks — units for STANDARD_PRODUCT, containers × servings_per_container for SERVING_BASED_PRODUCT; optional total restock cost capture (US-7.1, US-7.5)
- [x] Every stock change logged as a discrete inventory movement record; manual adjustments require adjustment_reason_category (structured enum) and optional detail note (US-7.2)
- [x] reorder_point indicator on Current Stock view (distinct from low_stock_threshold), low-stock flag on the stock view (US-7.3 — the Dashboard low-stock alert feed lands in M8)
- [x] Remaining servings display for serving-based products (US-7.4)
- [x] Days-until-stockout estimate per product on Current Stock view — current_stock ÷ avg daily sales (last 30 days) (US-7.6 — the Dashboard alerts-panel surfacing lands in M8)
- [x] Inventory valuation footer on Current Stock view: SUM(current_stock × cost_price) with excluded-count note (US-7.7 — the Dashboard KPI card lands in M8)
- [x] Shrinkage column on Current Stock view: total negative adjustment quantity this month, broken down by adjustment_reason_category on hover; red/amber thresholds (US-7.8)
- [x] Automatic stock deduction on POS sale (delivered in Milestone 6)
- [x] Force-sale override with logged flagged adjustment (delivered in Milestone 6)
- [x] Manual inventory adjustments with required adjustment_reason_category and optional detail note (US-7.2); a below-zero manual decrease is blocked (Flow 19, unlike Force Sale)

> **`#027`**: the Inventory `?view=` shell (Current Stock · Movement History). Restock (`PURCHASE` ledger entry raising `current_stock` — `+units` STANDARD or `+containers×servings_per_container` SERVING_BASED, Flow 9, optional `total_restock_cost`) and Manual Adjustment (`ADJUSTMENT` with required owner reason category — `FORCED_SALE` excluded per ADR-034 — note for `OTHER`, below-zero blocked, Flow 19) are row dialogs, each one interactive `$transaction` moving ledger + cached `current_stock` together (ADR-004). Current Stock view derives low-stock/reorder flags, remaining-servings, days-until-stockout, this-month shrinkage (amber/red), and an inventory valuation footer — all at query time. Movement History is the per-product PURCHASE/SALE/ADJUSTMENT ledger with restock cost + reason filters. The Dashboard-side consumers of US-7.3/7.6/7.7 (low-stock feed, stockout estimates, Inventory Value KPI) land in **Milestone 8**.

### Milestone 8 — Dashboard & Reports (in progress — Part 1 `#028` Dashboard ✅)
- [x] Dashboard: 6-card KPI strip (Active Members, Today's Check-Ins, MTD Revenue, Today's Revenue, Expiring Soon, Inventory Value); trend charts (revenue multi-series/membership donut/daily attendance/top products); live feeds (POS sales, expiring members, inventory alerts with stockout estimates, Today's Collections breakdown, frequent walk-ins, at-risk members) (US-8.1, US-2.10, US-2.11, US-5.4, US-7.6, US-7.7) — **Part 1 (`#028`)**
- [ ] Revenue reports by period (Daily / Weekly / Monthly / This Year / Custom Range) and source (membership / walk-in / product) (US-8.2)
- [ ] Revenue by payment method (Cash, GCash, Card, Other) (US-8.3)
- [ ] Revenue by product category (US-8.4)
- [ ] Attendance reports: period selector, member vs. walk-in breakdown, unique vs. total check-ins, period-over-period comparison toggle, CSV export (US-8.5)
- [ ] Membership reports: active, expired, expiring-soon lists (US-8.6)
- [ ] Best-selling products report by units/servings and by revenue; slow-moving sort option (ascending) (US-8.7)
- [ ] Frequent walk-in clients report (high visits, low membership conversion) (US-8.8)
- [ ] Inventory usage report with shrinkage derivation: movements per product over date range, adjustment breakdown by reason category (US-8.9)
- [ ] Gross profit report: revenue, COGS (cost_price_snapshot × quantity), gross profit, and margin % per product; blended totals; flags null-cost-snapshot sales (US-8.12)
- [ ] CSV export for all reports (US-8.10)
- [ ] Member engagement report: active members ranked by visit frequency, least engaged first (US-8.13)
- [ ] At-risk members report: active members not attending within threshold, ranked by days since last visit (US-8.14)
- [ ] Void analysis report: voided transactions by void_reason_category and period, spanning both transaction types; summary + detail sections (US-8.15)
- [ ] New vs. renewals report: new memberships (renewed_from_membership_id IS NULL) vs. renewals per period, with renewal rate %; filterable by plan (US-8.16)
- [ ] Membership plan performance report: per plan — count, revenue, average price paid, plan status (US-8.17)
- [ ] Restock cost report: period-total inventory spend from InventoryTransaction.total_restock_cost, per product and grand total; null entries excluded with count noted (US-8.18)
- [ ] Membership net change report: new + renewals − expired per month, running cumulative active count; last 12 months default (US-8.19)
- [ ] Period-over-period revenue comparison: current vs. prior period side-by-side by source, with % change; This Week/Month/Year presets + custom (US-8.20)
- [ ] Slow-moving / dead stock report: active products with zero sales in 30/60/90-day window; cost value locked in stock; longest-inactive first (US-8.21)
- [ ] Converted walk-ins report: clients who converted from walk-in to member in the period (ADR-020 derivation), with conversion timeline and pre-conversion visit count (US-8.22)

> **Milestone 8 is delivered in four parts.** **Part 1 (`#028`) — Dashboard (US-8.1) ✅:** the 6-card KPI strip, the period-driven chart row (revenue multi-series line, membership donut, daily attendance stacked bar, top products horizontal bar — Recharts), and six live-feed panels (recent POS sales, expiring soon, inventory alerts w/ stockout estimate, Today's Collections, frequent walk-ins, at-risk members). Reuses central client derivation, the inventory derivations (`lib/inventory/stock.ts`), `summarizeCollections`, and a new shared revenue-aggregation lib (`lib/revenue/revenue.ts`). **Part 2 (`#029`)** — Reports index + shared report shell + CSV export (US-8.10) + the revenue/financial reports (US-8.2/8.3/8.4/8.20/8.15). **Part 3 (`#030`)** — membership + attendance reports (US-8.5/8.6/8.8/8.13/8.14/8.16/8.17/8.19/8.22). **Part 4 (`#031`)** — product + inventory reports (US-8.7/8.9/8.12/8.18/8.21) → MVP complete.

---

## Phase 2 — Post-MVP

Items deferred from MVP. No committed timeline.

| Story | Description |
|---|---|
| US-1.5 | Staff accounts with limited permissions |
| US-1.6 | Password reset via email |
| US-2.7 | Merge duplicate client profiles |
| US-2.8 | Upload client photo or ID |
| US-3.7 | Pause / freeze a membership |
| US-3.8 | Transfer a membership between clients |
| US-4.6 | Record check-out time for session duration analytics |
| US-4.7 | QR code / RFID check-in |
| US-5.6 | Partial refunds on client payments |
| US-5.7 | Print or email receipt for client payments |
| US-6.11 | Discount codes and promotional pricing |
| US-6.12 | Print or email receipt for POS sales |
| US-7.9 | Automated reorder notifications to a supplier |
| US-8.11 | PDF report export |
