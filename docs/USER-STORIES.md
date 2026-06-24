# User Stories — Gym Management System

**Legend:**
`P0` = Committed for MVP launch · `P2` = Post-MVP / Future
All stories are written from the perspective of the **Gym Owner**, the only user role in MVP.

> **Scope update (original):** All stories formerly tagged `P1` ("should have, can slip") have been promoted to `P0` and are now committed MVP scope, per stakeholder decision after document review. Each promoted story below is marked `(P0 · was P1)` for traceability.

> **Design Review #1 (2026-06-22):** Sales Module redesigned. Module 5 (formerly "Sales & Transactions") is now "Client Payments" — covering only membership fees and walk-in fees, both of which always require a client. Product sales are extracted into a new standalone Module 6 "POS & Product Sales," which operates without a required client link. Client purchase history has been removed from the Client Profile. See DECISIONS.md ADR-011 and ADR-012 for rationale.

> **Design Review #2 (2026-06-23):** Clients Module wireframe reviewed against all planning documents. Two new P0 stories added to Clients (US-2.9, US-2.10); one new P0 story added to Membership (US-3.9); one new P0 story added to Auth & Settings (US-1.7 — walk-in inactivity threshold). Acceptance criteria updated for US-2.3, US-2.4, US-2.6, US-3.1, US-3.2, US-3.3. Client type (MEMBER/WALK_IN) and walk-in inactivity status introduced. Total MVP story count: 48 → 52. See DECISIONS.md ADR-014, ADR-015, ADR-016, ADR-017.

> **Design Review #3 (2026-06-24):** Attendance Module deep review. Six new P0 stories: US-1.8 (member inactivity threshold), US-2.11 (at-risk member filter + dashboard panel), US-4.8 (Check-In Station screen), US-4.9 (today's check-ins view), US-8.13 (member engagement report), US-8.14 (at-risk members report). Acceptance criteria updated for US-4.1, US-4.2, US-4.3, US-8.8. At-risk member signal introduced for active MEMBER clients not attending (ADR-019). Expired MEMBER renewal prompt at check-in added (ADR-018). Walk-in conversion derivation defined (ADR-020). `created_by` and `correction_note` added to Attendance entity (ADR-021). Dedicated Check-In Station screen introduced (ADR-022). Total MVP story count: 52 → 58. See DECISIONS.md ADR-018, ADR-019, ADR-020, ADR-021, ADR-022.

> **Design Review #4 (2026-06-24):** Attendance module restructured as a single top-level navbar module with three internal views: Check-In (default), Attendance History, and Attendance Analytics (ADR-023). ADR-022 amended to remove "top-level navigation" navigation claim. US-4.8 navigation placement AC updated. US-4.3 updated with explicit date filter presets. US-4.10 (NEW P0): Attendance Analytics view — KPI cards, trend charts, member/walk-in insights, operational signals, and alerts. Total MVP story count: 58 → 59. See DECISIONS.md ADR-023.

> **Design Review #5 (2026-06-24):** Payments, POS, and Inventory modules comprehensively reviewed for operational and business value. New P0 stories: US-5.4 (end-of-day collections summary); US-6.13–6.16 (POS cash change calculator, whole-container sale, gross margin display, category tabs); US-7.5 rescoped from P2 to P0 (restock cost capture); US-7.6 (days-until-stockout); US-7.7 (inventory valuation); US-7.8 (shrinkage indicator); US-8.12 promoted from P2 to P0 (gross profit report, enabled by cost_price_snapshot). US-8.9 AC updated with shrinkage. US-8.1 AC updated with new Dashboard KPIs. Former P2 US-5.4 → US-5.6; US-5.5 → US-5.7; US-7.6 → US-7.9. Total MVP story count: 59 → 69. See DECISIONS.md ADR-026, ADR-027, ADR-028.

> **Design Review #6 (2026-06-24):** Reports Module comprehensive review and expansion. Eight new P0 reports: US-8.15 (void analysis), US-8.16 (new vs. renewals), US-8.17 (membership plan performance), US-8.18 (restock cost), US-8.19 (membership net change), US-8.20 (period-over-period revenue comparison), US-8.21 (slow-moving / dead stock), US-8.22 (converted walk-ins). US-8.2 updated — annual and custom-range period options added. US-8.5 updated — full acceptance criteria specified. US-8.7 updated — slow-moving sort option added. Total MVP story count: 69 → 77. See DECISIONS.md ADR-029.

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

**US-5.3 (P0)** — As the Gym Owner, I want to void a client payment with a required reason category and optional detail note, so I can correct data-entry mistakes without deleting the financial record.
- Acceptance Criteria:
  - Voiding a transaction requires selecting a void reason category: `Duplicate Entry / Wrong Amount / Wrong Product / Client Cancelled / System Error / Other`.
  - When `Other` is selected, a detail note is required before the void can be confirmed.
  - For all other categories, the detail note is optional.
  - Voided transactions remain visible with a VOID status badge, the reason category, and the detail note — they are never deleted.
  - Voided transactions are excluded from all revenue totals and reports.
  - Voiding a payment record does not automatically cancel the associated membership — financial correction and membership management are separate actions.

**US-5.4 (P0)** — As the Gym Owner, I want an end-of-day collections summary showing today's total revenue by payment method across all transaction types, so I can reconcile my cash drawer and digital payments without navigating to the Reports module.
- Acceptance Criteria:
  - A Collections Summary view is accessible within the Client Payments module.
  - The summary displays today's totals by payment method: Cash / GCash / Card / Other.
  - Totals span both `CLIENT_TRANSACTION` and `POS_SALE` records — all money collected across the whole day in one view.
  - Each row shows: payment method, transaction count, and total amount collected.
  - A grand total row (all payment methods combined) is displayed prominently.
  - Voided transactions are excluded from all totals.
  - The summary defaults to today; a date selector allows viewing any prior day.

### Future

**US-5.6 (P2)** — As the Gym Owner, I want to issue a partial refund on a client payment, so I can handle disputes formally.

**US-5.7 (P2)** — As the Gym Owner, I want to print or email a receipt for a client payment, so clients have proof of payment.

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

**US-6.10 (P0)** — As the Gym Owner, I want to void a POS sale with a required reason category and optional detail note, so I can correct data-entry mistakes without deleting the audit trail.

**US-6.13 (P0)** — As the Gym Owner, I want a cash change calculator in the POS checkout so I can tell clients how much change they are owed without mental arithmetic.
- Acceptance Criteria:
  - When `Cash` is selected as payment method at checkout, a "Cash received" numeric input field is displayed.
  - The system immediately displays "Change: ₱X" where X = cash received − cart total.
  - The "Cash received" field must be ≥ the cart total before the sale can be confirmed; entering a lower value shows a validation error.
  - If the payment method is not Cash, the cash received field is hidden.

**US-6.14 (P0)** — As the Gym Owner, I want to sell a whole container of a serving-based product as a single cart line item, so I do not have to enter the serving count as the quantity.
- Acceptance Criteria:
  - `SERVING_BASED_PRODUCT` items on the POS screen show a mode toggle: "Per Serving / Per Container." Default is Per Serving (existing behavior unchanged).
  - Per Container mode is only available when `container_selling_price` is set on the product.
  - In Per Container mode: quantity represents whole containers; the unit price is `container_selling_price`; stock deduction on sale completion is `quantity × servings_per_container`.
  - `TransactionLineItem.description` in Per Container mode reads: "[Product name] — N container(s) ([N × servings_per_container] servings)."
  - The same Force Sale override applies when container stock deduction would take `current_stock` below zero.

**US-6.15 (P0)** — As the Gym Owner, I want to see the gross margin in ₱ and % for each product on its create/edit screen, so I understand which products are most profitable without running a separate report.
- Acceptance Criteria:
  - The product create/edit form displays a read-only computed field: "Gross Margin: ₱[selling_price − cost_price] ([margin]%)" when both `selling_price` and `cost_price` are set.
  - The margin field updates in real time as `selling_price` or `cost_price` is edited in the form.
  - If `cost_price` is null or not yet entered, the field shows "Margin: — (no cost price set)."
  - Margin is informational only — it does not create a new stored field on Product.

**US-6.16 (P0)** — As the Gym Owner, I want category filter tabs on the POS product grid so I can navigate to a product quickly without scrolling the entire catalog.
- Acceptance Criteria:
  - Category tabs are displayed above the product grid: one tab per `ProductCategory` that has at least one active product, plus an "All" tab (default on load).
  - Selecting a category tab filters the grid to show only `is_active = true` products in that category.
  - The category tab filter and the product name search work simultaneously — both constraints are applied together.
  - A category with no active products is hidden from the tab bar.

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

**US-7.5 (P0)** — As the Gym Owner, I want to record the total amount I paid when restocking a product, so I have a basic record of inventory spending without needing full supplier management.
- Acceptance Criteria:
  - The Restock form includes an optional "Total cost paid" field (decimal).
  - When entered, this value is stored as `total_restock_cost` on the `InventoryTransaction` record for that PURCHASE event.
  - The field is not required — restocks without cost data are fully valid.
  - The Inventory Movement History displays the total cost paid alongside each PURCHASE entry when it is present.

**US-7.6 (P0)** — As the Gym Owner, I want to see an estimated days-until-stockout per product based on recent sales velocity, so I know when to reorder before running out.
- Acceptance Criteria:
  - The Current Stock view displays "~N days remaining" per product, calculated as: `current_stock ÷ average daily units sold over the last 30 days`.
  - Products with no sales in the last 30 days show "No recent sales data."
  - The estimate uses the same `InventoryTransaction` ledger as the Inventory Usage Report.
  - The estimate is derived at query time — it is not stored.

**US-7.7 (P0)** — As the Gym Owner, I want to see the total cost value of my current inventory on the stock view and dashboard, so I know how much cash I have invested in products on the shelf.
- Acceptance Criteria:
  - The Current Stock view displays a total inventory value footer: `SUM(current_stock × cost_price)` across all active products where `cost_price` is not null.
  - Products without a `cost_price` set are excluded from the total, with a note: "N product(s) excluded — no cost price set."
  - Inventory value is also displayed as a KPI card on the Dashboard.
  - The value is calculated at query time — it is not stored.

**US-7.8 (P0)** — As the Gym Owner, I want to see a shrinkage summary per product showing total stock lost to non-sale adjustments, so inventory losses are visible without running a full report.
- Acceptance Criteria:
  - The Current Stock view displays a "Shrinkage (this month)" column per product showing the total absolute quantity lost via ADJUSTMENT entries (negative `quantity_delta`) in the current calendar month.
  - When `adjustment_reason_category` is set, the shrinkage breakdown by category is visible on hover or in an expanded detail row.
  - Products with zero shrinkage in the period display a dash.
  - A shrinkage value greater than zero is highlighted in amber; a value exceeding 10% of that product's total sales quantity for the period is highlighted in red.
  - The shrinkage calculation draws from the `InventoryTransaction` ledger — the same source as the Inventory Usage Report (US-8.9).

### Future

**US-7.9 (P2)** — As the Gym Owner, I want automated reorder notifications to a supplier, so restocking is semi-automated.

---

## 8. Dashboard & Reports

### MVP

**US-8.1 (P0)** — As the Gym Owner, I want a dashboard showing today's attendance, active/expired/expiring-soon membership counts, today's and month-to-date revenue breakdown, low-stock alerts, remaining servings for protein products, and inventory value — so I get a complete daily operational snapshot in one screen.
- Acceptance Criteria:
  - Loads within 3 seconds (per NFR).
  - KPI strip shows 6 cards: Active Members (with delta vs. last month), Today's Check-Ins (with delta vs. yesterday), MTD Revenue (with % change vs. same period last month), Today's Revenue (all transaction types, voided excluded), Expiring Soon count (using `Gym.expiration_warning_days`), Inventory Value (`SUM(current_stock × cost_price)` where cost_price is set — from US-7.7).
  - Inventory alerts live feed shows each low-stock product with remaining count, remaining servings for `SERVING_BASED_PRODUCT`, and a "~N days remaining" stockout estimate (from US-7.6).
  - A "Today's Collections" compact summary is visible on the Dashboard or accessible from the Dashboard: today's totals by payment method (Cash / GCash / Card / Other) spanning both transaction types (from US-5.4).
  - All revenue figures and KPI counts exclude voided transactions.

**US-8.2 (P0)** — As the Gym Owner, I want revenue reports (daily/weekly/monthly/yearly) broken down by source (membership, walk-in, product), so I understand where my income comes from.
- Acceptance Criteria:
  - Period selector includes: Daily · Weekly · Monthly · **This Year** · **Custom Date Range**.
  - "This Year" shows January 1 through the current date of the current calendar year.
  - "Custom Date Range" allows the owner to specify any start and end date — no minimum or maximum range restriction.
  - Revenue breakdown by source (Membership / Walk-In / Product) applies to all period options including This Year and Custom Range.
  - Voided transactions excluded from all figures.
  - Exportable to CSV.

**US-8.3 (P0)** — As the Gym Owner, I want revenue broken down by payment method (Cash, GCash, Card, Other) over any reporting period, so I can reconcile cash vs. digital collections.

**US-8.4 (P0)** — As the Gym Owner, I want revenue broken down by product category (Beverages, Supplements, etc.) over any reporting period, so I know which category drives product revenue.

**US-8.5 (P0)** — As the Gym Owner, I want attendance reports with period filtering and member vs. walk-in breakdowns, so I can track engagement trends and compare periods.
- Acceptance Criteria:
  - Period selector: Daily · Weekly · Monthly · This Year · Custom Date Range (matching the period options on US-8.2).
  - Report table shows one row per period unit in the selected range (one row per day for Daily, one per week for Weekly, etc.).
  - Columns per row: period label, total check-ins, unique visitors, member check-ins, walk-in check-ins, member unique visitors, walk-in unique visitors.
  - Period-over-period comparison toggle: when enabled, adds a parallel column set showing the equivalent prior period (same duration, immediately preceding) with a % change column per metric. Example: "This Month" shows current month and last month side-by-side.
  - Voided transactions do not affect attendance records — voiding a walk-in payment does not remove the Attendance record from this report.
  - Exportable to CSV.

**US-8.6 (P0)** — As the Gym Owner, I want membership reports listing active, expired, and expiring-soon members, so I can manage renewals proactively.

**US-8.7 (P0)** — As the Gym Owner, I want a best-selling products report (by units/servings sold and by revenue), so I know what to stock more of and what to stop ordering.
- Acceptance Criteria:
  - Default sort: units/servings sold descending (highest seller at top).
  - Secondary sort option: units/servings sold ascending — surfaces lowest-performing products and dead stock candidates. For a dedicated dead-stock analysis with cost-value locking and configurable lookback, see US-8.21.
  - Filterable by period (matching US-8.2 period options) and by product category.
  - Exportable to CSV.

**US-8.8 (P0)** — As the Gym Owner, I want a frequent walk-in clients report (high visit count, low membership conversion), so I can identify upsell opportunities.
*(Conversion detection is derived: a client is classified as a converted walk-in when they have ≥ 1 Attendance record with `visit_type = WALK_IN` dated before their first Membership record's `created_at`. No conversion event entity is stored. ADR-020)*

**US-8.9 (P0)** — As the Gym Owner, I want an inventory usage report showing stock movements per product over a date range (sold, restocked, adjusted) including a shrinkage derivation, so I can spot unusual discrepancies and understand what caused stock losses.
- Acceptance Criteria:
  - Report shows per product, for the selected date range: total units/servings sold, total units/servings restocked, total units/servings adjusted (net), and resulting stock change.
  - Shrinkage section: total negative adjustment quantity per product, broken down by `adjustment_reason_category` where set.
  - Exportable to CSV.

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

**US-8.12 (P0)** — As the Gym Owner, I want a gross profit report showing revenue minus cost of goods sold per product over a selected period, so I understand true profitability and not just revenue.
- Acceptance Criteria:
  - Report shows per product, for the selected period: total units/servings sold, total revenue (sum of `unit_price × quantity`), total COGS (sum of `cost_price_snapshot × quantity`), gross profit (revenue − COGS), and gross margin % ((gross profit ÷ revenue) × 100).
  - Products with null `cost_price_snapshot` on any line items are flagged: "X sales without cost data — margin may be understated."
  - Summary row at the bottom: total revenue, total COGS, total gross profit, blended margin %.
  - Filterable by date range and by product category.
  - Exportable to CSV.

**US-8.15 (P0)** — As the Gym Owner, I want a void analysis report showing all voided transactions by reason category and period, so I can identify data-entry patterns and operational issues.
- Acceptance Criteria:
  - Report spans both `CLIENT_TRANSACTION` and `POS_SALE` voided records.
  - Summary section: count and total voided amount per `void_reason_category` (`DUPLICATE_ENTRY` / `WRONG_AMOUNT` / `WRONG_PRODUCT` / `CLIENT_CANCELLED` / `SYSTEM_ERROR` / `OTHER`) for the selected period.
  - Detail section below summary: individual voided transactions with date, transaction type, original amount, void reason category, void note (if present), and payment method.
  - Filterable by period (Daily / Weekly / Monthly / This Year / Custom Range) and by transaction type (CLIENT_TRANSACTION / POS_SALE / Both).
  - Grand total row: total void count and total voided amount across all categories for the period.
  - Voided amounts are presented as the amount removed from revenue — they are not shown as negative figures or re-added to revenue totals.
  - Exportable to CSV.

**US-8.16 (P0)** — As the Gym Owner, I want a report showing new memberships versus renewals per period, so I can distinguish between member acquisition and member retention.
- Acceptance Criteria:
  - New memberships: `Membership` records where `renewed_from_membership_id IS NULL`, with `created_at` in the selected period.
  - Renewals: `Membership` records where `renewed_from_membership_id IS NOT NULL`, with `created_at` in the selected period.
  - Report shows one row per period unit (e.g., per month): new count, renewal count, total count, new revenue, renewal revenue, total revenue.
  - Renewal rate %: renewals ÷ (renewals + new) × 100 — shows the share of memberships sold that were existing members returning.
  - Filterable by period (Monthly / This Year / Custom Range) and by membership plan.
  - Summary row: totals and blended renewal rate % for the full selected range.
  - Exportable to CSV.

**US-8.17 (P0)** — As the Gym Owner, I want a membership plan performance report showing how each plan is selling and what revenue it generates, so I can make informed pricing decisions.
- Acceptance Criteria:
  - One row per `MembershipPlan`, including retired plans that had memberships sold in the selected period.
  - Columns: plan name, plan duration, current default price, memberships sold (count), total revenue (`SUM(price_paid)`), average price paid.
  - A note is displayed on the report: "Average price paid reflects actual amounts collected per the price-snapshot rule (ADR-003). Comparison to the current default price may not reflect the default at time of sale if it was later edited."
  - Filterable by period and by plan status (Active / Inactive / Both).
  - Plans with zero memberships sold in the selected period are shown with zero counts — not hidden.
  - Exportable to CSV.

**US-8.18 (P0)** — As the Gym Owner, I want a restock cost report showing how much I spent on inventory per product per period, so I can track my purchasing spend without maintaining a separate spreadsheet.
- Acceptance Criteria:
  - Draws from `InventoryTransaction` records where `type = PURCHASE`.
  - Detail rows: product name, restock date, quantity received, total cost paid (`total_restock_cost`). Rows where `total_restock_cost = null` are listed with a "—" in the cost column and a footnote: "N restock events without cost recorded — excluded from totals."
  - Subtotal row per product: total quantity restocked and total spend for the selected period.
  - Grand total row: all-products total spend for the selected period (null entries excluded with a count noted).
  - Filterable by period and by product category.
  - Exportable to CSV.

**US-8.19 (P0)** — As the Gym Owner, I want a membership net change report showing whether my membership base is growing or shrinking each month, so I can identify trends before they become problems.
- Acceptance Criteria:
  - Default view: monthly rows. Default range: last 12 months (or all available data if fewer than 12 months exist).
  - Columns per month: new memberships (count), renewals (count), expired memberships (count of `Membership` records where `end_date` fell within the period), net change (new + renewals − expired), cumulative active member count at end of period.
  - A positive net change row is highlighted green; a negative net change is highlighted red; zero net change is neutral.
  - Filterable by custom date range (monthly resolution minimum).
  - Exportable to CSV.

**US-8.20 (P0)** — As the Gym Owner, I want a period-over-period revenue comparison report, so I can see at a glance whether my revenue is growing or declining relative to the prior equivalent period.
- Acceptance Criteria:
  - Side-by-side columns: selected period revenue vs. prior period revenue (same duration, immediately preceding the selected period).
  - Revenue is broken down by source row: Membership / Walk-In / Product / **Total**.
  - A % change column per row: (current − prior) ÷ prior × 100. Positive values displayed in green; negative values in red.
  - Period presets: This Week vs. Last Week · This Month vs. Last Month · This Year vs. Last Year · Custom Range (system auto-calculates the prior range to match the selected range's exact duration).
  - When a prior period has no data (e.g., the gym just opened), the prior period column shows "—" and % change shows "N/A."
  - Voided transactions excluded from all figures.
  - Exportable to CSV.

**US-8.21 (P0)** — As the Gym Owner, I want a slow-moving and dead stock report showing products with no sales activity in a configurable window, so I can identify dead inventory and avoid re-ordering products that aren't selling.
- Acceptance Criteria:
  - Lookback window selector: **30 days** (default) · 60 days · 90 days. Report shows all active (`is_active = true`) products with zero sales in the selected window.
  - Columns: product name, category, current stock, cost value locked in stock (`current_stock × cost_price` where `cost_price` is set; "—" if null), last sale date (or "Never sold" if no sales history exists), days since last sale.
  - Products with null `cost_price` show "—" in the cost value column; excluded from any cost-value subtotal.
  - Default sort: days since last sale descending (longest-inactive products first).
  - Archived products (`is_active = false`) are excluded — this report is for active catalog items only.
  - Exportable to CSV.

**US-8.22 (P0)** — As the Gym Owner, I want a converted walk-ins report showing which walk-in clients became members during a period and how long it took them, so I can understand my conversion outcomes and what drives them.
- Acceptance Criteria:
  - A client is "converted" when `client_type = MEMBER` AND they have ≥1 `Attendance` record with `visit_type = WALK_IN` where `visit_date` predates their earliest `Membership.created_at` (derived per ADR-020). The "conversion date" is the `created_at` of the client's earliest Membership record.
  - Report filters to clients whose conversion date falls within the selected period.
  - Columns: client name, first walk-in date, walk-in visits before conversion (count of WALK_IN Attendance records predating earliest Membership.created_at), conversion date, days from first visit to conversion, membership plan purchased (MembershipPlan.name; "Custom" if membership_plan_id is null), price paid.
  - Summary row: total conversions in period, average walk-in visits before conversion, average days from first visit to conversion.
  - Filterable by period (Monthly / This Year / Custom Range).
  - Exportable to CSV.

### Future

**US-8.11 (P2)** — As the Gym Owner, I want to export reports as formatted PDF documents.

---

## Summary: MVP Story Count by Module

| Module | P0 (Committed MVP) | P2 (Future) |
|---|---|---|
| Auth & Settings | 6 | 2 |
| Clients | 9 | 2 |
| Membership | 7 | 2 |
| Attendance | 8 | 2 |
| Client Payments | 4 | 2 |
| POS & Product Sales | 14 | 2 |
| Inventory | 8 | 1 |
| Dashboard & Reports | 21 | 1 |
| **Total** | **77** | **14** |

---

## Impact of Original P1 → P0 Promotion

*(Retained for traceability — this section documents the earlier scope decision prior to Design Review #1.)*

You asked to commit all former-P1 stories to MVP. Here's what that actually changed, and what it didn't:

**What it didn't change:** the Domain Model and Module Specs documents. Both already assumed this full scope — soft-delete on clients, the `InventoryTransaction` ledger, void transactions, the snapshot-linked attendance, and the walk-in conversion report were already specified as core MVP behavior in those two documents, not deferred features. Nothing in the schema or module behavior needed to change.

**What it did change:**
- **Build estimate goes up.** 7 additional committed stories — most notably the void/reversal flow and the stock movement ledger — are not trivial CRUD; they involve state transitions and audit-trail logic.
- **No more "soft landing" if the timeline slips.** With everything at P0, there's no longer a pre-agreed fallback if development runs long.
- **Three open questions from Module Specs were resolved:** insufficient-stock handling defaults to block-with-override; the walk-in-fee-credit calculation was dropped; CSV report export is now committed MVP scope.
