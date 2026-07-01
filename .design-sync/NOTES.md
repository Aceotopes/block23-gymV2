# design-sync notes — Block 23 Gym DS

Repo-specific gotchas for future syncs. Config lives in `config.json`; durable inputs
(`ds-styles.css`, `previews/`, `conventions.md`, this file) are committed. Machine state
(`pkgroot/`, `.ds-sync/`, `ds-bundle/`, `.cache/`) is gitignored and rebuilt each run.

## This is a Next.js app, not a published component library
- The design-system layer is the 16 shadcn/ui `new-york` primitives in `src/components/ui/`.
  There is **no `dist/`** — the converter runs in **synth-entry mode** from `srcDir: src/components/ui`.
- The 16 files expand to **101 real exports** (compound sub-parts: CardHeader, DialogContent,
  SelectItem, …). All ship functional. Preview scope = the ~15 top-level primitives authored;
  the rest are floor cards (owner's choice, 2026-07-02).

## PKG_DIR / junction setup (REQUIRED each run — recreated by the setup below)
- The converter resolves the package dir as `node_modules/<pkg>` and globs `<pkgDir>/**/*.d.ts`
  for `exportedNames`. Pointing it at the repo root hangs two ways:
  1. a self-referential `node_modules/block23-gym -> repo` junction makes ts-morph's fast-glob
     follow it back into `node_modules` **infinitely** (build never prints past "source shape").
  2. even without that, it would parse the whole app's `.d.ts` tree.
- Fix: a **minimal package root** at `.design-sync/pkgroot/` (gitignored) containing only
  `package.json` (name `block23-gym`), a `tsconfig.json` (paths `@/* -> ./src/*`),
  `ds-styles.css` (copied from `../ds-styles.css`), and junctions
  `pkgroot/src/components -> repo/src/components` and `pkgroot/src/lib -> repo/src/lib`.
  Then `node_modules/block23-gym -> pkgroot` (NOT the repo root). No `.d.ts` under pkgroot → fast.
- Recreate with the one-liner in "Re-sync setup" below.

## cfg path rooting
- `cssEntry` is bounded to PKG_DIR and resolved via `resolve(PKG_DIR, rel)` → must live INSIDE
  pkgroot: `cssEntry: "ds-styles.css"` (the copied file).
- `tsconfig` is also `resolve(PKG_DIR, rel)` → `"tsconfig.json"` = `pkgroot/tsconfig.json`.
- Do NOT use repo-root-relative paths here — they resolve under pkgroot and "not found".

## Styling: Tailwind v4 + tokens must be pre-compiled
- Components are pure Tailwind-utility + CSS-var. Raw `globals.css` (`@import "tailwindcss"`)
  does NOT expand — previews would be unstyled.
- `ds-styles.css` = Geist fonts (data-URI, embedded from `node_modules/next/.../font/geist*.woff2`,
  OFL) + `--font-geist-*` vars + Tailwind v4 compiled output (tokens + utilities) + a dark-first
  `:root` override (app is dark-first; `.dark` hardcoded on `<html>`, light unimplemented).
- Rebuild `ds-styles.css` with `.design-sync/build-styles.mjs` (regenerates from globals.css).

## Fonts
- Geist / Geist Mono embedded as data-URIs → no `[FONT_MISSING]`, self-contained. The woff2 in
  `next/dist/next-devtools/server/font/` may be a single weight; heavier weights synth-bold.

## Render verification
- Owner chose **eyeball review** (no playwright/chromium install). Builds run with
  `package-validate.mjs --no-render-check`; the gate is the served `.review.html` + owner review.
  A future run that wants machine grading must install playwright + chromium.

## Toaster (sonner) — not authored
- `Toaster` renders nothing statically (toasts are transient/interaction-driven). Left as a floor
  card deliberately. Not a failure.

## Re-sync setup (run before the converter, from repo root)
```sh
node -e 'const fs=require("fs"),p=require("path"),r=process.cwd();const rm=x=>{try{fs.rmSync(x,{recursive:true,force:true})}catch{}};
rm(p.join(r,"node_modules","block23-gym"));const root=p.join(r,".design-sync","pkgroot");rm(root);
fs.mkdirSync(p.join(root,"src"),{recursive:true});
fs.writeFileSync(p.join(root,"package.json"),JSON.stringify({name:"block23-gym",version:"0.1.0",private:true}));
fs.writeFileSync(p.join(root,"tsconfig.json"),JSON.stringify({compilerOptions:{jsx:"preserve",baseUrl:".",paths:{"@/*":["./src/*"]},moduleResolution:"bundler",target:"ES2020",module:"esnext",skipLibCheck:true,allowJs:true}}));
const j=(t,l)=>fs.symlinkSync(t,l,"junction");
j(p.join(r,"src","components"),p.join(root,"src","components"));j(p.join(r,"src","lib"),p.join(root,"src","lib"));
j(root,p.join(r,"node_modules","block23-gym"));'
cp .design-sync/ds-styles.css .design-sync/pkgroot/ds-styles.css
```

## Re-sync risks (what can silently go stale)
- **Geist woff2 path** (`node_modules/next/dist/next-devtools/server/font/geist*.woff2`) is a Next
  internal — a Next upgrade may move/rename it. If `build-styles.mjs` can't find it, `--font-geist-*`
  goes undefined and text falls back. Re-check on Next version bumps.
- **Tailwind content scan**: `ds-styles.css` utilities come from scanning the repo at build time.
  A preview using a utility class NOT present anywhere in `src/` would render unstyled — previews
  therefore use inline styles for layout glue and rely on components' own (compiled) classes.
- **New primitives**: adding files to `src/components/ui/` grows the export count; author previews
  for new top-level ones or they ship as floor cards.
- The whole junction/pkgroot scheme is machine-local and gitignored — a fresh clone MUST run the
  Re-sync setup above before building.
