**Money** — a currency figure in tabular mono: `₱` prefix, 2 decimals, right-aligned so columns line up. `void` strikes it through, `negative` goes red with a leading minus.

```jsx
<Money amount={18450} />          {/* ₱18,450.00 */}
<Money amount={500} variant="void" />
<Money amount={120} variant="negative" />
<Money amount="₱612,300" variant="strong" size={24} />
```
