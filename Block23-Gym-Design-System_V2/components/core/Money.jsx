import React from 'react';

/**
 * Block 23 — Money cell. Tabular mono, ₱ prefix, 2 decimals, right-aligned.
 * `void` strikes through (excluded from totals); `negative` goes red.
 */
function format(amount) {
  if (typeof amount === 'string') return amount;
  const n = Number(amount) || 0;
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function Money({
  amount,
  currency = '₱',
  variant = 'default',   // 'default' | 'void' | 'negative' | 'muted' | 'strong'
  align = 'right',
  size = 14,
  style = {},
}) {
  const color =
    variant === 'negative' ? 'var(--b23-danger)'
    : variant === 'muted'  ? 'var(--b23-muted)'
    : variant === 'void'   ? 'var(--b23-faint)'
    : 'var(--b23-fg)';
  const weight = variant === 'strong' ? 600 : 500;
  const n = typeof amount === 'number' ? amount : null;
  const neg = variant === 'negative' && n != null && n >= 0;
  return (
    <span style={{
      display: 'inline-block',
      textAlign: align,
      fontFamily: 'var(--b23-mono)',
      fontWeight: weight,
      fontSize: size,
      fontVariantNumeric: 'tabular-nums',
      color,
      textDecoration: variant === 'void' ? 'line-through' : 'none',
      ...style,
    }}>
      {neg ? '−' : ''}{currency}{format(amount)}
    </span>
  );
}
