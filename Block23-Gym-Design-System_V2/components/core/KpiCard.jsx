import React from 'react';

/**
 * Block 23 — KPI Card.
 * Title (mono uppercase) · Value (display, tabular) · Delta (▲/▼/– mono).
 * Zero renders as "0"/"₱0", never blank.
 */
const DELTA_COLOR = {
  up:   'var(--b23-success)',
  down: 'var(--b23-danger)',
  flat: 'var(--b23-faint)',
};
const DELTA_GLYPH = { up: '▲', down: '▼', flat: '–' };

export function KpiCard({
  label,
  value,
  delta = null,       // { dir:'up'|'down'|'flat', value:'+3', note:'from last month' }
  icon = null,        // optional leading status icon next to the label
  accentBorder = null,// e.g. 'var(--b23-warning)' for the Expiring-soon card
  valueColor = 'var(--b23-fg)',
  style = {},
}) {
  const border = accentBorder
    ? `1px solid color-mix(in srgb, ${accentBorder} 22%, var(--b23-border))`
    : '1px solid var(--b23-border)';
  const labelColor = accentBorder || 'var(--b23-muted)';
  return (
    <div style={{
      padding: 'var(--b23-card-pad)',
      borderRadius: 'var(--b23-radius-2xl)',
      background: 'var(--b23-surface)',
      border,
      boxShadow: 'var(--b23-shadow-card)',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 11px var(--b23-mono)', letterSpacing: '.07em', textTransform: 'uppercase', color: labelColor }}>
        {icon}{label}
      </div>
      <div style={{ marginTop: 10, font: '600 28px var(--b23-display)', color: valueColor, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {delta && (
        <div style={{ marginTop: 8, font: '500 12px var(--b23-mono)', color: DELTA_COLOR[delta.dir] || 'var(--b23-faint)' }}>
          {DELTA_GLYPH[delta.dir] || ''} {delta.value}
          {delta.note && <span style={{ color: 'var(--b23-faint)', fontWeight: 400 }}> {delta.note}</span>}
        </div>
      )}
    </div>
  );
}
