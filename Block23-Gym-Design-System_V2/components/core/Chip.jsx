import React from 'react';

/**
 * Block 23 — Filter Chip.
 * Selected = violet subtle fill + violet text + border.
 * Idle = surface + hairline. Optional status dot + count.
 */
export function Chip({
  children,
  selected = false,
  dot = null,        // color string for a leading status dot
  count = null,      // optional trailing count
  onClick,
  style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '7px 13px',
    borderRadius: 'var(--b23-radius-pill)',
    font: '600 12.5px var(--b23-sans)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'filter var(--b23-dur-fast) var(--b23-ease-out), border-color var(--b23-dur-fast)',
    ...(selected
      ? {
          background: 'color-mix(in srgb, var(--b23-accent) 18%, transparent)',
          color: 'var(--b23-accent-hi)',
          border: '1px solid color-mix(in srgb, var(--b23-accent) 42%, transparent)',
        }
      : {
          background: 'var(--b23-surface)',
          color: 'var(--b23-fg-2)',
          border: '1px solid var(--b23-border)',
        }),
    ...(hover ? { filter: 'brightness(1.12)' } : null),
    ...style,
  };
  const countBg = selected
    ? 'color-mix(in srgb, var(--b23-accent) 28%, transparent)'
    : 'var(--b23-surface-2)';
  return (
    <button type="button" onClick={onClick} style={base}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: 999, background: dot, flex: 'none' }} />}
      {children}
      {count != null && (
        <span style={{
          font: '500 11px var(--b23-mono)',
          padding: '1px 6px',
          borderRadius: 'var(--b23-radius-pill)',
          background: countBg,
          fontVariantNumeric: 'tabular-nums',
        }}>{count}</span>
      )}
    </button>
  );
}
