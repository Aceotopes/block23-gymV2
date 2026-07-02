import React from 'react';

/**
 * Block 23 — Wordmark. The brand has no logo file; the mark is a
 * violet-gradient "23" tile + "Block 23" in Space Grotesk with a mono
 * "GYM · OPERATIONS" sub-label. Replace the tile if an official logo ships.
 */
export function Wordmark({ subLabel = 'GYM · OPERATIONS', showSub = true, size = 30, style = {} }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 13, ...style }}>
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.3),
        background: 'var(--b23-grad-logo)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        font: `700 ${Math.round(size * 0.47)}px var(--b23-display)`, color: 'var(--b23-primary-on)',
        boxShadow: 'var(--b23-glow-logo)', flex: 'none',
      }}>23</div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ font: '600 16px var(--b23-display)', letterSpacing: '-.01em', color: 'var(--b23-fg)' }}>Block&nbsp;23</span>
        {showSub && (
          <span style={{ font: '500 9px var(--b23-mono)', letterSpacing: '.22em', color: 'var(--b23-faint)', marginTop: 3 }}>{subLabel}</span>
        )}
      </div>
    </div>
  );
}
