**Button** — the primary action control. The violet gradient `primary` variant is the one loud element per screen region; everything else is `secondary`/`ghost`, and irreversible actions are `destructive`.

```jsx
<Button variant="primary" leadingIcon={<PlusIcon/>}>New Client</Button>
<Button variant="secondary">Export</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="destructive" leadingIcon={<BanIcon/>}>Void transaction</Button>
```

Variants: `primary` (violet gradient + glow) · `secondary` (surface + border) · `ghost` (transparent, hover tint) · `destructive` (solid red). Sizes: `sm` / `default` / `lg`. `pill` (default true) rounds fully; set `pill={false}` for radius-lg corners. Pass 16px lucide SVGs to `leadingIcon`/`trailingIcon`.
