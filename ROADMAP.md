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

### Milestone 2 — Client Management
- [ ] New client registration — name required, contact optional (US-2.1)
- [ ] Edit client profile (US-2.2)
- [ ] Client search by name with partial match (US-2.3)
- [ ] Client profile view: info, membership history, attendance, purchases (US-2.4)
- [ ] Support pure walk-in clients with no membership (US-2.5)
- [ ] Soft-delete / archive clients (US-2.6)

### Milestone 3 — Membership Management
- [ ] Create membership with plan selection and price override (US-3.1)
- [ ] Renew membership — extend from end date if not expired, from today if expired (US-3.2)
- [ ] Custom plan durations (US-3.3)
- [ ] Full membership history per client (US-3.4)
- [ ] Expired memberships remain visible; client still allowed as walk-in (US-3.5)
- [ ] Expiring-soon membership list (US-3.6)

### Milestone 4 — Attendance
- [ ] Record member check-in by name search — auto-tag MEMBER or WALK_IN (US-4.1)
- [ ] Record walk-in visit; create lightweight client if name not found (US-4.2)
- [ ] Attendance history with date range and visit type filters (US-4.3)
- [ ] Attendance records preserved after membership expiry or client soft-delete (US-4.4)
- [ ] Allow multiple check-ins per client per day (US-4.5)

### Milestone 5 — Sales & Transactions
- [ ] Record multi-line-item transactions (membership + walk-in fee + products in one checkout) (US-5.1)
- [ ] Payment method recorded per transaction: cash, GCash, card (US-5.2)
- [ ] Chronological transaction history (US-5.3)
- [ ] Void/reverse a transaction with a reason note — preserves audit trail (US-5.4)

### Milestone 6 — Inventory & Products
- [ ] Create and edit products with category, unit type, price (US-6.1)
- [ ] Record inventory restocks (US-6.2)
- [ ] Stock auto-decrements on sale; blocks (with override confirmation) if going below zero (US-6.3)
- [ ] Low-stock dashboard alert with configurable threshold (US-6.4)
- [ ] Every stock change logged as a discrete inventory movement record (US-6.5)

### Milestone 7 — Dashboard & Reports
- [ ] Dashboard: KPI strip, trend charts, live feed panels (US-7.1)
- [ ] Revenue reports by period and source (membership / walk-in / product) (US-7.2)
- [ ] Attendance reports by period (US-7.3)
- [ ] Membership reports: active, expired, expiring-soon lists (US-7.4)
- [ ] Best-selling products report (US-7.5)
- [ ] Frequent walk-in clients report (high visits, low membership conversion) (US-7.6)
- [ ] CSV export for all reports (US-7.9)

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
| US-5.5 | Partial refunds |
| US-5.6 | Print or email receipts |
| US-5.7 | Discount codes and promotional pricing |
| US-6.6 | Supplier cost per product for margin reporting |
| US-6.7 | Automated reorder notifications |
| US-7.7 | PDF report export |
| US-7.8 | Profit-margin reporting (revenue minus cost) |
