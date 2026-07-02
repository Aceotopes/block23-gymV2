# Console — Block 23 Operations UI kit

An interactive recreation of the Block 23 gym operations console, composing the
design-system primitives (`Button`, `Badge`, `Chip`, `KpiCard`, `Card`, `Money`,
`Avatar`, `Wordmark`, `Input`) from `window.Block23GymDesignSystem_acdb54`.

## Files
- `index.html` — entry point. Loads React + Babel + `styles.css` + the compiled
  `_ds_bundle.js`, then `console.jsx`. Open this to interact.
- `console.jsx` — the shell (topbar, sidebar) plus three fully-built screens and
  a placeholder for the rest.

## What's interactive
- **Sidebar nav** switches screens (active item = violet accent bar + violet text).
- **Dashboard** — KPI hero (Today's Revenue, glow) + 5 KPI cards, revenue-trend
  area chart, membership-status donut, Today/Week/Month segmented control.
- **Clients** — searchable table with single-select filter chips (chips + name
  search combine); status & type badges; empty state.
- **POS** — category tabs, product grid (tap to add, OUT disabled), live cart with
  qty steppers, payment-method selector, running total, Complete Sale.
- Attendance / Payments / Inventory / Reports / Settings show a pattern-note
  placeholder (they reuse the same shell, cards, tables and badges).

## Fidelity notes
- Charts are lightweight hand-rolled SVG (the real app uses Recharts) — colors
  and the fixed series mapping (membership = violet-light, product = teal,
  walk-in = amber) match the spec.
- All money/counts are mono + tabular; violet appears only on actions & the active
  nav item; every status carries a label + shape.
