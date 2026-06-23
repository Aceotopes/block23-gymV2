# User Stories — Gym Management System

**Legend:**
`P0` = Committed for MVP launch · `P2` = Post-MVP / Future
All stories are written from the perspective of the **Gym Owner**, the only user role in MVP.

> **Scope update (original):** All stories formerly tagged `P1` ("should have, can slip") have been promoted to `P0` and are now committed MVP scope, per stakeholder decision after document review. Each promoted story below is marked `(P0 · was P1)` for traceability.

> **Design Review #1 (2026-06-22):** Sales Module redesigned. Module 5 (formerly "Sales & Transactions") is now "Client Payments" — covering only membership fees and walk-in fees, both of which always require a client. Product sales are extracted into a new standalone Module 6 "POS & Product Sales," which operates without a required client link. Client purchase history has been removed from the Client Profile. See DECISIONS.md ADR-011 and ADR-012 for rationale.

> **Design Review #2 (2026-06-23):** Clients Module wireframe reviewed against all planning documents. Two new P0 stories added to Clients (US-2.9, US-2.10); one new P0 story added to Membership (US-3.9); one new P0 story added to Auth & Settings (US-1.7 — walk-in inactivity threshold). Acceptance criteria updated for US-2.3, US-2.4, US-2.6, US-3.1, US-3.2, US-3.3. Client type (MEMBER/WALK_IN) and walk-in inactivity status introduced. Total MVP story count: 48 → 52. See DECISIONS.md ADR-014, ADR-015, ADR-016, ADR-017.

> **Design Review #3 (2026-06-24):** Attendance Module deep review. Six new P0 stories: US-1.8 (member inactivity threshold), US-2.11 (at-risk member filter + dashboard panel), US-4.8 (Check-In Station screen), US-4.9 (today's check-ins view), US-8.13 (member engagement report), US-8.14 (at-risk members report). Acceptance criteria updated for US-4.1, US-4.2, US-4.3, US-8.8. At-risk member signal introduced for active MEMBER clients not attending (ADR-019). Expired MEMBER renewal prompt at check-in added (ADR-018). Walk-in conversion derivation defined (ADR-020). `created_by` and `correction_note` added to Attendance entity (ADR-021). Dedicated Check-In Station screen introduced (ADR-022). Total MVP story count: 52 → 58. See DECISIONS.md ADR-018, ADR-019, ADR-020, ADR-021, ADR-022.

> **Design Review #4 (2026-06-24):** Attendance module restructured as a single top-level navbar module with three internal views: Check-In (default), Attendance History, and Attendance Analytics (ADR-023). ADR-022 amended to remove "top-level navigation" navigation claim. US-4.8 navigation placement AC updated. US-4.3 updated with explicit date filter presets. US-4.10 (NEW P0): Attendance Analytics view — KPI cards, trend charts, member/walk-in insights, operational signals, and alerts. Total MVP story count: 58 → 59. See DECISIONS.md ADR-023.

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

**US-1.7 (P0)** — As the Gym Owner, I want to set a walk-in inactivity threshold (e.g., 7 days), so that walk-in clients who haven't visited within that period are flagged as Inactive.
- Acceptance Criteria:
  - Setting is configurable in Settings → System Preferences with a numeric "Walk-in inactivity threshold (days)" field. Default: 7.
  - When the threshold is updated, all walk-in client statuses recalculate immediately on the next query — no manual backfill required (computed at runtime from Attendance records).
  - A walk-in client with no attendance records at all is treated as Inactive regardless of threshold value.
  - Setting zero or a negative value is blocked with a validation error.

**US-1.8 (P0)** — As the Gym Owner, I want to set a member attendance inactivity threshold (e.g., 14 days since last visit), so that active paying members who have stopped coming in are flagged as "at risk" before their membership lapses and they fail to renew.
- Acceptance Criteria:
  - Setting is configurable in Settings → System Preferences with a numeric "At-risk member threshold (days since last visit)" field. Default: 14.
  - An at-risk member is defined as: `client_type = MEMBER`, active membership (`end_date >= today`), AND last `Attendance.visit_date` exceeds the threshold — OR an active MEMBER client with no Attendance records at all.
  - At-risk is a derived operational signal, NOT a change to `Client.status` — an at-risk member's status remains Active or Expiring Soon as determined by their membership dates. The at-risk signal is surfaced in filters and alerts only. (ADR-019)
  - When the threshold is updated, the at-risk signal recalculates immediately on the next query — no backfill required.
  - Setting zero or a negative value is blocked with a validation error.

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
- Acceptance Criteria:
  - Search returns results within 2 seconds (per NFR), supports partial name match.
  - Search can be combined with status filters — results respect both the name query and the active filter simultaneously.

**US-2.4 (P0)** — As the Gym Owner, I want to view a client's full profile — personal info, membership history, and attendance history — so that I have a complete picture of their relationship with the gym.
*(Product purchase history is intentionally excluded — POS sales are not linked to clients. See DECISIONS.md ADR-011.)*
- Acceptance Criteria:
  - Profile header displays a `MEMBER` or `WALK_IN` type badge alongside the client's status badge (e.g., "MEMBER · Active", "WALK_IN · Inactive").
  - Profile header displays a quick-stats strip: total all-time visits, visits this month, days until membership expiry (MEMBER clients), and walk-in visit count + days since last visit (WALK_IN clients).
  - Membership history tab shows a visual indicator (e.g., "VOID" badge) when the associated payment transaction was voided. The membership record itself remains unchanged; only the financial indicator is flagged.
  - Attendance history tab includes date range and visit type (MEMBER / WALK_IN) filters.
  - A future-dated membership (start_date > today) displays an "Upcoming" status badge, not "Active." The client's type badge still shows `MEMBER` from the moment the membership record is created.

**US-2.5 (P0)** — As the Gym Owner, I want a client to exist in the system without ever having a membership (pure walk-in), so that I can track casual visitors too.

**US-2.6 (P0 · was P1)** — As the Gym Owner, I want to mark a client as inactive/archived (soft delete) instead of permanently deleting them, so that historical attendance and payment records remain intact.
- Acceptance Criteria:
  - Archive action is accessible from the Client Profile (in an overflow "⋯" menu alongside Edit, not a primary button).
  - Archiving requires a confirmation step: "Archive [Name]? They will be hidden from the active client list. All history is preserved."
  - Archived clients are hidden from the default Client List view.
  - A "Show archived" toggle on the Client List reveals archived clients in a visually distinct state (greyed out).
  - Archived clients retain all attendance, membership, and payment history — fully intact and queryable.
  - A soft-deleted client can be reactivated (un-archived) from the same overflow menu.

**US-2.9 (P0)** — As the Gym Owner, I want to filter the client list by type and status, so that I can quickly find clients who need renewal outreach, conversion follow-up, or re-engagement without scrolling through all records.
- Acceptance Criteria:
  - Filter chips are always visible on the Client List: `All` · `Active` · `Expiring soon` · `Expired` · `Walk-in only` · `Inactive`.
  - `Active` — shows MEMBER clients with an active membership AND WALK_IN clients whose last visit is within the inactivity threshold.
  - `Expiring soon` — shows MEMBER clients within `Gym.expiration_warning_days` of membership end.
  - `Expired` — shows MEMBER clients with no current active membership.
  - `Walk-in only` — shows all WALK_IN type clients (both Active and Inactive walk-ins).
  - `Inactive` — shows WALK_IN clients whose last visit exceeds `Gym.walkin_inactivity_threshold_days`, or who have no attendance records.
  - Filters combine with name search: a filter chip and a name query are applied simultaneously.
  - "All" chip resets the filter to show all non-archived clients.
  - Filter state persists within the session (navigating to a profile and returning preserves the active filter).

**US-2.10 (P0)** — As the Gym Owner, I want to see walk-in visit frequency and conversion signals on a client's profile, so that I can identify and act on membership conversion opportunities in the moment.
- Acceptance Criteria:
  - For walk-in-only clients (no active or past membership), the profile header quick-stats strip prominently shows total walk-in visits with a conversion signal: "X visits — no membership."
  - The "Walk-in only" client list filter sorts results by visit count descending by default, surfacing the highest-frequency walk-ins first.
  - A "Frequent walk-ins" live feed panel on the Dashboard shows the top 5 walk-in clients (no active membership) sorted by visit count, with their last visit date. "View all →" links to the client list filtered by Walk-in only.

**US-2.11 (P0)** — As the Gym Owner, I want an "At risk" filter on the Client List and a dashboard panel showing at-risk members, so I can identify and contact paying members who have stopped attending before they lapse and fail to renew.
- Acceptance Criteria:
  - A new "At risk" filter chip is added to the Client List, updating the chip set to: `All` · `Active` · `At risk` · `Expiring soon` · `Expired` · `Walk-in only` · `Inactive`.
  - "At risk" shows MEMBER clients with an active membership (`end_date >= today`) whose last visit exceeds `Gym.member_inactivity_warning_days`, or who have an active membership and no attendance records.
  - "At risk" does not overlap with "Inactive" (WALK_IN clients only). A client can simultaneously match "At risk" and "Expiring soon" — both filter chips show them.
  - "At risk" results sort by days since last visit descending (longest absence first) by default.
  - An "At-risk members" live feed panel is added to the Dashboard: up to 5 clients with name, days since last visit, and membership expiry date. "View all →" links to the Client List filtered by "At risk."
  - The at-risk signal is NOT displayed on the individual Client Profile header — it is a list-level and alert-level signal only.

### Future

**US-2.7 (P2)** — As the Gym Owner, I want to merge two duplicate client profiles into one, so that I can clean up data entry mistakes without losing history.

**US-2.8 (P2)** — As the Gym Owner, I want to upload a photo or ID for each client, so that I can visually verify identity at check-in.

---

## 3. Membership Management

### MVP

**US-3.1 (P0)** — As the Gym Owner, I want to create a membership for a client by selecting a plan (1/2/3 months or custom duration) and price, so that I can register new paying members.
- Acceptance Criteria:
  - System blocks creating a new active membership if the client already has an active (non-expired) membership — one active membership per client at a time.
  - The blocking message reads: "[Client name] has an active membership until [end date]. Did you mean to Renew instead?" with a "Go to Renew" action that routes directly to the renewal flow.
  - Price defaults from the plan but can be overridden per transaction; the overridden price is what's recorded (price snapshot), not a live reference to the plan price.

**US-3.2 (P0)** — As the Gym Owner, I want to renew an expired or expiring membership, so that the client can continue using the gym.
- Acceptance Criteria:
  - If renewing **before** expiry, the new period **extends from the current end date** (not from today) — confirmed business rule.
  - If renewing **after** expiry, the new period starts from the renewal date.
  - The renewal creates a new Membership record linked to the previous one (`renewed_from_membership_id`), preserving full history.
  - The action button on the Client Profile is context-aware: displays "Add membership" for clients with no membership history; "Renew" for clients with an expired or expiring-soon membership; "Renew early" for clients with a currently active membership not near expiry.

**US-3.3 (P0)** — As the Gym Owner, I want to create custom membership plans with non-standard durations (e.g., 45 days), so that I can offer flexible deals.
- Acceptance Criteria:
  - When "Custom duration" is selected in the membership modal, a "Duration (days)" numeric input field appears inline.
  - The custom duration field is required before the form can be submitted.
  - Custom duration plans follow the same renewal date math as standard plans (ADR — renewal extends from end_date if active, from today if expired).

**US-3.4 (P0)** — As the Gym Owner, I want to view a client's full membership history, so that I can see all past plans, prices paid, and renewal patterns.

**US-3.5 (P0)** — As the Gym Owner, I want expired memberships to remain visible in the system and to still allow the client to enter as a walk-in, so that no business history is lost and expired members aren't blocked from the gym.

**US-3.6 (P0 · was P1)** — As the Gym Owner, I want to see which memberships are expiring within my configured warning period, so that I can proactively reach out for renewals.

**US-3.9 (P0)** — As the Gym Owner, I want to create, edit, and retire membership plans in Settings, so that the plan options in the Add/Renew modal always reflect my actual pricing structure.
- Acceptance Criteria:
  - A "Membership Plans" section in Settings lists all plans (name, duration, default price, active status).
  - I can create a new plan with: name, duration type (1 month / 2 months / 3 months / Custom days), default price, and active/inactive status.
  - I can edit any plan field at any time. Editing a plan's default price does not alter any past `price_paid` snapshots — only future transactions are affected (ADR-003).
  - I can retire (deactivate) a plan by setting it to inactive. Retired plans no longer appear in the Add/Renew membership modal. All existing memberships created under that plan are unaffected.
  - Retired plans remain visible in Settings (with an inactive badge) and can be reactivated.
  - The Add/Renew membership modal populates its plan selector from `MembershipPlan` where `is_active = true`, in order of creation.

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
  - In the Check-In Station context, search result cards show: name, type badge (MEMBER/WALK_IN), membership status, expiry date (MEMBER clients only), and a "checked in today" indicator if an Attendance record already exists for today.
  - When the owner selects a client with `client_type = MEMBER` and no active membership, the system presents a binary decision prompt: "Check in as walk-in (₱[fee])" or "Renew membership now →." Silent routing to the walk-in flow is not permitted. (ADR-018)
  - After a successful check-in where the client's active membership is within `Gym.expiration_warning_days` of expiry, a non-blocking dismissible notice is displayed: "[Name]'s membership expires in N days. [Renew now →]." The notice does not delay or interrupt the check-in.
  - When a client who already has an Attendance record for today is selected for check-in, the system prompts: "[Name] already checked in today at [time]. Check in again?" Confirm / Cancel. The second check-in is created only after explicit confirmation. (US-4.5 preserved.)

**US-4.2 (P0)** — As the Gym Owner, I want to record a walk-in visit (with or without an existing client profile), so that I can charge and log one-time visitors.
- Acceptance Criteria:
  - Required field is full name only; system creates a lightweight client record if one doesn't already exist.
  - The quick-create form for a new walk-in captures: full name (required) and contact number (optional). The form is a minimal inline modal, not a full registration screen.
  - Before the walk-in fee prompt, the system checks: does this client have a visit count ≥ `Gym.walkin_conversion_prompt_visits` and no Membership record? If yes, a dismissible conversion prompt is shown: "[Name] has visited N times without a membership. Register as a member now?" with routes to Add Membership (Flow 5) or "No, proceed with walk-in fee." The owner may dismiss without consequence.

**US-4.3 (P0)** — As the Gym Owner, I want to view and filter attendance history by date range and visit type, so that I can answer questions like "who came in last Tuesday."
- Acceptance Criteria:
  - Attendance History is a dedicated view within the Attendance module (the second tab, after Check-In). It is distinct from the per-client Attendance History tab on the Client Profile. It shows all attendance records across all clients, filterable by date range and visit type.
  - Date filter presets are always available: **Today** (default on open) · Yesterday · Last 7 Days · Last 30 Days · Custom Date Range. The selected filter persists within the session.
  - Each row shows: client name, visit type, time in, and visit date.

**US-4.4 (P0)** — As the Gym Owner, I want attendance history to remain available even after a client's membership expires or is deleted (soft-deleted), so that historical reporting stays accurate.

**US-4.5 (P0 · was P1)** — As the Gym Owner, I want to allow a client to be checked in more than once on the same day, so that I don't accidentally block a legitimate second visit (e.g., morning + evening session). The dashboard reports unique-visitor counts separately from total check-ins.

**US-4.8 (P0)** — As the Gym Owner, I want a dedicated Check-In Station screen with a persistent search field and a live check-in list, so that recording attendance is the fastest and most direct action in the system.
- Acceptance Criteria:
  - The Check-In screen is the default view of the Attendance module — the first thing the owner sees when opening Attendance. It is not a separate top-level navbar entry. (ADR-023)
  - The name search field is auto-focused on page load — no additional click required to start typing.
  - Search result cards show: client name, type badge (MEMBER/WALK_IN), membership status, expiry date (MEMBER clients only), and a "checked in today" indicator if applicable.
  - Selecting a result immediately initiates the appropriate check-in branch: active member → single "Check In" action; MEMBER-type with expired membership → renewal decision prompt (ADR-018); walk-in or no membership → conversion prompt check, then fee collection flow.
  - A "Today's Check-Ins" running list is visible below the search field: all clients checked in today, name, visit type, time in, reverse-chronological order. Updates immediately after each successful check-in.
  - Today's total check-in count and unique visitor count are displayed at the top of the running list.
  - After a successful check-in, the screen returns to search-focused state immediately.

**US-4.9 (P0)** — As the Gym Owner, I want to view today's attendance as a running list I can reference throughout the day, so I know who has checked in without searching for each client individually.
- Acceptance Criteria:
  - Today's check-in list is also accessible as a standalone view within the Attendance section (not only on the Check-In Station screen).
  - The list shows: client name, visit type (MEMBER / WALK_IN), time of check-in, in reverse-chronological order.
  - Clients who checked in more than once today are shown as separate rows with a "2nd visit" label.
  - Total check-ins and unique visitors for the day are shown at the top.

**US-4.10 (P0)** — As the Gym Owner, I want an Attendance Analytics view within the Attendance module, so I can monitor gym engagement, identify trends, and surface at-risk patterns without navigating to a separate Reports section.
- Acceptance Criteria:
  - Attendance Analytics is the third view within the Attendance module, alongside Check-In and Attendance History. (ADR-023)
  - **KPI Cards (always visible, fixed periods):** Today's Check-Ins; This Week's Check-Ins; This Month's Check-Ins; Member vs. Walk-In Ratio (percentage split for the current month, e.g., "73% Member · 27% Walk-In").
  - **Charts (all governed by a global period selector — Last 7 Days / Last 30 Days / Last 3 Months / Custom Range):**
    - Daily Attendance Trend (line chart): total check-ins and unique visitors per day over the selected period.
    - Attendance by Day of Week (bar chart): average check-ins per weekday over the selected period — identifies peak days.
    - Attendance by Hour (bar chart): check-ins bucketed by hour of day over the selected period — identifies peak hours.
  - **Member Insights:** At-risk Members count (live, links to Client List "At risk" filter); Average Visits Per Member (active MEMBER clients, selected period); Member Utilization Rate (unique MEMBER clients who visited in the period ÷ total active MEMBER clients × 100%).
  - **Walk-In Insights:** Frequent Walk-Ins count (walk-in clients with ≥ `Gym.walkin_conversion_prompt_visits` visits and no Membership record, live); Walk-In Conversion Candidates count (links to Client List "Walk-in only" filter sorted by visit count descending); Walk-In to Member Conversion Metrics (converted client count and conversion rate for the selected period, using the derived definition from ADR-020).
  - **Operational Insights:** Peak Hours (top 3 busiest hours by check-in volume over the selected period); Peak Days (top 3 busiest days of the week over the selected period); New vs. Returning Visitors (clients whose first-ever Attendance record falls within the selected period = New; all others = Returning).
  - **Alerts:** Active members inactive beyond `Gym.member_inactivity_warning_days` (live count + "View list" link to Client List "At risk" filter); Walk-in clients exceeding `Gym.walkin_conversion_prompt_visits` with no membership (live count + "View list" link); Attendance decline warning — if total check-ins in the selected period are ≥ 20% below the equivalent prior period, a warning banner is displayed.
  - All panels and counts use the same derived definitions as the Client List filters and Dashboard panels — signals are consistent across the system.
  - Analytics data includes historical attendance records from soft-deleted clients (for trend accuracy) but excludes them from active-member counts.
  - Attendance Analytics contains no revenue data, membership financial history, or inventory data — attendance-domain scope only.
  - No CSV export from Attendance Analytics — detailed filterable and exportable records belong in the Reports module (US-8.5, US-8.13, US-8.14).

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
*(Conversion detection is derived: a client is classified as a converted walk-in when they have ≥ 1 Attendance record with `visit_type = WALK_IN` dated before their first Membership record's `created_at`. No conversion event entity is stored. ADR-020)*

**US-8.9 (P0)** — As the Gym Owner, I want an inventory usage report showing stock movements per product over a date range (sold, restocked, adjusted), so I can spot unusual discrepancies.

**US-8.10 (P0)** — As the Gym Owner, I want to export any report to CSV, so I can keep offline copies or open them in Excel for further analysis.

**US-8.13 (P0)** — As the Gym Owner, I want a member engagement report showing how frequently each active member visits, so I can identify low-engagement members at risk of not renewing.
- Acceptance Criteria:
  - Report shows each active MEMBER client with: total all-time visits, visits this month, visits last month, days since last visit.
  - Default sort: days since last visit descending (least engaged at top).
  - Filterable by date range for the "visits in period" columns.
  - Exportable to CSV.

**US-8.14 (P0)** — As the Gym Owner, I want an at-risk members report listing active members who haven't visited in N days, so I can take targeted outreach action before their memberships expire without renewal.
- Acceptance Criteria:
  - Report lists all active MEMBER clients (`end_date >= today`) whose last attendance date exceeds `Gym.member_inactivity_warning_days`, sorted by days since last visit descending.
  - For each client: name, membership expiry date, last visit date, days since last visit, total all-time visits.
  - Exportable to CSV.

### Future

**US-8.11 (P2)** — As the Gym Owner, I want to export reports as formatted PDF documents.

**US-8.12 (P2)** — As the Gym Owner, I want profit-margin reporting (revenue minus cost price per product), so I understand true profitability, not just revenue. *(Foundation laid at MVP by storing `cost_price` on the Product record.)*

---

## Summary: MVP Story Count by Module

| Module | P0 (Committed MVP) | P2 (Future) |
|---|---|---|
| Auth & Settings | 6 | 2 |
| Clients | 9 | 2 |
| Membership | 7 | 2 |
| Attendance | 8 | 2 |
| Client Payments | 3 | 2 |
| POS & Product Sales | 10 | 2 |
| Inventory | 4 | 2 |
| Dashboard & Reports | 12 | 2 |
| **Total** | **59** | **16** |

---

## Impact of Original P1 → P0 Promotion

*(Retained for traceability — this section documents the earlier scope decision prior to Design Review #1.)*

You asked to commit all former-P1 stories to MVP. Here's what that actually changed, and what it didn't:

**What it didn't change:** the Domain Model and Module Specs documents. Both already assumed this full scope — soft-delete on clients, the `InventoryTransaction` ledger, void transactions, the snapshot-linked attendance, and the walk-in conversion report were already specified as core MVP behavior in those two documents, not deferred features. Nothing in the schema or module behavior needed to change.

**What it did change:**
- **Build estimate goes up.** 7 additional committed stories — most notably the void/reversal flow and the stock movement ledger — are not trivial CRUD; they involve state transitions and audit-trail logic.
- **No more "soft landing" if the timeline slips.** With everything at P0, there's no longer a pre-agreed fallback if development runs long.
- **Three open questions from Module Specs were resolved:** insufficient-stock handling defaults to block-with-override; the walk-in-fee-credit calculation was dropped; CSV report export is now committed MVP scope.
