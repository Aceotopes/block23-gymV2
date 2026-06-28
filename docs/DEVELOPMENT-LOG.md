# Development Log — Block23 Gym Management System

One entry per commit. Each entry covers all changes from the previous commit to this one.
Newest entries at the top.

---

## [#028] Milestone 8 (part 1) — Dashboard (US-8.1) — 2026-06-28

**Commit:** _(pending)_

**Purpose:** Build the Dashboard — the owner's daily command center (Module 1, US-8.1). First screen that consumes every prior module: the unified `Transaction` ledger (ADR-006), Attendance, the inventory ledger, and central client derivation. **No schema migration.** This is Part 1 of 4 for Milestone 8 (the Reports suite follows in `#029`–`#031`).

**Pure lib (`lib/revenue/revenue.ts`):** the shared revenue-aggregation layer reused by the Dashboard and the M8 revenue reports — `RevenueSource` (`membership`/`walkin`/`product`) + labels, `classifyClientTransaction` (a CLIENT_TRANSACTION is membership-or-walk-in by line item type, never mixed — ADR-024; POS_SALE is always product), `revenueBySource`, `dailyRevenueTrend` (gap-filled multi-series), `pctChange` (null when prior = 0 → "N/A"). **+8 tests (100 total).**

**Period selector (`dashboard-period-options.ts` + `dashboard-period.tsx`):** Today / Week (Mon-based) / Month (MTD) toggle driving the chart row; URL state `?period=` (ADR-047). The KPI cards always show their own contextual period regardless of the selector.

**Charts (`dashboard-charts.tsx`, client Recharts):** Revenue trend (multi-series line — Membership/Walk-in/Product, `--chart-1/3/2`), Membership status donut (Active/Expiring/Expired via `PieChart`+`Cell`), Daily attendance (stacked bar Member vs Walk-in), Top products (horizontal bar, units/servings sold). Money axes/tooltips formatted in ₱; empty states for the donut + top-products.

**View (`dashboard-view.tsx`, server):**
- **6-card KPI strip:** Active Members (+Δ vs a month ago), Today's Check-Ins (+Δ vs yesterday), MTD Revenue (+% vs same-days last month via `pctChange`), Today's Revenue, Expiring Soon (amber), Inventory Value (reuses `inventoryValuation`, excluded-count hint). All revenue excludes voids (`status = COMPLETED`).
- **Charts** fed by the period range: revenue trend (transactions bucketed to gym-local day + classified by source), membership donut + daily attendance (gap-filled), top products (SALE-ledger `groupBy`, abs `quantity_delta`).
- **Six live-feed panels:** Recent POS sales (last 5 + relative time), Expiring soon (red <7d / amber), Inventory alerts (low-stock + remaining + days-until-stockout reusing `daysUntilStockout`), Today's Collections (reuses `summarizeCollections`, both transaction types, grand total), Frequent walk-ins (top 5 walk-in-only by visit count — ADR-036, no threshold), At-risk members (reuses `deriveClient.atRisk`). Each panel "View all →" links to the matching filtered Client List chip / module.
- All client signals (active/expiring/at-risk/frequent) derive once through the shared `deriveClient` so the Dashboard agrees with the Client List + Attendance Analytics.

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (100/100) · `pnpm build` ✓ (`/dashboard` 123 kB w/ Recharts). **Live query smoke (Neon):** the full 9-query Dashboard battery (transaction findMany w/ `lineItems`, the COMPLETED instant-bound aggregates, attendance count + groupBy, client+membership derive feed, product + SALE `groupBy`, recent POS, today's collections) executed cleanly against the live schema (3 clients, 1 attendance-agg row); script removed.

**Doc sync:** DEVELOPMENT-LOG (this entry); ROADMAP (M8 Part 1 ✅ + parts plan); SESSION_HANDOFF; CLAUDE.md; memory. (No new ADR — built on ADR-002/006/024/035/036 + the M5/M7 derivations.)

**Notes / decisions:** Default period is **Week**. Active-members delta compares against in-effect memberships at the same date one month ago (computed from the already-fetched membership rows — no extra query). MTD % compares the current month-to-date against the **same number of elapsed days** last month (avoids month-length skew). Top products rank by units/servings from the SALE ledger (consistent across STANDARD/serving/container). The membership donut counts Active / Expiring-soon / Expired (Upcoming excluded). **Next: Milestone 8 Part 2 (`#029`) — Reports index + shared shell + CSV export + revenue/financial reports.**

---

## [#027] Milestone 7 — Inventory: restock, adjustments, Current Stock & Movement History (US-7.1/7.2/7.4/7.5/7.6/7.7/7.8) — Milestone 7 COMPLETE — 2026-06-28

**Commit:** `4125768`

**Purpose:** Close the inventory-ledger loop. M6 sales only *decrement* `current_stock`; M7 adds restock (raises it), manual adjustments, and the Current Stock analytics + Movement History views. No schema migration — `InventoryTransaction` (type/quantityDelta/resultingStock/adjustmentReasonCategory/totalRestockCost/note) was authored in `#016`.

**Pure lib (`lib/inventory/`):**
- `adjustment.ts` — owner-selectable `ADJUSTMENT_REASON_CATEGORIES` (the 7 owner reasons; **`FORCED_SALE` excluded** from the selector per ADR-034) + `isAdjustmentReasonCategory` guard + `ADJUSTMENT_REASON_LABELS` (all 8, incl. FORCED_SALE for movement-history display) + `MOVEMENT_TYPE_LABELS` (PURCHASE→Restock / SALE / ADJUSTMENT).
- `stock.ts` — `restockDelta` (STANDARD +units / SERVING_BASED +containers×spc, Flow 9), `daysUntilStockout` (`stock ÷ (sold30/30)`, null when no sales — US-7.6), `inventoryValuation` (`Σ stock×cost`, null-cost excluded + counted — US-7.7), `shrinkageLevel` (none/amber/red; red = shrinkage > 10% of period sales, suppressed at zero sales — US-7.8).
- **+16 tests (92 total).**

**Schema + actions (`inventory/`, gym-scoped, server-authoritative, interactive `$transaction`):**
- `inventory-schema.ts` — `restockSchema` (whole `quantityReceived ≥ 1`, optional `totalRestockCost ≥ 0`) and `adjustSchema` (non-zero whole `quantityDelta`, owner `category` enum, note required for `OTHER` via `superRefine`).
- `actions.ts` — `restockProduct` → a `PURCHASE` entry (`quantity_delta = restockDelta`, `resulting_stock`, `total_restock_cost`) + raise `current_stock`. `adjustStock` → a signed `ADJUSTMENT` (required `adjustment_reason_category`, note for OTHER) + update `current_stock`; **a manual decrease below zero is BLOCKED** (Flow 19 — unlike the M6 Force Sale). Both move ledger + cached stock together (ADR-004).

**UI (`?view=` shell — Current Stock · Movement History, ADR-047):**
- `page.tsx` + `inventory-nav.tsx` — the two-view shell (replaces the M7 placeholder).
- **Current Stock** (`stock-view.tsx`, server) — per-product stock (remaining servings + ≈containers for SERVING_BASED, US-7.4), low-stock + reorder badges (US-7.3), days-until-stockout (US-7.6), this-month shrinkage column with amber/red + per-category hover breakdown (US-7.8), and an inventory-valuation footer with excluded-count note (US-7.7). Derived figures come from three ledger `groupBy` aggregations (SALE last-30, SALE this-month, negative-ADJUSTMENT this-month) computed at query time. `stock-toolbar.tsx` (show-archived) + `stock-row-actions.tsx` (Restock · Adjust) + `restock-dialog.tsx` (live servings preview) + `adjust-dialog.tsx` (resulting-stock preview, below-zero guard).
- **Movement History** (`movements-view.tsx`, server) — the per-product PURCHASE/SALE/ADJUSTMENT ledger; signed colored deltas, restock cost, reason labels (FORCED_SALE flagged), notes. `movements-filters.tsx` — date preset + movement type + product, URL state (ADR-047, reuses the attendance `presetRange`).

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (92/92) · `pnpm build` ✓ (`/inventory` 4.32 kB). **Runtime smoke (Neon):** serving-based product, restock 2 containers → `current_stock` 0→140; a −30 SALE then a −10 DAMAGE adjustment → 100; below-zero adjustment correctly rejected by the guard; stock-view aggregations — sold(abs)=30 → days-until-stockout 100, shrinkage `DAMAGE:10`, valuation ₱2000. Smoke data removed.

**Doc sync:** DEVELOPMENT-LOG (this entry); ROADMAP (M7 ✅ complete); SESSION_HANDOFF; CLAUDE.md; memory. (No new ADR — built on ADR-004/026/028/034 + ADR-047.)

**Notes / decisions:** Shrinkage counts only **negative** ADJUSTMENT deltas — so the M6 `FORCED_SALE` markers (`quantity_delta = 0`) and void-reversal ADJUSTMENTs (positive) are naturally excluded; only owner manual losses register. The Current Stock view includes archived products under the show-archived toggle (they keep stock + ledger so the owner can write off remaining stock), but the valuation footer counts **active** priced stock only (US-7.7). Days-until-stockout uses a 30-day window ÷ 30 for avg daily velocity. Restock/Adjust are row dialogs (Flow 9/19 — "select product → action"), not separate tabs. **The Dashboard-side consumers (low-stock feed, stockout estimates in alerts, Inventory Value KPI — US-7.3/7.6/7.7) land in Milestone 8.** **Next: Milestone 8 — Dashboard & Reports.**

---

## [#026] Milestone 6 (part 2) — POS Sell Screen, Checkout, Stock & History/Void (US-6.6–6.10/6.13/6.14/6.16) — Milestone 6 COMPLETE — 2026-06-27

**Commit:** _(Done)_

**Purpose:** Build the POS sell screen, checkout, stock deduction into the inventory ledger, container-mode sale, Force Sale, and POS History + void — completing Milestone 6. First client-anonymous revenue (`POS_SALE`, `client_id` null, ADR-011) and first inventory-ledger writes (ADR-004). No schema migration.

**Pure lib (`lib/pos/cart.ts`):** `CartLine`/`CartMode` types, `cartKey` (product+mode), `lineSubtotal`/`cartTotal`, `stockDeduction` (container = qty×spc, else qty — ADR-027), `changeDue`, `lineDescription` (per-mode snapshot text). **+5 tests (76 total).**

**Cart store (`pos-cart-store.ts`):** the one Zustand store reserved for the POS cart by ADR-047 (alongside the sidebar). Ephemeral (not persisted — MODULE-SPECS), keyed by product+mode so a serving-based product can sit in the cart both per-serving and per-container; re-adding bumps quantity.

**Checkout + void (`pos-actions.ts`, gym-scoped, interactive `$transaction`):**
- `createPosSale` — server-authoritative: re-loads each product (archived allowed — archived-mid-transaction completes), resolves mode→`unit_price` (selling vs `container_selling_price`) + `cost_price_snapshot` (ADR-003/026) + stock deduction. Stock gate per product (ADR-009): if any product's total deduction exceeds stock and `force` is unset, returns `needsForce` (name/available/requested). On confirm: one `POS_SALE` + a `PRODUCT` line item per cart row, each creating a `SALE` inventory entry (`quantity_delta = −deduction`, `resulting_stock`, `reference_transaction_line_item_id`) and decrementing `current_stock`; cash rule (US-6.13) — `CASH` requires `cashReceived ≥ total`.
- **Force Sale ledger model (chosen interpretation):** the per-line `SALE` always carries the full `−deduction` (canonical "each line → SALE that decrements" — MODULE-SPECS); when that line takes stock negative, a flagged `ADJUSTMENT` with `adjustment_reason_category = FORCED_SALE`, `quantity_delta = 0`, and a note is also written (ADR-009/034 — "never silent"), keeping stock math entirely in the SALE entries and the void reversal simple.
- `voidPosSale` — required `void_reason_category` (ADR-028) + note (required for `OTHER`); status→VOID; **additive reversal** (Flow 11): per line item, a new `ADJUSTMENT` restores `−Σ(its ledger deltas)` with `reference_transaction_line_item_id` set; the original SALE rows are preserved. System reversal — `adjustment_reason_category` left null (no owner category fits) with a "Void reversal" note; the positive delta excludes it from shrinkage (US-7.8).

**UI:** `sell-view.tsx` (server — active products + category tabs derived from products present, so empty categories are hidden, US-6.16) → `pos-screen.tsx` (client — search + tabs + product grid + cart panel; serving-based-with-container cards show /serv + /cont add buttons; cart quantity steppers + remove) → `checkout-dialog.tsx` (payment method + cash-change calc + Force Sale confirmation). **POS History** (`pos-history-view.tsx`, server — today's count + revenue strip, date-preset + method filters (ADR-047), `POS_SALE` table, VOID badge + reason) + `pos-history-filters.tsx` + `pos-void-action.tsx`. `page.tsx` now renders Sell / Products / History.

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (76/76) · `pnpm build` ✓ (`/pos` 12.2 kB). **Runtime smoke (Neon):** normal sale (water 10→7 standard, whey 140→70 via container mode −70 servings); Force Sale (water 7→−3, 1 FORCED_SALE marker logged); void reversal restored stock (water →0, whey →140); today's COMPLETED POS aggregate excluded the voided sale (count 1, ₱250). Smoke data removed.

**Doc sync:** DEVELOPMENT-LOG (this entry); ROADMAP (M6 ✅ complete); SESSION_HANDOFF; README; CLAUDE.md; memory. (No new ADR — built on ADR-003/004/006/009/011/012/026/027/028/034.)

**Notes / decisions:** Force Sale marker uses `quantity_delta = 0` (the SALE carries the deduction) — chosen for a clean reversal and to honor "each line → one SALE that decrements." Void-reversal ADJUSTMENTs carry a null `adjustment_reason_category` (system reversal; no owner enum fits) + a note. Product images render via a plain `<img>` (arbitrary remote URLs can't be host-validated by `next/image`). The POS void dialog mirrors the payments void dialog (a future `/simplify` could DRY them). Product **restock** (raising `current_stock`) is **Milestone 7** — so the smoke seeds stock directly; in-app, selling before M7 uses Force Sale. The Collections summary (M5) already spans `POS_SALE`, so POS revenue surfaces there automatically. **Next: Milestone 7 — Inventory.**

---

## [#025] Milestone 6 (part 1) — Product Catalog & Categories (US-6.1/6.2/6.3/6.4/6.5/6.15) — 2026-06-27

**Commit:** _(Done)_

**Purpose:** Build the product catalog + category management — the data and management layer the POS sell screen (Part 2) depends on. No schema migration — `Product` / `ProductCategory` were authored in `#016`. The POS screen, cart/checkout, stock deduction, container mode, and POS History/void are Part 2 (`#026`).

**Scope boundary (M6 vs M7):** restock (US-7.1) is **Milestone 7**, so new products start at `current_stock = 0` (ledger-driven, ADR-004) — the catalog form never writes stock. Selling from zero relies on the Force Sale override (ADR-009), which arrives with the sell screen in Part 2. Product **image** is an optional URL field for now; R2 file-upload UX is deferred.

**Pure lib (`lib/products/`):** `types.ts` (`ProductType` STANDARD/SERVING_BASED + labels + guard, mirrors the Prisma enum), `margin.ts` (`grossMargin` — pure ₱+% for US-6.15; `%` null when selling = 0 to avoid divide-by-zero; null when cost unset). **+6 tests (71 total).**

**Schema + actions:** `pos/product-schema.ts` (Zod, shared client+server; conditional `superRefine` requiring `servings_per_container` for SERVING_BASED; `normalizeProduct` strips serving fields from STANDARD; required numbers NaN-on-empty, optional nullable). `product-actions.ts` (create/update/archive/restore — gym-scoped, category-ownership checked, soft delete via `deleted_at` ADR-005, never writes `current_stock`). `category-actions.ts` (create/rename — gym-scoped, case-insensitive duplicate block, no delete at MVP).

**UI:** POS module `?view=` sub-nav (`pos-nav.tsx` — Sell / Products / History; Sell + History are Part-2 placeholders). **Products view** (`products-view.tsx`, server) — URL-driven search + show-archived (ADR-047, `products-search-params.ts`), table (name/category/type/price/live margin/stock), `Manage categories` + `New product` actions, "add a category first" empty state. `product-form-dialog.tsx` (RHF + zod; type toggle reveals servings/container fields; live gross-margin readout; category select). `product-row-actions.tsx` (Edit · Archive/Restore with confirm). `category-manager.tsx` (add + inline rename). `new-product-button.tsx` (disabled until a category exists). `products-toolbar.tsx` (debounced search + archived toggle).

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (71/71) · `pnpm build` ✓ (`/pos` 15.1 kB). **Runtime smoke (Neon):** STANDARD + SERVING_BASED products created (serving fields persisted: spc 70, container ₱3000; both stock 0); price edit applied; archive excluded the product from the active query (active 1 / all 2) and restore returned it; category rename applied. Smoke data removed.

**Doc sync:** DEVELOPMENT-LOG (this entry); ROADMAP (M6 catalog boxes); SESSION_HANDOFF; README; CLAUDE.md; memory. (No new ADR — built on ADR-003/004/005/026/027.)

**Notes / deferrals:** `current_stock` editing, restock, and inventory valuation are M7. The POS sell screen / checkout / Force Sale / container-mode sale / POS History + void are **M6 Part 2 (`#026`)**. Image upload (R2) deferred — URL field for now. Category delete out of scope (products reference categories). **Next: Milestone 6 Part 2.**

---

## [#024] Milestone 5 — Client Payments (US-5.1/5.2/5.3/5.4) — Milestone 5 COMPLETE — 2026-06-27

**Commit:** _(Done)_

**Purpose:** Land the deferred `CLIENT_TRANSACTION` + payment-method layer (US-5.1). Retrofit the M3 membership create/renew and the M4 walk-in fee check-in to create the transaction + line item, and build the Payments module (history, void, collections). No schema migration — `Transaction` / `TransactionLineItem` / `PaymentMethod` / `VoidReasonCategory` / `ItemType` were authored in `#016`.

**Shared data layer:**
- `lib/payments/method.ts` — `PaymentMethod` values + labels + `isPaymentMethod` guard (mirrors the Prisma enum; shared by membership dialog, walk-in fee dialog, filters, collections).
- `lib/payments/void.ts` — `VoidReasonCategory` values + labels + guard (ADR-028; `OTHER` requires a note).
- `lib/payments/collections.ts` — `summarizeCollections` (pure: groups rows into Cash/GCash/Card/Other + grand total, always all four methods). **Testable.**
- `lib/dates.ts` — `gymDayStartUtc` (UTC instant of gym-local midnight) for bounding instant-based `transaction_date` to a gym-local calendar day (ADR-035), and `formatDateTimeInTz` (display an instant in `Gym.timezone`). **+9 tests (65 total).**

**Retrofit M3 (`membership-{schema,actions,actions-ui}`):** create + renew now wrap the `Membership` and its `CLIENT_TRANSACTION` (`transaction_type=CLIENT_TRANSACTION`, `total_amount`=price, payment method) + one `MEMBERSHIP` line item (`unit_price`/`subtotal`=price snapshot, `referenceMembershipId`) in one interactive `prisma.$transaction`. The dialog gains a payment-method `Select` (default Cash). The Membership History VOID badge (wired in `#020`) now lights up. ADR-024 (separate transactions) / ADR-012 (never mixed) / ADR-003 (snapshot) honored.

**Retrofit M4 (`attendance/actions.ts`, `check-in-view.tsx`):** a WALK_IN check-in now creates the attendance + a `CLIENT_TRANSACTION` + one `WALK_IN_FEE` line item atomically; `fee_override_note` is set when the fee ≠ `Gym.default_walkin_fee`. Member visits create no transaction. The walk-in fee dialog gains a payment-method `Select`.

**Payments module (`payments/`):** `?view=` sub-nav (Payment History default / Collections, ADR-023/047 pattern). **History** (`history-view` + `payment-filters`) — chronological `CLIENT_TRANSACTION` table for the selected range, filterable by date preset / payment method / client name (URL state, ADR-047); voided rows show a VOID badge + reason category + note; COMPLETED rows offer the void action. **Void** (`void-action` + `actions.ts → voidClientTransaction`) — required category, note required only for `OTHER`, additive `status=VOID` via `updateMany` (idempotent guard), never cancels the membership (ADR-041) or deletes the attendance (Module 5 edge case). **Collections** (`collections-view` + `collections-date`) — selected-day totals by method spanning **both** transaction types (ADR-006 — POS_SALE auto-included when M6 lands), grand total, zero-day notice, today-capped date selector (US-5.4, Flow 17).

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (65/65) · `pnpm build` ✓ (`/payments` 12.2 kB). **Runtime smoke (Neon):** membership (₱1000 GCash) + walk-in (₱75 Cash) transactions created via interactive `$transaction`; today's collections query (gym-day instant bounds) returned Cash 1×₱75 + GCash 1×₱1000 = ₱1075; voiding the walk-in left the non-void total at ₱1000 with the attendance row and live membership untouched (additive). Smoke data removed.

**Doc sync:** DEVELOPMENT-LOG (this entry); ROADMAP (M5 ✅ + M3/M4 deferral notes resolved); SESSION_HANDOFF; README; CLAUDE.md; memory. (No new ADR — built on ADR-003/006/012/024/028/035/041/047.)

**Notes / decisions:** Payment method defaults to **Cash** in both dialogs (most common; overridable). The walk-in `fee_override_note` is **auto-populated with a factual note** ("Fee adjusted from the ₱X default to ₱Y.") rather than prompting for a reason — the quick check-in flow stays fast while the override remains auditable (MODULE-SPECS Module 5 leaves the note optional). `transaction_date` is stamped at creation (`new Date()`), the moment money is collected. Collections spans `POS_SALE` by query design now (returns client-only totals until M6). Partial refunds (US-5.6) and receipts (US-5.7) remain deferred (P2). **Next: Milestone 6 — POS & Product Sales.**

---

## [#023] Milestone 4 (part 2) — Attendance Analytics (US-4.10) — Milestone 4 COMPLETE — 2026-06-27

**Commit:** _(Done)_

**Purpose:** Build the third Attendance view (ADR-023) — read-only engagement analytics — completing Milestone 4. Attendance-domain only (no revenue/inventory); no CSV export (that's Reports, M8).

**Pure aggregations — `lib/attendance/analytics.ts` (testable, no DB):** analytics period presets (Last 7 / Last 30 / Last 3 Months / Custom) + `analyticsRange` / `rangeDays`; `dailyTrend` (per-day total + unique, gap-filled), `byHour` (24 buckets on the `@db.Time` UTC hour, ADR-035), `byDayOfWeek` (per-weekday average over the weekday's occurrences in range), `peakHours` / `peakDays` (top 3), `newVsReturning` (first-ever check-in inside the period = New), `hourLabel`. **+7 tests (56 total).**

**View — `analytics-view.tsx` (server) + `analytics-charts.tsx` (client Recharts) + `analytics-period.tsx` (client, URL period selector, ADR-047):**
- **KPI cards:** Today / This Week (Mon-based) / This Month check-ins; Member-vs-Walk-In ratio (MTD).
- **Charts (global period selector):** Daily Attendance Trend (line — total + unique), Average Check-ins by Day of Week (bar), Check-ins by Hour (bar). Recharts (already in the stack), colored from the design tokens (`--chart-*`).
- **Member Insights:** at-risk count (reuses `deriveClient.atRisk`, links to `/clients?chip=at-risk`), avg visits/member (period), member utilization rate (unique visiting members ÷ active members).
- **Walk-In Insights:** frequent walk-ins (≥ `walkin_conversion_prompt_visits`), conversion candidates (links to `/clients?chip=walk-in-only`), conversions (period + lifetime + rate) using the ADR-020 derived definition (a MEMBER who ever had a WALK_IN visit).
- **Operational Insights:** peak hours, peak days, new vs returning.
- **Alerts:** inactive-member and frequent-walk-in counts + a **≥20%-below-prior-equivalent-period** decline banner.
- All counts derive through the shared `lib/clients/derive.ts` so signals match the Client List + (future) Dashboard. Historical rows from soft-deleted clients are included in trends but excluded from active-member counts (the all-clients query is `deletedAt: null`; trend/charts query all attendance).

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (56/56) · `pnpm build` ✓ (`/attendance` 126 kB — Recharts). **Runtime smoke (Neon):** the view's `groupBy` aggregations (`_count`/`_min`/`_max` together, and the WALK_IN-only groupBy) executed correctly (2 client rows, c1=2 visits, 1 walk-in client); `dailyTrend` returned 7 gap-filled days with today 2/2, peak hour 8, 7 day-of-week buckets. Smoke data removed.

**Doc sync:** DEVELOPMENT-LOG (this entry); ROADMAP (M4 ✅ complete); SESSION_HANDOFF; memory. (No new ADR — built on ADR-019/020/023/035/036/047.)

**Notes:** Conversion rate is defined as lifetime converted members ÷ clients who ever had a walk-in visit (ADR-020 is derive-only and leaves the exact rate denominator open; this is the chosen, documented interpretation). The 20%-decline threshold is hardcoded for MVP (MODULE-SPECS Module 4 deferral). **Next: Milestone 5 — Client Payments** (the `CLIENT_TRANSACTION` + payment-method layer onto M3 membership purchases and M4 walk-in fees, US-5.1).

---

## [#022] Milestone 4 (part 1) — Attendance core: Check-In, History, Correction (US-4.1/4.2/4.3/4.4/4.5/4.8/4.9/4.11) — 2026-06-27

**Commit:** _(Done)_

**Purpose:** Build the operational heart of the Attendance module (ADR-023) — the Check-In Station, Today's Check-Ins, Attendance History, and same-day time correction — plus the deferred per-client attendance filters on the Client Profile. Attendance Analytics (US-4.10) follows in `#023`.

**Scope boundary (M4 vs M5), same pattern as M3:** Per ROADMAP, **US-5.1 (Milestone 5) owns the walk-in fee `CLIENT_TRANSACTION` + payment method**. So a walk-in check-in records the `Attendance` with `fee_charged` (the denormalized display amount, defaulted from `Gym.default_walkin_fee`, overridable) and **defers the payment record to M5**. The expired-member renewal prompt (ADR-018) and the walk-in conversion prompt route the owner to the existing M3 Client Profile membership flows (`/clients/[id]`) — no rebuild.

**Data layer:**
- `dates.ts`: `gymTimeNow` (current wall-clock in the gym tz → `@db.Time`), `parseTimeOnly` / `toTimeInputValue` (HH:mm ↔ `@db.Time`), `formatDateOnlyISO`. All honor ADR-035 (bare clock/calendar values, UTC-stored, no offset).
- `lib/clients/derive.ts` (extended, not duplicated): `deriveCheckInBranch` (active-member / upcoming-member / expired-member / walk-in — Flow 14, ADR-018) and `activeMembershipId` (the in-effect membership to snapshot at check-in).
- `lib/attendance/history.ts` (date presets Today/Yesterday/Last 7/Last 30/Custom + visit-type filter + `presetRange`) and `lib/attendance/today.ts` (`summarizeToday` — total vs unique counts US-4.5, reverse-chronological, `ordinalVisit` "2nd visit" labels). **+11 tests (49 total).**
- `lib/gym.ts`: `getSessionContext()` → `{ userId, gymId }` so writes can stamp `Attendance.created_by` (ADR-021).

**Server Actions (`attendance/actions.ts`, gym-scoped):** `searchClientsForCheckIn` (live name search → derived branch + the data each branch needs: active membership id, expiry/expired/upcoming dates, total visits, checked-in-today time, default fee; archived clients excluded), `checkInClient` (validates client + gym-scoped in-effect membership for MEMBER visits, stamps `visit_date`=gymToday, `time_in`=gymTimeNow, `created_by`=session user, `fee_charged` for walk-ins), `correctAttendanceTime` (same-calendar-day guard, required reason, sets `updated_at` — US-4.11/Flow 15). Quick-create reuses the M2 `createClient` (fuzzy duplicate + force).

**UI:** `attendance/page.tsx` with a `?view=` sub-nav (Check-In default / History / Analytics, ADR-023/047). **Check-In view** (`check-in-view.tsx`, client) — auto-focused debounced search, result cards (type badge, status, expiry, "in today" indicator), branch dialogs (duplicate-today confirm, expired-member renewal decision, upcoming-member walk-in notice, walk-in conversion prompt, walk-in fee entry, new-walk-in quick-create), post-check-in expiry warning toast with Renew action, returns to focused search. **Today's Check-Ins** (`today-checkins.tsx`) — total/unique counts, 2nd-visit labels, edited indicator, inline correction. **History view** (`history-view.tsx` + `history-filters.tsx`) — URL-driven date presets + visit-type filter, table, same-day correction. **Correction** (`attendance-correction.tsx`) — shared HH:mm edit dialog. **Client Profile** attendance tab now has the deferred range + visit-type filters (`profile-attendance-filters.tsx`) and same-day correction.

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (49/49) · `pnpm build` ✓ (`/attendance` 15.8 kB). **Runtime smoke (Neon):** member branch = active-member with the correct `activeMembershipId` snapshot; walk-in branch = walk-in; today summary total 3 / unique 2 with the member's 2nd visit flagged; same-day correction updated `time_in` + set `updated_at`; last-7-days history range returned all 3 records. Smoke data removed.

**Doc sync:** DEVELOPMENT-LOG (this entry); ROADMAP (M4 core boxes); SESSION_HANDOFF; memory. (No new ADR — built on ADR-018/020/021/022/023/035/038/047.)

**Notes / deferrals:** **Attendance Analytics (US-4.10) → `#023`** (the Analytics sub-nav tab is a placeholder). Walk-in fee **payment**/`Transaction` → M5 (US-5.1). US-4.9's standalone today list is served by the always-default Check-In view's running list (counts + labels) plus the History view's Today preset. Backdated/retroactive attendance entry and record deletion remain out of scope (correction-only, MVP).

---

## [#021] Milestone 3 — Membership Management (US-3.1/3.2/3.3/3.4/3.9/3.10) — 2026-06-27

**Commit:** _(Done)_

**Purpose:** Build the Membership Management module — create / renew / cancel a membership, ad-hoc custom durations, and the Membership Plan catalog in Settings. Wires the (previously disabled) context-aware membership button + Membership History Cancel on the Client Profile. Completes Milestone 3.

**Scope boundary (M3 vs M5):** Per ROADMAP, **US-5.1 (Milestone 5 — Client Payments) owns the payment `Transaction` + payment-method capture**. So M3 creates the `Membership` record with its immutable `price_paid` snapshot (ADR-003) only; the `CLIENT_TRANSACTION`/payment-method step of Flow 5/6 is deferred to M5 (same way M2 deferred these flows). The Membership History **VOID** badge already keys off a transaction relationship, so it lights up once M5 lands. No doc contradiction — MODULE-SPECS describes the complete end-state flow; ROADMAP owns the per-milestone slice.

**New decision — ADR-048 (month → fixed days):** A plan's "1 / 2 / 3 months" maps to a fixed `duration_days` of **30 / 60 / 90** (gym-billing convention; the schema + ADR-040 math are day-based, so months need a concrete day count). "Custom days" and the inline ad-hoc duration carry the entered count. Mapping in `src/lib/memberships/duration.ts`. Rejected calendar-month addition (end-of-month ambiguity; inexpressible as the single `duration_days` int).

**Centralized derivation extended — `src/lib/clients/derive.ts` (do-not-duplicate, per ADR-002/037/040/041):**
- `deriveMembershipAction` → `add` / `renew` / `renew-early` / `upcoming-only` — the context-aware Client Profile button (US-3.2). `upcoming-only` is the disabled/informational state when the only membership hasn't begun (ADR-037).
- `deriveMembershipBlock` → `active` (with end date → "Go to Renew") / `upcoming` (informational, no redirect) / null — the create-blocking guard (US-3.1, ADR-037). Active takes precedence; cancelled never counts.
- `latestRelevantEnd` + `computeRenewalDates` — the canonical renewal math (ADR-040): `start = max(today, latest_end + 1)`, `end = start + duration_days`; anchor = greatest `end_date` among non-cancelled memberships with `end_date >= today`. Pure: the server action and the dialog's live preview compute identical dates.
- `dates.ts`: added `addDays`, `parseDateOnly`, `toDateInputValue` (date-only `@db.Date` math/serialization, ADR-035). **20 new unit tests** (38 total) cover the action/block/renewal logic + the duration mapping.

**Membership Plan catalog in Settings (US-3.9, Flow 13):** `plan-schema.ts` (zod, shared client+server), `plan-actions.ts` (`createPlan`/`updatePlan`/`retirePlan`/`reactivatePlan` — gym-scoped, server-revalidated; **last-active-plan retirement is blocked** "At least one active plan is required"), and `membership-plans.tsx` (list with name · duration · price · Inactive badge; Add/Edit dialog with a duration-type `Select` + conditional custom-days; row `⋯` → Retire/Reactivate). Editing a plan's price never rewrites past snapshots (ADR-003). Rendered below the gym-settings form on `/settings`. shadcn `select` added (unified `radix-ui` package — no new top-level dep).

**Membership create / renew / cancel (US-3.1/3.2/3.3/3.10, Flow 5/6/18) — `clients/[id]/`:** `membership-schema.ts` (create has a start date — defaults today, future-datable; renew computes it), `membership-actions.ts` (`createMembership` re-checks the block server-side + enforces `start_date >= today`; `renewMembership` computes the renewal period + links `renewed_from_membership_id`, never mutating the prior record; `cancelMembership` soft-sets `cancelled_at` + required reason, gym-scoped, independent of payment void). `membership-actions-ui.tsx` is the context-aware button + Add/Renew dialog (plan `Select` incl. "Custom duration (ad-hoc)" → `membership_plan_id` null, price default from plan but overridable as a snapshot, live period preview; an active-block surfaces an inline warning with a "Renew instead" switch). `membership-row-actions.tsx` is the history-row `⋯` → Cancel (reason-required dialog, non-cancelled rows only).

**Client Profile wiring (`clients/[id]/page.tsx`):** replaced the disabled Milestone-3 placeholder button with `<MembershipActions>` (fed the derived action, active plans, renewal anchor, gym today); fetches active plans alongside the client in one `Promise.all`; Membership History rows now carry the Cancel action; empty state copy updated (no longer "arrives in Milestone 3").

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (38/38) · `pnpm build` ✓ (`/clients/[id]`, `/settings` server-rendered). **Runtime smoke (Neon, seeded gym):** a temporary script created a plan + members and confirmed — create → derived `renew-early`/`ACTIVE` + active-block carrying the end date; renew chained onto `m1.end + 1` (2026-07-28) with `renewed_from` linked and the prior record untouched; soft-cancel excluded the record (live count 1 → action still `renew-early`); ad-hoc custom 45-day membership persisted with `membership_plan_id = null`. All smoke data removed afterward.

**Doc sync:** DECISIONS (ADR-048); CLAUDE.md (Project Status → M1–3 done, ADR range → ADR-048); DEVELOPMENT-LOG (this entry); ROADMAP (Milestone 3 boxes); SESSION_HANDOFF; memory.

**Notes / deferrals:** Membership **payment**/`Transaction` + payment-method → M5 (US-5.1). **Backdated** memberships are out of scope (start ≥ today; cancel + recreate for corrections). The Add/Renew dialog uses the create schema as a superset resolver for both modes (start date always has a valid default; the server re-validates each path) to avoid swapping the RHF resolver on a mode change. Expiring-soon membership list (US-3.6) is surfaced via the existing Client List chips + (later) Dashboard/Reports — no separate screen (ADR-042).

---

## [#020] Milestone 2 — Client Management (US-2.1/2.2/2.3/2.4/2.5/2.6/2.9/2.10/2.11) — 2026-06-26

**Commit:** _(Done)_

**Purpose:** Build the Client Management module — the client registry, the first filtered/searchable list, the Client Profile, and soft-delete/archive. This is the bulk of Milestone 2; membership/attendance *content* on the profile fills in with M3/M4.

**Decision resolved first (blocked the Client List): ADR-047 — list state lives in the URL.** Filter chip, name search, show-archived, sort, page, tab, and report period are URL search params (shareable, refresh-safe, back-restorable); Zustand is reserved for the POS cart and sidebar. Derived/filtered tables render on the server from the URL. The generic client-side TanStack `DataTable` is deferred to the first view that needs client-side table interactivity. Synced into `DECISIONS.md` (ADR-047), `TECH-STACK.md` (State Management Standards decision tree + rules 11 / the Zustand row), and `DESIGN-SYSTEM.md` (§14.4 confirmed, §19 marked resolved).

**Centralized derivation (ADR-002/017/019/037/040/041) — `src/lib/clients/derive.ts`:** the single source of truth for `client_type` (MEMBER iff ≥1 non-cancelled membership), member status (ACTIVE / UPCOMING / EXPIRING_SOON / EXPIRED with ADR-037 precedence), walk-in status (ACTIVE / INACTIVE), the orthogonal at-risk signal (ADR-019 — in-effect membership + absence beyond `member_inactivity_warning_days`, or in-effect with no attendance; upcoming excluded), `deriveMembershipStatus` (per-record, incl. CANCELLED), the 8 filter chips + `matchesChip`. Nothing here stores status or touches the DB/session — callers pass rows + thresholds + `gymToday()`. Cancelled memberships are excluded from every derivation (ADR-041). **18 unit tests** (`derive.test.ts`) cover walk-in/member statuses, at-risk, cancelled exclusion, and chip matching.

**Date handling — `src/lib/dates.ts` (ADR-035):** `gymToday(tz)` (current calendar date in the gym timezone as a UTC-midnight Date — the "today" boundary), `daysBetween`, `formatDateOnly` / `formatTimeOnly` (date/time-only `@db.Date`/`@db.Time` fields are bare calendar/clock values → formatted in UTC, never timezone-shifted).

**Client List (US-2.3/2.9/2.10/2.11) — server-rendered, URL-driven (ADR-047):** `lib/clients/list.ts` runs one gym-scoped `client.findMany` (name search + archived applied in SQL) + an `attendance.groupBy` aggregate, derives every row, then chip-filters / sorts / paginates in memory (single-gym scale; the derived predicates aren't expressible as plain SQL). Per-chip default sort (walk-in-only → visits desc, at-risk → absence desc, else name asc), overridable via sortable Name/Expiry headers (`aria-sort`). Page size 25. UI: server `ClientFilterChips` (8 chips) + `ClientsTable` (sort headers + pagination as `<Link>`s) + client `ClientsToolbar` (debounced search + show-archived) + client `ClientRowActions` (⋯ → View / Edit / Archive·Reactivate). Archived rows greyed; empty state distinguishes "no clients" vs "no match". `search-params.ts` is the one URL parse/serialize helper (importable by server + client; sort guard split into prisma-free `sort.ts` so the client toolbar doesn't bundle Prisma).

**Register / Edit (US-2.1/2.2) + duplicate warning:** `ClientFormDialog` (RHF + zod `client-schema.ts`, shared with the Server Action). `createClient` / `updateClient` / `archiveClient` / `reactivateClient` (`actions.ts`, `"use server"`) — all gym-scoped (`updateMany where {id, gymId}`), all re-validate server-side (TECH-STACK rule 10). Non-blocking fuzzy duplicate check (`lib/clients/duplicate.ts` — normalized case/spacing/diacritics/word-order/nesting) returns candidates; the dialog shows a warning + "Register anyway" (`force`). `date_registered` set to `gymToday()`.

**Client Profile (US-2.4/2.5/2.6/2.10) — `clients/[id]/page.tsx`:** header (type + status badges; **at-risk intentionally NOT shown here per US-2.11**), quick-stats strip (total visits · this-month · member expiry-countdown / walk-in conversion signal · last visit), details card, context-aware membership button (Add / Renew / Renew early — **disabled, the actual flows are M3**), ⋯ menu (reuses `ClientRowActions` with `showView={false}`). URL-driven tabs (§14.4): Membership History (reads real records, derived per-row status, Cancelled + VOID badges) and Attendance History (recent check-ins; **date-range / visit-type filters deferred to the Attendance module, M4**). Malformed (non-UUID) ids → 404 (guarded before the `@db.Uuid` query, which would otherwise 500).

**Shared components built once (DESIGN-SYSTEM §16):** `StatusBadge` / `ClientTypeBadge` / `AtRiskBadge` (§3.4 — label + icon + color, never color alone), `EmptyState`, and shadcn `badge` / `table` / `alert-dialog` (new-york, Radix). Added on-canvas semantic foreground tokens `--success/warning/danger/info/primary-on` to `globals.css` (the values were already specified in DESIGN-SYSTEM §3.3 "text/icon on canvas" — just not yet implemented) so subtle-surface badge text stays AA; noted in §3.3.

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (18/18) · `pnpm build` ✓ (`/clients`, `/clients/[id]` server-rendered). **Runtime smoke (dev, Neon, seeded owner):** unauth `/clients` → 307 `/login`; authed list 200; inserted a walk-in (visited today) + a member (active membership, no attendance) and confirmed by profile-link id that walk-in-only shows only the walk-in, at-risk only the member, active both, expired neither; both profiles render (membership history ₱1,000.00 / expiry Jul 26; attendance 9:30 Jun 26 + conversion signal); malformed & missing-uuid ids → 404. Smoke data removed afterward.

**Doc sync:** DECISIONS (ADR-047), TECH-STACK (State Management), DESIGN-SYSTEM (§3.3, §14.4, §19), ROADMAP (Milestone 2 boxes), SESSION_HANDOFF, memory.

**Notes / deferrals:** Attendance-tab filters → M4; membership Add/Renew/Cancel flows + per-plan pricing → M3; fuzzy duplicate match is intentionally lenient (warn-only). Table is server-rendered URL-driven rather than the client TanStack `DataTable` (ADR-047 rationale) — revisit when a view needs live client-side table interactivity.

---

## [#019] Milestone 1 — Settings module (US-1.2/1.3/1.4/1.7/1.8/1.9) — Milestone 1 COMPLETE — 2026-06-26

**Commit:** _(Done)_

**Purpose:** Build the Settings module — gym configuration and the operational thresholds the rest of the system reads. This is the **last unit of Milestone 1 (Foundation & Auth), which is now complete.**

**What was built (all on the single `Gym` row, scoped by session `gymId`):**

- **Gym Information (US-1.2):** name, address, contact info, **timezone** — a searchable IANA combobox (`timezone-combobox.tsx`, ~400 zones from `Intl.supportedValuesOf`, validated server-side). Timezone governs all date/time display and "today" math (ADR-035).
- **Pricing (US-1.3):** default walk-in fee only (no gym-level membership fee — ADR-039). Copy notes it affects future transactions only (snapshots never rewritten — ADR-003).
- **System Preferences (US-1.4/1.7/1.8/1.9):** expiring-soon, walk-in inactivity, at-risk member, and walk-in conversion thresholds. All validated **≥ 1** (zero/negative blocked, per the stories).
- **Membership Plans** (US-3.9) intentionally **deferred to Milestone 3** (not in M1 scope).

**Architecture:**

- `src/lib/gym.ts` — `getSessionGymId()` / `getCurrentGym()` (resolve the tenant gym from the session; every gym-scoped query keys off `gym_id` — ADR-001/025).
- `settings-schema.ts` — one Zod schema shared by the client form and the Server Action. `updateGymSettings` (`actions.ts`, `"use server"`) **re-validates server-side** before `prisma.gym.update` (TECH-STACK: never trust the UI), then `revalidatePath`.
- `settings-form.tsx` — React Hook Form + zodResolver, three Card sections, one Save; `sonner` toast on success. Numeric fields stay numeric in form state (NaN on empty) so the schema's input/output types match the RHF resolver (no `z.coerce`).
- `(app)/layout.tsx` now mounts `<Toaster />`. shadcn additions: `form`, `popover`, `command`, `sonner` (+ `dialog` as a command dep). Fixed shadcn's `sonner.tsx` to drop the `next-themes` dependency (we're dark-first via a class) — hardcoded `theme="dark"`.

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (2/2) · `pnpm build` ✓ (`/settings` renders the form). **Runtime smoke (dev):** sign-in 200; `/settings` 200 showing all three sections + seeded values (`Asia/Manila`, fee, thresholds) + Save. Write path is a type-checked validate-then-update.

**Doc sync:** ROADMAP — all Milestone 1 boxes ticked (**M1 complete**); SESSION_HANDOFF (M1 done, next = Milestone 2 Client Management); memory.

**Notes:** zod v4 error param is `{ error: ... }` (not `{ message }`) for base-type messages. Settings save uses one form/one action across all three sections (simplest cohesive write of one row); per-section saves can be split later if desired.

---

## [#018] Milestone 1 — Authenticated app shell (8-entry navigation) — 2026-06-26

**Commit:** _(Done)_

**Purpose:** Build the app shell — the authenticated layout and 8-entry navigation every signed-in screen lives inside (INFORMATION-ARCHITECTURE.md, DESIGN-SYSTEM §5.4/§12). Replaces the placeholder dashboard header.

**What was built:**

- **Route group `src/app/(app)/`** with a shared, session-checked layout (`(app)/layout.tsx` — authoritative `auth.api.getSession`, redirect to `/login` if absent; wraps everything in `TooltipProvider`). Moved the dashboard into it; added placeholder pages for the other seven areas (clients, attendance, payments, pos, inventory, reports, settings) — each a `PageHeader` + its delivery milestone. Route group parentheses keep URLs clean (`/dashboard`, `/clients`, …).
- **Topbar** (`components/app-shell/topbar.tsx`) — 56px, sticky `z-20`; gym wordmark left, **user menu** right (`user-menu.tsx`: dropdown with name/email/role + **Log out**, kept out of the nav per §12).
- **Sidebar** (`app-sidebar.tsx`) — desktop (`md+`), 8 entries (icon + label), active state = indigo left-accent bar + `--sidebar-accent` fill + `--sidebar-primary` text. **Collapsible** 240px ⇄ 64px icon rail (tooltips on the rail) via a small Zustand store (`sidebar-store.ts`).
- **Mobile bottom nav** (`mobile-nav.tsx`) — `< md`; the 4 highest-frequency entries (Dashboard · Clients · Attendance · POS) + a **More** sheet for the rest (§12). No mixed nav patterns.
- **Shared components:** `lib/nav.ts` (single nav-items source of truth + `isNavItemActive`), `components/page-header.tsx` (h1 + optional single primary action, §5.4). shadcn additions: `dropdown-menu`, `sheet`, `tooltip`.

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (2/2) · `pnpm build` ✓ (all 8 nav routes compile, dynamic/server-rendered; `/login` static; middleware 70.7 kB). **Runtime smoke (dev):** `/login` 200; unauthenticated `/dashboard` → 307 `/login`; sign-in 200; authenticated `/dashboard` + `/settings` 200 with all 8 nav entries rendered.

**Doc sync:** SESSION_HANDOFF (app shell done, next = Settings); ROADMAP/README/CLAUDE.md status (project setup marked complete; ADR range → ADR-046) — these status corrections, previously left uncommitted, are folded into this commit. Memory updated.

**Notes:** Sidebar collapse state is not persisted across reloads at MVP (can add `zustand/persist` later). The Dashboard page re-reads `getSession` for its greeting (in addition to the layout's check) — acceptable; Better Auth cookie-caches sessions. Full Dashboard content arrives in Milestone 8.

---

## [#017] Milestone 1 — Better Auth: owner login, session, route protection (US-1.1) — 2026-06-26

**Commit:** _(Done)_

**Purpose:** Implement authentication — owner login by username + password, server-managed sessions, and default-deny route protection (US-1.1, Flow 1). First protected area (a placeholder Dashboard) and the owner seed.

**Key decision — ADR-046 (owner-approved):** Better Auth's real architecture differs from what ADR-043 assumed. I read Better Auth 1.6.20's core schema in `node_modules` and confirmed: credential hashes live in a separate **`account`** table (not on `User`), and the user model requires `name`/`email`/`email_verified`. Surfaced the conflict, did a Change Impact Analysis, and the owner chose **adopt the native schema + new ADR-046** (over forcing `password_hash` onto `User`) and **seed a real owner email**. ADR-046 supersedes only the `password_hash`-on-`User` clause of ADR-043; the rest of ADR-043 (one canonical user, `gym_id`/`role` additional fields, `{ userId, gymId, role }` session) stands.

**Schema (migration `20260626151816_add_better_auth`):**

- **`User` reworked:** dropped `password_hash`; added Better Auth core fields `name`, `email` (unique), `email_verified`, `image`, and username-plugin `username` (unique) / `display_username`. `gym_id`/`role` retained as additional fields.
- **Added `Session`, `Account`, `Verification`** (Better Auth-owned). `account.password` holds the credential hash. These are the **documented exception to `gym_id`-everywhere** (ADR-001/025) — auth infra; tenancy via `User.gym_id`. UUID PKs via `@default(uuid(7))` + `advanced.database.generateId = false` (keeps ids consistent with domain FKs to `User.id`).
- Migration generated with `prisma migrate diff --from-config-datasource --to-schema` and applied via `migrate deploy` (Prisma 7's `migrate dev` is interactive-only and refuses non-interactive runs once a warning is present). An empty stray migration folder from a first wrong-flags attempt was removed from disk and `_prisma_migrations`.

**Auth wiring:**

- `src/lib/auth.ts` — `betterAuth` with `prismaAdapter`, `emailAndPassword` (sign-up disabled), `username()` plugin, `gymId`/`role` additional fields (server-managed, not client input), `generateId = false`.
- `src/lib/auth-client.ts` — React client + `usernameClient`. `src/app/api/auth/[...all]/route.ts` — `toNextJsHandler`.
- `src/middleware.ts` — optimistic edge cookie check (`getSessionCookie`): redirects unauthenticated → `/login`, authenticated-on-`/login` → `/dashboard`; allow-lists `/api/auth` + static. `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` added to `.env`.
- `src/app/login/` — login page + client form (react-hook-form + zod), **generic error** ("Invalid username or password" — no username-existence leak, US-1.1).
- `src/app/dashboard/` — layout does the **authoritative** server-side `auth.api.getSession` check (redirects if absent) + logout; placeholder dashboard page. Root `/` redirects to `/dashboard`. (Full 8-entry nav shell is the next step.)
- `prisma/seed.ts` (+ `db:seed` script, `tsx` devDep, `prisma.config` seed) — idempotently creates the gym + owner; hashes via Better Auth's own hasher and writes the matching credential `account` row. Env-parameterized (`SEED_OWNER_*`, `SEED_GYM_*`).

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (2/2) · `pnpm build` ✓ (routes: `/login` static, `/dashboard` dynamic, `/api/auth/[...all]`, middleware 70.7 kB). **Live auth round-trip on Neon:** seeded owner → `auth.api.signInUsername` returns `role=OWNER` + `gymId` in the session; wrong password rejected `UNAUTHORIZED`. Placeholder seed data then removed so the owner seeds with their real email/password.

**Doc sync:** ADR-046 (DECISIONS.md); DOMAIN-MODEL.md (`User` reworked + Session/Account/Verification section); TECH-STACK.md (Auth Standards); CLAUDE.md (ADR range → ADR-046, Better Auth quick-ref); SESSION_HANDOFF + ROADMAP (US-1.1 ticked) + memory.

**Owner action before first login:** run `pnpm db:seed` with `SEED_OWNER_EMAIL` / `SEED_OWNER_USERNAME` / `SEED_OWNER_PASSWORD` (and optionally `SEED_GYM_NAME` / `SEED_GYM_TIMEZONE`) set to real values. The seed is idempotent (skips if any user exists).

**Notes:** `tsx` added (devDep) to run the TS seed against the ESM-generated Prisma client; `esbuild` added to the pnpm build allowlist (`pnpm-workspace.yaml`) for tsx. Better Auth's `verification` table is unused at MVP (reserved for future email flows, US-1.6 P2).

---

## [#016] Milestone 1 — Domain schema, first migration, Prisma client singleton — 2026-06-26

**Commit:** _(Done)_

**Purpose:** Author the full domain schema (the step deferred at the end of `#015`), provision against the now-live Neon database, run the first migration, and stand up the runtime Prisma client. This is the data foundation every later milestone builds on.

**What was done:**

- **`prisma/schema.prisma` — 11 domain entities** authored faithfully to `docs/DOMAIN-MODEL.md`: `Gym`, `User`, `Client`, `MembershipPlan`, `Membership`, `Attendance`, `ProductCategory`, `Product`, `InventoryTransaction`, `Transaction`, `TransactionLineItem`, plus 10 enums (`Role`, `ProductType`, `VisitType`, `InventoryTransactionType`, `AdjustmentReasonCategory`, `TransactionType`, `TransactionStatus`, `PaymentMethod`, `VoidReasonCategory`, `ItemType`). ADRs honored: `gym_id` on every entity incl. children (ADR-001/025); derived status fields **not** stored (ADR-002/017/040 — no `status` columns on Client/Membership); price/cost snapshots (`price_paid`, `unit_price`, `cost_price_snapshot`) (ADR-003/026); soft delete via `deleted_at` on Client/Product (ADR-005); `MembershipPlan.is_active` retirement flag (not soft delete); unified `Transaction` + enums (ADR-006); structured audit-category enums incl. system-only `FORCED_SALE` (ADR-028/034); membership self-FK `renewed_from_membership_id` + soft cancel `cancelled_at`/`cancellation_reason` (ADR-040/041); nullable `membership_plan_id` for ad-hoc custom (ADR-015). UTC `DateTime`, `@db.Date` for calendar dates, `@db.Time` for clock times (ADR-035). **`Attendance.updatedAt` is a plain nullable field (not `@updatedAt`)** — it is the sole marker of a Flow 15 correction and must stay null otherwise (ADR-038).
- **Naming convention:** PascalCase models / camelCase fields in Prisma, mapped to snake_case columns + tables via `@map`/`@@map` (keeps DB-level RLS policies readable for the SaaS path). UUID v7 PKs (`@default(uuid(7)) @db.Uuid`) for index locality. Money/quantities `Decimal(12,2)`. Indexes on `gym_id`, FKs, and key query columns (`(gym_id, deleted_at)`, `(client_id, end_date)`, `(gym_id, visit_date)`, `(gym_id, transaction_date)`).
- **First migration** `20260626060051_init` created and applied to **Neon** (Singapore, `ap-southeast-1`) — 11 tables + 10 enum types. Verified: `prisma validate` ✓, table/enum counts ✓, and a live runtime round-trip (`prisma.gym.count()`) ✓.
- **Prisma client singleton** `src/lib/prisma.ts` — globalThis-cached for dev hot-reload (TECH-STACK Backend Standards). Uses the **pooled** `DATABASE_URL` at runtime.
- **Database connection wiring (Prisma 7 model):** schema `datasource` declares only `provider`; connection URLs live in `prisma.config.ts` (CLI/migrations use the **direct** `DATABASE_URL_UNPOOLED`) and are passed to the runtime client constructor (pooled `DATABASE_URL`). `.env` now holds the real Neon pooled + unpooled strings.

**Tooling-drift decision (owner-informed; forced by the locked "Prisma latest" choice — mirrors the `#015` Next/shadcn pins):**

- **Prisma 7 requires a driver adapter** — the built-in URL-string engine connection is gone. Added **`@prisma/adapter-pg`** + **`pg`** (and `@types/pg`); the runtime client connects via `new PrismaPg({ connectionString })` against the Neon pooler. `pg` here is **Prisma's own required driver**, not a second query mechanism — it does not violate the TECH-STACK "no `pg`/`postgres`/`knex`" rule (which targets alternative query builders). The serverless-optimized `@prisma/adapter-neon` is a one-file swap if edge/serverless tuning is ever wanted. **No new ADR** (consistent with how `#015` handled version-forced tooling drift); documented in TECH-STACK.

**Doc sync:**

- **TECH-STACK.md:** Backend Standards "no `pg`" rule annotated with the Prisma-7 driver-adapter exception; Database Standards note added on the Prisma 7 connection model (schema = provider only; URLs in `prisma.config.ts`; runtime adapter with pooled URL, CLI with direct URL).
- **SESSION_HANDOFF.md:** updated — schema + DB + client singleton complete; Neon blocker resolved; next step = Better Auth (US-1.1).

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (2/2) · `pnpm build` ✓ (Next 15.5.19, 5 static routes, 113 kB First Load JS) · `prisma migrate` applied to Neon ✓ · runtime round-trip ✓.

**Notes:** `src/generated/prisma` remains gitignored (regenerated via `prisma generate`). `prisma/migrations/` **is** committed (permanent history, TECH-STACK). A `pg` SSL deprecation notice prints on connect (`sslmode=require` → `verify-full` in a future pg major) — informational, harmless for Neon now; revisit at the `pg` v9 upgrade.

**Next step:** Better Auth integration against the `User` table (ADR-043) — owner login US-1.1 — then the app shell and Settings module.

---

## [#015] Milestone 1 — Project setup & scaffold (first application code) — 2026-06-26

**Commit:** _(Done)_

**Purpose:** Initialize the application codebase — the first code in the repo. Scaffold Next.js + the locked stack, wire the design tokens, and stand up tooling, verified building. No product features yet (owner auth + Settings are the next Milestone-1 steps).

**Tooling-drift decisions (owner-confirmed; both honor the locked stack):**

- **Next.js pinned to 15.x.** `create-next-app@latest` now defaults to **Next 16** with 16-shaped configs; TECH-STACK locks 15.x. Regenerated a coherent Next 15 scaffold via `create-next-app@15` (→ next 15.5.19). Honors the lock and the stack's training-density rationale.
- **shadcn-on-Radix retained.** shadcn v4 now defaults to **Base UI** + preset themes; TECH-STACK + DESIGN-SYSTEM §11 specify **Radix / new-york / slate**. Pinned the classic `shadcn@2` CLI for init + component adds; removed the Base UI (`@base-ui/react`) and stray `shadcn` CLI deps the v4 preset had added.

**What was set up:**

- **Framework:** Next.js 15.5.19 (App Router, Turbopack dev/build), React 19.1, TypeScript strict, `src/` dir, `@/*` alias, pnpm 11.1.2 (`packageManager` pinned).
- **Approved dependencies (TECH-STACK):** `@prisma/client` + `prisma` (v7), `better-auth`, `zod` (v4), `react-hook-form` + `@hookform/resolvers`, `@tanstack/react-table`, `@tanstack/react-query`, `zustand`, `recharts`, `lucide-react`; shadcn companions (`radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`); dev: `prettier` + `prettier-plugin-tailwindcss`, `vitest`, `dotenv` (required by Prisma 7's `prisma.config.ts`). Playwright remains deferred (post-Milestone-3) per TECH-STACK.
- **Design tokens (`src/app/globals.css`):** authored from DESIGN-SYSTEM §3 — core slate/indigo tokens, semantic feedback (`--success/--warning/--info/--at-risk`), the §3.5 chart palette, radius scale, and `@theme inline` mapping. `:root` = light values, `.dark` = dark values, `<html class="dark">` default = dark-first. Geist Sans + Geist Mono via `next/font/google` (no extra dep).
- **shadcn/ui:** `components.json` (new-york, slate, lucide, RSC, `@/` aliases), `cn` util (`src/lib/utils.ts`), and the Radix `Button` (validates the add pipeline).
- **Prisma 7:** `prisma init` (postgresql); `prisma.config.ts` (dotenv, `DATABASE_URL`); generator `prisma-client` → `src/generated/prisma` (gitignored); `db:generate/migrate/deploy/studio` scripts.
- **Tooling:** `.prettierrc.json` + `.prettierignore` (docs/markdown excluded from formatting), `vitest.config.ts` (`@/` alias) + a `cn` smoke test, `pnpm-workspace.yaml` `allowBuilds` (Prisma engine, sharp, unrs-resolver), package.json scripts (`type-check`, `format`, `test`, `db:*`).
- **Env & placeholder:** `.env.example` with the documented variable set (Neon `DATABASE_URL`/`_UNPOOLED`, `BETTER_AUTH_*`, `R2_*`); a minimal dark-first home page exercising the tokens + Button.

**Doc sync:**

- **DESIGN-SYSTEM.md §3.1 + §16:** updated the theming-model wording to the implemented convention — `:root` (light) + `.dark` (dark) with a default `.dark` class for dark-first. **No token value changed**; dark-first result is identical. Supersedes the earlier literal "`:root` = dark / `.light` = override."

**Verification:** `pnpm type-check` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (2/2) · `pnpm build` ✓ (Next 15.5.19, static prerender, ~113 kB First Load JS).

**Deferred to the next step (Schema):** full `prisma/schema.prisma` domain models (11 entities), `prisma generate`, the Prisma client singleton (`src/lib/prisma.ts`), and the first migration. **Requires the owner** to provision a Neon Postgres project and set `DATABASE_URL` / `DATABASE_URL_UNPOOLED` before `prisma migrate` can run.

**Notes:** Not committed yet (awaiting owner). `.env`, `node_modules`, `.next`, and `src/generated` are gitignored. dotenv was added solely because Prisma 7's config file imports it — a tool necessity, not a new architectural choice.

---

## [#014] Design System hardening — enforceable SSOT + owner-confirmed language — 2026-06-25

**Commit:** _(Done)_

**Purpose:** Turn `DESIGN-SYSTEM.md` from a sound-but-under-specified spec into the enforceable single source of truth for all UI work, and re-validate the locked design language (ADR-045) with the owner against real alternatives. Documentation-only — no application code. **No new ADR; no token, color, font, scope, story, flow, or domain change.** The design language is unchanged — it is now elaborated and owner-confirmed.

**Method:** UI/UX Pro Max skill (audit + style/color/typography data) → 5-phase audit & rewrite → owner interview via AskUserQuestion (vibe / accent / theme / typography), challenging each against the energetic gym-app norm.

**Owner decisions (interview, all reaffirmed the locked language):**

- **Vibe:** operational instrument (rejected athletic energy, friendly).
- **Accent:** indigo (rejected orange/emerald/sky — each collides with an existing domain status hue: At-risk orange, Active/Success emerald, Info/Upcoming sky).
- **Theme:** dark-first (rejected light-first, auto).
- **Typography:** Geist Sans + Geist Mono (rejected warmer Poppins-style, technical IBM Plex/JetBrains).

**Changes by file:**

- **DESIGN-SYSTEM.md (REWRITTEN, 306 → ~612 lines):** Rebuilt into an enforceable SSOT. Preserved every normative token, the §3.4 status table, and the §3.5 Recharts palette verbatim. Added: §2 brand personality + measurable design goals; §5.3 12-column grid system; §6 elevation + z-index scale (new); §10 interaction-state matrix; §11 full component standards (buttons, inputs, select, cards, tabs, dialog/sheet, chips, command palette, **toasts/notifications**, tooltip/popover, **pagination/virtualization**, charts); §13.7 money/number/**date-time formatting** (all display in `Gym.timezone`, ADR-035); §13.8 mandatory empty/loading/error trio; §13.9 action-feedback/loading; §8 imagery + no-illustration policy; §12 navigation (mobile bottom nav = 4 + "More"); §14.4 URL-state for list filters; §17 per-workflow design coverage table (every screen → pattern + components — the Phase 4 cross-check); §18 AI implementation guidelines; §19 deferred/open items. §2.1 owner-confirmation callout added.
- **DECISIONS.md:** ADR-045 — **Confirmation (2026-06-25)** note appended (owner re-interrogated and reaffirmed; indigo is the only collision-free accent). No new ADR; ADR count unchanged at 42.
- **TECH-STACK.md:** Remaining Technology Decisions table — added **List-state mechanism (URL search params vs. Zustand)**, to resolve before Milestone 2; surfaces the §14.4/§19 recommendation as an open decision rather than a silent override.

**Decisions captured:** None new (no ADR). ADR-045 reaffirmed by the owner. One open decision recorded for Milestone 2 (list-state mechanism).

**Issues / Notes:**

- Intentionally did **not** edit README, ROADMAP, CLAUDE.md, USER-STORIES, USER-FLOWS, DOMAIN-MODEL, MODULE-SPECS, or INFORMATION-ARCHITECTURE — no scope, ADR count, story, flow, entity, or milestone changed. DESIGN-SYSTEM.md is a downstream consumer; its expansion stays faithful to those sources and introduces no contradiction. Verified no other document references the design system by section number (renumbering is safe).
- **Open question for the owner:** adopt URL search params for list filter/sort/page/tab/period state (DESIGN-SYSTEM §19 / TECH-STACK open decisions)? If yes → new ADR + TECH-STACK State Management update.

**Planning Phase Status:** Complete. Design System is now the enforceable, owner-confirmed UI SSOT. Next step: implementation — Milestone 1 (project scaffold, owner auth, settings), starting with `schema.prisma`.

---

## [#013] Design System — DESIGN-SYSTEM.md + ADR-045 — 2026-06-25

**Commit:** _(Done)_

**Purpose:** Establish the visual and interaction language for Block23 Gym V2 before implementation. Documentation-only — no application code.

**New ADR:**

- **ADR-045 — Design language:** dark-first, professional **indigo** accent (`indigo-500` dark / `indigo-600` light) on neutral **slate** chrome; semantic emerald/amber/red/sky (at-risk = orange, distinct from amber "expiring soon"); **Geist Sans + Geist Mono** (tabular money/numbers); shadcn `new-york` / base color `slate` / lucide icons; tokens delivered as CSS variables so theme is a values flip. Rejected energetic-orange/lime, emerald-primary (collides with success), and light-only.

**New document:**

- **docs/DESIGN-SYSTEM.md (NEW):** Full design system — principles, dark-first theming model, color system (core tokens + dark/light values, semantic colors, the domain **status token table** with color+label+icon, Recharts palette, AA contrast commitments), typography (Geist + tabular figures, type scale), spacing/radius/layout (app shell, breakpoints, density), iconography, motion (with reduced-motion), the shadcn/ui **component inventory** mapped to every module surface, **core patterns** (status badge, KPI card, data table, filter chips, destructive confirmations, forms/validation, money/number formatting, empty/loading states, Check-In & POS), the concrete WCAG 2.1 AA application, and Tailwind v4 / shadcn implementation notes.

**Decisions captured (user-selected):**

- Brand: **Professional SaaS (indigo)** on neutral slate.
- Theme: **Dark-first** (light is a first-class secondary via the same CSS-variable tokens).

**Changes by file:**

- **DECISIONS.md:** ADR-045 appended.
- **README.md:** Current Phase → "Planning, tech stack, and Design System complete — ready for implementation (Milestone 1)"; ADR count → 42 (ADR-001–045); DESIGN-SYSTEM.md added to the documents table.
- **CLAUDE.md:** Project Status updated; DESIGN-SYSTEM.md added to the Planning Documents table; Locked Decisions intro ADR range → ADR-045; ADR-045 entry added to Locked Design Decisions.

**Issues / Notes:**

- The design system specifies the _system_, not application component code — implementation follows TECH-STACK rules (Server Components, shadcn primitives, Tailwind utilities, tokens from CSS variables).
- Deferred within the design system: user-facing theme toggle, logo/wordmark (text placeholder for now), compact-density default, a light-mode data-viz contrast re-check, and a print stylesheet for reports.
- Recorded ADRs: 41 → 42 (highest number 045; 030–032 intentionally unused).

**Planning Phase Status:** Complete. Design System defined. Next step: implementation — Milestone 1 (project scaffold, auth, settings), starting with `schema.prisma`.

---

## [#012] Architecture Readiness Patch — Pre-Design-System — 2026-06-25

**Commit:** _(Done)_

**Purpose:** Resolve all findings from the Architecture Readiness Review (2 critical, 5 high, 6 medium, 4 low) before the Design System phase. Documentation-only changes — no application code. Five new ADRs, one new planning document, one new P0 story, three new user flows.

**New ADRs:**

- **ADR-040 — Canonical "in-effect" membership definition, `Membership.status` states, and renewal date math:** One canonical in-effect test (`start_date ≤ today ≤ end_date`) replaces the old `end_date >= today` used in the `Membership.status` derivation and the no-overlap invariant. `Membership.status` = `UPCOMING` / `ACTIVE` / `EXPIRED`. No-overlap restated as "at most one in-effect membership" (one ACTIVE + N UPCOMING is valid). Unified renewal math: `start_date = max(today, latest_end_date + 1 day)`, `end_date = start_date + duration_days`. Resolves CB-1 and H-2.
- **ADR-041 — Membership cancellation (soft):** `Membership.cancelled_at` + `cancellation_reason` soft-cancel an erroneous membership; excluded from all derivations, never blocks a new membership, retained with a "Cancelled" badge; independent of payment void; no free edit (cancel + recreate). Resolves H-1.
- **ADR-042 — Information Architecture & navigation:** Eight top-level nav entries; Membership is a distributed capability with no standalone nav entry; the phantom "membership list" screen is realized by Client List chips + US-8.6. Resolves CB-2.
- **ADR-043 — Better Auth integration with the domain `User`:** Better Auth uses the domain `User` table with `gym_id`/`role` as additional fields; no parallel user table; session = `{ userId, gymId, role }`. Resolves H-4.
- **ADR-044 — Accessibility baseline:** WCAG 2.1 AA target with keyboard/focus/contrast/color-independence/motion requirements feeding the Design System tokens. Resolves H-3.

**New document:**

- **docs/INFORMATION-ARCHITECTURE.md (NEW):** Authoritative top-level navigation (8 entries), per-area screen map, "where Membership lives" table, cross-area deep links, and responsive adaptation. The app-shell input for the Design System (ADR-042). Resolves CB-2.

**Changes by file:**

- **DECISIONS.md:** ADR-040 through ADR-044 appended. Numbering note added explaining the intentional ADR-030–032 gap (M-5).
- **DOMAIN-MODEL.md:** Membership entity — `cancelled_at` + `cancellation_reason` added; `membership_plan_id` note clarified (null = ad-hoc custom, M-3); status derivation rewritten to UPCOMING/ACTIVE/EXPIRED; no-overlap invariant restated; renewal date math note added (ADR-040). Client entity — `client_type` and status derivation exclude cancelled memberships; `date_registered` vs `created_at` clarified (L-1). Attendance — `fee_charged` marked denormalized; "single source of truth" note added (M-2). Transaction — `transaction_date` vs `created_at` clarified (L-1). InventoryTransaction — `reference_transaction_line_item_id` reversal-traceability note added (L-4).
- **MODULE-SPECS.md:** Architecture Readiness Patch banner added. Module 1 — Active Members KPI and Frequent walk-ins populations tightened (ADR-040, M-6). Module 3 — Create custom-duration clarified; Cancel Membership section added; Monitor Expiration reconciled to chips + US-8.6 (ADR-042); business rules rewritten for canonical in-effect/renewal/cancellation; edge cases expanded. Module 6 — Product Management cross-referenced Flow 20. Module 7 — Manual Adjustment cross-referenced Flow 19; shrinkage zero-sales edge added (L-2).
- **USER-STORIES.md:** Architecture Readiness Patch banner added. US-2.10 / US-2.11 populations & chip set corrected (M-1, M-6). US-3.2 renewal math, US-3.3 custom-duration ACs updated (ADR-040, M-3). US-3.10 (NEW P0) Cancel Membership. US-7.8 zero-sales edge (L-2). US-8.22 "Custom (ad-hoc)" wording (M-3). Summary table: Membership 7 → 8, Total 79 → 80.
- **USER-FLOWS.md:** Architecture Readiness Patch banner added. Flow 5 custom-duration option clarified. Flow 6 renewal math updated (ADR-040). Flow 11 reversal traceability note (L-4). New flows: Flow 18 (Cancel Membership), Flow 19 (Manual Inventory Adjustment), Flow 20 (Product Management). Flow count 17 → 20.
- **ROADMAP.md:** Milestone 3 — renewal math reference updated, custom-duration clarified, history badges noted, US-3.10 (Cancel Membership) added.
- **TECH-STACK.md:** Better Auth integration paragraph added (ADR-043). New Accessibility Standards section (ADR-044). New consolidated Non-Functional Requirements section (L-3).
- **README.md:** Current Phase corrected ("tech stack selected — ready for the Design System"); ADR count corrected to 41 (ADR-001–044, 030–032 unused); story count 80, flow count 20; INFORMATION-ARCHITECTURE.md added to the documents table; Tech Stack section populated (was "To be decided") (H-5).
- **CLAUDE.md:** Planning Documents table — INFORMATION-ARCHITECTURE.md added. Locked Decisions intro ADR range → ADR-044. Five new Locked Decision entries (ADR-040–044). Domain Model Quick Reference — Membership line updated (status states, cancellation, nullable plan). Key Business Rules — renewal math, creation blocking, and cancellation-vs-void rules updated.

**Decisions made:**

- ADR-040: Canonical in-effect membership definition, Membership.status states, unified renewal math
- ADR-041: Soft membership cancellation for erroneous records
- ADR-042: Information architecture & top-level navigation; Membership is distributed
- ADR-043: Better Auth integration with the domain User entity
- ADR-044: Accessibility baseline — WCAG 2.1 AA

**Issues / Notes:**

- All review findings (CB-1, CB-2, H-1–H-5, M-1–M-6, L-1–L-4) are resolved. No application code exists yet.
- Total MVP story count: 79 → 80. User flows: 17 → 20. Recorded ADRs: 36 → 41 (highest number 044; 030–032 intentionally unused).
- `Membership.cancelled_at` / `cancellation_reason` are the only new schema fields; both are nullable and additive. No backfill required.
- Next step: DESIGN-SYSTEM.md, with INFORMATION-ARCHITECTURE.md and the TECH-STACK accessibility/NFR baselines as inputs.

**Planning Phase Status:** Complete. Architecture Readiness Review findings cleared. Next step: Design System.

---

## [#011] Technology Stack Finalized — 2026-06-25

**Commit:** _(Done)_

**Changes from previous commit:**

- **docs/TECH-STACK.md (NEW):** Technology stack document created as the single source of truth for all technology decisions. Contains: Executive Summary, Technology Decision Matrix, Architecture Guidelines (Frontend, Backend, Database, Auth, State Management, Storage, Deployment, Testing), Development Rules (19 domain/architecture rules + 5 tooling rules), Rejected Technologies (Drizzle ORM, Auth.js, Railway), Future Architecture Considerations, Claude Code Guidance, and Remaining Decisions table.

- **docs/TECH-STACK.md — Five supplementary decisions resolved and added:**
  - **Package manager:** pnpm — faster installs, content-addressable store, native workspace support for future monorepo
  - **Testing framework:** Vitest — ESM-native, TypeScript-native, no Babel transform required; unit tests for Zod schemas, derived status logic, and Server Action business rules; integration tests against a Neon test branch
  - **E2E testing:** Playwright selected but deferred to post-Milestone-3; added once core flows are stable
  - **Linting & formatting:** ESLint (eslint-config-next) + Prettier + prettier-plugin-tailwindcss; eslint-config-next includes react-hooks plugin which catches App Router-specific bugs; tailwindcss plugin auto-sorts class order
  - **Connection pooling:** Neon built-in pooler over Prisma Accelerate — free, zero additional service, already part of the Neon setup; `DATABASE_URL` (pooled) for app runtime, `DATABASE_URL_UNPOOLED` (direct) for `prisma migrate deploy`

- **README.md:** TECH-STACK.md added to the Project Documents table.

- **CLAUDE.md:** Project status updated from "Planning phase" to "Tech stack selected — ready for Design System and implementation." TECH-STACK.md added to the Planning Documents table.

**Decisions made:**

- Full technology stack approved (see TECH-STACK.md Section 2 — Technology Decision Matrix)
- pnpm as package manager
- Vitest for unit and integration testing; scope: Zod schemas, derived status logic, Server Action business rules, Prisma query integration against Neon test branch
- Playwright deferred to post-Milestone-3
- ESLint (eslint-config-next) + Prettier + prettier-plugin-tailwindcss
- Neon built-in connection pooler (not Prisma Accelerate)

**Planning Phase Status:** Complete. Tech stack finalized. Next step: DESIGN-SYSTEM.md.

---

## [#010] Blocker Resolution Patch — Pre-Tech-Stack Planning Complete — 2026-06-25

**Commit:** _(Done)_

**Purpose:** Resolve 7 planning blockers identified in the Planning Phase Exit Review (Log #009). All blockers were contradictions or undefined behaviors within the planning documents. No tech stack is selected yet — these are documentation-only changes.

**New ADRs:**

- **ADR-034 — Force Sale Inventory Category:** `FORCED_SALE` added as a system-assigned `adjustment_reason_category` value. Auto-populated by the Force Sale override flow; does not appear in the owner-facing manual adjustment selector. Keeps shrinkage analysis data clean.
- **ADR-035 — UTC Timestamp Storage with Gym-Local Display:** All `timestamp` fields stored in UTC. `Gym.timezone` (IANA identifier) governs display conversion and "today" boundary calculations. `date` and `time` fields (start_date, end_date, visit_date, time_in, time_out) stored as local values — no conversion needed.
- **ADR-036 — Dashboard Frequent Walk-Ins Panel Logic:** Panel always shows top 5 by visit count, no threshold filter. `Gym.walkin_conversion_prompt_visits` governs only: check-in conversion prompt, Attendance Analytics Walk-In Insights, and Frequent Walk-Ins Report.
- **ADR-037 — Upcoming Membership Status:** Fourth MEMBER client status added. Precedence: EXPIRING_SOON → ACTIVE → UPCOMING → EXPIRED. Eighth filter chip added to Client List. Creating a new membership is blocked for both active (redirect to Renew) and upcoming (informational block only) cases.
- **ADR-038 — visit_type Mutability Exception:** Updating `Attendance.visit_type` WALK_IN→MEMBER in Flow 7 is a business workflow mutation, not a data correction. `correction_note` and `updated_at` NOT set. Explicitly distinguished from Flow 15.
- **ADR-039 — Remove Gym.default_membership_fee:** Field was a holdover from pre-plan-catalog design. `MembershipPlan.default_price` is authoritative. `Gym.default_walkin_fee` retained.

**Changes by file:**

- **DECISIONS.md:** ADR-034 through ADR-039 appended. ADR-005 amended with note clarifying Product uses `deleted_at` (not `is_active`).
- **DOMAIN-MODEL.md:**
  - Gym entity: `default_membership_fee` removed; `timezone` field added.
  - Client entity: Derived status derivation updated — UPCOMING added as fourth status with full precedence order.
  - Attendance entity: `visit_type` marked mutable via Flow 7 only; mutation rule block added; `correction_note`/`updated_at` clarified as Flow 15 only.
  - Product entity: `is_active` replaced with `deleted_at` (nullable timestamp, soft delete per ADR-005).
  - InventoryTransaction entity: `FORCED_SALE` added to `adjustment_reason_category` enum with system-only note.
  - Cross-cutting design decisions: item 1 updated to reference `deleted_at` for both Client and Product; item 7 added for UTC timestamp storage.
- **USER-STORIES.md:** Blocker Resolution Patch banner added. US-1.2 updated (timezone field ACs). US-1.3 scoped to walk-in fee only. US-2.4 updated (Upcoming badge reference). US-2.9 updated (8 filter chips with all definitions). US-3.1 updated (dual blocking rule — active + upcoming). US-6.3 updated (`deleted_at` reference). US-8.21 updated (`deleted_at IS NULL` / `IS NOT NULL`). US-1.9 updated (Dashboard panel removed from threshold scope).
- **MODULE-SPECS.md:** Blocker Resolution Patch banner added. Module 1 (Dashboard): Frequent walk-ins panel note updated (top 5, no threshold). Module 2 (Clients): Filter chips updated to 8. Module 3 (Membership): Blocking rule updated for active + upcoming cases. Module 4 (Attendance): `visit_type` mutation business rule added. Module 6 (POS): Archive/soft-delete references updated to `deleted_at`. Module 7 (Inventory): `FORCED_SALE` documented as system-only. Module 8 (Reports): Slow-Moving/Dead Stock filter updated to `deleted_at IS NULL`. Module 9 (Settings): `timezone` added to Gym Information; `default_membership_fee` removed from Pricing; walk-in conversion threshold scope corrected.
- **USER-FLOWS.md:** Flow 7: ADR-038 mutation note added. Flow 8: Product grid updated to `deleted_at IS NULL`.
- **ROADMAP.md:** Milestone 1: timezone and walk-in-fee-only references updated. Milestone 2: Upcoming filter chip added. Milestone 3: Upcoming blocking case added. Milestone 6: Archive reference updated to `deleted_at`.
- **CLAUDE.md:** ADR count updated to ADR-039. Locked Decisions: ADR-034 through ADR-039 entries added. Domain Model Quick Reference: Gym entry added (timezone, no default_membership_fee); Product entry updated (deleted_at, not is_active); InventoryTransaction updated (FORCED_SALE). Key Business Rules: Walk-in conversion note updated with ADR-038; membership blocking rule updated with UPCOMING case; future-dated membership rule updated with UPCOMING status name.

**Decisions made:**

- ADR-034: Force Sale audit category (system-assigned, not owner-selectable)
- ADR-035: UTC storage with gym-local display via Gym.timezone
- ADR-036: Dashboard frequent walk-ins = top 5, no threshold filter
- ADR-037: Upcoming as fourth MEMBER status, dual blocking rule
- ADR-038: visit_type mutation in Flow 7 is a business workflow exception, not a data correction
- ADR-039: Gym.default_membership_fee removed in favor of MembershipPlan.default_price

**Planning Phase Status:** Complete. All 7 pre-tech-stack blockers resolved. Next step: Tech Stack Identification.

---

## [#009] Planning Phase Exit Review Patch + Device Strategy ADR — 2026-06-24

**Commit:** _(Done)_

**Changes from previous commit:**

- **DOMAIN-MODEL.md:**
  - `User` entity: `created_at` → `created_at / updated_at` for consistency with all other mutable entities (password changes and profile edits have no audit timestamp otherwise).
  - `MembershipPlan` entity: `created_at` → `created_at / updated_at` — plans are editable (US-3.9); price change history requires an `updated_at` for auditability.
  - `ProductCategory` entity: `created_at / updated_at` added — the only entity previously without timestamps; categories can be renamed (US-6.5).
  - `Attendance` entity: `updated_at` (nullable timestamp) added after `created_at`. Set to current timestamp when a correction is applied (Flow 15, US-4.11); null on all unedited records. **Resolves the BLOCKER identified in the Planning Phase Exit Review** — Flow 15 referenced `updated_at = now` but the entity definition did not include the field.

- **USER-STORIES.md:**
  - Design Review #7 banner added.
  - US-1.9 (NEW P0): Walk-In Conversion Prompt Threshold Setting — configurable in Settings → System Preferences with default of 5 visits. Governs the check-in conversion prompt (US-4.2, Flow 4), Dashboard "Frequent walk-ins" panel, Attendance Analytics Walk-In Insights (US-4.10), and Frequent Walk-Ins Report (US-8.8). Closes the gap: `Gym.walkin_conversion_prompt_visits` was referenced in 4 documents but no user story governed its configuration.
  - US-4.11 (NEW P0): Attendance Record Correction — same-day `time_in` edit only; required reason note stored in `Attendance.correction_note`; `Attendance.updated_at` set on save; prior-day records read-only; confirmation dialog required; no deletion permitted. Closes the gap: Flow 15 and the Roadmap item both existed but no acceptance criteria existed for the feature.
  - Summary table updated: Auth & Settings 6 → 7 P0; Attendance 8 → 9 P0; Total 77 → 79 P0.

- **DECISIONS.md:**
  - ADR-033 added: Device Target Strategy — desktop-first design; mobile-responsive support required for owner monitoring workflows (Dashboard, check-ins, revenue, inventory alerts); tablet is not a primary target; no native mobile app in scope. Rejected: tablet-first design; native mobile app.

- **MODULE-SPECS.md:**
  - Design Review #7 banner added.
  - Attendance module — Record Correction spec updated: references US-4.11 and `Attendance.updated_at` set on save; prior-day edit action not displayed (previously said "read-only" without specifying that the edit action is hidden).
  - Attendance module — Business Rule updated: Correction rule now references `Attendance.updated_at` and US-4.11.
  - Settings module — System Preferences list updated: each threshold now cross-references its governing user story; walk-in conversion prompt threshold now cites US-1.9 with a description of all surfaces it governs.

- **ROADMAP.md:**
  - Milestone 1: US-1.9 added (walk-in conversion prompt threshold setting).
  - Milestone 4: Attendance record correction item updated to reference US-4.11 and `Attendance.updated_at`.

- **CLAUDE.md:**
  - ADR count updated: ADR-001 through ADR-029 → ADR-001 through ADR-033.
  - Locked Design Decisions: ADR-033 (Device Target Strategy) entry added.
  - Domain Model Quick Reference — Attendance entry updated: `correction_note` and `updated_at` added with their constraints.

**Decisions made:**

- ADR-033: Device Target Strategy — desktop-first, mobile-responsive (see DECISIONS.md for full rationale and rejected alternatives)

**Issues / Notes:**

- All four domain model timestamp fixes are consistency patches only — no business rules, flows, or report derivations are affected.
- The `Attendance.updated_at` BLOCKER is resolved: the entity definition and Flow 15 are now consistent.
- US-1.9 and US-4.11 close all story coverage gaps identified in the Planning Phase Exit Review. Block23GymV2 is now cleared for exit from the Planning Phase.
- Next phases: tech stack selection (ADR-030 through ADR-032), ERD design, Design System.

---

## [#008] Reports Module Expansion — Design Review #6 — 2026-06-24

**Commit:** _(Done)_

**Changes from previous commit:**

- **DECISIONS.md:**
  - ADR-029 added: Reports Module Scope Expansion — Second Pass. Eight new P0 reports, annual revenue period, US-8.5 full ACs. Closes compliance gaps in ADR-020 and ADR-028 (void pattern detection was cited as a primary benefit but no report implemented it). Zero schema cost — all reports derive from existing fields.

- **DOMAIN-MODEL.md:**
  - `Membership.renewed_from_membership_id`: note updated — NULL = new membership, NOT NULL = renewal; cross-referenced to US-8.16 and US-8.19.
  - `InventoryTransaction.total_restock_cost`: note updated — aggregated by period in Restock Cost Report (US-8.18); null entries excluded from totals.
  - `Transaction.void_reason_category`: note updated — primary data source for Void Analysis Report (US-8.15), which delivers the pattern-detection benefit stated in ADR-028.

- **USER-STORIES.md:**
  - Design Review #6 banner added.
  - US-8.2 updated: period selector expanded to include This Year and Custom Date Range; acceptance criteria added.
  - US-8.5 updated: single-sentence story replaced with full acceptance criteria — period selector, member vs. walk-in breakdown columns, period-over-period comparison toggle, CSV export.
  - US-8.7 updated: acceptance criteria added — slow-moving ascending sort option; cross-reference to US-8.21.
  - US-8.15 (NEW P0): Void Analysis Report — voided transactions by void_reason_category and period; summary + detail sections; filterable by transaction type.
  - US-8.16 (NEW P0): New vs. Renewals Report — new memberships vs. renewals per period; renewal rate %; filterable by membership plan.
  - US-8.17 (NEW P0): Membership Plan Performance Report — per plan: memberships sold, total revenue, average price paid, plan status; limitation note on default-price comparison.
  - US-8.18 (NEW P0): Restock Cost Report — period-total inventory spend from InventoryTransaction.total_restock_cost; null entries excluded with count noted.
  - US-8.19 (NEW P0): Membership Net Change Report — new + renewals − expired per month; running cumulative active count; green/red net-change indicator.
  - US-8.20 (NEW P0): Period-over-Period Revenue Comparison — current vs. prior period side-by-side by source; % change column; four period presets + custom.
  - US-8.21 (NEW P0): Slow-Moving / Dead Stock Report — active products with zero sales in a 30/60/90-day lookback window; cost value locked in stock; longest-inactive first.
  - US-8.22 (NEW P0): Converted Walk-Ins Report — clients converted from walk-in to member (ADR-020 derivation) in period; conversion timeline; pre-conversion visit count; summary row.
  - Summary table updated: Dashboard & Reports 13 → 21 P0; Total 69 → 77 P0.

- **MODULE-SPECS.md:**
  - Design Review #6 banner added.
  - Module 8 (Reports) MVP Scope: Revenue Reports period options updated (This Year / Custom Range added). Attendance Reports spec fully rewritten with member/walk-in columns, period-over-period toggle, and CSV export. Best Sellers updated with slow-moving sort reference. Eight new report bullets added (US-8.15 through US-8.22).
  - Business Rules: eight new rules added covering void analysis derivation, new vs. renewals derivation, converted walk-ins derivation, period-over-period voided exclusion, restock cost null handling, and plan performance limitation.
  - Edge Cases: eleven new edge cases added covering zero-data states for all new reports.

- **ROADMAP.md:**
  - Milestone 8: Revenue reports item updated (This Year / Custom Range). Attendance reports item updated (full spec). Best sellers item updated (slow-moving sort). Eight new Milestone 8 items added (US-8.15 through US-8.22).

**Decisions made:**

- Reports Module expanded with eight new P0 reports; annual revenue period and full attendance report ACs added — ADR-029

**Issues / Notes:**

- US-8.17 (Membership Plan Performance): `price_paid` is snapshotted (ADR-003) but the plan's `default_price` at time of sale is not stored. The "average price paid" comparison uses the plan's current `default_price`, which may differ if the owner later edited the plan. The report surfaces this limitation explicitly in the UI. If precise override tracking is needed, a `default_price_at_purchase` field on `Membership` would resolve it — deferred to Phase 2.
- All eight new reports derive from existing schema fields with zero new entities, migrations, or field additions required.
- US-8.22 (Converted Walk-Ins) uses the ADR-020 derivation query — the same definition used in US-8.8 (Frequent Walk-In candidates), US-2.10 (profile conversion signal), and the Attendance Analytics Walk-In Insights panel. All four surfaces must stay consistent in their derivation logic.

---

## [#007] Payments, POS & Inventory Module Review — Design Review #5 — 2026-06-24

**Commit:** _(done)_

**Changes from previous commit:**

- **DECISIONS.md:**
  - ADR-026 added: `cost_price_snapshot` on `TransactionLineItem` — extends ADR-003's price-snapshot principle to cost price; historical gross profit figures must not be rewritten by future cost changes.
  - ADR-027 added: Whole-Container Sale Mode for `SERVING_BASED_PRODUCT` — `container_selling_price` field enables Per Container POS mode; rejected separate STANDARD_PRODUCT workaround.
  - ADR-028 added: Void Reason Category Enum on `Transaction` — `void_reason_category` enum replaces free-text-only void note; `void_reason` renamed to `void_reason_note` (now optional detail field).

- **DOMAIN-MODEL.md:**
  - `Product` entity: added `container_selling_price` (nullable decimal, SERVING_BASED_PRODUCT only; ADR-027) and `reorder_point` (nullable int; distinct from `low_stock_threshold`). Updated `cost_price` note to reference ADR-026 snapshot. Updated `low_stock_threshold` note to clarify distinction from `reorder_point`.
  - `Transaction` entity: `void_reason` renamed to `void_reason_note` (nullable, optional); added `void_reason_category` (nullable enum, required when status=VOID; ADR-028).
  - `InventoryTransaction` entity: added `adjustment_reason_category` (nullable enum, required when type=ADJUSTMENT); added `total_restock_cost` (nullable decimal, populated when type=PURCHASE); updated `note` field description (now optional supporting detail).
  - `TransactionLineItem` entity: added `cost_price_snapshot` (nullable decimal, copied from Product.cost_price at sale time; ADR-026); added `fee_override_note` (nullable text, for walk-in fee overrides). Updated `description` field example to include container-mode format. Updated reasoning to cover both unit_price and cost_price_snapshot snapshots.
  - Cross-Cutting Design Decisions: item 4 updated (snapshots now explicitly cover unit_price + cost_price_snapshot + price_paid); item 6 added (structured categories for void_reason_category and adjustment_reason_category).
  - "What's Not In This Model": SupplierCost note updated — per-unit supplier tracking is still deferred; `total_restock_cost` on InventoryTransaction covers MVP need.

- **USER-STORIES.md:**
  - Design Review #5 banner added.
  - US-5.3: updated — void now requires `void_reason_category` (structured enum); detail note optional except when category = OTHER; ACs expanded.
  - US-5.4 (NEW P0): end-of-day collections summary by payment method spanning all transaction types; date selector; voided excluded. Former P2 US-5.4 → US-5.6; former US-5.5 → US-5.7.
  - US-6.10: updated — void reason category required (from free-text only).
  - US-6.13 (NEW P0): cash change calculator in POS checkout.
  - US-6.14 (NEW P0): whole-container sale for SERVING_BASED_PRODUCT — Per Container mode toggle.
  - US-6.15 (NEW P0): gross margin display (₱ and %) on product create/edit form.
  - US-6.16 (NEW P0): category filter tabs on POS product grid.
  - US-7.5: promoted from P2 to P0, scope narrowed — total restock cost capture per PURCHASE event (not per-unit, not supplier entity).
  - US-7.6 (NEW P0): days-until-stockout estimate per product (current_stock ÷ avg daily sales, last 30 days).
  - US-7.7 (NEW P0): inventory valuation on Current Stock view and Dashboard KPI.
  - US-7.8 (NEW P0): shrinkage column on Current Stock view — negative ADJUSTMENT quantity this month, by category.
  - Former P2 US-7.6 → US-7.9.
  - US-8.1: ACs expanded — 6-card KPI strip specified, stockout estimates in inventory alerts, Today's Collections on Dashboard, voided exclusion rule stated.
  - US-8.9: ACs added — shrinkage section in Inventory Usage Report, breakdown by adjustment_reason_category, CSV export.
  - US-8.12: promoted from P2 to P0 — gross profit report (revenue, COGS via cost_price_snapshot, gross profit, margin %); full ACs added.
  - Summary table updated: Client Payments 3→4 P0; POS 10→14 P0; Inventory 4→8 P0; Dashboard & Reports 12→13 P0; total 59→69 P0, 16→14 P2.

- **USER-FLOWS.md:**
  - Design Review #5 header added.
  - Flow 8: category tabs and SERVING_BASED_PRODUCT container mode toggle added to product grid section; cash change calculator step added to checkout (Cash selected: "Cash received" input → "Change: ₱X" display); cost_price_snapshot captured alongside unit_price on each TransactionLineItem.
  - Flow 9: full restock flow rewritten — SERVING_BASED_PRODUCT container quantity clarified; optional total cost paid field added; InventoryTransaction fields (total_restock_cost, resulting_stock) made explicit.
  - Flow 11: void reason category selection step added before free-text note; `OTHER` requires detail note; void_reason_category stored on Transaction record.
  - Flow 16 (NEW): Whole-Container Sale — full flow from container mode toggle through POS sale creation and inventory deduction (quantity × servings_per_container).
  - Flow 17 (NEW): End-of-Day Collections Review — Collections Summary view, payment method table, voided exclusion, date selector, manual reconciliation note.

- **MODULE-SPECS.md:**
  - Design Review #5 banner added.
  - Module 1 (Dashboard): KPI strip expanded from 4 to 6 cards (added Today's Revenue, Inventory Value). Inventory alerts enhanced with days-until-stockout estimate per product. Today's Collections live feed panel added (6th panel). Business rules and edge cases expanded.
  - Module 5 (Client Payments): Collections Summary view fully specified (US-5.4, Flow 17). Void workflow updated with void_reason_category requirement (ADR-028). Business rules: void_reason_category required added; walk-in fee override note added. Edge cases: Collections Summary zero-state, void OTHER without note. Deferred references updated to US-5.6, US-5.7.
  - Module 6 (POS): Product create/edit — container_selling_price, reorder_point, gross margin display added. SERVING_BASED_PRODUCT section updated with container mode. POS screen — category tabs, container mode toggle, cash change calculator at checkout. POS History — summary strip (today's count + revenue) added. Void — void_reason_category required. Business rules — cost_price_snapshot, container mode deduction, void category, cash received validation. Edge cases expanded (6 new). Deferred references updated.
  - Module 7 (Inventory): Complete rewrite of MVP Scope — Restock, Current Stock View (with valuation, stockout estimate, reorder indicator, shrinkage column), Movement History, Manual Adjustment all updated. Business rules — adjustment_reason_category required, shrinkage derivation defined, reorder_point vs. low_stock_threshold distinction. Edge cases expanded (7 new). Deferred section updated.
  - Module 8 (Reports): Inventory Usage Report updated with shrinkage section. Gross Profit Report added (US-8.12, P0). Business rules updated — cost-snapshot rule added, shrinkage scope defined. Edge cases expanded. Deferred section simplified (US-8.12 promoted to P0, removed from deferred).
  - Resolved Scope Decisions table: 7 new rows added covering cost_price_snapshot, void categories, adjustment categories, container sale mode, collections summary, gross profit promotion, and daily revenue KPI.

- **ROADMAP.md:**
  - Milestone 5: added US-5.4 (collections summary); updated US-5.3 description (void_reason_category).
  - Milestone 6: added US-6.13 (change calculator), US-6.14 (container sale), US-6.15 (margin display), US-6.16 (category tabs); updated US-6.1–6.3 description; added container mode to Milestone 6 items; added whole-container sale flow reference.
  - Milestone 7: updated all items — restock cost capture (US-7.5), adjustment_reason_category, reorder_point indicator, days-until-stockout (US-7.6), inventory valuation (US-7.7), shrinkage column (US-7.8).
  - Milestone 8: Dashboard KPI strip updated to 6 cards with references; Inventory Usage Report updated with shrinkage; Gross Profit Report (US-8.12) added.
  - Phase 2 table: US-5.4 → US-5.6, US-5.5 → US-5.7, US-7.5 removed (promoted to P0), US-7.6 → US-7.9, US-8.12 removed (promoted to P0).

**Decisions made:**

- `cost_price_snapshot` added to `TransactionLineItem` — extends snapshot principle to cost price (ADR-026)
- Whole-container sale mode via `container_selling_price` on `SERVING_BASED_PRODUCT` (ADR-027)
- Void reason category enum on `Transaction`; `void_reason` renamed to `void_reason_note` (ADR-028)

**Issues / Notes:**

- `cost_price_snapshot` is nullable — products where the owner has not set `cost_price` will produce null snapshots. The Gross Profit Report flags these so the owner knows the margin figure may be understated. Historical transactions prior to this change will have null `cost_price_snapshot` — no backfill is performed.
- `void_reason_category = OTHER` requires a detail note (enforced at the application layer). All other categories make the note optional. This follows the same pattern as adjustment_reason_category.
- Days-until-stockout is advisory and derived at query time. It uses the last 30-day sales window; products with zero sales in that window show "No recent sales data" rather than an infinite estimate.
- US-7.9 (automated reorder notifications) was formerly US-7.6 in the Phase 2 table — this renumber accommodates the new P0 US-7.6 (days-until-stockout) without numbering collision.
- US-5.6 and US-5.7 were formerly US-5.4 and US-5.5 in the Phase 2 table — renumbered to accommodate the new P0 US-5.4 (collections summary).
- US-8.12 (Gross Profit Report) is promoted to P0 because the required foundation (`cost_price_snapshot` on TransactionLineItem, added in this session) is now in the schema. The report itself is computable from existing data with no further schema changes.

---

## [#006] Architecture Blockers Resolved — ADR-024 & ADR-025 — 2026-06-24

**Commit:** _(done)_

**Changes from previous commit:**

- **USER-FLOWS.md:**
  - Flow 7 header: Path A clarified — owner is redirected to Flow 5 (Add Membership) with no walk-in fee collected; one `MEMBERSHIP`-only transaction is created. Path B clarified — walk-in fee transaction already exists from Flow 3; a separate `MEMBERSHIP`-only transaction is created below.
  - Flow 7 main body: combined `WALK_IN_FEE + MEMBERSHIP` transaction step replaced with a separate `MEMBERSHIP`-only `CLIENT_TRANSACTION`. Walk-in fee transaction from Flow 3 remains intact. ADR-024 referenced.
  - Flow 7 Reasoning: updated to reflect the two-separate-transactions model and the rejection of the combined transaction.

- **DOMAIN-MODEL.md:**
  - `Membership` entity: `gym_id` (FK → Gym) added.
  - `TransactionLineItem` entity: `gym_id` (FK → Gym) added.
  - `InventoryTransaction` entity: `gym_id` (FK → Gym) added.
  - Cross-Cutting Design Decisions item 2: updated to explicitly include child/detail entities and reference ADR-025.

- **MODULE-SPECS.md:**
  - Module 5 (Client Payments) Business Rules: new rule added — a `CLIENT_TRANSACTION` never contains both `WALK_IN_FEE` and `MEMBERSHIP` line items simultaneously; these are always separate records (ADR-024).
  - Module 5 (Client Payments) Edge Cases: same-visit conversion edge case updated — original walk-in fee transaction remains intact; a separate `MEMBERSHIP` transaction is created; price override field covers any discount.

- **DECISIONS.md:**
  - ADR-012 Consequence: updated to remove combined transaction reference; now states that walk-in fees and membership purchases are always separate records, with ADR-024 cross-referenced.
  - ADR-024 added: Walk-In to Membership Conversion Always Creates Separate Transactions — defines three scenarios (pre-fee, post-fee same-visit, different-day) and formally rejects the combined transaction model.
  - ADR-025 added: `gym_id` on All Tables Including Child and Detail Entities — corrects the ADR-001 compliance gap on `Membership`, `TransactionLineItem`, and `InventoryTransaction`; documents RLS, reporting, and migration-cost rationale.

**Decisions made:**

- Walk-in fees and membership purchases are always separate `CLIENT_TRANSACTION` records — ADR-024
- `gym_id` added to `Membership`, `TransactionLineItem`, and `InventoryTransaction` to complete ADR-001 — ADR-025

**Issues / Notes:**

- The `TransactionLineItem` schema continues to permit both `WALK_IN_FEE` and `MEMBERSHIP` item types within a single `CLIENT_TRANSACTION` at the schema level — the rule against combining them is enforced at the application flow level, not via a schema constraint. This is intentional: a future admin tool may have a legitimate use case not yet in scope.
- ADR-025 corrects the domain model, not ADR-001. ADR-001's stated rule was always correct; the domain model implementation was incomplete. This entry resolves the inconsistency.
- These two resolutions clear the remaining architecture blockers. The project is ready to proceed to ERD and database design. Tech Stack Selection (ADR-026) is the recommended next planning activity before implementation begins.

---

## [#005] Attendance Module Structure Revision — Design Review #4 — 2026-06-24

**Commit:** _(done)_

**Changes from previous commit:**

- **DECISIONS.md:**
  - ADR-022 status updated to "Accepted — navigation placement amended by ADR-023." "Top-level navigation entry" clause removed; amendment note added.
  - ADR-023 added: Attendance module is a single top-level nav entry with three internal views (Check-In, Attendance History, Attendance Analytics). Check-In is the default view. All attendance-related workflows, records, analytics, and corrections live within this one module.

- **USER-STORIES.md:**
  - US-4.8: First AC updated — "top-level screen (not nested under Clients or Attendance)" replaced with "default view of the Attendance module." (ADR-023)
  - US-4.3: First AC updated — Attendance History is the second view within the Attendance module. Date filter presets added: Today (default on open) · Yesterday · Last 7 Days · Last 30 Days · Custom Date Range.
  - US-4.10 (NEW P0): Attendance Analytics view — KPI cards (Today/Week/Month check-ins, Member vs Walk-In Ratio), daily trend chart, day-of-week and peak-hour charts, Member Insights panel, Walk-In Insights panel, Operational Insights panel, and Alerts panel. Attendance-domain scope only; no CSV export from this view.
  - Summary table updated: Attendance 7→8, Total 58→59.

- **USER-FLOWS.md:**
  - Flow 14: Entry point updated from "Check-In Station screen (top-level navigation)" to "Attendance module → Check-In view (default view)."

- **MODULE-SPECS.md:**
  - Module 4 (Attendance): Module structure section added — three named views (Check-In, Attendance History, Attendance Analytics) under one top-level navbar entry.
  - Check-In Station: "Top-level navigation entry point" replaced with "Default view within the Attendance module." (ADR-023)
  - Attendance History: Date filter presets added (Today · Yesterday · Last 7 Days · Last 30 Days · Custom Date Range; default: Today; session-persistent).
  - Attendance Analytics: Full section added — KPI cards, three charts with period selector, Member Insights panel, Walk-In Insights panel, Operational Insights panel, Alerts panel. Scope boundary enforced: attendance-domain only, no revenue/inventory data, no CSV export.
  - Business Rule added: Analytics scope boundary — aggregate insights in Analytics; detailed exportable records in Reports module.
  - Deferred: Attendance decline alert threshold hardcoded at 20% for MVP; owner-configurable threshold deferred to a future Settings addition.

- **ROADMAP.md:**
  - Milestone 4 restructured: "Dedicated Check-In Station screen" bullet replaced with a three-view Attendance module entry covering Check-In (US-4.8), Attendance History (US-4.3), and Attendance Analytics (US-4.10).

**Decisions made:**

- Attendance module restructured as a single top-level nav entry with three views: Check-In (default), Attendance History, Analytics — ADR-023
- ADR-022 amended: Check-In screen UX unchanged; navigation placement changed from standalone top-level to default view within Attendance module
- Attendance Analytics confirmed as committed MVP scope — US-4.10

**Issues / Notes:**

- Attendance Analytics panels use the same derived definitions as existing Client List filters and Dashboard panels — "At risk" count, "Frequent walk-ins" count, and conversion rate all resolve from the same query logic established in ADR-019 and ADR-020. No new derivation rules introduced.
- The 20% attendance decline alert threshold is hardcoded for MVP. Owner-configurable threshold is a future Settings addition — the 20% value is a sensible operational default and unlikely to need tuning until the owner has several months of data.
- No CSV export from Attendance Analytics by design — this preserves a clear boundary between in-module operational intelligence (Analytics) and archive-quality reporting (Reports module, US-8.5, US-8.13, US-8.14). If the owner needs a list, they navigate to Reports.
- No new user flow added for Attendance Analytics — the view is a pure read interface with a period selector; it has no decision branches that warrant flow documentation.

---

## [#004] Attendance Module Deep Review — Planning Doc Sync — 2026-06-24

**Commit:** _(done — design review session #3)_

**Changes from previous commit:**

- **DECISIONS.md:**
  - ADR-018 added: Expired MEMBER check-in triggers a renewal decision point — no silent routing to walk-in
  - ADR-019 added: Member attendance inactivity is a separate operational signal, not a status change
  - ADR-020 added: Walk-in conversion event is derived, not stored
  - ADR-021 added: `created_by` added to the Attendance entity
  - ADR-022 added: Dedicated Check-In Station screen as primary check-in interface

- **DOMAIN-MODEL.md:**
  - `Gym` entity: added `member_inactivity_warning_days` (int, default: 14; drives at-risk MEMBER signal) and `walkin_conversion_prompt_visits` (int, default: 5; triggers pre-fee conversion prompt)
  - `Client` entity: added at-risk signal note — derived operational signal for active MEMBER clients not attending; does not alter `Client.status` (ADR-019)
  - `Attendance` entity: added `created_by` (FK → User, required; ADR-021) and `correction_note` (text, nullable; populated when time_in is edited)
  - `Attendance` entity: added conversion derivation note (ADR-020)

- **USER-STORIES.md:**
  - US-1.8 (NEW P0): Member inactivity warning threshold setting — configurable at-risk threshold (default: 14 days)
  - US-2.11 (NEW P0): At-risk member filter chip on Client List + Dashboard live feed panel
  - US-4.8 (NEW P0): Dedicated Check-In Station screen — top-level nav, auto-focused search, result cards, today's list
  - US-4.9 (NEW P0): Today's check-ins standalone view in Attendance section
  - US-8.13 (NEW P0): Member engagement report — active members by visit frequency, least engaged first
  - US-8.14 (NEW P0): At-risk members report — active members not attending within threshold
  - US-4.1: four new acceptance criteria (result card preview, expired MEMBER prompt, expiry warning, duplicate confirmation)
  - US-4.2: two new acceptance criteria (quick-create modal fields, pre-fee conversion prompt)
  - US-4.3: two new acceptance criteria (gym-wide attendance screen, row columns)
  - US-8.8: conversion derivation clarification note added (ADR-020)
  - Summary table updated: Auth & Settings 5→6, Clients 8→9, Attendance 5→7, Dashboard & Reports 10→12, Total 52→58

- **USER-FLOWS.md:**
  - Flow 3: two new upstream branches added — expired MEMBER renewal decision prompt (ADR-018) and pre-fee walk-in conversion prompt
  - Flow 4: duplicate check-in confirmation step added; post-check-in expiry warning step added; return-to-search state specified
  - Flow 7: conversion trigger description updated (upstream + profile paths); conversion logging replaced with derivation definition (ADR-020)
  - Flow 14 (NEW): Check-In Station — full check-in screen flow with all three client branches
  - Flow 15 (NEW): Attendance Record Correction — same-day time_in edit with required reason note

- **MODULE-SPECS.md:**
  - Module 1 (Dashboard): 5th live feed panel "At-risk members" added (ADR-019, US-2.11); new business rule and two new edge cases added
  - Module 2 (Clients): "At risk" filter chip added to 7-chip set; "At risk" chip defined with ADR-019 reference; at-risk business rule added; three new edge cases added
  - Module 4 (Attendance): MVP Scope section fully rewritten — Check-In Station, Today's Check-Ins, Gym-wide History, Attendance Record Correction all specified; Business Rules expanded with 5 new rules (ADR-018, ADR-019 prompt, ADR-021, correction bounds); Edge Cases expanded from 2 to 9; Deferred section updated with 2 new explicit callouts
  - Module 8 (Reports): Member Engagement Report (US-8.13) and At-risk Members Report (US-8.14) added; Frequent Walk-In Report updated with ADR-020 conversion derivation reference; new business rule added
  - Module 9 (Settings): System Preferences updated with 2 new fields (`member_inactivity_warning_days`, `walkin_conversion_prompt_visits`); 2 new business rules added

- **ROADMAP.md:**
  - Milestone 1: US-1.8 added
  - Milestone 2: US-2.11 added
  - Milestone 4: rewritten — US-4.8 promoted to first item; US-4.1, US-4.2, US-4.3 descriptions updated; US-4.9 added; attendance record correction item added
  - Milestone 8: Dashboard item updated (5th panel); US-8.13 and US-8.14 added

**Decisions made:**

- Expired MEMBER check-in triggers a renewal decision point — not silent walk-in routing — ADR-018
- Member attendance inactivity is a separate operational signal (not a status change) — ADR-019
- Walk-in conversion event is derived from Attendance + Membership records, not stored — ADR-020
- `created_by` added to Attendance entity now, not deferred — ADR-021
- Dedicated Check-In Station screen added as top-level navigation — ADR-022

**Issues / Notes:**

- ADR-019 extends ADR-017 without contradiction: MEMBER client status derivation (Active/Expiring soon/Expired) is unchanged. At-risk is an orthogonal attendance-recency signal surfaced as a filter, dashboard panel, and report — not as a status value.
- The "At risk" filter chip does not overlap with "Inactive" (WALK_IN clients only). A client can simultaneously match "At risk" (membership current, not attending) and "Expiring soon" (near end_date).
- Attendance record deletion is intentionally not permitted at MVP — only same-day time_in correction with a required reason note.
- `walkin_conversion_prompt_visits` (default: 5) is configurable in Settings → System Preferences, consistent with the pattern of all other threshold settings.

---

## [#003] Clients Module Wireframe Review — Planning Doc Sync — 2026-06-23

**Commit:** _(done — design review session #2)_

**Changes from previous commit:**

- **Clients Module (MODULE-SPECS.md)** — major overhaul:
  - Client List: status filter chips (All / Active / Expiring soon / Expired / Walk-in only); "Membership Expiry" column replaces "Joined"; "Show archived" toggle; toolbar "+ Add membership" shortcut removed
  - Client Profile: quick-stats strip (total visits, visits this month, days to expiry, walk-in count); walk-in conversion signal ("X visits — no membership"); context-aware membership action button (Add membership / Renew / Renew early); archive via overflow menu (⋯); voided payment indicator (VOID badge) in Membership History tab; Attendance History tab now includes date range + visit type filters
  - Archive client flow: confirmation dialog with specific text; reactivation from overflow menu
  - Edge cases expanded: future-dated "Upcoming" badge, Dashboard feed navigation, walk-in filter + search + sort combinations
- **Dashboard Module (MODULE-SPECS.md):**
  - Added 4th live feed panel: "Frequent walk-ins" — top 5 walk-in clients (no active membership), sorted by visit count, with last visit date. Links to Client List filtered by "Walk-in only."
- **Membership Module (MODULE-SPECS.md):**
  - Added Membership Plan Catalog subsection; plan selector now sourced from `MembershipPlan.is_active = true`
  - Create Membership form: "Duration (days)" numeric input appears inline when "Custom duration" selected
  - Blocking state: message text specified, "Go to Renew" action added
  - Edge cases expanded: plan retirement, voided payment handling
- **Settings Module (MODULE-SPECS.md):**
  - Added "Membership Plans" section: list view, add plan, edit plan, retire plan, last-active plan guard
- **USER-STORIES.md:**
  - US-2.3: combined filter + search AC added
  - US-2.4: quick-stats strip, voided indicator, attendance filters, "Upcoming" badge AC added
  - US-2.6: archive action location, confirmation text, archived list behavior, reactivation AC added
  - US-2.9 (NEW P0): Status filter chips on Client List
  - US-2.10 (NEW P0): Walk-in conversion signals on Client Profile + Dashboard feed
  - US-3.1: blocking message text, "Go to Renew" redirect AC added
  - US-3.2: context-aware button labels AC added
  - US-3.3: custom days inline input AC added
  - US-3.9 (NEW P0): Membership plan catalog management in Settings
  - Summary table updated: Clients 6→8, Membership 6→7, Total 48→51 P0 stories
- **USER-FLOWS.md:**
  - Flow 5: context-aware button entry points added; blocking message text specified; custom duration inline input noted
  - Flow 6: context-aware button labels ("Renew" / "Renew early") added to entry
  - Flow 7: conversion signal UX path added (profile quick-stats strip → "X visits — no membership" → "Add membership" button)
  - Flow 12 (NEW): Archive Client — archive flow, confirmation dialog, archived state, reactivation path
  - Flow 13 (NEW): Manage Membership Plans — add plan, edit plan, retire plan (with last-active guard)
  - Design Review #2 header note added
- **ROADMAP.md:**
  - Milestone 2: added US-2.9 and US-2.10; updated description of US-2.3, US-2.4, US-2.6
  - Milestone 3: added US-3.9; updated description of US-3.1, US-3.2, US-3.3
  - Milestone 8: added US-2.10 reference to Dashboard item
- **DOMAIN-MODEL.md:**
  - `MembershipPlan` entity: added management UI note referencing Settings module and ADR-015
- **DECISIONS.md:**
  - ADR-014 added: Client list status filters and membership expiry column
  - ADR-015 added: Membership Plan catalog management is MVP scope, placed in Settings
  - ADR-016 added: Walk-in conversion signals surface in Clients module, not only in Reports

- **Client type and walk-in inactivity status (all docs):**
  - `client_type` added as a derived field on `Client`: `MEMBER` (has ≥1 Membership record) | `WALK_IN` (zero memberships). Never stored.
  - `Client.status` derivation now branches by `client_type`:
    - MEMBER → Active / Expiring soon / Expired (from membership end_date, unchanged)
    - WALK_IN → Active (last visit within threshold) | Inactive (last visit > threshold or never visited)
  - `Gym.walkin_inactivity_threshold_days` added (default: 7) — new field on Gym entity, new setting in Settings → System Preferences
  - Client List gains "Inactive" filter chip; type badge (MEMBER / WALK_IN) added to list and profile
  - Client Profile: type badge + status badge in header; quick-stats strip updated for WALK_IN clients (days since last visit)
  - US-1.7 (NEW P0): walk-in inactivity threshold setting in Settings
  - US-2.4: type badge and WALK_IN-specific stats added to profile AC
  - US-2.9: "Inactive" filter chip added; chip definitions expanded for both MEMBER and WALK_IN branches
  - Summary table updated: Auth & Settings 4→5, Total 51→52
  - ADR-017 added: explicit client_type and walk-in inactivity status

**Decisions made:**

- Status filter chips on Client List are MVP scope, resolve against derived status (ADR-002) — ADR-014
- Membership Plan catalog management is MVP scope, UI in Settings — ADR-015
- Walk-in conversion signals surface in Clients module AND Dashboard, not only in Reports — ADR-016
- `client_type` (MEMBER/WALK_IN) and walk-in inactivity status are both derived from existing records, not stored — ADR-017

**Issues / Notes:**

- The "Membership Expiry" column replaces "Joined" for actionability in daily use; date_registered remains stored and accessible on the profile
- The last-active plan guard (Settings → Membership Plans) prevents a state where the Add/Renew modal has zero plan options
- Voiding a payment does not alter the associated membership; voiding a membership payment only adds a VOID badge to the membership history row — both financial and membership corrections remain manual and independent

---

## [#002] Sales Module Redesign — POS Model — 2026-06-22

**Commit:** _(done — design review session #1)_

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

**Commit:** _(done — first commit)_

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
