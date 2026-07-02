import React from 'react';

/**
 * Block 23 — Status Badge.
 * Status is color + LABEL + shape/icon, never color alone.
 * Subtle semantic surface + on-canvas semantic text.
 */
const HUES = {
  success: 'var(--b23-success)',
  warning: 'var(--b23-warning)',
  danger:  'var(--b23-danger)',
  info:    'var(--b23-info)',
  primary: 'var(--b23-accent-hi)',
  atRisk:  'var(--b23-at-risk)',
  neutral: 'var(--b23-neutral)',
};

function Dot({ hue, hollow }) {
  return (
    <span
      style={{
        width: 7, height: 7, borderRadius: 999, flex: 'none',
        background: hollow ? 'transparent' : hue,
        border: hollow ? `1.5px solid ${hue}` : 'none',
      }}
    />
  );
}

export function Badge({
  children,
  variant = 'neutral',
  shape = 'dot',    // 'dot' | 'hollow' | 'none'
  icon = null,      // custom leading ReactNode (overrides shape)
  outline = false,  // VOID / Cancelled treatment
  style = {},
}) {
  const hue = HUES[variant] || HUES.neutral;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 10px',
    borderRadius: 'var(--b23-radius-pill)',
    font: '500 11.5px var(--b23-sans)',
    whiteSpace: 'nowrap',
    color: hue,
    background: outline ? 'transparent' : `color-mix(in srgb, ${hue} 15%, transparent)`,
    border: `1px solid color-mix(in srgb, ${hue} ${outline ? '45%' : '30%'}, transparent)`,
    ...style,
  };
  const lead = icon
    ? icon
    : shape === 'none'
      ? null
      : <Dot hue={hue} hollow={shape === 'hollow'} />;
  return (
    <span style={base}>
      {lead}
      {children}
    </span>
  );
}
