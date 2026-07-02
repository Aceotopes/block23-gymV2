---
name: block23-gym-design
description: Use this skill to generate well-branded interfaces and assets for Block 23 Gym, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. Block 23 is a dark-first operational gym-management console — warm near-black canvas, violet primary, tabular mono numerics.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Fast orientation
- **`styles.css`** — link this one file; it imports every token + the base reset. Tokens are `--b23-*` custom properties (see `tokens/`).
- **Identity in one line:** warm near-black canvas `#100F0D`, violet primary `#8B43F0` (actions & active state ONLY — never a status color; on-primary text is light), Space Grotesk + IBM Plex Sans + IBM Plex Mono, tabular figures on all data, status = color + label + shape.
- **Components** live in `components/core/` (`Button`, `Badge`, `Chip`, `KpiCard`, `Card`, `Input`, `Money`, `Avatar`, `Wordmark`) — each has a `.d.ts` contract and a `.prompt.md` usage note. In HTML, load `_ds_bundle.js` and read them off `window.Block23GymDesignSystem_acdb54`.
- **`ui_kits/console/`** — a full interactive recreation of the operations console to copy patterns from.
- **`guidelines/`** — foundation specimen cards (colors, type, spacing, brand).

## Non-negotiables
- Violet is for primary actions and active states, never status.
- Money always `₱` + 2 decimals + tabular mono, right-aligned.
- Every status badge carries a text label and a dot/hollow-dot/icon.
- No emoji, no photos/illustration, no cool-slate substitution for the warm canvas.
