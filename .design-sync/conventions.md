# Block 23 Gym — design system conventions

shadcn/ui **new-york** primitives (Radix UI + Tailwind v4 + CVA), used to build a gym
management app: members, memberships, walk-ins, attendance, payments, POS, inventory.

## Setup & theme (dark-first)
- Components are available at `window.Block23Gym.*` and are styled by `styles.css` out of the
  box — **no ThemeProvider or wrapper is required.** The system is **dark-first**: `styles.css`
  applies the dark slate + indigo tokens on `:root` and sets the canvas (`body`) dark. A light
  theme is not shipped. Just render the components; they carry their own classes.
- A few components need a context parent (compose them together, exactly as shown in their
  `.prompt.md`): `Tooltip` must be inside `TooltipProvider`; `FormField`/`FormControl`/`FormLabel`
  must be inside `Form` (a react-hook-form provider); mount one `Toaster` for `sonner` toasts.

## Styling idiom — Tailwind utilities + CSS-variable tokens
Style with Tailwind classes bound to the DS tokens. **Do not hard-code hex colors** — use these:

| Purpose | Classes / tokens |
|---|---|
| Surfaces | `bg-background` (canvas), `bg-card`, `bg-popover`, `bg-muted`, `bg-secondary`, `bg-accent` |
| Text | `text-foreground`, `text-muted-foreground`, `text-card-foreground`, `text-primary` |
| Brand / action | `bg-primary` + `text-primary-foreground` (indigo); `bg-destructive` (red) |
| Borders / focus | `border-border`, `border-input`, `ring-ring` |
| Radius | `rounded-sm` / `rounded-md` / `rounded-lg` (from `--radius: 0.5rem`) |
| Type | `font-sans` = **Geist**, `font-mono` = **Geist Mono**; add `tabular-nums` for money/metrics |
| Status (text/icon on dark) | tokens `var(--success-on)`, `var(--warning-on)`, `var(--danger-on)`, `var(--info-on)`, `var(--primary-on)`; `var(--at-risk)` = orange, kept distinct from amber "expiring soon" |

**Status is never color alone** — status badges always pair a text label + icon (WCAG 2.1 AA).

Component variant props (the rest mostly pass through native element props):
- `Button` — `variant`: `default | secondary | outline | ghost | destructive | link`;
  `size`: `default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg`; `asChild`.
- `Badge` — `variant`: `default | secondary | outline | destructive`; `asChild`.

Compound components are composed from their parts (real exports): `Card` = `CardHeader` /
`CardTitle` / `CardDescription` / `CardContent` / `CardFooter` / `CardAction`; `Dialog`,
`Select`, `DropdownMenu`, `Table`, etc. follow the same pattern — see each `.prompt.md`.

## Where the truth lives
Before styling, read the bound `styles.css` (all tokens + the compiled utility set) and each
component's `.d.ts` (props) and `.prompt.md` (usage). Those are authoritative over this summary.

## Idiomatic example
```tsx
const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } = window.Block23Gym;

<Card className="w-[340px]">
  <CardHeader>
    <CardTitle>Juan Dela Cruz</CardTitle>
    <CardDescription className="text-muted-foreground">Monthly · member since Jan 2026</CardDescription>
    <CardAction><Badge>Active</Badge></CardAction>
  </CardHeader>
  <CardContent className="flex justify-between text-sm">
    <span className="text-muted-foreground">Expires</span>
    <span className="tabular-nums">Jul 30, 2026</span>
  </CardContent>
  <CardFooter className="gap-2">
    <Button size="sm">Renew</Button>
    <Button size="sm" variant="outline">Profile</Button>
  </CardFooter>
</Card>
```
