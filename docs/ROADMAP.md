# Roadmap — Block23 Gym Management System

## Phase 1 — MVP

Goal: replace paper sign-in sheets and Excel sales logs with a fully working digital system for a single gym.
All items in this phase are committed scope (P0). See [User Stories](docs/USER-STORIES.md) for full acceptance criteria.

---

### Milestone 1 — Foundation & Auth
- [ ] Project setup (repo, database, backend, frontend scaffold)
- [ ] Owner login with hashed credentials and session management (US-1.1)
- [ ] Gym settings: name, address, contact info (US-1.2)
- [ ] Default membership and walk-in fee configuration (US-1.3)
- [ ] Expiring-soon warning threshold setting (US-1.4)
- [ ] Walk-in inactivity threshold setting — drives the "Inactive" client status (US-1.7)
- [ ] Member inactivity warning threshold setting — drives the "At risk" MEMBER client signal (US-1.8)

### Milestone 2 — Client Management
- [ ] New client registration — name required, contact optional (US-2.1)
- [ ] Edit client profile (US-2.2)
- [ ] Client search by name with partial match; combined with status filter chips (US-2.3)
- [ ] Client profile view: personal info, quick-stats strip, membership history (voided indicator), attendance history (filters), context-aware membership button (US-2.4)
- [ ] Support pure walk-in clients with no membership (US-2.5)
- [ ] Soft-delete / archive clients via overflow menu; "Show archived" toggle on Client List (US-2.6)
- [ ] Status and type filter chips on Client List: All / Active / Expiring soon / Expired / Walk-in only / Inactive; client type (MEMBER/WALK_IN) badge on list and profile (US-2.9)
- [ ] Walk-in conversion signals on Client Profile + Dashboard "Frequent walk-ins" feed (US-2.10)
- [ ] At-risk member "At risk" filter chip on Client List + Dashboard "At-risk members" live feed panel (US-2.11)

### Milestone 3 — Membership Management
- [ ] Create membership with plan selection and price override; blocking state with "Go to Renew" redirect if active membership exists (US-3.1)
- [ ] Renew membership with context-aware button labels — extend from end date if not expired, from today if expired (US-3.2)
- [ ] Custom plan duration — inline "Duration (days)" input when "Custom duration" selected (US-3.3)
- [ ] Full membership history per client (US-3.4)
- [ ] Expired memberships remain visible; client still allowed as walk-in (US-3.5)
- [ ] Expiring-soon membership list (US-3.6)
- [ ] Membership plan catalog management in Settings: create, edit, retire plans (US-3.9)

### Milestone 4 — Attendance
- [ ] Attendance module — three internal views (ADR-023):
  - **Check-In view (default):** auto-focused search, result cards (status + expiry + today indicator), check-in branching, today's check-ins running list (US-4.8)
  - **Attendance History view:** all records filterable by date presets (Today · Yesterday · Last 7 Days · Last 30 Days · Custom Date Range) and visit type (US-4.3)
  - **Attendance Analytics view:** KPI cards (Today/Week/Month check-ins, Member vs Walk-In Ratio), daily trend chart, day-of-week and peak-hour charts, Member Insights, Walk-In Insights, Operational Insights, and Alerts panel (US-4.10)
- [ ] Record member check-in — expired MEMBER renewal prompt (ADR-018), expiry warning post-check-in, duplicate check-in confirmation (US-4.1)
- [ ] Record walk-in visit: pre-fee conversion prompt for high-frequency walk-ins, quick-create inline modal (name + optional contact), create lightweight client if not found (US-4.2)
- [ ] Today's check-ins standalone view in Attendance History (US-4.9)
- [ ] Attendance records preserved after membership expiry or client soft-delete (US-4.4)
- [ ] Allow multiple check-ins per client per day — explicit confirmation required for same-day duplicates (US-4.5)
- [ ] Attendance record correction: same-day time_in edit with required reason note (Flow 15)

### Milestone 5 — Client Payments
- [ ] Payment method (Cash, GCash, Card, Other) recorded on every membership and walk-in fee transaction (US-5.1)
- [ ] Chronological client payment history filterable by date, client, and payment method (US-5.2)
- [ ] Void client payment with required void_reason_category and optional detail note — record preserved, excluded from revenue totals (US-5.3)
- [ ] End-of-day collections summary: today's revenue totals by payment method (Cash / GCash / Card / Other) spanning CLIENT_TRANSACTION and POS_SALE, with date selector for prior days (US-5.4)

### Milestone 6 — POS & Product Sales
- [ ] Product catalog: create, edit, archive products with name, category, image, selling price, cost price, product type, low-stock threshold, reorder_point, and gross margin display on the form (US-6.1 – US-6.3, US-6.15)
- [ ] Serving-based product configuration: servings-per-container, price-per-serving, container_selling_price (optional), remaining servings tracking (US-6.4, US-6.14)
- [ ] Product categories (US-6.5)
- [ ] POS screen: category filter tabs, product grid with images, product search, SERVING_BASED_PRODUCT container mode toggle, shopping cart, quantity adjustment (US-6.6 – US-6.8, US-6.16)
- [ ] POS checkout with payment method selection, cash change calculator (cash received → change due), no client required (US-6.9, US-6.13)
- [ ] Whole-container sale for SERVING_BASED_PRODUCT: container mode checkout, stock deduction = quantity × servings_per_container (US-6.14, Flow 16)
- [ ] Void POS sale with required void_reason_category and optional detail note (US-6.10)

### Milestone 7 — Inventory
- [ ] Record product restocks — units for STANDARD_PRODUCT, containers × servings_per_container for SERVING_BASED_PRODUCT; optional total restock cost capture (US-7.1, US-7.5)
- [ ] Every stock change logged as a discrete inventory movement record; manual adjustments require adjustment_reason_category (structured enum) and optional detail note (US-7.2)
- [ ] Low-stock dashboard alerts per product threshold; reorder_point indicator on Current Stock view (distinct from low_stock_threshold) (US-7.3)
- [ ] Remaining servings display for serving-based products (US-7.4)
- [ ] Days-until-stockout estimate per product on Current Stock view — current_stock ÷ avg daily sales (last 30 days); shown in Inventory alerts panel on Dashboard (US-7.6)
- [ ] Inventory valuation footer on Current Stock view: SUM(current_stock × cost_price) with excluded-count note; Dashboard KPI card (US-7.7)
- [ ] Shrinkage column on Current Stock view: total negative adjustment quantity this month, broken down by adjustment_reason_category on expand; red/amber thresholds (US-7.8)
- [ ] Automatic stock deduction on POS sale (covered by Milestone 6)
- [ ] Force-sale override with logged flagged adjustment (covered by Milestone 6)
- [ ] Manual inventory adjustments with required adjustment_reason_category and optional detail note (covered by US-7.2)

### Milestone 8 — Dashboard & Reports
- [ ] Dashboard: 6-card KPI strip (Active Members, Today's Check-Ins, MTD Revenue, Today's Revenue, Expiring Soon, Inventory Value); trend charts (revenue/attendance/top products); live feeds (POS sales, expiring members, inventory alerts with stockout estimates, Today's Collections breakdown, frequent walk-ins, at-risk members) (US-8.1, US-2.10, US-2.11, US-5.4, US-7.6, US-7.7)
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
