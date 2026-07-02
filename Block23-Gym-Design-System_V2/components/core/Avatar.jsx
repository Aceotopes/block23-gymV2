import React from 'react';

/**
 * Block 23 — Avatar. Initials on a neutral circle (no client photos at MVP).
 * `accent` gives the violet-tinted treatment used for the signed-in user.
 */
export function Avatar({ initials, size = 32, accent = false, dim = false, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
      width: size, height: size, borderRadius: 'var(--b23-radius-pill)',
      font: `600 ${Math.round(size * 0.36)}px var(--b23-display)`,
      background: accent ? 'color-mix(in srgb, var(--b23-accent) 22%, var(--b23-surface-2))' : 'var(--b23-surface-3)',
      border: accent ? '1px solid color-mix(in srgb, var(--b23-accent) 35%, var(--b23-border))' : '1px solid transparent',
      color: accent ? 'var(--b23-accent-hi)' : 'var(--b23-fg-2)',
      opacity: dim ? 0.55 : 1,
      ...style,
    }}>{initials}</span>
  );
}
