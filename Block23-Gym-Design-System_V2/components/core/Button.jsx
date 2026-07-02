import React from 'react';

/**
 * Block 23 — Button
 * The violet gradient is reserved for the ONE primary action per region.
 */
const SIZES = {
  sm:      { padding: '7px 14px',  font: '600 12px',   height: 30, radius: 'var(--b23-radius-md)' },
  default: { padding: '11px 18px', font: '600 13px',   height: 40, radius: 'var(--b23-radius-lg)' },
  lg:      { padding: '12px 22px', font: '600 14px',   height: 46, radius: 'var(--b23-radius-lg)' },
};

const GRAD = 'linear-gradient(150deg, var(--b23-accent), color-mix(in srgb, var(--b23-accent) 70%, #000))';

function variantStyle(variant) {
  switch (variant) {
    case 'secondary':
      return { background: 'var(--b23-surface)', color: 'var(--b23-fg-2)', border: '1px solid var(--b23-border)' };
    case 'ghost':
      return { background: 'transparent', color: 'var(--b23-fg-2)', border: '1px solid transparent' };
    case 'destructive':
      return { background: 'var(--b23-danger-solid)', color: '#fff', border: '1px solid var(--b23-danger-solid)', boxShadow: '0 10px 24px -12px var(--b23-danger-solid)' };
    case 'primary':
    default:
      return { background: GRAD, color: 'var(--b23-primary-on)', border: 'none', boxShadow: 'var(--b23-glow-btn)' };
  }
}

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  pill = true,
  leadingIcon = null,
  trailingIcon = null,
  disabled = false,
  onClick,
  style = {},
  ...rest
}) {
  const s = SIZES[size] || SIZES.default;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: s.padding,
    borderRadius: pill ? 'var(--b23-radius-pill)' : s.radius,
    fontFamily: 'var(--b23-sans)',
    font: `${s.font} var(--b23-sans)`,
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
    transition: 'filter var(--b23-dur-fast) var(--b23-ease-out), border-color var(--b23-dur-fast), background var(--b23-dur-fast)',
    opacity: disabled ? 0.5 : 1,
    ...variantStyle(variant),
    ...style,
  };
  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover
    ? (variant === 'primary' || variant === 'destructive'
        ? { filter: 'brightness(1.08)' }
        : variant === 'ghost'
          ? { background: 'color-mix(in srgb, var(--b23-fg) 7%, transparent)' }
          : { borderColor: 'var(--b23-border-2)' })
    : null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...hoverStyle }}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
