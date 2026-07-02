import React from 'react';

/**
 * Block 23 — Card / panel (elevation level 1).
 * Separation is fill + hairline, not shadow. `hero` adds the violet
 * wash + bloom reserved for the one hero element on a screen.
 */
export function Card({
  children,
  hero = false,
  eyebrow = null,     // small mono uppercase label (ReactNode)
  title = null,       // display-font title (ReactNode)
  action = null,      // right-aligned header affordance (ReactNode)
  pad = 'var(--b23-card-pad)',
  style = {},
}) {
  const base = hero
    ? {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--b23-radius-3xl)',
        background: 'linear-gradient(155deg, color-mix(in srgb, var(--b23-accent) 16%, var(--b23-surface)), var(--b23-surface) 58%)',
        border: '1px solid color-mix(in srgb, var(--b23-accent) 30%, var(--b23-border))',
        boxShadow: 'var(--b23-glow-hero)',
      }
    : {
        borderRadius: 'var(--b23-radius-2xl)',
        background: 'var(--b23-surface)',
        border: '1px solid var(--b23-border)',
        boxShadow: 'var(--b23-shadow-card)',
      };
  const hasHeader = eyebrow || title || action;
  return (
    <div style={{ padding: pad, ...base, ...style }}>
      {hasHeader && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            {eyebrow && (
              <div style={{ font: '600 11px var(--b23-mono)', letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--b23-muted)' }}>{eyebrow}</div>
            )}
            {title && (
              <div style={{ marginTop: eyebrow ? 6 : 0, font: '600 16px var(--b23-display)', color: 'var(--b23-fg)' }}>{title}</div>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
