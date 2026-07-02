**Card** — the resting surface panel. Fill + hairline separates it from the canvas; use `hero` for the single glowing hero element (e.g. Today's Revenue).

```jsx
<Card eyebrow="ACTIVE MEMBERS"><KpiValue>284</KpiValue></Card>
<Card title="Revenue trend" action={<Button variant="ghost" size="sm">View all →</Button>}>
  {chart}
</Card>
<Card hero eyebrow="● TODAY'S REVENUE">{heroBody}</Card>
```
