/* global React, ReactDOM */
// Block 23 — Operations Console UI kit.
// Composes the design-system primitives (window namespace) with kit-local shell/table/grid.
const DS = window.Block23GymDesignSystem_acdb54 || {};
const { Button, Badge, Chip, KpiCard, Card, Money, Avatar, Wordmark, Input } = DS;

// ---- inline lucide-style icon ----
function Icon({ d, size = 18, sw = 1.7, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
const ICON = {
  dashboard: 'M3 4.5A1.5 1.5 0 0 1 4.5 3H9v8H3zM11 3h5.5A1.5 1.5 0 0 1 21 4.5V8H11zM11 11h10v8.5a1.5 1.5 0 0 1-1.5 1.5H11zM3 13h6v8H4.5A1.5 1.5 0 0 1 3 19.5z',
  clients: 'M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11zM3.5 20a5.5 5.5 0 0 1 11 0M16 4.8a3.2 3.2 0 0 1 0 6.4M17 20a5.5 5.5 0 0 0-2.2-4.4',
  attendance: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 20a5.5 5.5 0 0 1 9.2-4M14.5 18l2 2 4-4.2',
  payments: 'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2',
  pos: 'M6 2.5h12a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1zM8.5 6.5h7M8.5 10h7M8.5 13.5h4.5',
  inventory: 'M12 2.8 20.5 7.4v9.2L12 21.2 3.5 16.6V7.4zM3.5 7.4 12 12l8.5-4.6M12 12v9.2',
  reports: 'M5 4v16h16M9 16v-4M13.5 16V8.5M18 16v-2.5',
  settings: 'M3.5 7h7.5M15 7h5.5M3.5 12h3.5M11 12h9.5M3.5 17h6.5M14.5 17h6M13 4.8a2.2 2.2 0 1 0 0 4.4M8 9.8a2.2 2.2 0 1 0 0 4.4',
  search: 'M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0|m21 21-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M20 6 9 17l-5-5',
  triangle: 'M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z|M12 9v4M12 17h.01',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
};

const NAV = [
  { k: 'dashboard', l: 'Dashboard' }, { k: 'clients', l: 'Clients' },
  { k: 'attendance', l: 'Attendance' }, { k: 'payments', l: 'Client Payments' },
  { k: 'pos', l: 'POS' }, { k: 'inventory', l: 'Inventory' },
  { k: 'reports', l: 'Reports' }, { k: 'settings', l: 'Settings' },
];

const STATUS = {
  active:   { l: 'Active',        variant: 'success', shape: 'dot',    dot: 'var(--b23-success)' },
  upcoming: { l: 'Upcoming',      variant: 'info',    shape: 'hollow', dot: 'var(--b23-info)' },
  expiring: { l: 'Expiring soon', variant: 'warning', icon: true,      dot: 'var(--b23-warning)' },
  expired:  { l: 'Expired',       variant: 'neutral', shape: 'hollow', dot: 'var(--b23-neutral)' },
  atrisk:   { l: 'At risk',       variant: 'atRisk',  icon: true,      dot: 'var(--b23-at-risk)' },
  inactive: { l: 'Inactive',      variant: 'neutral', shape: 'hollow', dot: 'var(--b23-neutral)' },
};

function StatusBadge({ s }) {
  const m = STATUS[s];
  if (m.icon) return <Badge variant={m.variant} icon={<Icon d={ICON.triangle} size={12} sw={2} />}>{m.l}</Badge>;
  return <Badge variant={m.variant} shape={m.shape}>{m.l}</Badge>;
}
function TypeBadge({ t }) {
  return t === 'member'
    ? <Badge variant="primary" shape="none">◈ Member</Badge>
    : <Badge variant="neutral" outline shape="none">◇ Walk-in</Badge>;
}
const initials = (n) => n.split(' ').map(w => w[0]).slice(0, 2).join('');

const CLIENTS = [
  { id: 1, name: 'Maria Santos', type: 'member', statuses: ['active'], expiry: 'Aug 12, 2026', contact: '0917 555 0182' },
  { id: 2, name: 'Joshua dela Cruz', type: 'member', statuses: ['expiring', 'atrisk'], expiry: 'Jul 6, 2026', contact: '0918 220 4471' },
  { id: 3, name: 'Andrea Reyes', type: 'member', statuses: ['upcoming'], expiry: 'Oct 3, 2026', contact: '0917 884 1190' },
  { id: 4, name: 'Marco Bautista', type: 'walkin', statuses: ['active'], expiry: null, contact: '0920 553 7781' },
  { id: 5, name: 'Patricia Gonzales', type: 'member', statuses: ['expired'], expiry: 'Jun 1, 2026', contact: '0917 442 0098' },
  { id: 6, name: 'Kevin Tan', type: 'member', statuses: ['active', 'atrisk'], expiry: 'Sep 1, 2026', contact: '0915 778 2210' },
  { id: 7, name: 'Bea Villanueva', type: 'walkin', statuses: ['inactive'], expiry: null, contact: '0928 110 5567' },
  { id: 8, name: 'Carlo Mendoza', type: 'member', statuses: ['expiring'], expiry: 'Jul 11, 2026', contact: '0917 663 9921' },
  { id: 9, name: 'Nicole Aquino', type: 'member', statuses: ['active'], expiry: 'Dec 20, 2026', contact: '0916 207 3345' },
  { id: 10, name: 'Rafael Cruz', type: 'walkin', statuses: ['active'], expiry: null, contact: '0921 559 8830' },
];

const CHIPS = [
  { k: 'all', l: 'All', count: 296, dot: null },
  { k: 'active', l: 'Active', count: 284, dot: 'var(--b23-success)' },
  { k: 'upcoming', l: 'Upcoming', count: 8, dot: 'var(--b23-info)' },
  { k: 'atrisk', l: 'At risk', count: 5, dot: 'var(--b23-at-risk)' },
  { k: 'expiring', l: 'Expiring soon', count: 12, dot: 'var(--b23-warning)' },
  { k: 'expired', l: 'Expired', count: 47, dot: 'var(--b23-neutral)' },
];

const PRODUCTS = [
  { id: 'water', name: 'Bottled Water', cat: 'bev', price: 25, stock: 14, low: true, tile: 'var(--b23-info)' },
  { id: 'gatorade', name: 'Gatorade Blue', cat: 'bev', price: 45, stock: 62, tile: 'var(--b23-info)' },
  { id: 'sting', name: 'Sting Energy', cat: 'bev', price: 25, stock: 6, reorder: true, tile: 'var(--b23-danger)' },
  { id: 'pocari', name: 'Pocari Sweat', cat: 'bev', price: 55, stock: 30, tile: 'var(--b23-info)' },
  { id: 'whey', name: 'Whey Scoop', cat: 'sup', price: 50, stock: 70, tile: 'var(--b23-accent-light)' },
  { id: 'pre', name: 'Pre-Workout', cat: 'sup', price: 60, stock: 50, tile: 'var(--b23-accent-light)' },
  { id: 'bar', name: 'Protein Bar', cat: 'snk', price: 65, stock: 24, tile: 'var(--b23-cat-product)' },
  { id: 'towel', name: 'Gym Towel', cat: 'app', price: 180, stock: 12, tile: 'var(--b23-warning)' },
  { id: 'shaker', name: 'Shaker Bottle', cat: 'app', price: 220, stock: 0, out: true, tile: 'var(--b23-warning)' },
];
const POS_CATS = [{ k: 'all', l: 'All' }, { k: 'bev', l: 'Beverages' }, { k: 'sup', l: 'Supplements' }, { k: 'snk', l: 'Snacks' }, { k: 'app', l: 'Apparel' }];

const peso = (n) => '₱' + n.toLocaleString('en-PH');

// ==================================================================
//  TOPBAR + SIDEBAR
// ==================================================================
function Topbar() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20, height: 58, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 22px',
      background: 'color-mix(in srgb, var(--b23-bg) 86%, transparent)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--b23-border)',
    }}>
      <Wordmark />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999,
        background: 'var(--b23-surface)', border: '1px solid var(--b23-border)', minWidth: 320, color: 'var(--b23-faint)',
      }}>
        <Icon d={ICON.search} size={15} sw={2} />
        <span style={{ font: '400 13px var(--b23-sans)', color: 'var(--b23-muted)' }}>Search clients, products, transactions…</span>
        <span style={{ marginLeft: 'auto', font: '500 10px var(--b23-mono)', padding: '2px 7px', borderRadius: 6, background: 'var(--b23-surface-2)', border: '1px solid var(--b23-border)', color: 'var(--b23-faint)' }}>⌘K</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
          <div style={{ font: '500 12px var(--b23-mono)', color: 'var(--b23-fg-2)', fontVariantNumeric: 'tabular-nums' }}>Mon, Jun 30 · 7:12 PM</div>
          <div style={{ font: '400 10px var(--b23-mono)', color: 'var(--b23-faint)', letterSpacing: '.04em' }}>ASIA / MANILA</div>
        </div>
        <div style={{ width: 1, height: 26, background: 'var(--b23-border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <Avatar initials="MR" accent size={34} />
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ font: '600 13px var(--b23-sans)', color: 'var(--b23-fg)' }}>Marcus Reyes</div>
            <div style={{ font: '400 10px var(--b23-mono)', color: 'var(--b23-faint)', letterSpacing: '.05em' }}>OWNER</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ nav, setNav }) {
  return (
    <nav style={{
      flex: '0 0 240px', width: 240, borderRight: '1px solid var(--b23-border)', padding: '18px 14px',
      display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 58, height: 'calc(100vh - 58px)',
    }}>
      <div style={{ font: '600 10px var(--b23-mono)', letterSpacing: '.16em', color: 'var(--b23-faint)', padding: '4px 16px 10px' }}>MENU</div>
      {NAV.map((it) => {
        const on = nav === it.k;
        return (
          <button key={it.k} onClick={() => setNav(it.k)}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 11, width: '100%',
              padding: '9px 12px 9px 14px', border: 'none', borderRadius: 10, cursor: 'pointer',
              font: '500 13.5px var(--b23-sans)', textAlign: 'left',
              background: on ? 'color-mix(in srgb, var(--b23-accent) 14%, transparent)' : 'transparent',
              color: on ? 'var(--b23-accent-hi)' : 'var(--b23-fg-2)',
              transition: 'background var(--b23-dur-fast)',
            }}
            onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'color-mix(in srgb, var(--b23-fg) 7%, transparent)'; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
          >
            {on && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, background: 'var(--b23-accent)' }} />}
            <Icon d={ICON[it.k]} size={18} />
            <span>{it.l}</span>
          </button>
        );
      })}
      <div style={{ marginTop: 'auto', padding: 14, borderRadius: 12, background: 'var(--b23-surface)', border: '1px solid var(--b23-border)' }}>
        <div style={{ font: '600 11px var(--b23-mono)', letterSpacing: '.05em', color: 'var(--b23-accent-hi)', marginBottom: 5 }}>DRAWER OPEN</div>
        <div style={{ font: '400 11.5px var(--b23-sans)', color: 'var(--b23-muted)', lineHeight: 1.45 }}>₱18,450 collected today across 41 transactions.</div>
      </div>
    </nav>
  );
}

// ==================================================================
//  DASHBOARD
// ==================================================================
function Sparkline() {
  const pts = [22, 20, 24, 21, 26, 25, 30, 28, 34, 33, 40];
  const w = 150, h = 44, max = 42;
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - (v / max) * h}`).join(' L ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={`M ${d}`} stroke="var(--b23-accent-hi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Donut() {
  const R = 52, C = 2 * Math.PI * R;
  const segs = [{ v: 0.83, c: 'var(--b23-success)' }, { v: 0.05, c: 'var(--b23-warning)' }, { v: 0.12, c: 'var(--b23-neutral)' }];
  let off = 0;
  return (
    <svg width={132} height={132} viewBox="0 0 132 132">
      <circle cx="66" cy="66" r={R} fill="none" stroke="var(--b23-surface-3)" strokeWidth="14" />
      {segs.map((s, i) => {
        const len = s.v * C; const el = <circle key={i} cx="66" cy="66" r={R} fill="none" stroke={s.c} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 66 66)" strokeLinecap="butt" />; off += len; return el;
      })}
      <text x="66" y="63" textAnchor="middle" style={{ font: '600 28px var(--b23-display)', fill: 'var(--b23-fg)' }}>284</text>
      <text x="66" y="82" textAnchor="middle" style={{ font: '400 11px var(--b23-mono)', fill: 'var(--b23-muted)' }}>active</text>
    </svg>
  );
}
function AreaChart() {
  const series = [
    { c: 'var(--b23-cat-membership)', p: [30, 38, 34, 46, 42, 55, 60, 58, 70, 82] },
    { c: 'var(--b23-cat-product)', p: [20, 24, 22, 28, 26, 30, 34, 32, 40, 46] },
    { c: 'var(--b23-cat-walkin)', p: [8, 10, 9, 12, 11, 13, 14, 13, 16, 18] },
  ];
  const w = 620, h = 200, max = 90;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map((g, i) => <line key={i} x1="0" x2={w} y1={h * g} y2={h * g} stroke="var(--b23-border)" strokeWidth="1" />)}
      {series.map((s, si) => {
        const line = s.p.map((v, i) => `${(i / (s.p.length - 1)) * w},${h - (v / max) * h}`).join(' L ');
        return (
          <g key={si}>
            <path d={`M 0,${h} L ${line} L ${w},${h} Z`} fill={s.c} opacity="0.12" />
            <path d={`M ${line}`} fill="none" stroke={s.c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
}

function Dashboard() {
  const [period, setPeriod] = React.useState('today');
  const seg = (k, l) => (
    <button key={k} onClick={() => setPeriod(k)} style={{
      padding: '7px 15px', borderRadius: 999, border: 'none', cursor: 'pointer', font: '600 12.5px var(--b23-sans)',
      background: period === k ? 'var(--b23-surface-3)' : 'transparent',
      color: period === k ? 'var(--b23-fg)' : 'var(--b23-muted)',
    }}>{l}</button>
  );
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, font: '600 30px/1.1 var(--b23-display)', letterSpacing: '-.02em', color: 'var(--b23-fg)' }}>Good evening, Marcus</h1>
          <p style={{ margin: '9px 0 0', font: '400 14px var(--b23-sans)', color: 'var(--b23-muted)' }}>Here's how <span style={{ color: 'var(--b23-fg-2)', fontWeight: 500 }}>Block 23</span> is running — Monday, Jun 30, 2026.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', padding: 4, borderRadius: 999, background: 'var(--b23-surface)', border: '1px solid var(--b23-border)' }}>
            {seg('today', 'Today')}{seg('week', 'Week')}{seg('month', 'Month')}
          </div>
          <Button leadingIcon={null} trailingIcon={<Icon d={ICON.arrow} size={15} sw={2.2} />}>Reconcile day</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
        <Card hero style={{ gridColumn: 'span 2', gridRow: 'span 2', padding: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '600 11px var(--b23-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--b23-accent-hi)' }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--b23-accent-hi)', boxShadow: '0 0 0 4px color-mix(in srgb,var(--b23-accent) 25%, transparent)' }} />Today's Revenue
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 2, color: 'var(--b23-fg)' }}>
                <span style={{ font: '600 30px var(--b23-display)' }}>₱</span>
                <span style={{ font: '600 56px/1 var(--b23-display)', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>18,450</span>
                <span style={{ font: '500 26px var(--b23-display)', color: 'var(--b23-muted)' }}>.00</span>
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Badge variant="success" shape="none">▲ 12.4%</Badge>
                <span style={{ font: '400 13px var(--b23-sans)', color: 'var(--b23-muted)' }}>vs. yesterday · 41 transactions</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: '500 10px var(--b23-mono)', letterSpacing: '.08em', color: 'var(--b23-faint)', textTransform: 'uppercase' }}>Intraday</div>
              <div style={{ marginTop: 8 }}><Sparkline /></div>
            </div>
          </div>
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid color-mix(in srgb,var(--b23-accent) 18%, var(--b23-border))', display: 'flex', gap: 26 }}>
            {[['Membership', 9200], ['Product', 6450], ['Walk-in', 2800]].map(([l, v]) => (
              <div key={l}>
                <div style={{ font: '500 10px var(--b23-mono)', letterSpacing: '.06em', color: 'var(--b23-faint)', textTransform: 'uppercase' }}>{l}</div>
                <div style={{ marginTop: 5 }}><Money amount={v} variant="muted" size={15} align="left" /></div>
              </div>
            ))}
          </div>
        </Card>
        <KpiCard label="Active members" value="284" delta={{ dir: 'up', value: '+3', note: 'from last month' }} />
        <KpiCard label="Today's check-ins" value="96" delta={{ dir: 'up', value: '+8', note: 'vs. yesterday' }} />
        <KpiCard label="MTD revenue" value="₱612,300" delta={{ dir: 'up', value: '+8.0%', note: 'vs. last month' }} />
        <KpiCard label="Expiring soon" value="12" accentBorder="var(--b23-warning)"
          icon={<span style={{ color: 'var(--b23-warning)', display: 'inline-flex' }}><Icon d={ICON.triangle} size={12} sw={2} /></span>} />
        <KpiCard label="Inventory value" value="₱148,920" valueColor="var(--b23-fg)"
          delta={{ dir: 'flat', value: '3 excluded', note: '— no cost price' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, font: '600 16px var(--b23-display)', color: 'var(--b23-fg)' }}>Revenue trend</h2>
              <p style={{ margin: '4px 0 0', font: '400 12px var(--b23-sans)', color: 'var(--b23-muted)' }}>Daily revenue by source · last 10 days</p>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[['Membership', 'var(--b23-cat-membership)'], ['Product', 'var(--b23-cat-product)'], ['Walk-in', 'var(--b23-cat-walkin)']].map(([l, c]) => (
                <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 12px var(--b23-sans)', color: 'var(--b23-fg-2)' }}>
                  <span style={{ width: 12, height: 3, borderRadius: 2, background: c }} />{l}
                </span>
              ))}
            </div>
          </div>
          <AreaChart />
        </Card>
        <Card title="Membership status">
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}><Donut /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 6 }}>
            {[['Active', 'var(--b23-success)', 284], ['Expiring soon', 'var(--b23-warning)', 18], ['Expired', 'var(--b23-neutral)', 41]].map(([l, c, n]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: c }} />
                <span style={{ font: '500 13px var(--b23-sans)', color: 'var(--b23-fg-2)' }}>{l}</span>
                <span style={{ marginLeft: 'auto', font: '600 13px var(--b23-mono)', color: 'var(--b23-fg)', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==================================================================
//  CLIENTS
// ==================================================================
function Clients() {
  const [chip, setChip] = React.useState('all');
  const [q, setQ] = React.useState('');
  const rows = CLIENTS.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (chip === 'all') return true;
    return c.statuses.includes(chip);
  });
  const th = { textAlign: 'left', padding: '13px 16px', font: '600 11px var(--b23-mono)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--b23-muted)', borderBottom: '1px solid var(--b23-border)' };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, font: '600 28px/1.1 var(--b23-display)', letterSpacing: '-.02em', color: 'var(--b23-fg)' }}>Clients</h1>
          <p style={{ margin: '9px 0 0', font: '400 14px var(--b23-sans)', color: 'var(--b23-muted)' }}>Registry of <span style={{ color: 'var(--b23-fg-2)', fontWeight: 500 }}>296</span> clients · 284 with an active membership · 47 expired</p>
        </div>
        <Button leadingIcon={<Icon d={ICON.plus} size={16} sw={2.4} />}>New Client</Button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 14px', height: 40, borderRadius: 11, background: 'var(--b23-surface)', border: '1px solid var(--b23-border)', minWidth: 280, flex: 1, maxWidth: 380, color: 'var(--b23-muted)' }}>
          <Icon d={ICON.search} size={16} sw={2} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--b23-fg)', font: '400 14px var(--b23-sans)' }} />
        </div>
        <Button variant="secondary" leadingIcon={<Icon d={ICON.download} size={15} sw={2} />}>Export</Button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 18 }}>
        {CHIPS.map((c) => <Chip key={c.k} selected={chip === c.k} dot={c.dot} count={c.count} onClick={() => setChip(c.k)}>{c.l}</Chip>)}
      </div>
      <div style={{ borderRadius: 16, background: 'var(--b23-surface)', border: '1px solid var(--b23-border)', overflow: 'hidden', boxShadow: 'var(--b23-shadow-panel)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--b23-sans)' }}>
          <thead><tr style={{ background: 'var(--b23-surface-2)' }}>
            <th style={{ ...th, padding: '13px 18px' }}>Full name</th><th style={th}>Type</th><th style={th}>Status</th><th style={th}>Membership expiry</th><th style={th}>Contact number</th><th style={{ width: 48, borderBottom: '1px solid var(--b23-border)' }} />
          </tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--b23-border)', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb,var(--b23-accent) 7%, transparent)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Avatar initials={initials(c.name)} size={32} />
                    <span style={{ font: '500 14px var(--b23-sans)', color: 'var(--b23-fg)' }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}><TypeBadge t={c.type} /></td>
                <td style={{ padding: '13px 16px' }}><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{c.statuses.map((s) => <StatusBadge key={s} s={s} />)}</div></td>
                <td style={{ padding: '13px 16px' }}><span style={{ font: '400 13px var(--b23-mono)', color: c.expiry ? 'var(--b23-fg-2)' : 'var(--b23-faint)', fontVariantNumeric: 'tabular-nums' }}>{c.expiry || '—'}</span></td>
                <td style={{ padding: '13px 16px' }}><span style={{ font: '400 13px var(--b23-mono)', color: 'var(--b23-fg-2)', fontVariantNumeric: 'tabular-nums' }}>{c.contact}</span></td>
                <td style={{ padding: '13px 12px' }}><button style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--b23-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon d={ICON.dots} size={17} sw={2.6} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ padding: '54px 20px', textAlign: 'center' }}>
            <div style={{ color: 'var(--b23-faint)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Icon d={ICON.search} size={26} sw={1.8} /></div>
            <div style={{ font: '500 14px var(--b23-sans)', color: 'var(--b23-fg-2)' }}>No clients match this filter</div>
            <div style={{ font: '400 13px var(--b23-sans)', color: 'var(--b23-muted)', marginTop: 5 }}>Try a different chip or clear your search.</div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', background: 'var(--b23-surface-2)', borderTop: '1px solid var(--b23-border)' }}>
          <span style={{ font: '400 12px var(--b23-mono)', color: 'var(--b23-muted)' }}>Showing <span style={{ color: 'var(--b23-fg-2)' }}>{rows.length}</span> of 296 clients</span>
        </div>
      </div>
    </div>
  );
}

// ==================================================================
//  POS
// ==================================================================
function POS() {
  const [cat, setCat] = React.useState('all');
  const [cart, setCart] = React.useState({});
  const [pay, setPay] = React.useState('cash');
  const grid = PRODUCTS.filter((p) => cat === 'all' || p.cat === cat);
  const add = (p) => { if (p.out) return; setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 })); };
  const step = (id, d) => setCart((c) => { const q = (c[id] || 0) + d; const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = q; return n; });
  const lines = Object.entries(cart).map(([id, qty]) => ({ p: PRODUCTS.find(x => x.id === id), qty }));
  const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const catTab = (k, l) => {
    const on = cat === k;
    return <button key={k} onClick={() => setCat(k)} style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 16px', borderRadius: 999, cursor: 'pointer', font: '600 13px var(--b23-sans)', whiteSpace: 'nowrap', border: on ? '1px solid color-mix(in srgb,var(--b23-accent) 42%,transparent)' : '1px solid var(--b23-border)', background: on ? 'color-mix(in srgb,var(--b23-accent) 18%,transparent)' : 'var(--b23-surface)', color: on ? 'var(--b23-accent-hi)' : 'var(--b23-fg-2)' }}>{l}</button>;
  };
  const payBtn = (k, l, d) => {
    const on = pay === k;
    return <button key={k} onClick={() => setPay(k)} style={{ flex: 1, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 0', borderRadius: 11, cursor: 'pointer', font: '600 11px var(--b23-sans)', border: on ? '1px solid color-mix(in srgb,var(--b23-accent) 45%,transparent)' : '1px solid var(--b23-border)', background: on ? 'color-mix(in srgb,var(--b23-accent) 15%,transparent)' : 'var(--b23-surface)', color: on ? 'var(--b23-accent-hi)' : 'var(--b23-muted)' }}><Icon d={d} size={17} sw={1.8} />{l}</button>;
  };
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, font: '600 28px/1.1 var(--b23-display)', letterSpacing: '-.02em', color: 'var(--b23-fg)' }}>Point of Sale</h1>
            <p style={{ margin: '8px 0 0', font: '400 13px var(--b23-sans)', color: 'var(--b23-muted)' }}>Tap a product to ring it up · cash drawer open</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 16px', borderRadius: 13, background: 'var(--b23-surface)', border: '1px solid var(--b23-border)' }}>
            <div style={{ textAlign: 'right', lineHeight: 1.3 }}><div style={{ font: '500 10px var(--b23-mono)', letterSpacing: '.08em', color: 'var(--b23-faint)', textTransform: 'uppercase' }}>Today · POS</div><div style={{ font: '600 15px var(--b23-mono)', color: 'var(--b23-fg)', fontVariantNumeric: 'tabular-nums' }}>₱6,450</div></div>
            <div style={{ width: 1, height: 28, background: 'var(--b23-border)' }} />
            <div style={{ textAlign: 'center', lineHeight: 1.05 }}><div style={{ font: '600 20px var(--b23-display)', color: 'var(--b23-accent-hi)', fontVariantNumeric: 'tabular-nums' }}>23</div><div style={{ font: '400 9px var(--b23-mono)', letterSpacing: '.1em', color: 'var(--b23-faint)' }}>SALES</div></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 17px', height: 52, borderRadius: 14, background: 'var(--b23-surface)', border: '1px solid var(--b23-border-2)', marginBottom: 16, boxShadow: 'var(--b23-inset-hi)' }}>
          <span style={{ color: 'var(--b23-accent-hi)', display: 'inline-flex' }}><Icon d={ICON.search} size={19} sw={2} /></span>
          <input placeholder="Search products to add…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--b23-fg)', font: '500 15px var(--b23-sans)' }} />
          <span style={{ font: '500 10px var(--b23-mono)', padding: '3px 8px', borderRadius: 6, background: 'var(--b23-surface-2)', border: '1px solid var(--b23-border)', color: 'var(--b23-faint)' }}>⌘K</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 18 }}>{POS_CATS.map(c => catTab(c.k, c.l))}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
          {grid.map((p) => (
            <div key={p.id} style={{ position: 'relative', borderRadius: 14, background: 'var(--b23-surface)', border: '1px solid var(--b23-border)', overflow: 'hidden' }}>
              {p.out && <span style={{ position: 'absolute', top: 11, right: 11, zIndex: 2, padding: '3px 8px', borderRadius: 999, font: '700 9px var(--b23-mono)', letterSpacing: '.07em', background: 'color-mix(in srgb,var(--b23-danger) 16%, transparent)', color: 'var(--b23-danger)' }}>OUT</span>}
              <button onClick={() => add(p)} style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%', padding: 14, minHeight: 148, background: 'none', border: 'none', cursor: p.out ? 'not-allowed' : 'pointer', textAlign: 'left', color: 'inherit', opacity: p.out ? 0.55 : 1 }}>
                <div style={{ width: 46, height: 46, borderRadius: 11, background: `color-mix(in srgb, ${p.tile} 18%, var(--b23-surface-2))`, border: `1px solid color-mix(in srgb, ${p.tile} 32%, var(--b23-border))`, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 15px var(--b23-display)', color: p.tile }}>{initials(p.name)}</div>
                <div><div style={{ font: '600 14px var(--b23-sans)', color: 'var(--b23-fg)', lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ marginTop: 4, font: '400 11px var(--b23-mono)', color: p.low || p.reorder ? 'var(--b23-warning)' : 'var(--b23-faint)' }}>{p.out ? 'Out of stock' : `${p.stock} in stock`}</div></div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 'auto' }}><span style={{ font: '600 18px var(--b23-mono)', color: 'var(--b23-fg)', fontVariantNumeric: 'tabular-nums' }}>{peso(p.price)}</span></div>
              </button>
            </div>
          ))}
        </div>
      </div>
      <aside style={{ flex: '0 0 340px', width: 340, position: 'sticky', top: 78, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 96px)', borderRadius: 18, background: 'var(--b23-surface)', border: '1px solid var(--b23-border)', boxShadow: 'var(--b23-shadow-panel)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 14px', borderBottom: '1px solid var(--b23-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <h2 style={{ margin: 0, font: '600 15px var(--b23-display)', color: 'var(--b23-fg)' }}>Current Sale</h2>
            {lines.length > 0 && <span style={{ font: '600 11px var(--b23-mono)', padding: '2px 8px', borderRadius: 999, background: 'color-mix(in srgb,var(--b23-accent) 22%, var(--b23-surface-2))', color: 'var(--b23-accent-hi)' }}>{lines.reduce((s, l) => s + l.qty, 0)}</span>}
          </div>
          {lines.length > 0 && <button onClick={() => setCart({})} style={{ background: 'none', border: 'none', cursor: 'pointer', font: '500 12px var(--b23-sans)', color: 'var(--b23-muted)' }}>Clear</button>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', minHeight: 130 }}>
          {lines.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '46px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--b23-border-2)' }}><Icon d="M9 20m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0|M18 20m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0|M2 3h2.2l2.3 12.4a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L21 7H5.5" size={30} sw={1.6} /></div>
              <div style={{ font: '500 13px var(--b23-sans)', color: 'var(--b23-fg-2)', marginTop: 13 }}>No items yet</div>
              <div style={{ font: '400 12px var(--b23-sans)', color: 'var(--b23-muted)', marginTop: 4 }}>Tap a product to start a sale.</div>
            </div>
          ) : lines.map((l) => (
            <div key={l.p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 8px', borderBottom: '1px solid var(--b23-border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: '500 13.5px var(--b23-sans)', color: 'var(--b23-fg)' }}>{l.p.name}</div><div style={{ font: '400 11px var(--b23-mono)', color: 'var(--b23-faint)' }}>{peso(l.p.price)} each</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'var(--b23-surface-2)', border: '1px solid var(--b23-border)', borderRadius: 9, padding: 2 }}>
                <button onClick={() => step(l.p.id, -1)} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--b23-fg-2)', font: '600 17px var(--b23-sans)', lineHeight: 1 }}>−</button>
                <span style={{ minWidth: 22, textAlign: 'center', font: '600 13px var(--b23-mono)', color: 'var(--b23-fg)', fontVariantNumeric: 'tabular-nums' }}>{l.qty}</span>
                <button onClick={() => step(l.p.id, 1)} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--b23-fg-2)', font: '600 17px var(--b23-sans)', lineHeight: 1 }}>+</button>
              </div>
              <span style={{ width: 70, textAlign: 'right', font: '600 13px var(--b23-mono)', color: 'var(--b23-fg)', fontVariantNumeric: 'tabular-nums' }}>{peso(l.p.price * l.qty)}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 16px 18px', borderTop: '1px solid var(--b23-border)', background: 'var(--b23-surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ font: '500 13px var(--b23-sans)', color: 'var(--b23-muted)' }}>Total</span><span style={{ font: '700 27px var(--b23-display)', color: 'var(--b23-fg)', fontVariantNumeric: 'tabular-nums' }}>{peso(total)}</span></div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 13 }}>
            {payBtn('cash', 'Cash', 'M2 6h20v12H2zM12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0')}
            {payBtn('gcash', 'GCash', 'M6 2h12v20H6zM11 18h2')}
            {payBtn('card', 'Card', 'M2 5h20v14H2zM2 10h20')}
            {payBtn('other', 'Other', 'M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M17 14h.01')}
          </div>
          <Button size="lg" style={{ width: '100%', borderRadius: 12 }} leadingIcon={<Icon d={ICON.check} size={18} sw={2.4} />} disabled={lines.length === 0}>Complete Sale</Button>
        </div>
      </aside>
    </div>
  );
}

// ==================================================================
//  PLACEHOLDER (screens not fully built in the kit)
// ==================================================================
function Placeholder({ nav }) {
  const meta = NAV.find(n => n.k === nav);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ maxWidth: 460, textAlign: 'center', padding: 40, borderRadius: 18, background: 'var(--b23-surface)', border: '1px solid var(--b23-border)' }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, margin: '0 auto 18px', background: 'color-mix(in srgb,var(--b23-accent) 16%, var(--b23-surface-2))', border: '1px solid color-mix(in srgb,var(--b23-accent) 30%, var(--b23-border))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--b23-accent-hi)' }}><Icon d={ICON[nav]} size={24} /></div>
        <h1 style={{ margin: 0, font: '600 24px var(--b23-display)', color: 'var(--b23-fg)' }}>{meta.l}</h1>
        <p style={{ margin: '10px 0 0', font: '400 14px var(--b23-sans)', color: 'var(--b23-muted)' }}>This surface follows the same shell, cards, tables and status patterns shown in Dashboard, Clients and POS.</p>
      </div>
    </div>
  );
}

// ==================================================================
//  APP
// ==================================================================
function App() {
  const [nav, setNav] = React.useState('dashboard');
  let screen;
  if (nav === 'dashboard') screen = <Dashboard />;
  else if (nav === 'clients') screen = <Clients />;
  else if (nav === 'pos') screen = <POS />;
  else screen = <Placeholder nav={nav} />;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--b23-bg)', color: 'var(--b23-fg)' }}>
      <Topbar />
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 58px)' }}>
        <Sidebar nav={nav} setNav={setNav} />
        <main style={{ flex: 1, minWidth: 0, padding: '26px 30px 60px', maxWidth: 1320 }}>{screen}</main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
