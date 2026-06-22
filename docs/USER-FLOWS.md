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
Walk-in client arrives, pays walk-in fee (Flow 3 begins)
    ↓
Mid-visit, client decides to buy a membership
    ↓
Owner opens "Add Membership" from the same checkout screen
    ↓
Owner selects a Membership Plan; price defaults from plan
    ↓
(Optional) Owner manually overrides the membership price if they want to 
    account for the walk-in fee already paid today — this is a manual 
    judgment call, not an automated calculation (see reasoning below)
    ↓
Single combined Transaction created with 2 line items 
    (WALK_IN_FEE, MEMBERSHIP) at whatever prices were entered
    ↓
Attendance record's visit_type is updated to MEMBER (since they now have an active membership for today)
    ↓
Walk-in→Member conversion event logged for reporting (supports "frequent walk-in / conversion opportunity" report)
```

**Reasoning:** This flow doesn't exist anywhere in the original BRD, but it's the literal moment the BRD's stated goal — "identify frequent walk-in clients" for conversion — actually happens. Without designing this explicitly, the conversion-tracking metric becomes a report nobody can act on in the moment.

**Scope decision:** an earlier draft of this flow included an automatic "apply walk-in fee as credit" calculation. That's been dropped — it added partial-credit math to checkout logic for a fairly rare moment, and the core value (the conversion-tracking report itself) doesn't depend on it. The existing manual price-override field already covers an owner who wants to give a discount in this moment.

---

## Flow 8: Product Sale (standalone or combined with membership/walk-in)

```
Owner opens "New Sale" (can be initiated standalone or from a check-in screen)
    ↓
Owner adds one or more products to cart, with quantity
    ↓
For each product line:
    Available stock/servings >= requested quantity? 
        │
        ├── No ──→ Block line item, show "Insufficient stock: X remaining" 
        │          (owner can override only via explicit "Force Sale" confirmation, 
        │           which logs a negative-stock adjustment for visibility)
        │
        └── Yes ──→ Add to cart at current product price (snapshot taken at add-to-cart time)
    ↓
Owner optionally adds membership/walk-in fee line items to the same cart (see Flow 7)
    ↓
Owner confirms total, selects payment method
    ↓
Transaction + TransactionLineItems created
    ↓
For each PRODUCT line item:
    InventoryTransaction (type=SALE) created, stock/servings decremented
    ↓
Dashboard revenue + inventory counters update
```

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
