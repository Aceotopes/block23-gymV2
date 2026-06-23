# Development Log — Block23 Gym Management System

One entry per commit. Each entry covers all changes from the previous commit to this one.
Newest entries at the top.

---

## [#002] Sales Module Redesign — POS Model — 2026-06-22
**Commit:** *(pending — design review session #1)*

**Changes from previous commit:**
- Sales Module split into two separate modules:
  - Module 5 "Client Payments": membership fees and walk-in fees only — always client-linked
  - Module 6 "POS & Product Sales": product sales — no client required
- Mixed checkout concept removed (was the original justification for ADR-006)
- Client Profile "Purchase History" tab removed — POS sales are not linked to clients
- `Product` entity updated:
  - `unit_type` renamed to `product_type` (values: `STANDARD_PRODUCT`, `SERVING_BASED_PRODUCT`)
  - `current_price` renamed to `selling_price`
  - Added `cost_price` (nullable decimal — promoted from P2 to MVP)
  - Added `image_url` (nullable string — for POS grid display)
  - Added `servings_per_container` (nullable int — SERVING_BASED_PRODUCT only)
- `Transaction` entity updated:
  - Added `transaction_type` enum (`CLIENT_TRANSACTION` | `POS_SALE`)
  - `client_id` now explicitly null for `POS_SALE` transactions
- `TransactionLineItem` constraint added: item_type must match parent transaction_type
- Three new report types added: Revenue by Payment Method, Revenue by Product Category, Inventory Usage Report
- Roadmap updated: 8 milestones (was 7) — POS is now a dedicated milestone
- Flow 8 (Product Sale) rewritten as standalone POS flow — no client
- Flow 7 (Walk-in → Member Conversion) preserved unchanged in logic — WALK_IN_FEE + MEMBERSHIP is a valid CLIENT_TRANSACTION
- USER-STORIES.md: module count goes from 7 to 8; MVP story count increases from 37 to 48
- ADR-006 reasoning updated (unified ledger, not mixed checkout)
- ADR-011 added: POS sales are anonymous by default
- ADR-012 added: Mixed checkout removed — client and POS flows are always separate
- ADR-013 added: cost_price promoted to MVP scope

**Decisions made:**
- POS product sales do not require a client — ADR-011
- Mixed checkout removed — client transactions and POS sales are separate flows — ADR-012
- cost_price promoted from P2 to MVP scope — ADR-013

**Issues / Notes:**
- Voiding a client payment (e.g., membership fee) does not auto-cancel the associated membership — financial correction and membership management are intentionally separate actions
- Remaining servings for SERVING_BASED_PRODUCT are now surfaced on the dashboard inventory alerts panel

---

## [#001] Project Scaffolding — 2026-06-22
**Commit:** *(pending — first commit)*

**Changes from previous commit:**
- First commit — no previous state
- Created `docs/` folder and moved all planning documents into it:
  - `DOMAIN-MODEL.md`
  - `MODULE-SPECS.md`
  - `USER-FLOWS.md`
  - `USER-STORIES.md`
- Created root-level project files:
  - `README.md` — project overview, module list, doc links
  - `ROADMAP.md` — MVP milestones (7) and Post-MVP items (15 stories)
  - `DECISIONS.md` — 10 architecture decisions (ADR-001 through ADR-010)
  - `DEVELOPMENT-LOG.md` — this file
  - `.gitignore`
- Initialized Git repository

**Decisions made:**
- None new — all decisions already recorded in `DECISIONS.md` were made during the planning phase prior to this commit

**Issues / Notes:**
- Tech stack not yet decided; `.gitignore` covers common stacks and will be updated once the stack is confirmed
- No application code exists yet
