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
- [ ] Void client payment with required reason note — record preserved, excluded from revenue totals (US-5.3)

### Milestone 6 — POS & Product Sales
- [ ] Product catalog: create, edit, archive products with name, category, image, selling price, cost price, product type, low-stock threshold (US-6.1 – US-6.3)
- [ ] Serving-based product configuration: servings-per-container, price-per-serving, remaining servings tracking (US-6.4)
- [ ] Product categories (US-6.5)
- [ ] POS screen: product grid with images, product search, shopping cart, quantity adjustment (US-6.6 – US-6.8)
- [ ] POS checkout with payment method selection — no client required (US-6.9)
- [ ] Void POS sale with required reason note (US-6.10)

### Milestone 7 — Inventory
- [ ] Record product restocks — units for STANDARD_PRODUCT, containers × servings_per_container for SERVING_BASED_PRODUCT (US-7.1)
- [ ] Every stock change logged as a discrete inventory movement record (US-7.2)
- [ ] Low-stock dashboard alerts per product threshold (US-7.3)
- [ ] Remaining servings display for serving-based products (US-7.4)
- [ ] Automatic stock deduction on POS sale (covered by Milestone 6)
- [ ] Force-sale override with logged flagged adjustment (covered by Milestone 6)
- [ ] Manual inventory adjustments with required reason note (covered by US-7.2)

### Milestone 8 — Dashboard & Reports
- [ ] Dashboard: KPI strip, trend charts (revenue/attendance/top products), live feeds (POS sales, expiring members, inventory alerts, frequent walk-ins, at-risk members) (US-8.1, US-2.10, US-2.11)
- [ ] Revenue reports by period and source (membership / walk-in / product) (US-8.2)
- [ ] Revenue by payment method (Cash, GCash, Card, Other) (US-8.3)
- [ ] Revenue by product category (US-8.4)
- [ ] Attendance reports by period (US-8.5)
- [ ] Membership reports: active, expired, expiring-soon lists (US-8.6)
- [ ] Best-selling products report by units/servings and by revenue (US-8.7)
- [ ] Frequent walk-in clients report (high visits, low membership conversion) (US-8.8)
- [ ] Inventory usage report: movements per product over a date range (US-8.9)
- [ ] CSV export for all reports (US-8.10)
- [ ] Member engagement report: active members ranked by visit frequency, least engaged first (US-8.13)
- [ ] At-risk members report: active members not attending within threshold, ranked by days since last visit (US-8.14)

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
| US-5.4 | Partial refunds on client payments |
| US-5.5 | Print or email receipt for client payments |
| US-6.11 | Discount codes and promotional pricing |
| US-6.12 | Print or email receipt for POS sales |
| US-7.5 | Per-restock supplier cost tracking |
| US-7.6 | Automated reorder notifications |
| US-8.11 | PDF report export |
| US-8.12 | Profit-margin reporting (revenue minus cost price) |
