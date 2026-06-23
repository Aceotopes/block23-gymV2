# User Stories — Gym Management System

**Legend:**
`P0` = Committed for MVP launch · `P2` = Post-MVP / Future
All stories are written from the perspective of the **Gym Owner**, the only user role in MVP.

> **Scope update (original):** All stories formerly tagged `P1` ("should have, can slip") have been promoted to `P0` and are now committed MVP scope, per stakeholder decision after document review. Each promoted story below is marked `(P0 · was P1)` for traceability.

> **Design Review #1 (2026-06-22):** Sales Module redesigned. Module 5 (formerly "Sales & Transactions") is now "Client Payments" — covering only membership fees and walk-in fees, both of which always require a client. Product sales are extracted into a new standalone Module 6 "POS & Product Sales," which operates without a required client link. Client purchase history has been removed from the Client Profile. See DECISIONS.md ADR-011 and ADR-012 for rationale.

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

**US-2.4 (P0)** — As the Gym Owner, I want to view a client's full profile — personal info, membership history, and attendance history — so that I have a complete picture of their relationship with the gym.
*(Product purchase history is intentionally excluded — POS sales are not linked to clients. See DECISIONS.md ADR-011.)*

**US-2.5 (P0)** — As the Gym Owner, I want a client to exist in the system without ever having a membership (pure walk-in), so that I can track casual visitors too.

**US-2.6 (P0 · was P1)** — As the Gym Owner, I want to mark a client as inactive/archived (soft delete) instead of permanently deleting them, so that historical attendance and payment records remain intact.

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
  - If renewing **before** expiry, the new period **extends from the current end date** (not from today) — confirmed business rule.
  - If renewing **after** expiry, the new period starts from the renewal date.
  - The renewal creates a new Membership record linked to the previous one (`renewed_from_membership_id`), preserving full history.

**US-3.3 (P0)** — As the Gym Owner, I want to create custom membership plans with non-standard durations (e.g., 45 days), so that I can offer flexible deals.

**US-3.4 (P0)** — As the Gym Owner, I want to view a client's full membership history, so that I can see all past plans, prices paid, and renewal patterns.

**US-3.5 (P0)** — As the Gym Owner, I want expired memberships to remain visible in the system and to still allow the client to enter as a walk-in, so that no business history is lost and expired members aren't blocked from the gym.

**US-3.6 (P0 · was P1)** — As the Gym Owner, I want to see which memberships are expiring within my configured warning period, so that I can proactively reach out for renewals.

### Future

**US-3.7 (P2)** — As the Gym Owner, I want to pause/freeze a membership for a defined period (e.g., medical leave), so that the client doesn't lose paid time. *(Explicitly out of scope per BRD.)*

**US-3.8 (P2)** — As the Gym Owner, I want to transfer a membership from one client to another, so that I can accommodate gift transfers.

---

## 4. Attendance

### MVP

**US-4.1 (P0)** — As the Gym Owner, I want to record a member's attendance by searching their name and logging a check-in, so that I replace the paper sign-in sheet.
- Acceptance Criteria:
  - System records client, date, time-in, and visit type (MEMBER or WALK_IN).
  - If the client has an active membership at the moment of check-in, the visit is auto-tagged MEMBER and linked to that membership record (snapshot link).
  - If the client has no active membership, the visit defaults to WALK_IN and prompts for the walk-in fee.

**US-4.2 (P0)** — As the Gym Owner, I want to record a walk-in visit (with or without an existing client profile), so that I can charge and log one-time visitors.
- Acceptance Criteria: Required field is full name only; system creates a lightweight client record if one doesn't already exist.

**US-4.3 (P0)** — As the Gym Owner, I want to view and filter attendance history by date range and visit type, so that I can answer questions like "who came in last Tuesday."

**US-4.4 (P0)** — As the Gym Owner, I want attendance history to remain available even after a client's membership expires or is deleted (soft-deleted), so that historical reporting stays accurate.

**US-4.5 (P0 · was P1)** — As the Gym Owner, I want to allow a client to be checked in more than once on the same day, so that I don't accidentally block a legitimate second visit (e.g., morning + evening session). The dashboard reports unique-visitor counts separately from total check-ins.

### Future

**US-4.6 (P2)** — As the Gym Owner, I want to record a check-out time in addition to check-in, so that I can later analyze session duration and gym occupancy by hour.

**US-4.7 (P2)** — As the Gym Owner, I want to use a QR code or RFID card for check-in instead of manual name search. *(Out of scope per BRD.)*

---

## 5. Client Payments

**Scope:** All money collected directly from identified clients — membership fees and walk-in fees. Both always require a client. Product sales are handled entirely by the POS module (Module 6) and are not part of this module.

### MVP

**US-5.1 (P0)** — As the Gym Owner, I want the payment method (Cash, GCash, Card, Other) recorded on every client payment, so that I can reconcile collections by method.

**US-5.2 (P0)** — As the Gym Owner, I want to view a chronological history of all client payments (membership fees and walk-in fees), so I have an auditable record of what each client paid and when.

**US-5.3 (P0)** — As the Gym Owner, I want to void a client payment with a required reason note, so I can correct data-entry mistakes without deleting the financial record.
- Acceptance Criteria:
  - Voided transactions remain visible with a VOID status badge and reason note — they are never deleted.
  - Voided transactions are excluded from all revenue totals and reports.
  - Voiding a payment record does not automatically cancel the associated membership — financial correction and membership management are separate actions.

### Future

**US-5.4 (P2)** — As the Gym Owner, I want to issue a partial refund on a client payment, so I can handle disputes formally.

**US-5.5 (P2)** — As the Gym Owner, I want to print or email a receipt for a client payment, so clients have proof of payment.

---

## 6. POS & Product Sales

**Scope:** Lightweight point-of-sale for product transactions. Product sales do not require a client — the POS screen operates independently of client management. This module also covers all product catalog management.

### MVP

**Product Management**

**US-6.1 (P0)** — As the Gym Owner, I want to create a product with a name, category, image, selling price, cost price, product type (STANDARD_PRODUCT or SERVING_BASED_PRODUCT), low-stock threshold, and active status, so that it appears in my POS catalog.

**US-6.2 (P0)** — As the Gym Owner, I want to edit any product field at any time, so I can update pricing, images, categories, or thresholds without restrictions.

**US-6.3 (P0)** — As the Gym Owner, I want to archive a product so it no longer appears in the POS, while keeping its full sales and inventory history intact.

**US-6.4 (P0)** — As the Gym Owner, I want to configure serving-based products (e.g., protein powder) with a servings-per-container count and a price-per-serving, so the system tracks remaining scoops rather than container count.
- Acceptance Criteria:
  - `selling_price` represents price per serving (e.g., ₱50 per scoop).
  - `current_stock` represents remaining servings (e.g., 42 of 70 servings).
  - Recording a restock of N containers adds N × `servings_per_container` to `current_stock`.
  - Example: Gold Standard Whey — 70 servings per container, ₱50 per scoop.

**US-6.5 (P0)** — As the Gym Owner, I want to organize products into categories (e.g., Beverages, Supplements), so I can browse by category in the POS and see revenue broken down by category in reports.

**POS Sales**

**US-6.6 (P0)** — As the Gym Owner, I want a product grid on the POS screen showing all active products with their image, name, and price, so I can quickly tap a product to add it to the cart.

**US-6.7 (P0)** — As the Gym Owner, I want to search for a product by name from the POS screen, so I can find it quickly without scrolling the entire grid.

**US-6.8 (P0)** — As the Gym Owner, I want to adjust the quantity of any item in the cart before checkout, so I can handle multi-item orders.

**US-6.9 (P0)** — As the Gym Owner, I want to complete a POS sale by selecting a payment method (Cash, GCash, Card, Other), so every product transaction has a payment record.
- Acceptance Criteria: A client is not required to complete a POS sale.

**US-6.10 (P0)** — As the Gym Owner, I want to void a POS sale with a required reason note, so I can correct data-entry mistakes without deleting the audit trail.

### Future

**US-6.11 (P2)** — As the Gym Owner, I want to apply discount codes or promotional pricing rules automatically, so I don't have to manually override prices for sales.

**US-6.12 (P2)** — As the Gym Owner, I want to print or email a receipt for a POS sale, so customers have proof of purchase.

---

## 7. Inventory

**Scope:** Track and audit all stock movements — restocks, POS sale deductions, and manual corrections. Includes remaining servings tracking for supplement products.

### MVP

**US-7.1 (P0)** — As the Gym Owner, I want to record inventory restocks for any product, so that stock counts reflect what is actually on the shelf.

**US-7.2 (P0 · was P1/US-6.5)** — As the Gym Owner, I want every stock change — sale, restock, or manual adjustment — logged as a discrete inventory movement record, so I can audit exactly what happened to my stock over time.
- Acceptance Criteria: Manual adjustments require a reason note.

**US-7.3 (P0)** — As the Gym Owner, I want a low-stock alert on the dashboard when a product falls below its configured threshold, so I know when to reorder.

**US-7.4 (P0)** — As the Gym Owner, I want to see remaining servings for serving-based products (e.g., "Whey Protein: 42 of 70 servings remaining"), so I know when to open a new container.

### Future

**US-7.5 (P2)** — As the Gym Owner, I want to record the supplier and purchase cost for each restock event, so I can track product-level spending over time. *(Cost price is stored on the Product record at MVP for margin-reporting foundation; per-restock cost tracking is a separate, deferred feature.)*

**US-7.6 (P2)** — As the Gym Owner, I want automated reorder notifications to a supplier, so restocking is semi-automated.

---

## 8. Dashboard & Reports

### MVP

**US-8.1 (P0)** — As the Gym Owner, I want a dashboard showing today's attendance, active/expired/expiring-soon membership counts, today's and month-to-date revenue breakdown, low-stock alerts, and remaining servings for protein products — so I get a complete daily operational snapshot in one screen.
- Acceptance Criteria: Loads within 3 seconds (per NFR).

**US-8.2 (P0)** — As the Gym Owner, I want revenue reports (daily/weekly/monthly) broken down by source (membership, walk-in, product), so I understand where my income comes from.

**US-8.3 (P0)** — As the Gym Owner, I want revenue broken down by payment method (Cash, GCash, Card, Other) over any reporting period, so I can reconcile cash vs. digital collections.

**US-8.4 (P0)** — As the Gym Owner, I want revenue broken down by product category (Beverages, Supplements, etc.) over any reporting period, so I know which category drives product revenue.

**US-8.5 (P0)** — As the Gym Owner, I want attendance reports (daily/weekly/monthly).

**US-8.6 (P0)** — As the Gym Owner, I want membership reports listing active, expired, and expiring-soon members, so I can manage renewals proactively.

**US-8.7 (P0)** — As the Gym Owner, I want a best-selling products report (by units/servings sold and by revenue), so I know what to stock more of.

**US-8.8 (P0)** — As the Gym Owner, I want a frequent walk-in clients report (high visit count, low membership conversion), so I can identify upsell opportunities.

**US-8.9 (P0)** — As the Gym Owner, I want an inventory usage report showing stock movements per product over a date range (sold, restocked, adjusted), so I can spot unusual discrepancies.

**US-8.10 (P0)** — As the Gym Owner, I want to export any report to CSV, so I can keep offline copies or open them in Excel for further analysis.

### Future

**US-8.11 (P2)** — As the Gym Owner, I want to export reports as formatted PDF documents.

**US-8.12 (P2)** — As the Gym Owner, I want profit-margin reporting (revenue minus cost price per product), so I understand true profitability, not just revenue. *(Foundation laid at MVP by storing `cost_price` on the Product record.)*

---

## Summary: MVP Story Count by Module

| Module | P0 (Committed MVP) | P2 (Future) |
|---|---|---|
| Auth & Settings | 4 | 2 |
| Clients | 6 | 2 |
| Membership | 6 | 2 |
| Attendance | 5 | 2 |
| Client Payments | 3 | 2 |
| POS & Product Sales | 10 | 2 |
| Inventory | 4 | 2 |
| Dashboard & Reports | 10 | 2 |
| **Total** | **48** | **16** |

---

## Impact of Original P1 → P0 Promotion

*(Retained for traceability — this section documents the earlier scope decision prior to Design Review #1.)*

You asked to commit all former-P1 stories to MVP. Here's what that actually changed, and what it didn't:

**What it didn't change:** the Domain Model and Module Specs documents. Both already assumed this full scope — soft-delete on clients, the `InventoryTransaction` ledger, void transactions, the snapshot-linked attendance, and the walk-in conversion report were already specified as core MVP behavior in those two documents, not deferred features. Nothing in the schema or module behavior needed to change.

**What it did change:**
- **Build estimate goes up.** 7 additional committed stories — most notably the void/reversal flow and the stock movement ledger — are not trivial CRUD; they involve state transitions and audit-trail logic.
- **No more "soft landing" if the timeline slips.** With everything at P0, there's no longer a pre-agreed fallback if development runs long.
- **Three open questions from Module Specs were resolved:** insufficient-stock handling defaults to block-with-override; the walk-in-fee-credit calculation was dropped; CSV report export is now committed MVP scope.
