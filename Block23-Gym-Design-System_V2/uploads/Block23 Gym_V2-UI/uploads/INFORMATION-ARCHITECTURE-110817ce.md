# Information Architecture — Block23 Gym Management System

This document is the single, authoritative map of the application's navigation and screen structure. It exists so the Design System can design the app shell, navigation, and layout against one explicit source. It records *where every screen lives* and *how the areas link to each other* — it does not re-specify field-level behavior (see `MODULE-SPECS.md`) or workflows (see `USER-FLOWS.md`).

Governed by **ADR-042** (information architecture & navigation; Membership is a distributed capability) and **ADR-023** (Attendance is one nav entry with three views). Device strategy per **ADR-033** (desktop-first, mobile-responsive, no tablet-specific target).

---

## 1. Top-Level Navigation (8 entries)

The primary navigation has exactly eight entries:

| # | Nav entry | Purpose | Default landing |
|---|---|---|---|
| 1 | **Dashboard** | Daily operational command center — KPIs, charts, live feeds | KPI strip + charts |
| 2 | **Clients** | Client registry, profiles, and **all membership operations** | Client List |
| 3 | **Attendance** | Check-in and attendance intelligence (3 views) | Check-In view |
| 4 | **Client Payments** | Membership/walk-in payment history, void, collections | Client Payment History |
| 5 | **POS** | Product sales + product catalog management | POS Screen |
| 6 | **Inventory** | Stock ledger, restock, adjustments, valuation | Current Stock View |
| 7 | **Reports** | All 22 archival/exportable reports | Reports index |
| 8 | **Settings** | Gym config, thresholds, **membership plan catalog** | Gym Information |

**There is no "Membership" top-level entry.** Membership is a cross-cutting capability whose surfaces are distributed across Clients, Settings, Dashboard, and Reports (see §3).

---

## 2. Screen Map per Nav Entry

### 1. Dashboard
- KPI strip (6 cards) · period selector · charts (revenue / membership / attendance / top products) · live feed panels (Recent POS sales, Expiring soon, Inventory alerts, Today's Collections, Frequent walk-ins, At-risk members).
- Live feeds deep-link outward: Expiring soon → Clients (Expiring soon chip); Frequent walk-ins → Clients (Walk-in only); At-risk → Clients (At risk chip); Today's Collections → Client Payments (Collections Summary); Inventory alerts → Inventory.

### 2. Clients
- **Client List** — search + 8 filter chips (`All · Active · Upcoming · At risk · Expiring soon · Expired · Walk-in only · Inactive`) + "Show archived" toggle.
- **Client Profile** — header (type/status badges, quick-stats, context-aware membership button, overflow menu) and tabs:
  - *Membership History* — create / renew / **cancel** memberships; VOID and Cancelled badges. **(Membership module's primary home — ADR-042.)**
  - *Attendance History* — per-client check-in log with filters; inline same-day `time_in` correction (Flow 15).
- **Register / Edit Client** modal.

### 3. Attendance (one nav entry, three internal views — ADR-023)
- **Check-In** (default) — auto-focused search, result cards, branching, Today's Check-Ins list.
- **Attendance History** — gym-wide records, date-preset and visit-type filters.
- **Attendance Analytics** — KPI cards, trend/peak charts, Member/Walk-In/Operational insights, alerts. No CSV export (lives in Reports).

### 4. Client Payments
- **Client Payment History** — `CLIENT_TRANSACTION` list; void action (Flow 11).
- **Collections Summary** — daily totals by payment method across both transaction types (Flow 17).

### 5. POS
- **POS Screen** — category tabs, product grid, search, cart, checkout (cash change calculator), container-mode toggle.
- **Product Management** — product CRUD + archive/restore + categories (Flow 20).
- **POS History** — `POS_SALE` list with today's summary strip; void action.

### 6. Inventory
- **Current Stock View** — stock levels, low-stock flag, reorder indicator, days-until-stockout, valuation footer, shrinkage column.
- **Restock** (Flow 9) · **Manual Adjustment** (Flow 19) · **Inventory Movement History**.

### 7. Reports
- Index linking all 22 reports (US-8.2–US-8.22, excluding the P2 PDF export). Every report supports CSV export. Includes **Membership Reports (US-8.6)** — the archival Active/Expired/Expiring-soon lists.

### 8. Settings
- **Gym Information** (name, address, contact, timezone) · **Pricing** (default walk-in fee only) · **System Preferences** (4 threshold settings) · **Membership Plans** (plan catalog CRUD + retire).

---

## 3. Where "Membership" Lives (resolves the prior ambiguity)

Membership is a functional module (Module 3) without its own nav entry. Its surfaces map as follows:

| Membership concern | Lives in | Reference |
|---|---|---|
| Create / Renew / **Cancel** a membership | Clients → Client Profile → Membership History | US-3.1, US-3.2, US-3.10 |
| Membership history (per client) | Clients → Client Profile → Membership History | US-3.4 |
| Plan catalog (create/edit/retire plans) | Settings → Membership Plans | US-3.9 |
| Expiry monitoring (live) | Dashboard → Expiring Soon panel | US-3.6 |
| Operational status lists (outreach) | Clients → Client List filter chips (Active / Upcoming / Expiring soon / Expired) | US-2.9 |
| Archival status lists (exportable) | Reports → Membership Reports | US-8.6 |

The previously referenced Module 3 "dedicated filterable list (Active / Expired / Expiring Soon)" is **not** a separate screen — it is realized by the Client List chips (operational) and US-8.6 (archival). This removes the prior three-places ambiguity.

---

## 4. Cross-Area Deep Links

The system is navigationally cohesive — these links are first-class, not back-button journeys:

- Dashboard live feeds → filtered Client List, Inventory, Collections Summary (see §2.1).
- Check-In branches → Add Membership (Flow 5) and Renew (Flow 6) on the Client Profile.
- Client List "Walk-in only" / "At risk" chips ← Dashboard "View all →" links and Attendance Analytics "View list" links — all resolve to the same filtered Client List using the same derived definitions.
- Client Payments void ↔ Membership: voiding a payment and cancelling a membership are reached independently (Flow 11 vs Flow 18) and never cascade into each other.

---

## 5. Responsive Adaptation (per ADR-033)

- **Desktop-first** is the design baseline for every screen above. Data tables, reports, and analytics are designed for a full desktop viewport.
- **Mobile** adapts the read-heavy monitoring surfaces — Dashboard, Today's Check-Ins, revenue/collections totals, and inventory alerts — via stacked cards and simplified column sets. A bottom-navigation pattern for the 8 entries is acceptable on mobile.
- **No data-entry workflow is optimized for mobile**, and **no tablet-specific breakpoints** are defined — mobile-responsive layouts cover tablets adequately.
- The Design System defines the mobile breakpoint(s); this document defines only the structure that adapts across them.
