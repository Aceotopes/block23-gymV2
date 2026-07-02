**Badge** — the status pill. Always carries a text label plus a dot / hollow-dot / icon so status never depends on color alone.

```jsx
<Badge variant="success">Active</Badge>
<Badge variant="warning" icon={<AlertTriangle/>}>Expiring soon</Badge>
<Badge variant="neutral" shape="hollow">Expired</Badge>
<Badge variant="atRisk" icon={<Activity/>}>At risk</Badge>
<Badge variant="danger" outline icon={<Ban/>}>VOID</Badge>
```

Variants: `success` (emerald) · `warning` (amber) · `danger` (red) · `info` (sky) · `primary` (violet) · `atRisk` (orange, distinct from amber) · `neutral` (expired/inactive). `shape`: `dot`|`hollow`|`none`. Pass a lucide `icon` for richer statuses; `outline` renders the VOID/Cancelled look.
