# User Flows — Gym Management System

All flows assume the Gym Owner is logged in. Decision points are marked with `?`; edge-case branches are called out explicitly since these are the parts most BRDs gloss over.

> **Design Review #2 (2026-06-23):** Flow 5 blocking state confirmed; Flow 6 updated with context-aware button labels; Flow 7 updated with walk-in conversion signal UX path. New flows added: Flow 12 (Archive Client), Flow 13 (Manage Membership Plans). See DECISIONS.md ADR-014, ADR-015, ADR-016.

> **Design Review #3 (2026-06-24):** Flow 3 updated with expired MEMBER renewal decision branch and pre-fee walk-in conversion prompt. Flow 4 updated with post-check-in expiry warning and duplicate check-in confirmation. Flow 7 updated with conversion derivation clarification. New flows added: Flow 14 (Check-In Station), Flow 15 (Attendance Record Correction). See DECISIONS.md ADR-018, ADR-019, ADR-020, ADR-021, ADR-022.

> **Design Review #4 (2026-06-24):** Flow 14 entry point updated — Check-In is now the default view within the Attendance module, not a top-level navigation entry. See DECISIONS.md ADR-023.

---

## Flow 1: Owner Login

```
Owner opens app
    ↓
Enters username + password
    ↓
Credentials valid? ──No──→ Show generic "invalid credentials" error → back to login
    │
   Yes
    ↓
Redirect to Dashboard
```

---

## Flow 2: New Client Registration (no membership yet)

```
Owner clicks "Register Client"
    ↓
Enters Full Name (required)
    ↓
Enters Contact Number (optional)
    ↓
System checks for similar existing names
    │
    ├── Similar name found ──→ Show warning: "Possible duplicate: [Name]" 
    │                          → Owner chooses: "Use existing" or "Create new anyway"
    │
    └── No match
    ↓
Client record created (no membership, status = walk-in-only)
    ↓
Owner redirected to Client Profile
```

**Edge case handled:** duplicate-name collision is surfaced but never silently blocked — owner makes the final call (real-world gyms have multiple "John Cruz").

---

## Flow 3: Walk-In Visit (existing or new client)

```
Walk-in client arrives
    ↓
Owner searches by name
    │
    ├── Client found ──────────────┐
    │                              │
    └── Not found                  │
        ↓                          │
    Quick-create client             │
    (name only, required)           │
        ↓                          │
        └──────────────────────────┘
    ↓
Does client have an ACTIVE membership? ──Yes──→ This is actually a MEMBER visit, route to Flow 4
    │
    No
    ↓
Client has client_type = MEMBER but no active membership? (expired member visiting)
    │
   Yes ──→ Renewal decision prompt (ADR-018):
    │        "[Name]'s membership expired [date].
    │         Check in as walk-in (₱fee)  ·  Renew membership now"
    │         │
    │         ├── Owner selects walk-in → proceed to conversion prompt check below
    │         └── Owner selects Renew → redirect to Flow 6
    │
    No (client is WALK_IN type)
    ↓
Client visit count ≥ Gym.walkin_conversion_prompt_visits with no Membership record?
    │
   Yes ──→ Conversion prompt:
    │        "[Name] has visited N times without a membership.
    │         Register as a member now?  ·  Yes → Flow 5  ·  No, walk-in fee"
    │         │
    │         ├── Owner selects member → redirect to Flow 5 (New Membership)
    │         └── Owner dismisses → proceed to fee prompt below
    │
    No / dismissed
    ↓
System prompts Walk-In Fee (defaults to gym setting, owner may override)
    ↓
Owner records payment method
    ↓
Transaction created: 1 line item (WALK_IN_FEE)
    ↓
Attendance record created: visit_type = WALK_IN, membership_id = null
    ↓
Stock/dashboard counters update
```

**Edge case handled:** the system itself checks membership status rather than trusting the owner to remember — prevents accidentally charging a walk-in fee to an active member.

---

## Flow 4: Member Attendance (active membership)

```
Member arrives
    ↓
Owner searches by name
    ↓
Client found, active membership confirmed
    ↓
Client already has an Attendance record for today?
    │
   Yes ──→ System shows: "[Name] already checked in today at [time]. Check in again?"
    │        │
    │        ├── Owner confirms → proceed
    │        └── Owner cancels → return to search (no record created)
    │
    No
    ↓
Owner clicks "Check In"
    ↓
Attendance record created:
  visit_type = MEMBER
  membership_id = [current active membership] (snapshot link)
  fee_charged = 0
  created_by = [authenticated user]
    ↓
Confirmation shown, client appears in Today's Check-Ins list
    ↓
Membership expiry within Gym.expiration_warning_days?
    │
   Yes ──→ Non-blocking dismissible notice displayed:
    │        "[Name]'s membership expires in N days. [Renew now →]"
    │        Owner may dismiss or follow link to Flow 6
    │
    No
    ↓
Check-In Station returns to auto-focused search state
```

**Edge case — second visit same day:** System prompts confirmation before creating a second same-day record. After confirmation, the record is created normally. Dashboard distinguishes "Total Check-ins" vs "Unique Visitors" so double-counting doesn't distort attendance reports.

---

## Flow 5: New Membership Purchase

```
Owner opens Client Profile
    ↓
Profile shows context-aware membership action button:
    "Add membership" (no prior membership) ──→ this flow
    "Renew" (expired/expiring) ──────────────→ Flow 6
    "Renew early" (active, not near expiry) ─→ Flow 6
    ↓
Owner clicks "Add membership"
    ↓
Client already has an ACTIVE membership? ──Yes──→ Block. Show:
                                                    "[Client name] has an active membership 
                                                     until [end date]. Did you mean to Renew instead?"
                                                    + "Go to Renew" button → redirect to Flow 6
    │
    No
    ↓
Owner selects a Membership Plan from active plan catalog
    (Custom duration option → "Duration (days)" numeric input field appears inline, required)
    ↓
Price defaults from plan's default_price, owner may override (override value is what gets recorded)
    ↓
Owner selects start date (defaults to today, can be future-dated for pre-purchase)
    ↓
End date auto-calculated (start + duration)
    ↓
Owner records payment method
    ↓
Transaction created: 1 line item (MEMBERSHIP), price snapshot stored
    ↓
Membership record created, status derived as ACTIVE (since end_date > today)
    ↓
Owner optionally logs attendance for today in same flow (if client is visiting now)
```

---

## Flow 6: Membership Renewal

```
Owner opens Client Profile
    ↓
Context-aware button shows "Renew" (expired or expiring soon)
                        or "Renew early" (active, not near expiry threshold)
    ↓
Owner clicks the renewal button
    ↓
System shows current membership status: ACTIVE (ends [date]) or EXPIRED (ended [date])
    ↓
Owner selects renewal plan/duration from active plan catalog + price (override allowed)
    ↓
Renewal date calculation:
    │
    ├── Current membership is still ACTIVE (renewing early)
    │       → New end_date = current end_date + plan duration
    │         (extends from existing expiry, NOT from today — confirmed business rule)
    │
    └── Current membership is EXPIRED
            → New start_date = today, end_date = today + plan duration
    ↓
New Membership record created, linked via renewed_from_membership_id to the previous one
    ↓
Transaction created: 1 line item (MEMBERSHIP - Renewal), price snapshot stored
    ↓
Old membership record remains in history, untouched (never overwritten)
```

**Edge case handled:** renewal never mutates the old record — both old and new memberships remain queryable, which is what "View Membership History" (BRD requirement) actually needs.

---

## Flow 7: Walk-In → Member Conversion (same visit)

Conversion can be initiated at two points:
- **(A) Before the walk-in fee is collected** — if the client's visit count reaches `Gym.walkin_conversion_prompt_visits`, a conversion prompt appears during check-in (Flow 3). Owner follows the prompt directly to the Add Membership step below.
- **(B) After the walk-in visit is recorded** — owner opens the Client Profile (existing path). Both routes reach the same Add Membership flow.

```
Walk-in client arrives, pays walk-in fee (Flow 3 completes)
    ↓
Owner opens Client Profile for the checked-in client
    ↓
Quick-stats strip shows walk-in visit count with conversion signal:
    "X visits — no membership" (if walk-in-only client)
    ↓
Owner identifies conversion opportunity (in-person, in the moment)
    ↓
Context-aware button shows "Add membership" (client has no membership history)
    ↓
Owner clicks "Add membership"
    ↓
Owner selects a Membership Plan; price defaults from plan
    ↓
(Optional) Owner manually overrides the membership price if they want to
    account for the walk-in fee already paid today — manual judgment call,
    not an automated calculation (confirmed: no auto credit)
    ↓
A CLIENT_TRANSACTION is created with 2 line items:
    WALK_IN_FEE (already paid) + MEMBERSHIP at the entered prices
    ↓
Attendance record's visit_type updated to MEMBER
    (client now has an active membership for today)
    ↓
Walk-in→Member conversion is recorded implicitly (ADR-020):
    The Membership record's created_at documents when the client became a member.
    Prior Attendance records with visit_type = WALK_IN remain intact.
    Conversion is derived for all reports by querying: MEMBER clients who have
    WALK_IN attendance records predating their earliest Membership.created_at.
    No separate conversion event entity is created.
```

**Note:** If the client also wants to purchase a product during this visit, that is handled as a separate, standalone POS sale — see Flow 8. Client transactions (membership fees, walk-in fees) and POS sales are always separate flows.

**Reasoning:** This flow captures the literal moment the BRD's conversion goal happens. The combined WALK_IN_FEE + MEMBERSHIP CLIENT_TRANSACTION is valid because both items are client-linked. The "apply walk-in fee as credit" automatic calculation was dropped — the existing manual price-override field covers any owner who wants to offer a discount in this moment.

---

## Flow 8: POS Product Sale (standalone, no client required)

```
Owner opens POS screen
    ↓
Product grid loads — all active products with image, name, and price
    ↓
Owner taps a product to add it to cart
    ↓
For each product added:
    Available stock/servings >= requested quantity?
        │
        ├── No ──→ Show: "Only X remaining"
        │          Owner proceeds via explicit "Force Sale" confirmation
        │          (logs a flagged ADJUSTMENT entry in inventory ledger)
        │
        └── Yes ──→ Item added to cart; price snapshot taken at this moment
    ↓
Owner adjusts quantities in cart if needed
    ↓
Owner taps "Checkout"
    ↓
Owner selects payment method (Cash / GCash / Card / Other)
    ↓
Owner confirms total
    ↓
POS Sale created:
    transaction_type = POS_SALE
    client_id = null (no client required)
    TransactionLineItems created for each product (unit_price = snapshot)
    ↓
For each line item:
    InventoryTransaction (type=SALE) created
    Product.current_stock decremented accordingly
    ↓
Dashboard revenue and inventory counters update
```

**No client is required for this flow.**
If the client is also paying a membership fee or walk-in fee during the same visit, those are recorded as separate CLIENT_TRANSACTION records via their respective flows (Flows 3, 5, or 6) — they are never combined with a POS sale into a single transaction.

---

## Flow 9: Inventory Restock

```
Owner opens Inventory → selects product → "Record Purchase/Restock"
    ↓
Owner enters quantity received (units or servings/containers, depending on unit_type)
    ↓
InventoryTransaction (type=PURCHASE) created
    ↓
Product's current stock/servings increased
    ↓
(Future) Owner optionally enters supplier cost — deferred for MVP, 
          but field reserved in schema for future profit-margin reporting
```

---

## Flow 10: Daily Dashboard Check (Owner's typical morning routine)

```
Owner logs in
    ↓
Dashboard loads (within 3s per NFR):
    - Membership snapshot (active/expired/expiring soon)
    - Yesterday/today attendance count
    - Revenue summary (today, month-to-date)
    - Low-stock alerts
    ↓
Owner clicks into "Expiring Soon" list
    ↓
Owner manually follows up with flagged clients (outside the system — 
    no notification feature in MVP, this is a manual action driven by the list)
```

---

## Flow 11: Transaction Correction (Void)

```
Owner finds an incorrectly entered transaction in Transaction History
    ↓
Owner clicks "Void Transaction"
    ↓
Owner enters a required reason note (e.g., "duplicate entry," "wrong product")
    ↓
System confirms: "This will reverse inventory and revenue impact. Continue?"
    ↓
Confirmed
    ↓
Transaction marked status=VOID (not deleted)
    ↓
Linked InventoryTransactions reversed (stock restored) via new ADJUSTMENT entries —
    original SALE entries remain in the ledger for audit, reversal is additive, not a deletion
    ↓
Revenue reports automatically exclude VOID transactions from totals,
    but the void event itself remains visible in the audit trail
```

**Reasoning:** "Business records must be preserved" (NFR) and "correct mistakes" are in tension unless corrections are modeled as additive reversals rather than destructive edits. This flow resolves that tension.

---

## Flow 12: Archive Client (Soft Delete)

```
Owner opens Client Profile
    ↓
Owner clicks the overflow menu (⋯) in the profile header
    ↓
Overflow menu shows: Edit · Archive client
    ↓
Owner clicks "Archive client"
    ↓
Confirmation dialog: "Archive [Name]? They will be hidden from the active client list.
                      All history is preserved."
    ↓
Owner confirms
    ↓
Client.deleted_at = now (soft delete)
    ↓
Client disappears from the default Client List view
    ↓
Client remains visible in Client List when "Show archived" toggle is enabled (greyed out)
    ↓
All attendance, membership, and transaction history remains fully intact and queryable
```

**Reactivation path:**
```
Owner enables "Show archived" toggle on Client List → locates archived client
    ↓
Owner opens Client Profile (archived state banner visible)
    ↓
Overflow menu (⋯) shows: Reactivate client
    ↓
Owner clicks "Reactivate client" → Client.deleted_at = null
    ↓
Client reappears in the default Client List view
```

---

## Flow 13: Manage Membership Plans (Settings)

```
Owner opens Settings → "Membership Plans"
    ↓
Plan list shows all plans (name · duration · default price · status badge)
```

**Add a new plan:**
```
Owner clicks "Add plan"
    ↓
Enters: name (required), duration type (required), default price (required)
    ↓
Duration type:
    ├── 1 month / 2 months / 3 months → duration_days computed automatically
    └── Custom days → "Duration (days)" numeric input field required
    ↓
Plan saved with is_active = true
    ↓
Plan immediately appears in the Add/Renew membership modal
```

**Edit a plan:**
```
Owner clicks edit on an existing plan
    ↓
All fields editable
    ↓
Changing default_price → only affects future memberships
    (existing price_paid snapshots are never altered — ADR-003)
```

**Retire a plan:**
```
Owner clicks "Retire" on an active plan
    ↓
Last active plan? ──Yes──→ Block. Show: "At least one active plan is required."
    │
    No
    ↓
is_active = false
    ↓
Plan disappears from the Add/Renew membership modal
    ↓
All existing memberships created under this plan remain fully intact
    ↓
Plan remains visible in Settings with "Inactive" badge (can be reactivated)
```

---

## Flow 14: Check-In Station

```
Owner opens Attendance module → Check-In view (default view)
    ↓
Name search field is auto-focused — no click required to begin typing
    ↓
Owner types client name (partial match supported)
    ↓
Result cards show: name · type badge (MEMBER/WALK_IN) · membership status
                   · expiry date (MEMBER only) · "today" indicator if already checked in
    ↓
Owner selects a client
    ↓
Which path?
    │
    ├── Active MEMBER ──────────────────────────────────────────────→
    │       Single "Check In" button displayed
    │       → Duplicate check today? Prompt confirmation if yes
    │       → Attendance record created (MEMBER, membership_id snapshotted, created_by set)
    │       → Expiry warning displayed if within Gym.expiration_warning_days
    │       → Client appears in Today's Check-Ins list
    │       → Screen returns to auto-focused search
    │
    ├── MEMBER-type, no active membership (expired) ────────────────→
    │       Renewal decision prompt (ADR-018):
    │       "[Name]'s membership expired [date].
    │        Check in as walk-in (₱fee)  ·  Renew membership now"
    │       ├── Walk-in selected → proceed to conversion prompt check, then fee flow
    │       └── Renew selected → redirect to Flow 6
    │
    └── WALK_IN type client ────────────────────────────────────────→
            Visit count ≥ Gym.walkin_conversion_prompt_visits and no membership?
            ├── Yes → Conversion prompt → owner selects member (Flow 5) or dismisses
            └── No / dismissed → Fee collection flow
            → Walk-in fee entered, payment method selected
            → CLIENT_TRANSACTION created (WALK_IN_FEE)
            → Attendance record created (WALK_IN, membership_id = null, created_by set)
            → Client appears in Today's Check-Ins list
            → Screen returns to auto-focused search
```

---

## Flow 15: Attendance Record Correction

```
Owner locates attendance record in one of:
  - Today's Check-Ins list (on Check-In Station screen)
  - Client Profile → Attendance History tab
    ↓
Owner clicks the edit icon on the record
    ↓
Is the record from today (current calendar day)?
    │
    No ──→ Edit is disabled
    │        Message: "Records older than today cannot be edited."
    │        No escalation path at MVP.
    │
   Yes
    ↓
time_in field is editable; all other fields (visit_type, membership_id, client) are read-only
    ↓
Owner enters corrected time_in value
    ↓
Reason note field is displayed and required — owner enters explanation
    ↓
Owner confirms
    ↓
Attendance record updated:
  time_in = corrected value
  correction_note = owner's reason
  updated_at = now
    ↓
Attendance history shows the corrected time with a small "edited" indicator
```

---

## Flows Explicitly Deferred (Future / Post-MVP)

- Multi-staff check-in flow with role-based screen restrictions
- QR/RFID-based check-in flow
- SMS/email-triggered renewal reminder flow (data exists from Flow 10's "Expiring Soon" list; only the automated delivery mechanism is deferred)
- Refund (as opposed to void) flow with partial-amount handling
- Receipt printing/emailing flow
