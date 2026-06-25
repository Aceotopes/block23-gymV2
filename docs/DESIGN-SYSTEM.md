# Design System — Block23 Gym Management System

This is the **single source of truth** for the visual and interaction language of Block23 Gym V2. Every screen, component, and interaction state is specified here in measurable, enforceable terms. When implementation code and this document disagree, this document wins — and the discrepancy is fixed in code.

**Scope:** This document defines the *system* (tokens, rules, component standards, patterns). It does not contain application component source — implementation follows `TECH-STACK.md` (Server Components by default, shadcn/ui primitives, Tailwind v4 utilities, tokens from CSS variables).

**Foundations it is built on (locked — do not reopen here):**

| Foundation | Source | What it fixes for this document |
|---|---|---|
| Design language: dark-first, professional indigo accent on neutral slate | ADR-045 | The palette, fonts, shadcn style, and "status never by color alone" rule |
| Desktop-first, mobile-responsive, **no tablet target** | ADR-033 | Every surface is designed at `lg`/`xl` first; mobile adapts read-heavy surfaces only |
| 8 top-level nav entries; Membership is distributed | ADR-042, `INFORMATION-ARCHITECTURE.md` | The app shell, sidebar, and screen map |
| Stack: shadcn/ui (`new-york`) + Radix on Tailwind CSS v4, Recharts, lucide-react | `TECH-STACK.md` | The only component, styling, chart, and icon libraries permitted |
| Accessibility: **WCAG 2.1 AA** | ADR-044 | Contrast floors, keyboard operability, visible focus, color-independent status, reduced motion |

**How to use this document:** Pick the screen you are building, read §17 (Per-Workflow Design Coverage) to find its pattern and component mapping, then apply the relevant standards (§3–§16). For AI/Claude Code sessions, §18 is mandatory pre-flight reading.

---

## 1. Design Principles

These six principles resolve trade-offs. When two rules conflict, the lower-numbered principle wins.

1. **Data legibility over decoration.** The owner reads dense tables, six KPI cards, four dashboard charts, and 22 reports. Chrome is quiet; data is loud. No decorative gradients, glows, or imagery compete with numbers. Money and counts are tabular, right-aligned, and unmistakable.
2. **Dark-first, low-fatigue.** The default theme is dark slate with an indigo accent for long monitoring sessions. Light mode is a first-class secondary theme produced by flipping token *values* — never by editing component code.
3. **Status is never color alone (ADR-044).** Every status carries a text label; every status badge also carries an icon/shape. Color reinforces meaning; it never solely conveys it.
4. **One token layer.** Components consume semantic CSS variables (`--primary`, `--destructive`, `--muted`) and never raw hex. A theme is a set of variable values, not a code path.
5. **Speed at the counter.** The highest-frequency surfaces (Check-In, POS) are keyboard-first, single-focus, and return focus to search after every action. Perceived latency on these surfaces is held under 100 ms for input feedback.
6. **Compose shadcn/Radix; don't replace it.** Accessibility, focus management, and ARIA come from the primitives plus these tokens. Hand-rolled interactive widgets that duplicate a Radix primitive are prohibited.

---

## 2. Brand Personality & Design Goals

### 2.1 Brand personality

> **Owner-confirmed (2026-06-25).** These four pillars were challenged against the energetic gym-app norm and the realistic alternatives, and the owner reaffirmed each: **operational-instrument vibe** (over athletic energy), **indigo accent** (over orange/green/sky — each of which collides with a status color, §3.4), **dark-first default** (front-desk light is controlled), and **Geist Sans + Geist Mono**. ADR-045 is therefore not an inherited default but a deliberately retained decision.

Block23 is an **operational instrument**, not a consumer lifestyle app. The personality target, expressed as measurable design choices:

| Trait | Means in practice | Anti-trait (prohibited) |
|---|---|---|
| **Precise** | Tabular figures, right-aligned money, exact timestamps in gym timezone, 2-decimal currency | Approximate/rounded money in operational views; ragged number columns |
| **Calm** | Dark slate canvas, ≤3 accent hues per screen, motion ≤240 ms, no autoplay | Bright fills, pulsing decoration, celebratory animation |
| **Direct** | One primary action per screen; plain-language confirmations naming the consequence | Ambiguous icon-only actions; "Are you sure?" with no stated consequence |
| **Trustworthy** | Void/cancel/archive are additive and visible; nothing is silently deleted | Hidden destructive actions; color-only error signalling |

### 2.2 Design goals (measurable)

These are pass/fail acceptance targets for any screen built against this system.

| Goal | Target | Verified by |
|---|---|---|
| Readable density | Body text 14 px, line-height ≥1.4; primary data visible without horizontal scroll at 1280 px | Visual check at `xl` |
| Contrast | All text ≥4.5:1; large text and meaningful UI boundaries ≥3:1 (§3.5) | Contrast tooling on every token pair before use |
| Keyboard parity | 100% of actions reachable and operable by keyboard; visible focus on every focusable element | Tab-through audit per screen |
| Action clarity | Exactly one `--primary` button per screen region; destructive actions use `--destructive` and are spatially separated | Code review |
| Status independence | Every status communicates via label + icon, verified with a greyscale screenshot | Greyscale check |
| Speed-surface latency | Check-In/POS input-to-feedback <100 ms; screen returns to search focus after each commit | Manual timing |
| Empty/loading/error coverage | Every data surface defines all three states (§13.8) — never a blank panel | Per-screen checklist |

---

## 3. Color System

### 3.1 Theming model

**Dark is the default theme.** Tokens are CSS variables on `:root` (dark) with a `.light` override block. shadcn/ui reads these variables; Tailwind v4 exposes them via `@theme inline`.

```
:root            → dark theme (default)
.light           → light theme override
@theme inline    → maps tokens to Tailwind utilities (bg-background, text-foreground, …)
```

- **Base color:** `slate` (`components.json` → `baseColor: "slate"`).
- **shadcn style:** `new-york`.
- Values below are written as hex for readability. Store them as CSS variables in **one** consistent format (HSL or OKLCH). The *values* are normative; the storage format is not.
- A user-facing light/dark toggle is deferred (§19), but because every surface uses variables, shipping it is a values flip, not a redesign.

### 3.2 Core token set

| Token (shadcn var) | Role | Dark (default) | Light |
|---|---|---|---|
| `--background` | App canvas | `#0F172A` slate-900 | `#FFFFFF` |
| `--foreground` | Primary text | `#F1F5F9` slate-100 | `#0F172A` slate-900 |
| `--card` | Card / panel surface | `#15203A` (slate-900 lifted) | `#FFFFFF` |
| `--card-foreground` | Text on card | `#F1F5F9` | `#0F172A` |
| `--popover` | Menus, dialogs, popovers | `#1E293B` slate-800 | `#FFFFFF` |
| `--popover-foreground` | Text in popovers | `#F1F5F9` | `#0F172A` |
| `--muted` | Subtle fills, table header | `#1E293B` slate-800 | `#F1F5F9` slate-100 |
| `--muted-foreground` | Secondary / label text | `#94A3B8` slate-400 | `#64748B` slate-500 |
| `--border` | Hairlines, dividers, inputs | `#283449` (~slate-750) | `#E2E8F0` slate-200 |
| `--input` | Input border | `#334155` slate-700 | `#CBD5E1` slate-300 |
| `--ring` | Focus ring | `#818CF8` indigo-400 | `#6366F1` indigo-500 |
| `--primary` | Brand / primary action | `#6366F1` indigo-500 | `#4F46E5` indigo-600 |
| `--primary-foreground` | Text on primary | `#FFFFFF` | `#FFFFFF` |
| `--secondary` | Secondary surfaces / buttons | `#1E293B` slate-800 | `#F1F5F9` slate-100 |
| `--secondary-foreground` | Text on secondary | `#E2E8F0` | `#0F172A` |
| `--accent` | Hover / active surface | `#27344C` | `#EEF2FF` indigo-50 |
| `--accent-foreground` | Text on accent | `#F1F5F9` | `#3730A3` indigo-800 |
| `--destructive` | Destructive action (solid) | `#DC2626` red-600 | `#DC2626` red-600 |
| `--destructive-foreground` | Text on destructive | `#FFFFFF` | `#FFFFFF` |

> **Why indigo-500 dark / indigo-600 light:** white on indigo-500 ≈ 4.6:1 (AA normal text); on a light canvas indigo-600 keeps the same button readable. **Never** use indigo-600 as a fill behind small text on dark — it dims below AA; use indigo-500. **Never** use indigo-500 as a fill behind small white text on light — use indigo-600.

### 3.3 Semantic (feedback) colors

Each semantic has a **solid** variant (filled badge/button + foreground), a **text/icon** variant (for the canvas), and a **subtle** surface (tinted background at 12–16% alpha).

| Semantic | Solid fill | Solid text | Text/icon on canvas (dark / light) | Subtle surface |
|---|---|---|---|---|
| **Success** | `#059669` emerald-600 | white | `#34D399` / `#047857` | emerald @ 15% |
| **Warning** | `#D97706` amber-600 | white | `#FBBF24` / `#B45309` | amber @ 15% |
| **Danger** | `#DC2626` red-600 | white | `#F87171` / `#B91C1C` | red @ 15% |
| **Info** | `#0284C7` sky-600 | white | `#38BDF8` / `#0369A1` | sky @ 15% |
| **Neutral** | `#475569` slate-600 | white | `#94A3B8` / `#475569` | slate @ 12% |

> Amber never carries white text below large sizes. Use **amber-600** for solid (with white) or amber **text** on the canvas. Do not place white on amber-400/500.

### 3.4 Domain status tokens (color + label + shape — never color alone)

The canonical mapping for every status surfaced across the modules. **Every badge renders its label text; the icon/shape is the color-independent signal (ADR-044, Principle 3).**

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

> **At-risk uses orange (`#F97316`), not amber,** so it stays distinguishable from "Expiring soon" (amber) when both appear on one client row. Both still differ additionally by icon and label.

**Payment-method chips** (Collections, Payments, Reports) are neutral chips differentiated by **label + icon**, not hue: Cash `banknote`, GCash `smartphone`, Card `credit-card`, Other `wallet`.

### 3.5 Data-visualization palette (Recharts)

A categorical palette tuned for the dark canvas (re-verified for light, §19). Series are **also** distinguished by non-color means (line dash / marker / legend order) for color-independence.

| Slot | Color (dark) | Typical use |
|---|---|---|
| Cat-1 | `#818CF8` indigo-400 | Membership revenue · Member check-ins |
| Cat-2 | `#34D399` emerald-400 | Product revenue |
| Cat-3 | `#FBBF24` amber-400 | Walk-in revenue · Walk-in check-ins |
| Cat-4 | `#38BDF8` sky-400 | Secondary series |
| Cat-5 | `#F472B6` pink-400 | Additional category |
| Cat-6 | `#A3E635` lime-400 | Additional category |
| Grid / axis | `#334155` slate-700 (grid), `#94A3B8` slate-400 (labels) | — |

**Fixed semantic chart mappings (use these exact assignments so charts agree across the app):**
- **Revenue by source:** Membership = Cat-1 (indigo), Walk-In = Cat-3 (amber), Product = Cat-2 (emerald).
- **Member vs Walk-in attendance:** Member = Cat-1 (indigo), Walk-In = Cat-3 (amber).
- **Membership status donut:** Active = emerald, Expiring soon = amber, Expired = slate-500.
- **Net change / deltas:** positive = emerald, negative = red, zero = slate-400.

### 3.6 Contrast (AA) commitments

- Body and label text meet **≥4.5:1**; large text (≥24 px regular / ≥18.66 px bold) and meaningful UI/graphic boundaries meet **≥3:1**.
- Verified primary pairs: `foreground` on `background` (dark ≈14:1), `muted-foreground` on `background` (dark ≈5.6:1), white on `--primary` (≈4.6:1), white on `--destructive` (≈4.5:1); success/warning/danger/info **text** tokens on canvas ≥4.5:1.
- Focus ring (`--ring`) against adjacent surfaces ≥3:1.
- Chart data: lines/bars vs background ≥3:1; data text labels ≥4.5:1.
- **Disallowed:** white text on amber-400/500; `muted-foreground` for primary reading text; any status conveyed by fill color with no label; new foreground/background pairs that have not been contrast-checked.

---

## 4. Typography

**Families:** `Geist Sans` (UI) and `Geist Mono` (numeric/tabular, IDs) — loaded via `next/font`, Vercel-native, no extra license. Mono is used for money, quantities, durations, and any column where digit alignment matters.

**Tabular figures everywhere numbers line up:** apply `font-feature-settings: "tnum"` (Tailwind `tabular-nums`) to all numeric table cells, KPI values, and currency. Money is right-aligned.

**Type scale** (rem @ 16 px root; data-dense, so default body is 14 px):

| Token | Size / line-height | Weight | Usage |
|---|---|---|---|
| `display` | 30 / 36 | 600 | Empty-state hero, login |
| `h1` | 24 / 32 | 600 | Page title |
| `h2` | 20 / 28 | 600 | Section / card title |
| `h3` | 16 / 24 | 600 | Sub-section, dialog title |
| `body` | 14 / 20 | 400 | Default UI text |
| `body-strong` | 14 / 20 | 500 | Emphasis, table headers |
| `sm` | 13 / 18 | 400 | Table cells, secondary text |
| `xs` | 12 / 16 | 500 | Badge, caption, chip |
| `kpi` | 28 / 32 | 600, `tabular-nums` | KPI card value |
| `mono-sm` | 13 / 18 | 450 | Money, quantities, IDs |

**Rules (enforceable):**
- Exactly one `h1` per page; headings descend without skipping levels (`h1→h2→h3`).
- Weights limited to 400 / 500 / 600. 700 is reserved for rare single-word emphasis and never for body or table text.
- Meaning is never carried by italics alone.
- Prose/help text line length is capped at ~75ch; tables run full content width.
- Minimum rendered text size is 12 px (`xs`); never smaller. On mobile, body inputs render at ≥16 px to avoid iOS auto-zoom.

---

## 5. Spacing, Radius, Grid & Layout

### 5.1 Spacing scale

4 px base (Tailwind default): `0, 1(4), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48), 16(64)`. No off-scale spacing values.

| Context | Value |
|---|---|
| Card padding | 24 (desktop) / 16 (mobile) |
| Table cell padding | 12×16 (comfortable) or 8×12 (compact density) |
| Form field vertical gap | 16 |
| Section gap | 24–32 |
| Inline icon ↔ label gap | 8 |
| Page header → content | 24 |

### 5.2 Radius

`--radius: 0.5rem`. Scale: `sm 4 · md 6 · lg 8 (default) · xl 12 · full`. Inputs/buttons/badges = md–lg; cards = lg–xl; pills/chips = full. No square (0) corners except table edges and full-bleed surfaces.

### 5.3 Grid system

The content region uses a **12-column CSS grid** at `xl`, with a 24 px gutter and 24 px content inset. Specific layouts derive from it:

| Surface | Columns (xl) | lg | md | < md |
|---|---|---|---|---|
| **KPI strip** (6 cards) | 6 | 3 | 2 | 2 (wrap) |
| **Dashboard charts** | 2-up (6+6) | 2-up | 1-up | 1-up |
| **Dashboard live-feed panels** | 3-up (4+4+4) | 2-up | 1-up | 1-up |
| **Form (single record)** | `max-w-3xl`, 1 field per row; paired short fields 2-up | same | 1-up | 1-up |
| **Data tables / reports** | full content width | full | full | horizontal scroll / stacked cards |
| **Client Profile** | header full width; tab content `max-w-5xl` | same | full | full |

- **Content max-widths:** prose/forms cap at `max-w-3xl` (768 px); reading text caps at 75ch; data tables and reports use full content width.
- A KPI card never shrinks below 160 px wide; if the viewport cannot fit the column count, cards wrap to the next row (never horizontally scroll the KPI strip).

### 5.4 App shell (per IA, ADR-042)

```
┌────────────────────────────────────────────────────────────┐
│  Topbar: gym name · global state · user menu                │   56px
├───────────┬────────────────────────────────────────────────┤
│  Sidebar  │  Content area                                   │
│  (8 nav)  │  ┌──────────────────────────────────────────┐  │
│  240px    │  │ Page header (title · primary action)     │  │
│  collapse │  │ Content (cards / tables / charts)        │  │
│  → 64px   │  └──────────────────────────────────────────┘  │
└───────────┴────────────────────────────────────────────────┘
```

- **Topbar:** 56 px, sticky (`z-20`). Holds the gym wordmark (left), any global state, and the user menu (right). Never holds page-specific actions.
- **Sidebar:** the 8 nav entries (Dashboard · Clients · Attendance · Client Payments · POS · Inventory · Reports · Settings), each icon (20 px) + label. Width 240 px, collapsible to a 64 px icon rail (collapsed labels surface as tooltips). Active item: indigo left-accent bar (3 px) + `--accent` fill + `--primary` text/icon.
- **Page header:** holds the `h1` and at most one `--primary` action button (e.g., "+ New Client"). Secondary actions are ghost/secondary buttons or an overflow `⋯` menu.
- **Density:** comfortable is the default; long-list tables (Client List, Inventory, reports) offer a per-table compact toggle (8×12 cell padding + `sm` text).

---

## 6. Elevation & Z-index

Dark UIs separate surfaces with **1 px borders + a slight surface lift**, not heavy shadows. Shadows appear only on true overlays.

### 6.1 Elevation scale

| Level | Surface | Treatment (dark) | Treatment (light) |
|---|---|---|---|
| 0 | App canvas | `--background`, no border | `--background` |
| 1 | Resting card / panel | `--card` fill + 1 px `--border` | `--card` + 1 px `--border` + `shadow-xs` |
| 2 | Dropdown / popover / select | `--popover` + 1 px `--border` + `shadow-md` (low opacity) | `--popover` + `shadow-md` |
| 3 | Dialog / sheet | `--popover` + `shadow-lg` + scrim | `shadow-lg` + scrim |
| 4 | Toast | `--popover` + `shadow-lg` | `shadow-lg` |

**Resting cards carry no shadow in dark mode** — separation comes from fill + border. Do not stack shadows or invent intermediate shadow values.

### 6.2 Modal scrim

Dialog/sheet overlays use a scrim of **40–60% black** (`bg-black/50`) so foreground content is isolated. The scrim is present in both themes.

### 6.3 Z-index scale

Use only these values; never an arbitrary `z-[9999]`.

| Layer | z-index |
|---|---|
| Base content | 0 |
| Raised (sticky table header, FAB) | 10 |
| Topbar / sticky page header | 20 |
| Dropdown / popover / tooltip-trigger surface | 30 |
| Overlay scrim | 40 |
| Dialog / sheet / command palette | 50 |
| Toast | 60 |
| Tooltip | 70 |

---

## 7. Iconography

- **Library:** `lucide-react` only (shadcn default). No second icon set; no emoji as structural icons.
- **Sizes (tokens):** `icon-sm 16` (inline/table), `icon-md 18` (buttons), `icon-nav 20` (nav, section headers), `icon-empty 24` (empty states). No off-token sizes.
- **Stroke:** 2 by default; 1.5 acceptable at ≥24 px. One stroke width per visual layer.
- **Filled vs outline discipline:** one style per hierarchy level. Status dots are the only filled glyphs in table rows.
- **Labelling:** primary actions and statuses always pair icon + text label. Icon-only controls require both an `aria-label` and a tooltip, and a ≥24 px hit area (≥40 px on mobile).
- **Canonical icons:** statuses per §3.4; destructive `ban` / `trash-2` / `x-circle`; money `banknote`; search `search`; add `plus`; edit `pencil`; export `download`; filter `sliders-horizontal`; overflow `more-horizontal`.

---

## 8. Imagery & Illustration

This is a data tool; imagery is functional, not decorative.

- **No illustration system.** Empty states use a single 24 px muted lucide icon + copy (§13.8), not spot illustrations. Do not introduce an illustration library.
- **Product images (POS grid / product forms):** square aspect ratio (`aspect-square`), `object-cover`, `lg` radius, served from Cloudflare R2 (TECH-STACK). Always declare width/height or `aspect-ratio` to prevent layout shift. Lazy-load below the fold.
- **Product image fallback:** when `image_url` is null, render a neutral placeholder = `--muted` tile with a centered `package` icon (`--muted-foreground`) and the product's initials. Never a broken-image glyph.
- **Client identity:** no client photos at MVP (US-2.8 is P2). Where an avatar slot is needed, render initials on a `--secondary` circle.
- **Logo / wordmark:** "Block 23 Gym" text wordmark in the topbar until an official asset is supplied (§19). Do not invent or recolor a logo.

---

## 9. Motion

- **Duration tokens:** `fast 120 ms` (hover, small toggles), `base 180 ms` (popovers, dropdowns, tabs, accordions), `slow 240 ms` (dialogs, sheets, route-level). Nothing exceeds 240 ms.
- **Easing:** enter `ease-out`, exit `ease-in`; exits run at ~70% of the enter duration. No spring/bounce in a data tool.
- **Animate only:** dialog/sheet/popover/toast enter–exit, accordion/collapsible expand, tab content crossfade, chart initial draw, skeleton shimmer, and an optional subtle KPI delta count-up.
- **Performance:** animate `transform`/`opacity` only — never `width`/`height`/`top`/`left`. Animations never cause layout reflow (CLS).
- **Interruptible:** an in-progress animation never blocks input; a click/keypress cancels it immediately.
- **`prefers-reduced-motion` (ADR-044):** disable transforms and shimmer, keep instant opacity swaps; charts render their final state immediately; no count-up. This is mandatory, not optional.

---

## 10. Interaction States

Every interactive element defines all applicable states. This is the enforceable matrix; component sections (§11) reference it.

| State | Visual rule | Token / utility |
|---|---|---|
| **Default** | Resting style per component | — |
| **Hover** (pointer only) | Surface lightens one step; `cursor-pointer` on all clickable elements; transition 120 ms | `hover:bg-accent` / `hover:bg-primary/90` |
| **Focus-visible** | 2 px `--ring` with 2 px offset on **every** focusable element; never removed without an equivalent replacement | `focus-visible:ring-2 ring-ring ring-offset-2` |
| **Active / pressed** | Brief depress: opacity 0.9 or a 0.98 scale, restored on release; no layout shift | `active:opacity-90` |
| **Selected / current** | Nav active = indigo accent bar + `--accent`; selected chip = `--primary` subtle fill + indigo text + border; selected tab = active indicator | per §5.4, §11.6, §11.9 |
| **Disabled** | Opacity 0.5 + `cursor-not-allowed` + `aria-disabled`/`disabled`; not focusable; tooltip explains *why* when non-obvious | `disabled:opacity-50 disabled:pointer-events-none` |
| **Loading** | Async controls show an inline spinner and become non-interactive (`aria-busy`) — they do not change width | §13.9 |
| **Read-only** | Visually and semantically distinct from disabled — `--muted` fill, full-contrast text, focusable for copy | — |
| **Error** | `--destructive` border + error text associated via `aria-describedby` (§11.2) | — |

Hover is never the *only* affordance for a critical action (no hover-to-reveal primary controls). Press feedback appears within 100 ms.

---

## 11. Component Standards

All components are shadcn/ui primitives, themed by the tokens above. Each shared component (Status Badge, KPI Card, DataTable, Money cell) is built **once** as a project component and reused — never re-implemented per module (TECH-STACK component rule).

### 11.1 Buttons
- **Variants:** `primary` (filled `--primary`, one per screen region), `secondary` (filled `--secondary`), `ghost` (transparent, hover `--accent`), `destructive` (filled `--destructive`), `link`. `outline` for secondary toolbar actions.
- **Sizes:** `sm` (28 px h), `default` (36 px h), `lg` (40 px h). Mobile touch targets ≥44 px.
- **Icon + label** for all but icon-only toolbar buttons (which require `aria-label` + tooltip).
- **Pending state:** on Server Action submit, the button disables and shows a leading spinner via `useFormStatus`; label stays (e.g., "Saving…"); width is fixed to prevent reflow.
- Destructive buttons are visually separated from the primary action and never receive default focus in a dialog (§13.5).

### 11.2 Inputs & form fields
- **Label above field** (never placeholder-as-label). Placeholder is an example or hint only.
- Helper text sits below the field; on error it is **replaced** by the error message in `--destructive` text, associated via `aria-describedby` and announced (`role="alert"` on the message).
- Required fields marked with a `*` and `aria-required`.
- **Currency inputs** prefix `₱`, right-align, enforce 2 decimals, use tabular mono.
- **Numeric inputs** use `inputMode="decimal"`/`"numeric"` and semantic `type` so mobile keyboards match.
- Validation runs **on blur** (not per keystroke); the submit-blocking re-check happens server-side regardless (TECH-STACK).
- Input height ≥36 px desktop / ≥44 px mobile.

### 11.3 Select / Combobox
- Use Radix Select for short fixed lists (payment method, reason category, duration type); Combobox (`cmdk`) for searchable lists (plan selector, category).
- `FORCED_SALE` never appears in any reason-category selector (ADR-034) — it is system-assigned only.
- Reason-category selects that require a note on `OTHER` reveal the note field inline (§13.5).

### 11.4 Cards
- Elevation level 1 (§6.1): `--card` fill + 1 px `--border`, `lg`–`xl` radius, 24 px padding.
- Card header = `h2`/`h3` title + optional action/affordance on the right. Card body holds one coherent unit (one KPI, one chart, one panel, one form section).
- Live-feed panels (Dashboard) are cards with a title, a scrollable body (max ~5 rows), and a "View all →" link to the deep-linked destination (IA §4).

### 11.5 Badges → see §13.1 (Status badge pattern).

### 11.6 Tabs
- Used for: Attendance (Check-In / History / Analytics), Client Profile (Membership History / Attendance History).
- Active tab carries a 2 px `--primary` underline/indicator + `--foreground` text; inactive tabs use `--muted-foreground`.
- Tab state is reflected in the URL (§14.4) so refresh and back-button restore the active tab.

### 11.7 Dialog / AlertDialog / Sheet
- **Dialog:** create/edit forms (Register/Edit Client, Add/Renew membership, Add/Edit product/plan). Focus traps; Esc and the scrim dismiss; an explicit close affordance is always present.
- **AlertDialog:** destructive confirmations only (§13.5).
- **Sheet:** mobile navigation and slide-in side detail panels.
- **Unsaved-changes guard:** dismissing a Dialog/Sheet with dirty form fields prompts a confirm before discarding.
- Dialog max-width `max-w-lg` for forms, `max-w-md` for confirmations; body scrolls internally if it exceeds viewport height.

### 11.8 Tables → see §13.3 (Data table pattern).

### 11.9 Filter chips
- Horizontal, `rounded-full`, single row, deep-linked + session-persistent (§14.4).
- Selected = `--primary` subtle fill + indigo text + border; idle = `--secondary`.
- The 8 Client-List chips (`All · Active · Upcoming · At risk · Expiring soon · Expired · Walk-in only · Inactive`) follow §3.4 status colors so a chip visually matches its rows.
- Chips combine with name search; both constraints apply simultaneously (MODULE-SPECS Module 2). Multiple chips are mutually exclusive (single-select) per the spec — selecting one replaces the prior.

### 11.10 Command palette (`cmdk`)
- Powers Check-In search and POS product search. Auto-focused on view load; full keyboard control (type-ahead, ↑/↓, Enter, Esc).
- Result rows show the entity name + the status/type badges + context indicators ("checked in today", stock remaining). Selection branches inline (§13.10).

### 11.11 Toasts & notifications (Sonner)
- **Placement:** bottom-right on desktop, top-center on mobile. Max 3 stacked; older toasts collapse.
- **Types & duration:** `success` / `info` auto-dismiss at **4 s**; `warning` at **6 s**; `error` persists until dismissed (or 8 s) and includes the failure cause + a recovery affordance where applicable; `loading` (promise toast) resolves to success/error.
- **Use toasts for** action confirmations ("Sale recorded", "Membership cancelled", "Check-in saved") and background-operation results — optionally with a "View" link.
- **Do not use toasts for** destructive confirmation (that is AlertDialog) or for blocking validation errors (those render inline at the field).
- **Accessibility:** toasts use `aria-live="polite"` (errors `role="alert"`), never steal focus, and are dismissible by keyboard.

### 11.12 Tooltip / Popover
- **Tooltip:** label for icon-only controls and truncated text; keyboard-reachable; never the sole carrier of essential information.
- **Popover:** richer hover/click detail — e.g., the Inventory shrinkage breakdown by `adjustment_reason_category` (US-7.8). Popover content is keyboard-reachable; it is not the only path to the data (also available in the Inventory Usage Report).

### 11.13 Pagination & large lists
- Server-side pagination (TanStack Table) is the default for Client List, Inventory, POS History, Payments, and all report tables. Page size default 25; options 25/50/100.
- Lists expected to exceed ~50 rows on screen at once (e.g., Today's Check-Ins on a busy day) virtualize the row range.
- Sortable columns expose `aria-sort` reflecting the current sort; sort and page state live in the URL (§14.4).

### 11.14 Charts (Recharts)
- Palette and fixed semantic mappings per §3.5. Every series is distinguished by a second channel (dash/marker/legend order) in addition to color.
- Every chart shows axis labels with units, a visible legend near the chart, and tooltips/data labels on hover (keyboard-reachable).
- **Empty:** render axes with a "No data yet" centered label, not a blank frame. **Loading:** skeleton/shimmer placeholder, not an empty axis frame. **Error:** message + retry.
- Charts respect `prefers-reduced-motion` (no entrance animation; data readable immediately).
- A text/table alternative exists for chart data (the Reports module provides the exportable table form) so charts are not the only accessible representation.

---

## 12. Navigation

- **Primary nav** is the 8-entry sidebar (§5.4). Placement is identical on every page; the active entry is always visually indicated (indigo accent bar + `--accent` + `--primary` text).
- **No mixed nav patterns** at one level — sidebar on desktop, bottom nav on mobile, never both simultaneously.
- **Mobile (`< md`):** the sidebar collapses to a **bottom navigation bar**. With 8 entries exceeding the 5-item bottom-nav guideline, the bar shows the 4 highest-frequency entries (Dashboard · Clients · Attendance · POS) plus a "More" overflow sheet for the rest. Bottom nav is for top-level destinations only — never sub-navigation.
- **Secondary nav** within a module uses Tabs (Attendance, Client Profile) — not the sidebar.
- **Breadcrumbs** appear on the Reports module for any report 3+ levels deep (Reports → [report] → filtered view) to aid orientation; not used elsewhere (the app is shallow).
- **Deep links (IA §4):** Dashboard live-feed "View all →" links resolve to the correctly filtered Client List / Inventory / Collections using the URL-state mechanism (§14.4); Check-In branches deep-link to Add Membership (Flow 5) / Renew (Flow 6).
- **Back behavior:** browser back restores the prior list's filter, sort, page, and scroll position (guaranteed by URL state). Navigation never silently resets to the home/dashboard.
- **Destructive separation:** logout sits in the user menu, spatially separated from navigation; no destructive action lives in the nav.

---

## 13. Core Patterns

### 13.1 Status badge
`[icon] Label` in a pill (`xs`, weight 500, `rounded-full`): subtle semantic surface + semantic text on canvas; outline variant for VOID/Cancelled. **Label is mandatory; color is reinforcement.** A row may show multiple badges (e.g., "Expiring soon" + "At risk") — they differ by icon, label, and hue (§3.4).

### 13.2 KPI card
Title (`xs`, muted) · Value (`kpi`, tabular) · Delta (small: emerald ▲ / red ▼ / slate – with text like "+3 from last month") · optional sparkline. **Empty/zero renders `₱0` or `0`, never blank.** The Inventory Value card appends an excluded-count note when products lack `cost_price` (US-7.7). The six Dashboard KPI cards are fixed per MODULE-SPECS Module 1.

### 13.3 Data table
Toolbar (search + filter chips + density toggle + export-to-CSV) → header (`--muted` bg, `body-strong`, sortable carets with `aria-sort`) → rows (`sm`, optional zebra via `--muted` @40%) → footer (pagination / totals row). Numeric columns right-aligned + tabular mono. Row actions live in a trailing `⋯` menu. **States:** loading = skeleton rows matching column layout; empty = centered icon + the spec's exact empty copy; error = inline message + retry. Sort/filter/page state is deep-linked (§14.4).

### 13.4 Filter chips → §11.9.

### 13.5 Destructive confirmation (AlertDialog)
Used for **Void transaction, Cancel membership, Archive client/product, Force Sale**. Title names the action; body states the consequence in plain language; the confirm button is `--destructive`; required reason fields render **inline** (void `void_reason_category` + note-required-on-`OTHER`; cancel `cancellation_reason`; adjustment `OTHER` note). Force Sale shows the exact stock shortfall ("Only X servings remaining (~Z containers)"). **Default focus rests on Cancel**, never on the destructive action. Esc cancels.

### 13.6 Forms & validation
Label above; helper below; error replaces helper in `--destructive` text with `aria-describedby` and `role="alert"`. On submit error, focus moves to the first invalid field; for multiple errors, an error summary at the top anchors to each field. Submit-disabling is a hint only — the Server Action re-validates (TECH-STACK). Long/complex forms (membership, product) confirm before discarding unsaved changes (§11.7).

### 13.7 Money, number & date formatting
This system is money- and time-sensitive; formatting is standardized so figures are unambiguous and reconcilable.

| Data | Format | Example |
|---|---|---|
| Currency | `₱` prefix, en-PH grouping, exactly 2 decimals, tabular mono, right-aligned in tables | `₱1,250.00` |
| Voided amount | struck-through + VOID badge, excluded from totals | ~~`₱500.00`~~ |
| Negative / decline | `--destructive` text with leading `−` or `▼` | `−₱120.00`, `▼12%` |
| Count (integer) | grouped, no decimals | `1,204` visits |
| Average / rate | 1 decimal | `3.4 visits`, `27.5%` |
| Percentage delta | signed, colored (emerald/red/slate) | `+8.0%`, `−3.2%` |
| Date | `MMM d, yyyy` in `Gym.timezone` (ADR-035) | `Jun 25, 2026` |
| Date + time | `MMM d, yyyy · h:mm a` in `Gym.timezone` | `Jun 25, 2026 · 6:45 PM` |
| Time-only (check-in) | `h:mm a` | `6:45 PM` |
| Relative ("time-ago") | ≤24 h ago: relative; older: absolute date | `3m ago`, `2h ago`, `Jun 24` |

**All displayed timestamps are converted from UTC to `Gym.timezone`; all "today" boundaries use the current date in `Gym.timezone` (ADR-035).** Never render a raw UTC timestamp to the owner.

### 13.8 Empty / loading / error states (the three required states)
Every data surface defines all three; a blank panel is a defect.

- **Empty (no data):** centered 24 px `--muted-foreground` icon + the module spec's **exact** copy (e.g., "All active members have visited recently", "No transactions recorded for this date", "All active products have sales in the last N days") + a primary action where one applies. Zero-value KPIs and collections rows render `0`/`₱0`, not empty.
- **Loading:** skeleton matching the final layout (card/table/chart shape). Suppress the skeleton for operations under 300 ms to avoid flash. Live panels skeleton on first load only; background refreshes update in place without re-skeletoning.
- **Error (load failed):** inline message stating what failed + a retry affordance. Errors are visually and textually distinct from empty states ("Couldn't load …, retry" ≠ "No data yet").

### 13.9 Loading & feedback on actions
- **Server Action submit:** button enters pending state (spinner + disabled + fixed width) via `useFormStatus`; on success → toast (§11.11) + UI update; on failure → inline error and/or error toast with cause.
- **Live panels (Dashboard, Check-In Today's list):** background refresh via TanStack Query; no full-screen spinner, no layout shift on refetch.
- **Optimistic update** is permitted for POS cart quantity changes (instant) with server reconciliation; never optimistic for money-committing actions (checkout, void, payment) — those wait for server confirmation.
- Spinner appears only for waits >300 ms; for >1 s prefer a skeleton over a spinner.

### 13.10 Check-In & POS (speed surfaces)
A single dominant `Command`-style search, auto-focused; result cards show name + type badge + status + "checked-in today" indicator. Selection branches **inline**: active member → one "Check In"; MEMBER with expired membership → renewal decision prompt (ADR-018); walk-in → conversion-prompt check then fee collection. The POS cart is a persistent right rail (Zustand) with a running total; Cash payment reveals "Cash received → Change" computed live, blocking confirmation until cash ≥ total. Both surfaces return focus to search immediately after each committed action (Principle 5).

---

## 14. Responsive Behavior

Desktop-first (ADR-033). Breakpoints (Tailwind defaults): `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. **Design target is `lg`/`xl`. No tablet-specific breakpoint** — mobile-responsive layouts cover tablets adequately.

### 14.1 What adapts on mobile (`< md`)
- Sidebar → bottom nav (4 entries + "More", §12).
- KPI strips wrap 2-up.
- Dashboard charts and live panels stack 1-up.
- Data tables become **stacked cards** (label : value pairs) **or** horizontal scroll with a frozen first column. The choice is per table: monitoring tables (read) → stacked cards; ledger tables (scan) → frozen-column scroll.
- Forms go single-column; inputs render ≥16 px to avoid iOS zoom; touch targets ≥44 px.

### 14.2 What is not optimized for mobile
Data-entry workflows — POS checkout, Inventory restock/adjustment, product/plan management — are not optimized for mobile (IA §5). They remain operable but are designed for desktop.

### 14.3 Layout safety
`min-h-dvh` over `100vh`; no horizontal scroll on mobile except the deliberate frozen-column table; viewport meta never disables zoom; fixed bottom nav reserves bottom padding so content is never obscured.

### 14.4 State in the URL (deep-linking, refresh-safe)
List **filter, sort, page, active tab, and report period** are encoded in URL search params. This satisfies the spec's "filter state persists within the session" (MODULE-SPECS Module 2) **and** adds shareability, refresh-safety, and correct back-button restoration (Principle: predictable back). Ephemeral cross-component UI that must not survive a reload (the POS cart, an open dialog) stays in Zustand/local state. *(See §19 — this refines TECH-STACK's Zustand-for-filters note and should be confirmed.)*

---

## 15. Accessibility (ADR-044, concrete)

- **Keyboard:** full operability — Command search (type-ahead, ↑/↓/Enter/Esc), filter chips (Tab/Space), table sort (Enter on header), dialogs (focus trap, Esc), cart controls, pagination. No mouse-only path anywhere.
- **Focus:** visible `--ring` (2 px, 2 px offset) on every focusable element; never removed without a replacement. After a route change, focus moves to the main content region; after a dialog closes, focus returns to the trigger.
- **Color-independence:** every status = label + icon/shape (§3.4); every chart series = color + dash/marker/legend. Verified with a greyscale screenshot per screen.
- **Contrast:** the §3 pairs are the approved text/background combinations; any new pair is contrast-checked to AA before use.
- **Forms:** programmatic `<label>` association; errors associated via `aria-describedby`, announced via `role="alert"`, and focus-managed (first invalid field). Inputs use semantic `type`/`inputMode`.
- **Live regions:** toasts `aria-live="polite"`; background-updating panels announce politely; nothing auto-steals focus.
- **Motion:** honor `prefers-reduced-motion` (§9).
- **Targets:** interactive controls ≥24 px desktop with adequate spacing; primary touch targets ≥44 px on mobile.
- **Tables:** `aria-sort` on sortable headers; a row count / summary is available to screen readers.
- These are validated during the component build, not deferred to a post-launch audit.

---

## 16. Tailwind & Implementation Notes (aligns with TECH-STACK)

- **Tailwind v4 CSS-first:** tokens live in `globals.css` as CSS variables on `:root` (dark) and `.light`; exposed to utilities via `@theme inline`. No color hardcoding in `tailwind.config` that bypasses the variables.
- **shadcn `components.json`:** `style: new-york`, `baseColor: slate`, `cssVariables: true`, `iconLibrary: lucide`.
- **No raw hex in components** — use semantic utilities (`bg-primary`, `text-destructive`, `border-border`) so theme swaps work. Raw hex appears only in the token definitions and the chart palette module.
- **Fonts via `next/font`** (Geist Sans + Geist Mono); apply `tabular-nums` on numeric/table contexts.
- **Chart palette** is imported from a single tokens module (§3.5) so all charts stay in sync; the fixed semantic mappings live there as named exports.
- **Shared components built once:** `StatusBadge`, `KpiCard`, `DataTable` (TanStack + shadcn), `MoneyCell`, `DateCell`, `EmptyState`, `ConfirmDialog`. Reuse them — do not re-implement per module (TECH-STACK component rule). Prettier (`prettier-plugin-tailwindcss`) owns class order; never reorder manually.
- **Class order, density, and token usage are not code-review debates** — they are mechanical and enforced by tooling and this document.

---

## 17. Per-Workflow Design Coverage

Every major workflow has design guidance. This table is the cross-check against USER-STORIES, USER-FLOWS, MODULE-SPECS, and IA — each screen maps to its pattern(s) and primary components.

| Module / screen | Key flows / stories | Primary pattern(s) | Primary components |
|---|---|---|---|
| **Login** | Flow 1, US-1.1 | Centered card on `display` hero; single primary action; generic error | Card, Form, Input, Button |
| **Dashboard** | US-8.1, Flow 10 | KPI strip (§13.2) · charts (§11.14) · live-feed panels (§11.4) with deep links | KpiCard, Card, Recharts, Badge |
| **Client List** | US-2.3/2.9/2.10/2.11 | Data table (§13.3) + 8 filter chips (§11.9) + show-archived toggle; URL state (§14.4) | DataTable, Filter chips, Badge, Toggle |
| **Register / Edit Client** | US-2.1/2.2, Flow 2 | Dialog form (§11.7) + fuzzy-duplicate warning (non-blocking) | Dialog, Form, Input |
| **Client Profile** | US-2.4, Flow 7/12 | Header (type+status badges, quick-stats strip, context-aware membership button, `⋯` menu) + Tabs | Tabs, Badge, KpiCard (stats), DropdownMenu |
| **Membership History tab** | US-3.4/3.10, Flow 18 | Table with VOID/Cancelled badges; row `⋯` → Cancel (destructive confirm §13.5) | DataTable, Badge, AlertDialog |
| **Add / Renew / Cancel membership** | US-3.1/3.2/3.3, Flow 5/6/18 | Dialog form; plan Combobox + inline Custom-duration; price override; blocking states (active/upcoming) | Dialog, Combobox, Input, AlertDialog |
| **Check-In** | US-4.1/4.8, Flow 3/4/14 | Speed surface (§13.10): command search + branch prompts + Today's list | Command, Card, Badge, AlertDialog, Toast |
| **Attendance History** | US-4.3 | Data table + date-preset filters + visit-type filter; URL state | DataTable, ToggleGroup, DatePicker |
| **Attendance Analytics** | US-4.10 | KPI cards + charts (period selector) + insight/alert panels | KpiCard, Recharts, Card, Badge |
| **Attendance correction** | US-4.11, Flow 15 | Inline same-day edit; required reason; confirm dialog; "edited" marker | Dialog, Input, AlertDialog |
| **Client Payment History** | US-5.2/5.3, Flow 11 | Data table; row `⋯` → Void (destructive confirm with category + note) | DataTable, Badge, AlertDialog, Select |
| **Collections Summary** | US-5.4, Flow 17 | Totals table by payment-method chip + grand total; date selector; zero-state | Card, Table, Payment chips, DatePicker |
| **POS Screen** | US-6.6–6.16, Flow 8/16 | Speed surface (§13.10): category tabs + product grid + cart rail + cash-change checkout; container-mode toggle | Tabs, Card grid, Command, ToggleGroup, Dialog |
| **Product Management** | US-6.1–6.5, Flow 20 | Data table + Dialog form (gross-margin live field, archive/restore) | DataTable, Dialog, Form, Badge |
| **POS History** | US-6.10 | Data table + today's summary strip; Void action | DataTable, Badge, AlertDialog |
| **Current Stock** | US-7.3/7.4/7.6/7.7/7.8 | Data table: low-stock/reorder flags, days-to-stockout, shrinkage popover, valuation footer | DataTable, Badge, Popover |
| **Restock / Adjust** | US-7.1/7.5, Flow 9/19 | Dialog form; adjustment category Select (no FORCED_SALE); note-on-OTHER | Dialog, Form, Select, Input |
| **Inventory Movement History** | US-7.2 | Data table (PURCHASE/SALE/ADJUSTMENT); FORCED_SALE flagged | DataTable, Badge |
| **Reports (22)** | US-8.2–8.22 | Data table (§13.3) + period selector + CSV export; breadcrumb for deep reports; per-report empty/error copy | DataTable, ToggleGroup, DatePicker, Button |
| **Settings** | US-1.2/1.3/1.4/1.7/1.8/1.9, US-3.9, Flow 13 | Sectioned forms (Gym info, Pricing, System Preferences, Membership Plans table) | Card, Form, Input, DataTable, Badge |

Any new screen not in this table must be added here before implementation, with its pattern and component mapping.

---

## 18. AI Implementation Guidelines

Mandatory pre-flight for Claude Code / AI sessions generating UI. Read alongside TECH-STACK §7.

1. **This document is the SSOT for UI.** If a generated design conflicts with it, follow this document and flag the conflict. Do not invent tokens, colors, fonts, spacing, or component patterns outside §3–§16.
2. **Tokens only — no raw hex/px-color in components.** Use semantic utilities (`bg-primary`, `text-muted-foreground`, `border-border`). The only files with raw hex are the token definitions and the chart-palette module.
3. **Compose shadcn/ui + Radix; never hand-roll** a dialog, select, tooltip, combobox, or tabs. New needs are met by composing the §11 inventory — do not add a component or chart library (TECH-STACK rule 5).
4. **Build shared components once** (§16). Before creating a badge/table/KPI/money cell, check whether the project component exists and reuse it.
5. **Every data surface ships all three states** (§13.8) using the module spec's exact empty copy. A blank panel, a bare spinner with no skeleton, or a missing error+retry is incomplete work.
6. **Status is label + icon, never color alone** (§3.4). Generating a color-only status is a defect.
7. **Money/number/date formatting follows §13.7**; all timestamps display in `Gym.timezone` (ADR-035). Never render raw UTC.
8. **Accessibility is built-in, not added later** (§15): visible focus, keyboard parity, label association, `aria-sort`, reduced-motion. Generate it from the start.
9. **`FORCED_SALE` never appears in a user-facing selector** (ADR-034); destructive actions use AlertDialog with reason fields inline (§13.5) and default focus on Cancel.
10. **Desktop-first** (§14): build the `lg`/`xl` layout first, then the mobile adaptation. Do not optimize data-entry flows for mobile.
11. **When a screen is not in §17,** add its row (pattern + components) before generating it; if the pattern is genuinely new, surface the question rather than inventing silently.

---

## 19. Deferred / Open Questions

- **List-state mechanism (confirm):** §14.4 specifies URL search params for filter/sort/page/tab/period state, which refines TECH-STACK's "Zustand for session-persistent filter state." Both satisfy the spec; URL state additionally gives shareable, refresh-safe, back-restorable views and suits Server Components. **Recommendation:** adopt URL params for list state; keep Zustand for the POS cart only. Confirm and, if accepted, note it in `DECISIONS.md` / `TECH-STACK.md`.
- **User-facing theme toggle** (light/dark switch) — tokens are ready; the toggle UI is post-MVP unless trivially added.
- **Logo / wordmark** for "Block 23 Gym" — not yet supplied; topbar uses a text wordmark placeholder (§8) until provided.
- **Light-mode data-viz parity pass** — the §3.5 palette is verified for dark; re-check chart colors on the white canvas to AA when light mode is built.
- **Compact-density default** — comfortable ships first; a per-table density toggle (§5.4) can follow if the owner prefers denser lists by default.
- **Print stylesheet** for reports (separate from CSV export) — post-MVP.
- **Attendance-decline alert threshold** is hardcoded at 20% (MODULE-SPECS Module 4); if it becomes configurable, the Settings form and any visual threshold styling inherit the §11 form/badge standards.
```

