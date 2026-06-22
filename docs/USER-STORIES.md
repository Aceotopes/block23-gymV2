# User Stories — Gym Management System

**Legend:**
`P0` = Committed for MVP launch · `P2` = Post-MVP / Future
All stories are written from the perspective of the **Gym Owner**, the only user role in MVP.

> **Scope update:** All stories formerly tagged `P1` ("should have, can slip") have been promoted to `P0` and are now committed MVP scope, per stakeholder decision after document review. Each promoted story below is marked `(P0 · was P1)` for traceability. This is a low-risk promotion: the Domain Model and Module Specs documents had already architected for these items as core MVP behavior (soft-delete, stock movement ledger, void transactions, etc.) — only this story-prioritization document was treating them as optional. See the updated Summary table and the **Impact of This Change** note at the end of this document for what it means for your build timeline.

---

## 1. Authentication & Settings

### MVP

**US-1.1 (P0)** — As the Gym Owner, I want to log in with a username and password, so that only I can access business data.
- Acceptance Criteria:
  - Login form validates credentials against stored (hashed) password.
  - Failed login shows a generic error (no "username not found" vs "wrong password" distinction, to avoid leaking which usernames exist).
  - Session persists until logout or timeout.

**US-1.2 (P0)** — As the Gym Owner, I want to configure my gym's name, address, and contact info, so that this information is available throughout the system (e.g., for future receipts/reports).

**US-1.3 (P0)** — As the Gym Owner, I want to set the default membership fee and default walk-in fee, so that new registrations use sensible defaults without me typing them every time.

**US-1.4 (P0)** — As the Gym Owner, I want to set a "membership expiring soon" warning threshold (e.g., 5 days), so that the dashboard can flag members who need renewal outreach.

### Future

**US-1.5 (P2)** — As the Gym Owner, I want to create additional staff accounts with limited permissions, so that front-desk staff can record attendance without seeing financial reports.

**US-1.6 (P2)** — As the Gym Owner, I want to reset my password via email, so that I'm not locked out if I forget it.

---

## 2. Client Management

### MVP

**US-2.1 (P0)** — As the Gym Owner, I want to register a new client with their full name and (optionally) contact number, so that I can track them in the system.
- Acceptance Criteria:
  - Full name is required; contact number is optional.
  - System warns (does not block) if a client with a very similar name already exists, to reduce accidental duplicates.

**US-2.2 (P0)** — As the Gym Owner, I want to edit a client's profile information, so that I can correct typos or update their contact number.

**US-2.3 (P0)** — As the Gym Owner, I want to search for a client by name, so that I can quickly find them during check-in or checkout.
- Acceptance Criteria: Search returns results within 2 seconds (per NFR), supports partial name match.

**US-2.4 (P0)** — As the Gym Owner, I want to view a client's full profile — personal info, membership history, attendance history, and purchase history — so that I have a complete picture of their relationship with the gym.

**US-2.5 (P0)** — As the Gym Owner, I want a client to exist in the system without ever having a membership (pure walk-in), so that I can track casual visitors too.

**US-2.6 (P0 · was P1)** — As the Gym Owner, I want to mark a client as inactive/archived (soft delete) instead of permanently deleting them, so that historical attendance and sales records remain intact.

### Future

**US-2.7 (P2)** — As the Gym Owner, I want to merge two duplicate client profiles into one, so that I can clean up data entry mistakes without losing history.

**US-2.8 (P2)** — As the Gym Owner, I want to upload a photo or ID for each client, so that I can visually verify identity at check-in.

---

## 3. Membership Management

### MVP

**US-3.1 (P0)** — As the Gym Owner, I want to create a membership for a client by selecting a plan (1/2/3 months or custom duration) and price, so that I can register new paying members.
- Acceptance Criteria:
  - System blocks creating a new active membership if the client already has an active (non-expired) membership — one active membership per client at a time.
  - Price defaults from the plan but can be overridden per transaction; the overridden price is what's recorded (price snapshot), not a live reference to the plan price.

**US-3.2 (P0)** — As the Gym Owner, I want to renew an expired or expiring membership, so that the client can continue using the gym.
- Acceptance Criteria:
  - If renewing **before** expiry, the new period **extends from the current end date** (not from today) — confirmed business rule, not assumed.
  - If renewing **after** expiry, the new period starts from the renewal date.
  - The renewal creates a new Membership record linked to the previous one (`renewed_from_membership_id`), preserving full history rather than overwriting dates on the old record.

**US-3.3 (P0)** — As the Gym Owner, I want to create custom membership plans with non-standard durations (e.g., 45 days), so that I can offer flexible deals.

**US-3.4 (P0)** — As the Gym Owner, I want to view a client's full membership history, so that I can see all past plans, prices paid, and renewal patterns.

**US-3.5 (P0)** — As the Gym Owner, I want expired memberships to remain visible in the system (not deleted or hidden) and to still allow the client to enter as a walk-in, so that no business history is lost and expired members aren't blocked from the gym.

**US-3.6 (P0 · was P1)** — As the Gym Owner, I want to see which memberships are expiring within my configured warning period, so that I can proactively reach out for renewals.

### Future

**US-3.7 (P2)** — As the Gym Owner, I want to pause/freeze a membership for a defined period (e.g., medical leave), so that the client doesn't lose paid time. *(Explicitly out of scope per BRD — listed here for completeness.)*

**US-3.8 (P2)** — As the Gym Owner, I want to transfer a membership from one client to another, so that I can accommodate gift transfers.

---

## 4. Attendance

### MVP

**US-4.1 (P0)** — As the Gym Owner, I want to record a member's attendance by searching their name and logging a check-in, so that I replace the paper sign-in sheet.
- Acceptance Criteria:
  - System records client, date, time-in, and visit type (MEMBER or WALK_IN).
  - If the client has an active membership at the moment of check-in, the visit is auto-tagged MEMBER and linked to that membership record (snapshot link) for accurate historical reporting.
  - If the client has no active membership, the visit defaults to WALK_IN and prompts for the walk-in fee.

**US-4.2 (P0)** — As the Gym Owner, I want to record a walk-in visit (with or without an existing client profile), so that I can charge and log one-time visitors.
- Acceptance Criteria: Required field is full name only; system creates a lightweight client record if one doesn't already exist.

**US-4.3 (P0)** — As the Gym Owner, I want to view and filter attendance history by date range and visit type, so that I can answer questions like "who came in last Tuesday."

**US-4.4 (P0)** — As the Gym Owner, I want attendance history to remain available even after a client's membership expires or is deleted (soft-deleted), so that historical reporting stays accurate.

**US-4.5 (P0 · was P1)** — As the Gym Owner, I want to allow a client to be checked in more than once on the same day, so that I don't accidentally block a legitimate second visit (e.g., morning + evening session). The dashboard should still report unique-visitor counts separately from total check-ins.

### Future

**US-4.6 (P2)** — As the Gym Owner, I want to record a check-out time in addition to check-in, so that I can later analyze session duration and gym occupancy by hour.

**US-4.7 (P2)** — As the Gym Owner, I want to use a QR code or RFID card for check-in instead of manual name search, so that the front desk process is faster. *(Out of scope per BRD.)*

---

## 5. Sales & Transactions

### MVP

**US-5.1 (P0)** — As the Gym Owner, I want to record a sale that can include a membership purchase/renewal, a walk-in fee, and/or one or more products in a single checkout, so that I capture real-world transactions accurately (a client often buys a drink right after paying their walk-in fee).
- Acceptance Criteria:
  - A single Transaction can contain multiple line items of different types (MEMBERSHIP, WALK_IN_FEE, PRODUCT).
  - Each line item stores its own price at the time of sale (snapshot) — changing a product's price later never alters past transactions.

**US-5.2 (P0)** — As the Gym Owner, I want every transaction to record the payment method (cash, GCash, card), so that I can reconcile collections later even though full payment-method reporting is a future feature.

**US-5.3 (P0)** — As the Gym Owner, I want to view a complete, chronological transaction history, so that I have a single source of truth replacing my Excel sales log.

**US-5.4 (P0 · was P1)** — As the Gym Owner, I want to void/reverse a transaction (with a reason note) if I made a data-entry mistake, so that I can correct errors without deleting financial records and losing the audit trail.

### Future

**US-5.5 (P2)** — As the Gym Owner, I want to issue a partial refund on a transaction, so that I can handle customer disputes formally.

**US-5.6 (P2)** — As the Gym Owner, I want to print or email a receipt for a transaction, so that clients have proof of payment. *(Out of scope per BRD.)*

**US-5.7 (P2)** — As the Gym Owner, I want to apply discount codes or promotional pricing rules automatically, so that I don't have to manually override prices for sales/promos.

---

## 6. Inventory & Products

### MVP

**US-6.1 (P0)** — As the Gym Owner, I want to create and edit products (beverages, supplements) with a name, category, unit type (per-unit or per-serving), and price, so that I can sell them through the Sales module.

**US-6.2 (P0)** — As the Gym Owner, I want to record inventory purchases (restocks) that increase stock/servings, so that my stock counts stay accurate.

**US-6.3 (P0)** — As the Gym Owner, I want stock/servings to automatically decrease when a product is sold, so that I don't have to manually update inventory after every sale.
- Acceptance Criteria: System blocks (or explicitly warns and requires confirmation for) a sale that would take stock or servings below zero — exact behavior to be confirmed with owner (see clarifying questions), but undefined silent negative stock is not acceptable.

**US-6.4 (P0)** — As the Gym Owner, I want to see a low-stock alert on the dashboard when a product falls below a configurable threshold, so that I know when to reorder.

**US-6.5 (P0 · was P1)** — As the Gym Owner, I want every stock change (sale, restock, manual adjustment) logged as a discrete movement record, not just reflected in a single running total, so that I can audit exactly what happened to my inventory over time.

### Future

**US-6.6 (P2)** — As the Gym Owner, I want to record the supplier cost of each product, so that I can calculate profit margin, not just revenue, in reports.

**US-6.7 (P2)** — As the Gym Owner, I want to set up reorder notifications to a supplier, so that restocking is semi-automated.

---

## 7. Dashboard & Reports

### MVP

**US-7.1 (P0)** — As the Gym Owner, I want a dashboard showing today's attendance, active/expired/expiring-soon membership counts, today's and monthly revenue breakdown (membership/walk-in/product), and low-stock alerts, so that I get a daily operational snapshot in one screen.
- Acceptance Criteria: Loads within 3 seconds (per NFR).

**US-7.2 (P0)** — As the Gym Owner, I want revenue reports (daily/weekly/monthly) broken down by source (membership, walk-in, product), so that I understand where my income comes from.

**US-7.3 (P0)** — As the Gym Owner, I want attendance reports (daily/weekly/monthly), so that I can see traffic patterns.

**US-7.4 (P0)** — As the Gym Owner, I want membership reports listing active, expired, and expiring-soon members, so that I can manage renewals proactively.

**US-7.5 (P0 · was P1)** — As the Gym Owner, I want a best-selling-products report, so that I know what to stock more of.

**US-7.6 (P0 · was P1)** — As the Gym Owner, I want a report of frequent walk-in clients (high visit count, low membership conversion), so that I can identify upsell opportunities — this directly supports the BRD's stated conversion goal.

**US-7.9 (P0 · new decision)** — As the Gym Owner, I want to export any report to CSV, so that I can keep offline copies or open them in Excel for further analysis alongside my existing workflows.

### Future

**US-7.7 (P2)** — As the Gym Owner, I want to export reports as formatted PDF documents, so that I have a polished file to share with an accountant or stakeholder. *(CSV export — see US-7.9 — covers the core "get my data out" need for MVP; PDF formatting is a separate, deferred enhancement.)*

**US-7.8 (P2)** — As the Gym Owner, I want profit-margin reporting (revenue minus product cost), so that I understand true profitability, not just revenue.

---

## Summary: MVP Story Count by Module

| Module | P0 (Committed MVP) | P2 (Future) |
|---|---|---|
| Auth & Settings | 4 | 2 |
| Clients | 6 | 2 |
| Membership | 6 | 2 |
| Attendance | 5 | 2 |
| Sales | 4 | 3 |
| Inventory | 5 | 2 |
| Dashboard & Reports | 7 | 2 |
| **Total** | **37** | **15** |

**Reasoning note (original):** P0 count (29) was the real MVP scope — notice that several stories that *look* like "extras" (transaction void, stock movement log, price snapshotting) were P0/P1, not P2. That's intentional: these aren't feature additions, they're correctness requirements for the core promise of the BRD ("centralize business records," "business records must be preserved"). Skipping them doesn't reduce scope — it just means you ship a system that silently corrupts its own history.

---

## Impact of This Change (P1 → P0 Promotion)

You asked to commit all former-P1 stories to MVP. Here's what that actually changes, and what it doesn't:

**What it doesn't change:** the Domain Model and Module Specs documents. Both already assumed this full scope — soft-delete on clients, the `InventoryTransaction` ledger, void transactions, the snapshot-linked attendance, and the walk-in conversion report were already specified as core MVP behavior in those two documents, not deferred features. Nothing in the schema or module behavior needs to change.

**What it does change:**
- **Build estimate goes up.** 7 additional committed stories — most notably the void/reversal flow (US-5.4) and the stock movement ledger (US-6.5) — are not trivial CRUD; they involve state transitions and audit-trail logic. Budget real time for them rather than treating them as small additions.
- **No more "soft landing" if the timeline slips.** With a P1 tier, you had an informal escape hatch (ship P0, slip P1 to a fast-follow). With everything at P0, there's no longer a pre-agreed fallback if development runs long. Worth deciding now — informally, just between you and whoever's building this — what *would* slip if you had to cut scope under time pressure, even if you don't formally document it as P1 again.
- **Two open questions from Module Specs are now resolved** (see MODULE-SPECS.md → "Resolved Scope Decisions"): insufficient-stock handling defaults to block-with-override, and the walk-in-fee-credit calculation was dropped from Flow 7 in favor of the existing manual price-override field. A third decision was made in the same pass — CSV report export (US-7.9) is now committed MVP scope, while PDF export remains deferred. No open questions currently block wireframe or API contract work.
