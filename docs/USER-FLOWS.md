# User Flows — Gym Management System

All flows assume the Gym Owner is logged in. Decision points are marked with `?`; edge-case branches are called out explicitly since these are the parts most BRDs gloss over.

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
Owner clicks "Check In"
    ↓
Attendance record created:
  visit_type = MEMBER
  membership_id = [current active membership] (snapshot link)
  fee_charged = 0
    ↓
Confirmation shown, dashboard "Today's Attendance" increments
```

**Edge case — second visit same day:**
```
Owner attempts check-in again same day for same client
    ↓
System allows it (does not block)
    ↓
Dashboard distinguishes "Total Check-ins" vs "Unique Visitors" so double-counting doesn't distort attendance reports
```

---

## Flow 5: New Membership Purchase

```
Owner opens Client Profile → "Add Membership"
    ↓
Client already has an ACTIVE membership? ──Yes──→ Block. Show: 
                                                    "Client has an active membership until [date]. 
                                                     Did you mean to Renew instead?" → redirect to Flow 6
    │
    No
    ↓
Owner selects a Membership Plan (1/2/3 month, or custom duration)
    ↓
Price defaults from plan, owner may override (override value is what gets recorded)
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
Owner opens Client Profile → "Renew Membership"
    ↓
System shows current membership status: ACTIVE (ends [date]) or EXPIRED (ended [date])
    ↓
Owner selects renewal plan/duration + price (override allowed)
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

```
Walk-in client arrives, pays walk-in fee (Flow 3 completes)
    ↓
Mid-visit, client decides to buy a membership
    ↓
Owner opens Client Profile → "Add Membership"
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
Walk-in→Member conversion logged for reporting
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

## Flows Explicitly Deferred (Future / Post-MVP)

- Multi-staff check-in flow with role-based screen restrictions
- QR/RFID-based check-in flow
- SMS/email-triggered renewal reminder flow (data exists from Flow 10's "Expiring Soon" list; only the automated delivery mechanism is deferred)
- Refund (as opposed to void) flow with partial-amount handling
- Receipt printing/emailing flow
