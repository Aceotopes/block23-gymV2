**Chip** — a single-select filter chip. Selected chips fill violet-subtle with violet text; a `dot` colors the chip to match the rows it filters, and `count` shows the matching total.

```jsx
<Chip selected count={296}>All</Chip>
<Chip dot="var(--b23-success)" count={284}>Active</Chip>
<Chip dot="var(--b23-warning)" count={12}>Expiring soon</Chip>
<Chip dot="var(--b23-at-risk)" count={5}>At risk</Chip>
```
