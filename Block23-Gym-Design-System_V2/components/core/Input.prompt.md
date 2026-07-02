**Input** — the shared form field. Label above, helper below (swapped for the error on error). Violet focus ring; rose error ring. Currency uses `prefix="₱"`, and `readOnly` renders the muted system-value look.

```jsx
<Input label="Full name" required value={name} onChange={onName}
       placeholder="e.g. Maria Santos" error={nameErr} />
<Input label="Contact number" optional prefix={null} inputMode="tel"
       hint="Used for renewal reminders." />
<Input label="Amount" prefix="₱" inputMode="decimal" />
<Input label="Date registered" readOnly value="Jan 11, 2026" />
<Input label="Notes" optional multiline rows={3} />
```
