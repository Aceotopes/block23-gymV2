**KpiCard** — a dashboard metric: uppercase mono label, big Space-Grotesk value (tabular), and a directional delta. Zero shows as `0`/`₱0`, never blank.

```jsx
<KpiCard label="ACTIVE MEMBERS" value="284"
         delta={{ dir: 'up', value: '+3', note: 'from last month' }} />
<KpiCard label="MTD REVENUE" value="₱612,300"
         delta={{ dir: 'up', value: '+8.0%', note: 'vs. last month' }} />
<KpiCard label="EXPIRING SOON" value="12" accentBorder="var(--b23-warning)"
         icon={<AlertTriangle size={13}/>} />
```
