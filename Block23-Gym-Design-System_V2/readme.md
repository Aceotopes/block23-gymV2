# Block 23 Gym — Design System

A dark-first operational console for a single gym owner/admin. Block 23 is an
**operational instrument**, not a consumer fitness app: dense tables, six KPI
cards, live revenue, POS, inventory, and 22 reports — chrome quiet, data loud.

This design system is extracted **verbatim from the approved prototype**
(`Block 23 Console`) so downstream designs match the shipped product pixel-for-pixel.

---

## Product context

- **Who:** Argee Vizcarra, the gym owner ("OWNER" role). Single-tenant today, built
  for a future multi-gym SaaS + self-hosted path.
- **What it does:** Dashboard (revenue, members, check-ins), Clients (registry +
  profiles), Attendance (speed check-in, history, analytics), Client Payments,
  POS (product sale + cash change), Inventory (stock, restock, movement), Reports
  (22 exportable views), Settings.
- **Where:** Desktop-first (`lg`/`xl`), mobile-responsive for read-heavy surfaces.
  Manila / Philippine peso (₱), Asia/Manila timezone.
- **Speed surfaces:** Check-In and POS are keyboard-first, single-focus, and
  return focus to search after every commit.

### Sources (stored for reference — reader may not have access)

| Source                 | Location                                                 | Notes                                                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Approved prototype** | `uploads/Block23 Gym_V2-UI/Block 23 Console.dc.html`     | **Ground truth.** All tokens, type, spacing, components extracted from here.                                                                                                                                                                          |
| Design spec            | `uploads/Block23 Gym_V2-UI/uploads/DESIGN-SYSTEM.md`     | Rules & principles. **Note:** its color/type tables describe an _earlier_ indigo/slate + Geist direction that the shipped prototype superseded. Where the doc and the prototype disagree, **the prototype wins** (this system follows the prototype). |
| Tech stack             | `uploads/Block23 Gym_V2-UI/uploads/TECH-STACK.md`        | Next.js 15 · shadcn/ui (new-york) · Tailwind v4 · Radix · Recharts · lucide-react.                                                                                                                                                                    |
| Module specs / IA      | `.../MODULE-SPECS.md`, `.../INFORMATION-ARCHITECTURE.md` | Screen-by-screen content & flows.                                                                                                                                                                                                                     |

> **Design-vs-doc discrepancy (important):** `DESIGN-SYSTEM.md` §3–§4 specify
> indigo `#6366F1` on slate `#0F172A` with Geist Sans/Mono. The **shipped
> prototype** instead used a warm near-black canvas `#100F0D` with an electric
> **violet** primary and **Space Grotesk + IBM Plex Sans/Mono**. This system
> encodes the prototype's foundations, with the primary as electric **violet
> `#8B43F0`**. If the owner wants the documented indigo direction instead,
> flag it — it's a full re-theme.

---

## CONTENT FUNDAMENTALS

How Block 23 writes copy. The voice is a **calm, precise operator** — it talks to
Marcus like a trusted floor manager, never like a marketing app.

- **Person & address.** Second person, warm but brief: "Good evening, Marcus",
  "Here's how Block 23 is running". Instructions are direct imperatives:
  "Tap a product to ring it up", "Search clients, products, transactions…".
- **Tone.** Factual and reassuring, never hype. No exclamation points, no
  celebration. "Sale recorded." "Membership cancelled." "Check-in saved." State
  the outcome and stop.
- **Casing.** Sentence case for headings and body ("Today's revenue", "Expiring
  soon"). **UPPERCASE mono micro-labels** for eyebrows and meta, letter-spaced:
  `TODAY'S REVENUE`, `INTRADAY`, `MENU`, `OWNER`, `ASIA / MANILA`, `CSV EXPORT`.
- **Numbers are the message.** Money always `₱` + grouped + 2 decimals
  (`₱18,450.00`), right-aligned, tabular mono. Deltas are signed and directional
  with a triangle: `▲ 12.4%`, `▲ +3 from last month`, `▼ 12%`. Counts grouped, no
  decimals (`41 transactions`, `96 check-ins`). Rates one decimal (`27.5%`).
- **Dates & time.** `MMM d, yyyy` (`Jun 30, 2026`); date+time `MMM d, yyyy · h:mm a`;
  time-only `7:12 PM`; relative under 24h (`3m ago`, `2h ago`) else absolute.
  Always gym-local, never raw UTC.
- **Status language.** Every status is a short label paired with an icon/shape —
  "Active", "Upcoming", "Expiring soon", "Expired", "At risk", "VOID",
  "Cancelled", "Low stock". Never color alone.
- **Consequences named plainly.** Destructive confirms state what happens:
  "Only X servings remaining", "This can't be undone", reason required inline.
- **Emoji:** none. Ever. Icons are lucide line icons; the only "glyphs" are status
  dots (●/○), directional triangles (▲/▼), and the ⌘K hint.
- **Micro-guidance.** Speed surfaces coach quietly: "Focus returns to search after
  each check-in — keep typing the next name." Empty states are specific and calm:
  "No clients match this filter · Try a different chip or clear your search."

---

## VISUAL FOUNDATIONS

The identity is **a warm, near-black instrument panel lit by a single violet
signal.** Everything else is neutral so data and the one accent read instantly.

### Color & vibe

- **Canvas:** warm near-black `#100F0D` — not pure black, not slate. Surfaces step
  up in warmth: `#1A1815` (card) → `#221F1A` (header/inset) → `#2B2721` (raised).
  The warmth (brown-black, not blue-black) is the signature — never substitute a
  cool slate.
- **Primary = violet `#8B43F0`, reserved for action & active state only.** Primary
  buttons, the active nav item, selected chips, focus rings, the "23" logo tile,
  the KPI hero glow. It is **never** a status color. A lighter mixed violet
  (`--b23-accent-hi`) carries violet _text/glyphs_ on the canvas, and because
  violet is a deep hue, **on-primary text is light** (`--b23-primary-on` `#FFFFFF`),
  never dark.
- **Status colors are fixed and distinct from the primary:** emerald `#34D399`
  (success), amber `#FBBF24` (warning), red/rose `#F87171`/`#FB7185` (danger), sky
  `#38BDF8` (info), orange `#FB923C` (at-risk — deliberately separate from amber),
  neutral `#7A7167` (expired/inactive). Chart categoricals: violet-light
  `#B69BFF`, teal `#2DD4BF`, amber `#FBBF24`, sky `#38BDF8`.
- **Imagery:** none. This is a data tool — no photos, no illustration, no stock.
  Product images are square `object-cover` tiles with an initials-on-tint
  fallback. Client identity = initials on `--b23-surface-3`.

### Type

- **Space Grotesk** (display) for headings, KPI values, the wordmark, big money —
  tight tracking `-0.02em`, weights 600 (700 only for the running-total).
- **IBM Plex Sans** (body) for all UI text, default 14px / 1.45.
- **IBM Plex Mono** for **everything numeric** (money, counts, IDs, timestamps,
  deltas) and for uppercase micro eyebrows. Always `tabular-nums` so digits align.
- Weights limited to 400 / 500 / 600.

### Backgrounds & texture

- **Flat warm fills**, no patterns, no noise, no photographic backgrounds.
- The only gradients are (1) the **primary violet gradient** on buttons/logo/active
  pills (`150deg`, accent → accent×76%+black), (2) a **hero card wash** (violet at
  ~16% into the surface), and (3) a subtle **section well** below the app canvas
  (`#0C0B09 → #100F0D`). No decorative rainbow/blue-purple gradients.

### Elevation, borders, cards

- **Separation is fill + 1px border, not shadow.** `--b23-border` `#2E2A24`
  hairlines; `--b23-border-2` `#3C372F` for inputs and stronger edges.
- **Resting cards:** `--b23-surface` fill, 1px border, radius 16px, an inner
  top catch-light (`inset 0 1px 0 rgba(255,255,255,.04)`) + a soft grounding
  shadow. Radii: inputs/buttons 11px, panels 14px, KPI cards & tables 16px,
  modals & hero 20px, pills 999px.
- **Hero elevation + glow:** the Today's-Revenue card and modals carry a violet
  bloom (`0 24px 60px -34px var(--accent)` / dialog `0 0 60px -30px var(--accent)`).
  Reserve the glow for hero moments — never on ordinary cards.
- **Overlays** get real shadows (popover, dialog, toast) + a `rgba(8,7,6,.66)`
  scrim with 4px blur.

### Motion

- Fast and restrained: `120ms` hover, `180ms` popovers/tabs, `240ms` dialogs —
  nothing longer. Enter `ease-out`, exit `ease-in`. Two keyframes only: `b23-in`
  (fade+8px rise) and `b23-rise` (fade+14px rise+scale) for toasts. No bounce, no
  spring, no autoplay, no infinite loops. `prefers-reduced-motion` kills all of it.

### Interaction states

- **Hover:** surface lightens one step, or `filter: brightness(1.08)` on the violet
  gradient; borders go `--border` → `--border-2`; `cursor: pointer` on everything
  clickable.
- **Active/pressed:** brief `brightness(1.06)` or opacity dip — no layout shift.
- **Focus-visible:** 2px violet outline, 2px offset (or the `0 0 0 3px` violet-20%
  ring on inputs). Never removed.
- **Selected:** nav = violet accent + violet text; chip = violet subtle fill +
  violet text + border; tab = violet underline.
- **Disabled:** `not-allowed` cursor, faint fill (`--surface-3`), faint text.

### Layout

- 58px sticky glass topbar (blur), 240px sidebar (collapsible to 64px), content
  max 1320px with 30×26px padding. 12-col grid at xl; KPI hero spans 2×2.
  Money right-aligned in tables; numeric columns tabular mono.

---

## ICONOGRAPHY

- **Library:** [lucide](https://lucide.dev) — the shadcn default and the **only**
  icon set. Line icons, `fill="none"`, `stroke="currentColor"`, `stroke-width` 1.7
  (nav/section) to 2 (buttons/inline), round caps & joins. The prototype inlines
  lucide path data directly as `<svg>`; this system does the same and also links
  lucide from CDN for kits/cards.
- **Sizes:** 16px inline/table, 18px buttons & nav, 20px section headers, 24–26px
  empty states, 13–15px inside chips/badges.
- **Colored icons only carry status:** an icon is `currentColor` (inherits text)
  unless it _is_ a status signal, in which case it takes that status hue
  (`#FBBF24` warning triangle, `#F87171` danger, `#34D399` success, `#38BDF8` info).
- **Glyph exceptions (not icons, intentional):** status dots ● (filled) / ○
  (hollow), directional triangles ▲ ▼ for deltas, the `⌘K` command hint, `−`/`+`
  qty steppers. **No emoji anywhere.**
- **Canonical icons:** search `search`, add `plus`, edit `pencil`, export
  `download`, overflow `more-horizontal` (dots), destructive `ban`/`trash-2`/
  `x-circle`, money `banknote`, payment chips `banknote`/`smartphone`/`credit-card`/
  `wallet`, warning `alert-triangle`, check `check`.
- **Assets:** there is **no logo file** — the brand mark is a CSS wordmark: a
  30px rounded-9px violet-gradient tile reading "23" + "Block 23" in Space Grotesk
  with a mono `GYM · OPERATIONS` sub-label. See `assets/` for the reference
  screenshot and a reusable `Wordmark` component. If an official logo is later
  supplied, replace the tile — do not invent one.

---

## Index / manifest

**Root**

- `styles.css` — the single entry point consumers link (imports all tokens + base).
- `readme.md` — this file.
- `SKILL.md` — Agent-Skills-compatible front matter for downstream use.

**`tokens/`** — `typography.css` (fonts + scale), `colors.css`, `spacing.css`,
`elevation.css` (shadow/glow/motion/z), `base.css` (reset + canvas). All values are
`--b23-*` custom properties on `:root`.

**`components/`** — reusable React primitives (namespace
`window.Block23GymDesignSystem_acdb54`):

- `core/` — `Button`, `Badge` (status pill w/ dot/icon), `Chip` (filter chip),
  `KpiCard`, `Card`, `Input`, `Money`, `Avatar`, `Wordmark`.

**`ui_kits/console/`** — `index.html` interactive recreation of the Block 23
operations console (Dashboard, Clients, POS, etc.), composing the primitives.

**Design System tab** — foundation specimen cards live beside the tokens and
components (groups: Type, Colors, Spacing, Brand, Components, Console).
