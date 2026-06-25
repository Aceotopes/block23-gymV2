# Design System — Block23 Gym Management System

This is the single source of truth for the visual and interaction language of Block23 Gym V2. It defines design tokens, the theming model, typography, spacing/layout, the component inventory, and the core UI patterns — all grounded in the locked planning docs and tech stack.

**Foundations it builds on:**
- **Desktop-first, mobile-responsive, no tablet target** (ADR-033) — every surface is designed for a full desktop viewport first.
- **Information architecture** (`INFORMATION-ARCHITECTURE.md`, ADR-042) — 8 top-level nav entries; Membership is distributed.
- **Stack** (`TECH-STACK.md`) — shadcn/ui + Radix on Tailwind CSS v4, Recharts, lucide-react. No second component or styling library.
- **Accessibility: WCAG 2.1 AA** (ADR-044) — keyboard, visible focus, contrast, color-independent status, reduced motion.

**Design language decision:** dark-first, professional indigo accent on neutral slate chrome (ADR-045).

> This document specifies the *system*. It does not contain application component code — implementation follows `TECH-STACK.md` rules (Server Components by default, shadcn/ui primitives, Tailwind utilities, tokens from CSS variables).

---

## 1. Design Principles

1. **Data legibility over decoration.** The owner reads dense tables, KPIs, and 22 reports. Chrome is quiet; data is loud. Numbers are tabular and right-aligned; money is unmistakable.
2. **Dark-first, calm.** The default theme is dark slate with an indigo accent — low fatigue for long report/dashboard sessions. Light mode is a first-class secondary theme via the same tokens.
3. **Status is never color alone (ADR-044).** Every status carries a text label, and most carry an icon/shape. Color reinforces; it never solely conveys.
4. **One token layer.** Components consume semantic CSS variables (`--primary`, `--destructive`, `--muted`), never raw hex. Theme switches by swapping variable values, not component code.
5. **Speed at the counter.** The highest-frequency surfaces (Check-In, POS) are keyboard-first, single-focus, and low-latency in feel.
6. **Consistency with shadcn/Radix.** Use the primitives as intended; extend, don't replace. Accessibility comes from the primitives + these tokens, not bespoke widgets.

---

## 2. Theming Model

**Dark is the default theme.** Tokens are defined as CSS variables on `:root` (dark) with a `.light` override block. shadcn/ui components read these variables; Tailwind v4 exposes them via `@theme inline`.

```
:root            → dark theme (default)
.light           → light theme override
@theme inline    → maps tokens to Tailwind color utilities (bg-background, text-foreground, …)
```

- **Base color:** `slate` (shadcn `components.json` → `baseColor: "slate"`).
- **Style:** shadcn `new-york`.
- **Values below are given as hex for readability.** Implementation stores them as CSS variables (HSL or OKLCH are both fine — keep one format consistent). The *values* are normative; the storage format is not.
- **Theme toggle is deferred-friendly:** because every surface uses variables, shipping light mode later (or a user toggle) is a values flip, not a redesign.

---

## 3. Color System

### 3.1 Core token set

| Token (shadcn var) | Role | Dark (default) | Light |
|---|---|---|---|
| `--background` | App canvas | `#0F172A` slate-900 | `#FFFFFF` |
| `--foreground` | Primary text | `#F1F5F9` slate-100 | `#0F172A` slate-900 |
| `--card` | Card / panel surface | `#15203A` (slate-900 lifted) | `#FFFFFF` |
| `--card-foreground` | Text on card | `#F1F5F9` | `#0F172A` |
| `--popover` | Menus, dialogs, popovers | `#1E293B` slate-800 | `#FFFFFF` |
| `--popover-foreground` | Text in popovers | `#F1F5F9` | `#0F172A` |
| `--muted` | Subtle fills, table header | `#1E293B` slate-800 | `#F1F5F9` slate-100 |
| `--muted-foreground` | Secondary/label text | `#94A3B8` slate-400 | `#64748B` slate-500 |
| `--border` | Hairlines, dividers, inputs | `#283449` (~slate-750) | `#E2E8F0` slate-200 |
| `--input` | Input border | `#334155` slate-700 | `#CBD5E1` slate-300 |
| `--ring` | Focus ring | `#818CF8` indigo-400 | `#6366F1` indigo-500 |
| `--primary` | Brand / primary action | `#6366F1` indigo-500 | `#4F46E5` indigo-600 |
| `--primary-foreground` | Text on primary | `#FFFFFF` | `#FFFFFF` |
| `--secondary` | Secondary surfaces/buttons | `#1E293B` slate-800 | `#F1F5F9` slate-100 |
| `--secondary-foreground` | Text on secondary | `#E2E8F0` | `#0F172A` |
| `--accent` | Hover/active surface | `#27344C` | `#EEF2FF` indigo-50 |
| `--accent-foreground` | Text on accent | `#F1F5F9` | `#3730A3` indigo-800 |
| `--destructive` | Destructive action (solid) | `#DC2626` red-600 | `#DC2626` red-600 |
| `--destructive-foreground` | Text on destructive | `#FFFFFF` | `#FFFFFF` |

> **Why indigo-500 on dark / indigo-600 on light:** white text on indigo-500 ≈ 4.6:1 (AA for normal text); on light, indigo-600 keeps the same button readable. Never use indigo-600 as a *fill behind small text on dark* — it dims; use 500.

### 3.2 Semantic (feedback) colors

Each has a **solid** variant (filled button/badge with foreground text), a **text/icon** variant (for use on the dark/light canvas), and a **subtle** surface (tinted background ~12–16% alpha).

| Semantic | Solid fill | Solid text | Text/icon on canvas (dark / light) | Subtle surface |
|---|---|---|---|---|
| **Success** | `#059669` emerald-600 | white | `#34D399` / `#047857` | emerald @ 15% |
| **Warning** | `#D97706` amber-600 | white | `#FBBF24` / `#B45309` | amber @ 15% |
| **Danger** | `#DC2626` red-600 | white | `#F87171` / `#B91C1C` | red @ 15% |
| **Info** | `#0284C7` sky-600 | white | `#38BDF8` / `#0369A1` | sky @ 15% |
| **Neutral** | `#475569` slate-600 | white | `#94A3B8` / `#475569` | slate @ 12% |

> Amber/yellow never carries white text below large sizes — use **amber-600** for solid (with white) or amber text on canvas. Do not put white on amber-400/500.

### 3.3 Domain status tokens (color + label + shape — never color alone)

This is the canonical mapping for every status surfaced across the modules. **Every badge renders the label text; the icon/shape is the color-independent signal (ADR-044).**

| Domain status | Semantic | Shape / icon (lucide) | Label text |
|---|---|---|---|
| Member · **Active** (in-effect, ADR-040) | Success | ● filled dot | "Active" |
| Member · **Upcoming** (ADR-037) | Info | ◷ `clock` outline | "Upcoming" |
| Member · **Expiring soon** | Warning | △ `alert-triangle` | "Expiring soon" |
| Member · **Expired** | Neutral | ○ hollow dot | "Expired" |
| **At risk** (orthogonal, ADR-019) | Danger-orange `#F97316` | `activity` / pulse | "At risk" |
| Walk-in · **Active** | Success (subtle) | ● filled dot | "Active" |
| Walk-in · **Inactive** | Neutral | ○ hollow dot | "Inactive" |
| Type badge · **Member** | Primary (subtle indigo) | `user-check` | "Member" |
| Type badge · **Walk-in** | Neutral (outline) | `user` | "Walk-in" |
| Transaction · **VOID** | Danger (outline) | `ban`, strikethrough amount | "VOID" |
| Membership · **Cancelled** (ADR-041) | Neutral (strikethrough) | `x-circle` | "Cancelled" |
| Inventory · **Forced sale** (ADR-034) | Danger (flagged) | `alert-octagon` | "Forced sale" |
| Inventory · **Low stock** | Warning | `alert-triangle` | "Low stock" |
| Inventory · **Out / negative** | Danger | `alert-octagon` | "Out of stock" |
| Inventory · **Reorder** | Info | `package` | "Reorder" |

> **At-risk uses orange, not amber,** specifically so it is distinguishable from "Expiring soon" (amber) when both appear on one client row — and both still differ by icon and label.

**Payment-method chips** (Collections, Payments, Reports) are neutral chips differentiated by label + small icon, not hue: Cash `banknote`, GCash `smartphone`, Card `credit-card`, Other `wallet`.

### 3.4 Data-visualization palette (Recharts)

A categorical palette tuned for the dark canvas (and re-verified for light). Series are **also** distinguished by non-color means (line dash / marker / legend order) for color-independence.

| Slot | Color (dark) | Typical use |
|---|---|---|
| Cat-1 | `#818CF8` indigo-400 | Membership revenue · Member check-ins |
| Cat-2 | `#34D399` emerald-400 | Product revenue |
| Cat-3 | `#FBBF24` amber-400 | Walk-in revenue · Walk-in check-ins |
| Cat-4 | `#38BDF8` sky-400 | Secondary series |
| Cat-5 | `#F472B6` pink-400 | Additional category |
| Cat-6 | `#A3E635` lime-400 | Additional category |
| Grid / axis | `#334155` slate-700 (grid), `#94A3B8` slate-400 (labels) | — |

**Fixed semantic mappings (use these exact assignments so charts agree across the app):**
- **Revenue by source:** Membership = Cat-1 (indigo), Walk-In = Cat-3 (amber), Product = Cat-2 (emerald).
- **Member vs Walk-in attendance:** Member = Cat-1 (indigo), Walk-In = Cat-3 (amber).
- **Membership status donut:** Active = emerald, Expiring soon = amber, Expired = slate-500.
- **Net change / deltas:** positive = emerald, negative = red, zero = slate-400.

### 3.5 Contrast (AA) commitments

- Body and label text meet **≥ 4.5:1**; large text (≥ 24px regular / 18.66px bold) and meaningful UI/graphic boundaries meet **≥ 3:1**.
- Verified primary pairs: `foreground` on `background` (dark ≈ 14:1), `muted-foreground` on `background` (dark ≈ 5.6:1), white on `--primary` (≈ 4.6:1), white on `--destructive` (≈ 4.5:1), success/warning/danger **text** tokens on canvas (≥ 4.5:1).
- Focus ring (`--ring`) against adjacent surfaces ≥ 3:1.
- **Disallowed:** white text on amber-400/500; muted-foreground for primary reading text; any status conveyed by fill color with no label.

---

## 4. Typography

**Families:** `Geist Sans` (UI) and `Geist Mono` (numeric/tabular, IDs, code) — loaded via `next/font`, Vercel-native, no extra license. Mono is used for money, quantities, and any column where digit alignment matters.

- **Tabular figures everywhere numbers line up:** apply `font-feature-settings: "tnum"` (Tailwind `tabular-nums`) to all table numeric cells, KPI values, and currency. Money is right-aligned.

**Type scale** (rem @ 16px root; data-dense so body is 14px):

| Token | Size / line-height | Weight | Usage |
|---|---|---|---|
| `display` | 30 / 36 | 600 | Empty-state hero, login |
| `h1` | 24 / 32 | 600 | Page title |
| `h2` | 20 / 28 | 600 | Section / card title |
| `h3` | 16 / 24 | 600 | Sub-section, dialog title |
| `body` | 14 / 20 | 400 | Default UI text |
| `body-strong` | 14 / 20 | 500 | Emphasis, table headers |
| `sm` | 13 / 18 | 400 | Table cells, secondary |
| `xs` | 12 / 16 | 500 | Badge, caption, chip |
| `kpi` | 28 / 32 | 600, `tabular-nums` | KPI card value |
| `mono-sm` | 13 / 18 | 450 | Money, quantities, IDs |

**Rules:** one `h1` per page; weights limited to 400/500/600 (700 reserved for rare emphasis); never communicate meaning by italics alone; line length for prose capped ~75ch (tables are full-width).

---

## 5. Spacing, Radius, Layout

**Spacing scale (4px base, Tailwind default):** `0, 1(4), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48), 16(64)`.
- Card padding: 24 (desktop) / 16 (mobile). Table cell padding: 12×16 (comfortable) or 8×12 (compact). Form field gap: 16. Section gap: 24–32.

**Radius (`--radius: 0.5rem`):** `sm 4 · md 6 · lg 8 (default) · xl 12 · full`. Inputs/buttons/badges = md–lg; cards = lg–xl; pills/chips = full.

**Borders & elevation (dark-first):** dark UIs separate surfaces with **1px borders + slight surface lift**, not heavy shadows.
- Resting card: `--card` fill + `1px --border`.
- Elevation order: background → card → popover (each step lighter). Shadows are reserved for true overlays (popover, dialog, dropdown, toast): `shadow-md`/`shadow-lg` with low opacity. No shadows on resting cards in dark mode.

**App shell (per IA):**
```
┌────────────────────────────────────────────────────────────┐
│  Topbar: gym name · global state · user menu                │   56px
├───────────┬────────────────────────────────────────────────┤
│  Sidebar  │  Content area                                   │
│  (8 nav)  │  ┌──────────────────────────────────────────┐  │
│  240px    │  │ Page header (title · actions)            │  │
│  collapse │  │ Content (cards / tables / charts)        │  │
│  → 64px   │  └──────────────────────────────────────────┘  │
└───────────┴────────────────────────────────────────────────┘
```
- **Sidebar:** 8 entries (Dashboard · Clients · Attendance · Client Payments · POS · Inventory · Reports · Settings), each icon + label; collapsible to 64px icon-rail. Active item: indigo left-accent + `--accent` fill.
- **Content max-width:** prose/forms capped ~`max-w-3xl`; data tables and reports go full content width.
- **Density:** comfortable default; tables offer an optional compact density (smaller cell padding, `sm` text) for long lists.

**Breakpoints (Tailwind defaults; desktop-first intent):** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
- Design target: `lg`/`xl`. No tablet-specific breakpoint (ADR-033).
- `< md`: sidebar collapses into a **bottom nav** (primary entries) + overflow; tables become stacked cards or horizontally scrollable with a frozen first column; KPI strips wrap 2-up. POS/Inventory data entry is not optimized for mobile.

---

## 6. Iconography

- **Library:** `lucide-react` (shadcn default). No second icon set.
- **Sizes:** 16 (inline/table), 18 (buttons), 20 (nav, section headers), 24 (empty states).
- **Stroke:** default 2; 1.5 acceptable at ≥ 24.
- **Always paired with a label** in primary actions and statuses; icon-only controls require an `aria-label` and a tooltip.
- **Canonical icons:** see the status table (§3.3) and nav. Destructive actions use `ban`/`trash-2`/`x-circle`; money `banknote`; search `search`; add `plus`.

---

## 7. Motion

- **Durations:** `fast 120ms` (hover, small toggles), `base 180ms` (popovers, dropdowns, tabs), `slow 240ms` (dialogs, sheets, route-level).
- **Easing:** enter `ease-out`, exit `ease-in`; springy/bounce avoided in a data tool.
- **What animates:** dialog/sheet/popover/toast enter-exit, accordion/collapsible, chart initial draw, skeleton shimmer, KPI delta count-up (subtle, optional).
- **`prefers-reduced-motion` (ADR-044):** disable transforms/animation, keep instant opacity swaps; chart draw renders final state immediately; no count-up.

---

## 8. Component Inventory (shadcn/ui → surfaces)

| Component | Used for |
|---|---|
| **DataTable** (TanStack + shadcn) | Client List, Attendance History, Payments, POS History, Inventory, all 22 reports |
| **Card** | KPI cards, dashboard panels, form sections, summary blocks |
| **Badge** | All status/type/payment-method badges (§3.3) |
| **Button** | Primary/secondary/ghost/destructive actions; `+ New …` |
| **Dialog / AlertDialog** | Create/Edit modals; destructive confirms (void, cancel membership, archive, Force Sale) |
| **Form** (RHF + Zod) | Every create/edit form; inline validation |
| **Input / NumberField** | Text, currency ("Cash received" → change), duration days |
| **Select / Combobox** | Plan selector, category, payment method, reason categories |
| **Command (cmdk)** | Check-In search, POS product search (keyboard-first) |
| **Tabs** | Attendance (Check-In/History/Analytics), Client Profile tabs |
| **ToggleGroup** | Period selectors (Today/Week/Month…), Per Serving/Per Container |
| **Calendar / DatePicker** | `start_date`, date-range report filters |
| **Popover / Tooltip** | Shrinkage breakdown on hover, info hints, icon-button labels |
| **Sheet** | Mobile nav, slide-in detail/side panels |
| **Sonner (Toast)** | Action confirmations ("Sale recorded", "Membership cancelled") |
| **Skeleton** | Loading states for cards, tables, charts |
| **Separator / ScrollArea / Pagination** | Layout + long lists/tables |
| **Recharts** | All charts (palette §3.4) |

> Do not introduce a component or charting library outside this list (TECH-STACK rule 5). New needs are met by composing these primitives.

---

## 9. Core Patterns

### 9.1 Status badge
`[icon] Label` in a pill (`xs`, weight 500, `rounded-full`). Subtle semantic surface + semantic text on canvas; outline variant for VOID/Cancelled. **Label is mandatory; color is reinforcement.** A row can show multiple badges (e.g., "Expiring soon" + "At risk") — they differ by icon, label, and hue.

### 9.2 KPI card
Title (`xs`, muted) · Value (`kpi`, tabular) · Delta (small, emerald ▲ / red ▼ / slate –, with text like "+3 from last month"). Optional sparkline. Empty/zero renders `₱0` or `0`, never blank (per spec empty states). Inventory Value card notes excluded count when `cost_price` is null.

### 9.3 Data table
Toolbar (search + filter chips + density + export-to-CSV) → header (`muted` bg, `body-strong`, sortable carets) → rows (`sm`, zebra optional via subtle `--muted` at 40%) → footer (pagination / totals row). Numeric columns right-aligned + tabular. Row actions in a trailing `⋯` menu. **States:** loading = Skeleton rows; empty = centered icon + the spec's exact empty copy (e.g., "All active products have sales in the last N days"); error = inline retry.

### 9.4 Filter chips
Horizontal, `rounded-full`, single-row, session-persistent. Selected = `--primary` subtle fill + indigo text + border; idle = `--secondary`. The 8 Client-List chips follow §3.3 status colors so a chip visually matches its rows.

### 9.5 Destructive confirmation (AlertDialog)
Used for **Void transaction, Cancel membership, Archive, Force Sale**. Title states the action; body states the consequence in plain language; the confirm button is `--destructive`; reason category/note fields render inline where required (void category, cancel reason, adjustment `OTHER` note). Force Sale shows the stock shortfall ("Only X servings remaining (~Z containers)"). Never destructive-by-default focus — focus rests on Cancel.

### 9.6 Forms & validation
Label above field; helper text below; error replaces helper in danger text with `aria-describedby` association (ADR-044). Submit disabled only as a hint — the Server Action re-validates (TECH-STACK). Currency inputs prefix `₱`, right-aligned, 2 decimals. Required custom-duration input appears inline when "Custom duration" is chosen.

### 9.7 Money & numbers
`₱` prefix, thousands separators, 2 decimals, **tabular mono**, right-aligned in tables. Voided amounts shown struck-through with a VOID badge (excluded from totals). Negative/decline values in red with a leading `▼`/`−`.

### 9.8 Empty / loading / zero-data
The module specs define many exact empty states — render them verbatim with a centered 24px muted icon + the specified copy + (where useful) a primary action. Loading = Skeleton matching final layout. Never a blank panel.

### 9.9 Check-In & POS (speed surfaces)
Single dominant `Command`-style search, auto-focused; result cards show name + type badge + status + "checked-in today" indicator. Selection branches inline (active member → one "Check In"; expired member → renewal decision; walk-in → conversion/fee). POS cart is a persistent right rail (Zustand) with running total; Cash payment reveals "Cash received → Change" live. Both return focus to search after each action.

---

## 10. Accessibility Application (ADR-044, concrete)

- **Keyboard:** full operability — Command search (type-ahead, ↑/↓/Enter), filter chips (Tab/Space), data-table sorting (Enter on header), dialogs (focus trap, Esc), cart controls. No mouse-only path.
- **Focus:** visible `--ring` (2px, 2px offset) on every focusable element; never removed without replacement.
- **Color-independence:** all statuses use label + icon/shape (§3.3); charts add dash/marker/legend distinctions.
- **Contrast:** the §3 pairs are the only approved text/background combinations; new pairings must be checked to AA before use.
- **Forms:** programmatic label + error association; errors announced, not just colored.
- **Motion:** honor `prefers-reduced-motion` (§7).
- **Targets:** interactive controls ≥ 24px with adequate spacing; primary touch targets ≥ 40px on mobile.

---

## 11. Implementation Notes (aligns with TECH-STACK)

- **Tailwind v4 CSS-first:** tokens live in `globals.css` as CSS variables on `:root` (dark) and `.light`; exposed to utilities via `@theme inline`. No `tailwind.config` color hardcoding that bypasses the variables.
- **shadcn `components.json`:** `style: new-york`, `baseColor: slate`, `cssVariables: true`, `iconLibrary: lucide`.
- **No raw hex in components** — use semantic utilities (`bg-primary`, `text-destructive`, `border-border`) so theme swaps work.
- **Fonts via `next/font`** (Geist Sans + Geist Mono); `tabular-nums` utility on numeric/table contexts.
- **Charts** import the §3.4 palette from a single tokens module so all charts stay in sync.
- **Status badge + KPI + DataTable** are built once as project components extending shadcn primitives, then reused — do not re-implement per module (TECH-STACK component rule).

---

## 12. Deferred / Open

- **User-facing theme toggle** (light/dark switch) — tokens are ready; the toggle UI is post-MVP unless trivially added.
- **Logo / wordmark** for "Block 23 Gym" — not yet provided; topbar uses a text wordmark placeholder until supplied.
- **Compact-density default** — comfortable ships first; a per-table density toggle can follow if the owner wants denser lists.
- **Light-mode data-viz parity pass** — palette is defined for dark; a contrast re-check of chart colors on white is required when light mode is built.
- **Print stylesheet** for reports (separate from CSV export) — post-MVP.
