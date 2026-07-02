/* @ds-bundle: {"format":3,"namespace":"Block23GymDesignSystem_acdb54","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"KpiCard","sourcePath":"components/core/KpiCard.jsx"},{"name":"Money","sourcePath":"components/core/Money.jsx"},{"name":"Wordmark","sourcePath":"components/core/Wordmark.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"35c067ed6ef0","components/core/Badge.jsx":"51a50b36e0b6","components/core/Button.jsx":"452ae87b0645","components/core/Card.jsx":"8d8f2b02f25f","components/core/Chip.jsx":"d613a5c90f07","components/core/Input.jsx":"1bfeb099fb8f","components/core/KpiCard.jsx":"6954fdfcfb23","components/core/Money.jsx":"93bfc2e6e583","components/core/Wordmark.jsx":"de611e1685e8","ui_kits/console/console.jsx":"85abc5a01f5f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.Block23GymDesignSystem_acdb54 = window.Block23GymDesignSystem_acdb54 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
/**
 * Block 23 — Avatar. Initials on a neutral circle (no client photos at MVP).
 * `accent` gives the violet-tinted treatment used for the signed-in user.
 */
function Avatar({
  initials,
  size = 32,
  accent = false,
  dim = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      width: size,
      height: size,
      borderRadius: 'var(--b23-radius-pill)',
      font: `600 ${Math.round(size * 0.36)}px var(--b23-display)`,
      background: accent ? 'color-mix(in srgb, var(--b23-accent) 22%, var(--b23-surface-2))' : 'var(--b23-surface-3)',
      border: accent ? '1px solid color-mix(in srgb, var(--b23-accent) 35%, var(--b23-border))' : '1px solid transparent',
      color: accent ? 'var(--b23-accent-hi)' : 'var(--b23-fg-2)',
      opacity: dim ? 0.55 : 1,
      ...style
    }
  }, initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
/**
 * Block 23 — Status Badge.
 * Status is color + LABEL + shape/icon, never color alone.
 * Subtle semantic surface + on-canvas semantic text.
 */
const HUES = {
  success: 'var(--b23-success)',
  warning: 'var(--b23-warning)',
  danger: 'var(--b23-danger)',
  info: 'var(--b23-info)',
  primary: 'var(--b23-accent-hi)',
  atRisk: 'var(--b23-at-risk)',
  neutral: 'var(--b23-neutral)'
};
function Dot({
  hue,
  hollow
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      flex: 'none',
      background: hollow ? 'transparent' : hue,
      border: hollow ? `1.5px solid ${hue}` : 'none'
    }
  });
}
function Badge({
  children,
  variant = 'neutral',
  shape = 'dot',
  // 'dot' | 'hollow' | 'none'
  icon = null,
  // custom leading ReactNode (overrides shape)
  outline = false,
  // VOID / Cancelled treatment
  style = {}
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
    ...style
  };
  const lead = icon ? icon : shape === 'none' ? null : /*#__PURE__*/React.createElement(Dot, {
    hue: hue,
    hollow: shape === 'hollow'
  });
  return /*#__PURE__*/React.createElement("span", {
    style: base
  }, lead, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Block 23 — Button
 * The violet gradient is reserved for the ONE primary action per region.
 */
const SIZES = {
  sm: {
    padding: '7px 14px',
    font: '600 12px',
    height: 30,
    radius: 'var(--b23-radius-md)'
  },
  default: {
    padding: '11px 18px',
    font: '600 13px',
    height: 40,
    radius: 'var(--b23-radius-lg)'
  },
  lg: {
    padding: '12px 22px',
    font: '600 14px',
    height: 46,
    radius: 'var(--b23-radius-lg)'
  }
};
const GRAD = 'linear-gradient(150deg, var(--b23-accent), color-mix(in srgb, var(--b23-accent) 70%, #000))';
function variantStyle(variant) {
  switch (variant) {
    case 'secondary':
      return {
        background: 'var(--b23-surface)',
        color: 'var(--b23-fg-2)',
        border: '1px solid var(--b23-border)'
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--b23-fg-2)',
        border: '1px solid transparent'
      };
    case 'destructive':
      return {
        background: 'var(--b23-danger-solid)',
        color: '#fff',
        border: '1px solid var(--b23-danger-solid)',
        boxShadow: '0 10px 24px -12px var(--b23-danger-solid)'
      };
    case 'primary':
    default:
      return {
        background: GRAD,
        color: 'var(--b23-primary-on)',
        border: 'none',
        boxShadow: 'var(--b23-glow-btn)'
      };
  }
}
function Button({
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
    ...style
  };
  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover ? variant === 'primary' || variant === 'destructive' ? {
    filter: 'brightness(1.08)'
  } : variant === 'ghost' ? {
    background: 'color-mix(in srgb, var(--b23-fg) 7%, transparent)'
  } : {
    borderColor: 'var(--b23-border-2)'
  } : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...hoverStyle
    }
  }, rest), leadingIcon, children, trailingIcon);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
/**
 * Block 23 — Card / panel (elevation level 1).
 * Separation is fill + hairline, not shadow. `hero` adds the violet
 * wash + bloom reserved for the one hero element on a screen.
 */
function Card({
  children,
  hero = false,
  eyebrow = null,
  // small mono uppercase label (ReactNode)
  title = null,
  // display-font title (ReactNode)
  action = null,
  // right-aligned header affordance (ReactNode)
  pad = 'var(--b23-card-pad)',
  style = {}
}) {
  const base = hero ? {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 'var(--b23-radius-3xl)',
    background: 'linear-gradient(155deg, color-mix(in srgb, var(--b23-accent) 16%, var(--b23-surface)), var(--b23-surface) 58%)',
    border: '1px solid color-mix(in srgb, var(--b23-accent) 30%, var(--b23-border))',
    boxShadow: 'var(--b23-glow-hero)'
  } : {
    borderRadius: 'var(--b23-radius-2xl)',
    background: 'var(--b23-surface)',
    border: '1px solid var(--b23-border)',
    boxShadow: 'var(--b23-shadow-card)'
  };
  const hasHeader = eyebrow || title || action;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: pad,
      ...base,
      ...style
    }
  }, hasHeader && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 11px var(--b23-mono)',
      letterSpacing: '.07em',
      textTransform: 'uppercase',
      color: 'var(--b23-muted)'
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: eyebrow ? 6 : 0,
      font: '600 16px var(--b23-display)',
      color: 'var(--b23-fg)'
    }
  }, title)), action), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
/**
 * Block 23 — Filter Chip.
 * Selected = violet subtle fill + violet text + border.
 * Idle = surface + hairline. Optional status dot + count.
 */
function Chip({
  children,
  selected = false,
  dot = null,
  // color string for a leading status dot
  count = null,
  // optional trailing count
  onClick,
  style = {}
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
    ...(selected ? {
      background: 'color-mix(in srgb, var(--b23-accent) 18%, transparent)',
      color: 'var(--b23-accent-hi)',
      border: '1px solid color-mix(in srgb, var(--b23-accent) 42%, transparent)'
    } : {
      background: 'var(--b23-surface)',
      color: 'var(--b23-fg-2)',
      border: '1px solid var(--b23-border)'
    }),
    ...(hover ? {
      filter: 'brightness(1.12)'
    } : null),
    ...style
  };
  const countBg = selected ? 'color-mix(in srgb, var(--b23-accent) 28%, transparent)' : 'var(--b23-surface-2)';
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: base,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: dot,
      flex: 'none'
    }
  }), children, count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px var(--b23-mono)',
      padding: '1px 6px',
      borderRadius: 'var(--b23-radius-pill)',
      background: countBg,
      fontVariantNumeric: 'tabular-nums'
    }
  }, count));
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
/**
 * Block 23 — form field. Label above (never placeholder-as-label);
 * helper below is replaced by the error message on error. Focus =
 * violet border + violet-20% ring. `prefix` for currency (₱).
 */
function Input({
  label,
  value,
  onChange,
  placeholder,
  error = null,
  hint = null,
  optional = false,
  required = false,
  prefix = null,
  // e.g. '₱'
  readOnly = false,
  multiline = false,
  rows = 3,
  type = 'text',
  inputMode,
  style = {}
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--b23-danger-rose)' : focus ? 'var(--b23-accent)' : 'var(--b23-border-2)';
  const ring = error ? '0 0 0 3px rgba(251,113,133,.16)' : focus ? '0 0 0 3px var(--b23-focus-ring)' : 'none';
  const fieldFont = {
    font: '400 14px var(--b23-sans)',
    color: 'var(--b23-fg)'
  };
  const shell = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    boxSizing: 'border-box',
    padding: multiline ? '12px 14px' : '0 14px',
    minHeight: multiline ? 72 : 44,
    borderRadius: 'var(--b23-radius-lg)',
    background: readOnly ? 'var(--b23-surface-2)' : 'var(--b23-bg)',
    border: `1px solid ${readOnly ? 'var(--b23-border)' : borderColor}`,
    boxShadow: ring,
    transition: 'border-color var(--b23-dur-fast), box-shadow var(--b23-dur-fast)'
  };
  const controlStyle = {
    flex: 1,
    minWidth: 0,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontVariantNumeric: 'tabular-nums',
    resize: multiline ? 'vertical' : 'none',
    ...fieldFont,
    color: readOnly ? 'var(--b23-muted)' : 'var(--b23-fg)',
    fontFamily: readOnly || prefix ? 'var(--b23-mono)' : 'var(--b23-sans)',
    padding: multiline ? 0 : '12px 0'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      font: '600 12.5px var(--b23-sans)',
      color: 'var(--b23-fg-2)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--b23-danger-rose)'
    }
  }, " *"), optional && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px var(--b23-sans)',
      color: 'var(--b23-faint)'
    }
  }, " \xB7 optional")), /*#__PURE__*/React.createElement("div", {
    style: shell
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 15px var(--b23-mono)',
      color: 'var(--b23-muted)'
    }
  }, prefix), multiline ? /*#__PURE__*/React.createElement("textarea", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    rows: rows,
    readOnly: readOnly,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      ...controlStyle,
      lineHeight: 1.5
    }
  }) : /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    type: type,
    inputMode: inputMode,
    readOnly: readOnly,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: controlStyle
  })), error ? /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: '500 12px var(--b23-sans)',
      color: 'var(--b23-danger-rose)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v4M12 16h.01"
  })), error) : hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px var(--b23-sans)',
      color: 'var(--b23-faint)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/KpiCard.jsx
try { (() => {
/**
 * Block 23 — KPI Card.
 * Title (mono uppercase) · Value (display, tabular) · Delta (▲/▼/– mono).
 * Zero renders as "0"/"₱0", never blank.
 */
const DELTA_COLOR = {
  up: 'var(--b23-success)',
  down: 'var(--b23-danger)',
  flat: 'var(--b23-faint)'
};
const DELTA_GLYPH = {
  up: '▲',
  down: '▼',
  flat: '–'
};
function KpiCard({
  label,
  value,
  delta = null,
  // { dir:'up'|'down'|'flat', value:'+3', note:'from last month' }
  icon = null,
  // optional leading status icon next to the label
  accentBorder = null,
  // e.g. 'var(--b23-warning)' for the Expiring-soon card
  valueColor = 'var(--b23-fg)',
  style = {}
}) {
  const border = accentBorder ? `1px solid color-mix(in srgb, ${accentBorder} 22%, var(--b23-border))` : '1px solid var(--b23-border)';
  const labelColor = accentBorder || 'var(--b23-muted)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--b23-card-pad)',
      borderRadius: 'var(--b23-radius-2xl)',
      background: 'var(--b23-surface)',
      border,
      boxShadow: 'var(--b23-shadow-card)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: '600 11px var(--b23-mono)',
      letterSpacing: '.07em',
      textTransform: 'uppercase',
      color: labelColor
    }
  }, icon, label), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      font: '600 28px var(--b23-display)',
      color: valueColor,
      fontVariantNumeric: 'tabular-nums'
    }
  }, value), delta && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      font: '500 12px var(--b23-mono)',
      color: DELTA_COLOR[delta.dir] || 'var(--b23-faint)'
    }
  }, DELTA_GLYPH[delta.dir] || '', " ", delta.value, delta.note && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--b23-faint)',
      fontWeight: 400
    }
  }, " ", delta.note)));
}
Object.assign(__ds_scope, { KpiCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/KpiCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Money.jsx
try { (() => {
/**
 * Block 23 — Money cell. Tabular mono, ₱ prefix, 2 decimals, right-aligned.
 * `void` strikes through (excluded from totals); `negative` goes red.
 */
function format(amount) {
  if (typeof amount === 'string') return amount;
  const n = Number(amount) || 0;
  return n.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function Money({
  amount,
  currency = '₱',
  variant = 'default',
  // 'default' | 'void' | 'negative' | 'muted' | 'strong'
  align = 'right',
  size = 14,
  style = {}
}) {
  const color = variant === 'negative' ? 'var(--b23-danger)' : variant === 'muted' ? 'var(--b23-muted)' : variant === 'void' ? 'var(--b23-faint)' : 'var(--b23-fg)';
  const weight = variant === 'strong' ? 600 : 500;
  const n = typeof amount === 'number' ? amount : null;
  const neg = variant === 'negative' && n != null && n >= 0;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      textAlign: align,
      fontFamily: 'var(--b23-mono)',
      fontWeight: weight,
      fontSize: size,
      fontVariantNumeric: 'tabular-nums',
      color,
      textDecoration: variant === 'void' ? 'line-through' : 'none',
      ...style
    }
  }, neg ? '−' : '', currency, format(amount));
}
Object.assign(__ds_scope, { Money });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Money.jsx", error: String((e && e.message) || e) }); }

// components/core/Wordmark.jsx
try { (() => {
/**
 * Block 23 — Wordmark. The brand has no logo file; the mark is a
 * violet-gradient "23" tile + "Block 23" in Space Grotesk with a mono
 * "GYM · OPERATIONS" sub-label. Replace the tile if an official logo ships.
 */
function Wordmark({
  subLabel = 'GYM · OPERATIONS',
  showSub = true,
  size = 30,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 13,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.3),
      background: 'var(--b23-grad-logo)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: `700 ${Math.round(size * 0.47)}px var(--b23-display)`,
      color: 'var(--b23-primary-on)',
      boxShadow: 'var(--b23-glow-logo)',
      flex: 'none'
    }
  }, "23"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 16px var(--b23-display)',
      letterSpacing: '-.01em',
      color: 'var(--b23-fg)'
    }
  }, "Block\xA023"), showSub && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 9px var(--b23-mono)',
      letterSpacing: '.22em',
      color: 'var(--b23-faint)',
      marginTop: 3
    }
  }, subLabel)));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Wordmark.jsx", error: String((e && e.message) || e) }); }

// ui_kits/console/console.jsx
try { (() => {
/* global React, ReactDOM */
// Block 23 — Operations Console UI kit.
// Composes the design-system primitives (window namespace) with kit-local shell/table/grid.
const DS = window.Block23GymDesignSystem_acdb54 || {};
const {
  Button,
  Badge,
  Chip,
  KpiCard,
  Card,
  Money,
  Avatar,
  Wordmark,
  Input
} = DS;

// ---- inline lucide-style icon ----
function Icon({
  d,
  size = 18,
  sw = 1.7,
  style
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style
  }, d.split('|').map((p, i) => /*#__PURE__*/React.createElement("path", {
    key: i,
    d: p
  })));
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
  dots: 'M5 12h.01M12 12h.01M19 12h.01'
};
const NAV = [{
  k: 'dashboard',
  l: 'Dashboard'
}, {
  k: 'clients',
  l: 'Clients'
}, {
  k: 'attendance',
  l: 'Attendance'
}, {
  k: 'payments',
  l: 'Client Payments'
}, {
  k: 'pos',
  l: 'POS'
}, {
  k: 'inventory',
  l: 'Inventory'
}, {
  k: 'reports',
  l: 'Reports'
}, {
  k: 'settings',
  l: 'Settings'
}];
const STATUS = {
  active: {
    l: 'Active',
    variant: 'success',
    shape: 'dot',
    dot: 'var(--b23-success)'
  },
  upcoming: {
    l: 'Upcoming',
    variant: 'info',
    shape: 'hollow',
    dot: 'var(--b23-info)'
  },
  expiring: {
    l: 'Expiring soon',
    variant: 'warning',
    icon: true,
    dot: 'var(--b23-warning)'
  },
  expired: {
    l: 'Expired',
    variant: 'neutral',
    shape: 'hollow',
    dot: 'var(--b23-neutral)'
  },
  atrisk: {
    l: 'At risk',
    variant: 'atRisk',
    icon: true,
    dot: 'var(--b23-at-risk)'
  },
  inactive: {
    l: 'Inactive',
    variant: 'neutral',
    shape: 'hollow',
    dot: 'var(--b23-neutral)'
  }
};
function StatusBadge({
  s
}) {
  const m = STATUS[s];
  if (m.icon) return /*#__PURE__*/React.createElement(Badge, {
    variant: m.variant,
    icon: /*#__PURE__*/React.createElement(Icon, {
      d: ICON.triangle,
      size: 12,
      sw: 2
    })
  }, m.l);
  return /*#__PURE__*/React.createElement(Badge, {
    variant: m.variant,
    shape: m.shape
  }, m.l);
}
function TypeBadge({
  t
}) {
  return t === 'member' ? /*#__PURE__*/React.createElement(Badge, {
    variant: "primary",
    shape: "none"
  }, "\u25C8 Member") : /*#__PURE__*/React.createElement(Badge, {
    variant: "neutral",
    outline: true,
    shape: "none"
  }, "\u25C7 Walk-in");
}
const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('');
const CLIENTS = [{
  id: 1,
  name: 'Maria Santos',
  type: 'member',
  statuses: ['active'],
  expiry: 'Aug 12, 2026',
  contact: '0917 555 0182'
}, {
  id: 2,
  name: 'Joshua dela Cruz',
  type: 'member',
  statuses: ['expiring', 'atrisk'],
  expiry: 'Jul 6, 2026',
  contact: '0918 220 4471'
}, {
  id: 3,
  name: 'Andrea Reyes',
  type: 'member',
  statuses: ['upcoming'],
  expiry: 'Oct 3, 2026',
  contact: '0917 884 1190'
}, {
  id: 4,
  name: 'Marco Bautista',
  type: 'walkin',
  statuses: ['active'],
  expiry: null,
  contact: '0920 553 7781'
}, {
  id: 5,
  name: 'Patricia Gonzales',
  type: 'member',
  statuses: ['expired'],
  expiry: 'Jun 1, 2026',
  contact: '0917 442 0098'
}, {
  id: 6,
  name: 'Kevin Tan',
  type: 'member',
  statuses: ['active', 'atrisk'],
  expiry: 'Sep 1, 2026',
  contact: '0915 778 2210'
}, {
  id: 7,
  name: 'Bea Villanueva',
  type: 'walkin',
  statuses: ['inactive'],
  expiry: null,
  contact: '0928 110 5567'
}, {
  id: 8,
  name: 'Carlo Mendoza',
  type: 'member',
  statuses: ['expiring'],
  expiry: 'Jul 11, 2026',
  contact: '0917 663 9921'
}, {
  id: 9,
  name: 'Nicole Aquino',
  type: 'member',
  statuses: ['active'],
  expiry: 'Dec 20, 2026',
  contact: '0916 207 3345'
}, {
  id: 10,
  name: 'Rafael Cruz',
  type: 'walkin',
  statuses: ['active'],
  expiry: null,
  contact: '0921 559 8830'
}];
const CHIPS = [{
  k: 'all',
  l: 'All',
  count: 296,
  dot: null
}, {
  k: 'active',
  l: 'Active',
  count: 284,
  dot: 'var(--b23-success)'
}, {
  k: 'upcoming',
  l: 'Upcoming',
  count: 8,
  dot: 'var(--b23-info)'
}, {
  k: 'atrisk',
  l: 'At risk',
  count: 5,
  dot: 'var(--b23-at-risk)'
}, {
  k: 'expiring',
  l: 'Expiring soon',
  count: 12,
  dot: 'var(--b23-warning)'
}, {
  k: 'expired',
  l: 'Expired',
  count: 47,
  dot: 'var(--b23-neutral)'
}];
const PRODUCTS = [{
  id: 'water',
  name: 'Bottled Water',
  cat: 'bev',
  price: 25,
  stock: 14,
  low: true,
  tile: 'var(--b23-info)'
}, {
  id: 'gatorade',
  name: 'Gatorade Blue',
  cat: 'bev',
  price: 45,
  stock: 62,
  tile: 'var(--b23-info)'
}, {
  id: 'sting',
  name: 'Sting Energy',
  cat: 'bev',
  price: 25,
  stock: 6,
  reorder: true,
  tile: 'var(--b23-danger)'
}, {
  id: 'pocari',
  name: 'Pocari Sweat',
  cat: 'bev',
  price: 55,
  stock: 30,
  tile: 'var(--b23-info)'
}, {
  id: 'whey',
  name: 'Whey Scoop',
  cat: 'sup',
  price: 50,
  stock: 70,
  tile: 'var(--b23-accent-light)'
}, {
  id: 'pre',
  name: 'Pre-Workout',
  cat: 'sup',
  price: 60,
  stock: 50,
  tile: 'var(--b23-accent-light)'
}, {
  id: 'bar',
  name: 'Protein Bar',
  cat: 'snk',
  price: 65,
  stock: 24,
  tile: 'var(--b23-cat-product)'
}, {
  id: 'towel',
  name: 'Gym Towel',
  cat: 'app',
  price: 180,
  stock: 12,
  tile: 'var(--b23-warning)'
}, {
  id: 'shaker',
  name: 'Shaker Bottle',
  cat: 'app',
  price: 220,
  stock: 0,
  out: true,
  tile: 'var(--b23-warning)'
}];
const POS_CATS = [{
  k: 'all',
  l: 'All'
}, {
  k: 'bev',
  l: 'Beverages'
}, {
  k: 'sup',
  l: 'Supplements'
}, {
  k: 'snk',
  l: 'Snacks'
}, {
  k: 'app',
  l: 'Apparel'
}];
const peso = n => '₱' + n.toLocaleString('en-PH');

// ==================================================================
//  TOPBAR + SIDEBAR
// ==================================================================
function Topbar() {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 22px',
      background: 'color-mix(in srgb, var(--b23-bg) 86%, transparent)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--b23-border)'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '8px 14px',
      borderRadius: 999,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border)',
      minWidth: 320,
      color: 'var(--b23-faint)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    d: ICON.search,
    size: 15,
    sw: 2
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px var(--b23-sans)',
      color: 'var(--b23-muted)'
    }
  }, "Search clients, products, transactions\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: '500 10px var(--b23-mono)',
      padding: '2px 7px',
      borderRadius: 6,
      background: 'var(--b23-surface-2)',
      border: '1px solid var(--b23-border)',
      color: 'var(--b23-faint)'
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      lineHeight: 1.3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px var(--b23-mono)',
      color: 'var(--b23-fg-2)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "Mon, Jun 30 \xB7 7:12 PM"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 10px var(--b23-mono)',
      color: 'var(--b23-faint)',
      letterSpacing: '.04em'
    }
  }, "ASIA / MANILA")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 26,
      background: 'var(--b23-border)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: "MR",
    accent: true,
    size: 34
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.25
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 13px var(--b23-sans)',
      color: 'var(--b23-fg)'
    }
  }, "Marcus Reyes"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 10px var(--b23-mono)',
      color: 'var(--b23-faint)',
      letterSpacing: '.05em'
    }
  }, "OWNER")))));
}
function Sidebar({
  nav,
  setNav
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: '0 0 240px',
      width: 240,
      borderRight: '1px solid var(--b23-border)',
      padding: '18px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      position: 'sticky',
      top: 58,
      height: 'calc(100vh - 58px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 10px var(--b23-mono)',
      letterSpacing: '.16em',
      color: 'var(--b23-faint)',
      padding: '4px 16px 10px'
    }
  }, "MENU"), NAV.map(it => {
    const on = nav === it.k;
    return /*#__PURE__*/React.createElement("button", {
      key: it.k,
      onClick: () => setNav(it.k),
      style: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        padding: '9px 12px 9px 14px',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        font: '500 13.5px var(--b23-sans)',
        textAlign: 'left',
        background: on ? 'color-mix(in srgb, var(--b23-accent) 14%, transparent)' : 'transparent',
        color: on ? 'var(--b23-accent-hi)' : 'var(--b23-fg-2)',
        transition: 'background var(--b23-dur-fast)'
      },
      onMouseEnter: e => {
        if (!on) e.currentTarget.style.background = 'color-mix(in srgb, var(--b23-fg) 7%, transparent)';
      },
      onMouseLeave: e => {
        if (!on) e.currentTarget.style.background = 'transparent';
      }
    }, on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        borderRadius: 3,
        background: 'var(--b23-accent)'
      }
    }), /*#__PURE__*/React.createElement(Icon, {
      d: ICON[it.k],
      size: 18
    }), /*#__PURE__*/React.createElement("span", null, it.l));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      padding: 14,
      borderRadius: 12,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 11px var(--b23-mono)',
      letterSpacing: '.05em',
      color: 'var(--b23-accent-hi)',
      marginBottom: 5
    }
  }, "DRAWER OPEN"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11.5px var(--b23-sans)',
      color: 'var(--b23-muted)',
      lineHeight: 1.45
    }
  }, "\u20B118,450 collected today across 41 transactions.")));
}

// ==================================================================
//  DASHBOARD
// ==================================================================
function Sparkline() {
  const pts = [22, 20, 24, 21, 26, 25, 30, 28, 34, 33, 40];
  const w = 150,
    h = 44,
    max = 42;
  const d = pts.map((v, i) => `${i / (pts.length - 1) * w},${h - v / max * h}`).join(' L ');
  return /*#__PURE__*/React.createElement("svg", {
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: `M ${d}`,
    stroke: "var(--b23-accent-hi)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }));
}
function Donut() {
  const R = 52,
    C = 2 * Math.PI * R;
  const segs = [{
    v: 0.83,
    c: 'var(--b23-success)'
  }, {
    v: 0.05,
    c: 'var(--b23-warning)'
  }, {
    v: 0.12,
    c: 'var(--b23-neutral)'
  }];
  let off = 0;
  return /*#__PURE__*/React.createElement("svg", {
    width: 132,
    height: 132,
    viewBox: "0 0 132 132"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "66",
    cy: "66",
    r: R,
    fill: "none",
    stroke: "var(--b23-surface-3)",
    strokeWidth: "14"
  }), segs.map((s, i) => {
    const len = s.v * C;
    const el = /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: "66",
      cy: "66",
      r: R,
      fill: "none",
      stroke: s.c,
      strokeWidth: "14",
      strokeDasharray: `${len} ${C - len}`,
      strokeDashoffset: -off,
      transform: "rotate(-90 66 66)",
      strokeLinecap: "butt"
    });
    off += len;
    return el;
  }), /*#__PURE__*/React.createElement("text", {
    x: "66",
    y: "63",
    textAnchor: "middle",
    style: {
      font: '600 28px var(--b23-display)',
      fill: 'var(--b23-fg)'
    }
  }, "284"), /*#__PURE__*/React.createElement("text", {
    x: "66",
    y: "82",
    textAnchor: "middle",
    style: {
      font: '400 11px var(--b23-mono)',
      fill: 'var(--b23-muted)'
    }
  }, "active"));
}
function AreaChart() {
  const series = [{
    c: 'var(--b23-cat-membership)',
    p: [30, 38, 34, 46, 42, 55, 60, 58, 70, 82]
  }, {
    c: 'var(--b23-cat-product)',
    p: [20, 24, 22, 28, 26, 30, 34, 32, 40, 46]
  }, {
    c: 'var(--b23-cat-walkin)',
    p: [8, 10, 9, 12, 11, 13, 14, 13, 16, 18]
  }];
  const w = 620,
    h = 200,
    max = 90;
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${w} ${h}`,
    preserveAspectRatio: "none",
    style: {
      display: 'block'
    }
  }, [0.25, 0.5, 0.75, 1].map((g, i) => /*#__PURE__*/React.createElement("line", {
    key: i,
    x1: "0",
    x2: w,
    y1: h * g,
    y2: h * g,
    stroke: "var(--b23-border)",
    strokeWidth: "1"
  })), series.map((s, si) => {
    const line = s.p.map((v, i) => `${i / (s.p.length - 1) * w},${h - v / max * h}`).join(' L ');
    return /*#__PURE__*/React.createElement("g", {
      key: si
    }, /*#__PURE__*/React.createElement("path", {
      d: `M 0,${h} L ${line} L ${w},${h} Z`,
      fill: s.c,
      opacity: "0.12"
    }), /*#__PURE__*/React.createElement("path", {
      d: `M ${line}`,
      fill: "none",
      stroke: s.c,
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }));
  }));
}
function Dashboard() {
  const [period, setPeriod] = React.useState('today');
  const seg = (k, l) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setPeriod(k),
    style: {
      padding: '7px 15px',
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      font: '600 12.5px var(--b23-sans)',
      background: period === k ? 'var(--b23-surface-3)' : 'transparent',
      color: period === k ? 'var(--b23-fg)' : 'var(--b23-muted)'
    }
  }, l);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 24,
      flexWrap: 'wrap',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: '600 30px/1.1 var(--b23-display)',
      letterSpacing: '-.02em',
      color: 'var(--b23-fg)'
    }
  }, "Good evening, Marcus"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '9px 0 0',
      font: '400 14px var(--b23-sans)',
      color: 'var(--b23-muted)'
    }
  }, "Here's how ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--b23-fg-2)',
      fontWeight: 500
    }
  }, "Block 23"), " is running \u2014 Monday, Jun 30, 2026.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: 4,
      borderRadius: 999,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border)'
    }
  }, seg('today', 'Today'), seg('week', 'Week'), seg('month', 'Month')), /*#__PURE__*/React.createElement(Button, {
    leadingIcon: null,
    trailingIcon: /*#__PURE__*/React.createElement(Icon, {
      d: ICON.arrow,
      size: 15,
      sw: 2.2
    })
  }, "Reconcile day"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Card, {
    hero: true,
    style: {
      gridColumn: 'span 2',
      gridRow: 'span 2',
      padding: 26
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      font: '600 11px var(--b23-mono)',
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--b23-accent-hi)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: 'var(--b23-accent-hi)',
      boxShadow: '0 0 0 4px color-mix(in srgb,var(--b23-accent) 25%, transparent)'
    }
  }), "Today's Revenue"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'flex',
      alignItems: 'baseline',
      gap: 2,
      color: 'var(--b23-fg)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 30px var(--b23-display)'
    }
  }, "\u20B1"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 56px/1 var(--b23-display)',
      letterSpacing: '-.02em',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "18,450"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 26px var(--b23-display)',
      color: 'var(--b23-muted)'
    }
  }, ".00")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "success",
    shape: "none"
  }, "\u25B2 12.4%"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px var(--b23-sans)',
      color: 'var(--b23-muted)'
    }
  }, "vs. yesterday \xB7 41 transactions"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 10px var(--b23-mono)',
      letterSpacing: '.08em',
      color: 'var(--b23-faint)',
      textTransform: 'uppercase'
    }
  }, "Intraday"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Sparkline, null)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      paddingTop: 18,
      borderTop: '1px solid color-mix(in srgb,var(--b23-accent) 18%, var(--b23-border))',
      display: 'flex',
      gap: 26
    }
  }, [['Membership', 9200], ['Product', 6450], ['Walk-in', 2800]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 10px var(--b23-mono)',
      letterSpacing: '.06em',
      color: 'var(--b23-faint)',
      textTransform: 'uppercase'
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement(Money, {
    amount: v,
    variant: "muted",
    size: 15,
    align: "left"
  })))))), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Active members",
    value: "284",
    delta: {
      dir: 'up',
      value: '+3',
      note: 'from last month'
    }
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Today's check-ins",
    value: "96",
    delta: {
      dir: 'up',
      value: '+8',
      note: 'vs. yesterday'
    }
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "MTD revenue",
    value: "\u20B1612,300",
    delta: {
      dir: 'up',
      value: '+8.0%',
      note: 'vs. last month'
    }
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Expiring soon",
    value: "12",
    accentBorder: "var(--b23-warning)",
    icon: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--b23-warning)',
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      d: ICON.triangle,
      size: 12,
      sw: 2
    }))
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Inventory value",
    value: "\u20B1148,920",
    valueColor: "var(--b23-fg)",
    delta: {
      dir: 'flat',
      value: '3 excluded',
      note: '— no cost price'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: '600 16px var(--b23-display)',
      color: 'var(--b23-fg)'
    }
  }, "Revenue trend"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      font: '400 12px var(--b23-sans)',
      color: 'var(--b23-muted)'
    }
  }, "Daily revenue by source \xB7 last 10 days")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14
    }
  }, [['Membership', 'var(--b23-cat-membership)'], ['Product', 'var(--b23-cat-product)'], ['Walk-in', 'var(--b23-cat-walkin)']].map(([l, c]) => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: '500 12px var(--b23-sans)',
      color: 'var(--b23-fg-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 3,
      borderRadius: 2,
      background: c
    }
  }), l)))), /*#__PURE__*/React.createElement(AreaChart, null)), /*#__PURE__*/React.createElement(Card, {
    title: "Membership status"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      margin: '4px 0'
    }
  }, /*#__PURE__*/React.createElement(Donut, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      marginTop: 6
    }
  }, [['Active', 'var(--b23-success)', 284], ['Expiring soon', 'var(--b23-warning)', 18], ['Expired', 'var(--b23-neutral)', 41]].map(([l, c, n]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 999,
      background: c
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px var(--b23-sans)',
      color: 'var(--b23-fg-2)'
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: '600 13px var(--b23-mono)',
      color: 'var(--b23-fg)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, n)))))));
}

// ==================================================================
//  CLIENTS
// ==================================================================
function Clients() {
  const [chip, setChip] = React.useState('all');
  const [q, setQ] = React.useState('');
  const rows = CLIENTS.filter(c => {
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (chip === 'all') return true;
    return c.statuses.includes(chip);
  });
  const th = {
    textAlign: 'left',
    padding: '13px 16px',
    font: '600 11px var(--b23-mono)',
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: 'var(--b23-muted)',
    borderBottom: '1px solid var(--b23-border)'
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 24,
      flexWrap: 'wrap',
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: '600 28px/1.1 var(--b23-display)',
      letterSpacing: '-.02em',
      color: 'var(--b23-fg)'
    }
  }, "Clients"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '9px 0 0',
      font: '400 14px var(--b23-sans)',
      color: 'var(--b23-muted)'
    }
  }, "Registry of ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--b23-fg-2)',
      fontWeight: 500
    }
  }, "296"), " clients \xB7 284 with an active membership \xB7 47 expired")), /*#__PURE__*/React.createElement(Button, {
    leadingIcon: /*#__PURE__*/React.createElement(Icon, {
      d: ICON.plus,
      size: 16,
      sw: 2.4
    })
  }, "New Client")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '0 14px',
      height: 40,
      borderRadius: 11,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border)',
      minWidth: 280,
      flex: 1,
      maxWidth: 380,
      color: 'var(--b23-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    d: ICON.search,
    size: 16,
    sw: 2
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search by name\u2026",
    style: {
      flex: 1,
      background: 'none',
      border: 'none',
      outline: 'none',
      color: 'var(--b23-fg)',
      font: '400 14px var(--b23-sans)'
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    leadingIcon: /*#__PURE__*/React.createElement(Icon, {
      d: ICON.download,
      size: 15,
      sw: 2
    })
  }, "Export")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      flexWrap: 'wrap',
      marginBottom: 18
    }
  }, CHIPS.map(c => /*#__PURE__*/React.createElement(Chip, {
    key: c.k,
    selected: chip === c.k,
    dot: c.dot,
    count: c.count,
    onClick: () => setChip(c.k)
  }, c.l))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 16,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border)',
      overflow: 'hidden',
      boxShadow: 'var(--b23-shadow-panel)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--b23-sans)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: 'var(--b23-surface-2)'
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      padding: '13px 18px'
    }
  }, "Full name"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Type"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Membership expiry"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Contact number"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 48,
      borderBottom: '1px solid var(--b23-border)'
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.id,
    style: {
      borderBottom: '1px solid var(--b23-border)',
      cursor: 'pointer'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'color-mix(in srgb,var(--b23-accent) 7%, transparent)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '13px 18px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: initials(c.name),
    size: 32
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 14px var(--b23-sans)',
      color: 'var(--b23-fg)'
    }
  }, c.name))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '13px 16px'
    }
  }, /*#__PURE__*/React.createElement(TypeBadge, {
    t: c.type
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '13px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, c.statuses.map(s => /*#__PURE__*/React.createElement(StatusBadge, {
    key: s,
    s: s
  })))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '13px 16px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px var(--b23-mono)',
      color: c.expiry ? 'var(--b23-fg-2)' : 'var(--b23-faint)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, c.expiry || '—')), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '13px 16px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px var(--b23-mono)',
      color: 'var(--b23-fg-2)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, c.contact)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '13px 12px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--b23-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    d: ICON.dots,
    size: 17,
    sw: 2.6
  }))))))), rows.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '54px 20px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--b23-faint)',
      marginBottom: 12,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    d: ICON.search,
    size: 26,
    sw: 1.8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 14px var(--b23-sans)',
      color: 'var(--b23-fg-2)'
    }
  }, "No clients match this filter"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px var(--b23-sans)',
      color: 'var(--b23-muted)',
      marginTop: 5
    }
  }, "Try a different chip or clear your search.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '13px 18px',
      background: 'var(--b23-surface-2)',
      borderTop: '1px solid var(--b23-border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px var(--b23-mono)',
      color: 'var(--b23-muted)'
    }
  }, "Showing ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--b23-fg-2)'
    }
  }, rows.length), " of 296 clients"))));
}

// ==================================================================
//  POS
// ==================================================================
function POS() {
  const [cat, setCat] = React.useState('all');
  const [cart, setCart] = React.useState({});
  const [pay, setPay] = React.useState('cash');
  const grid = PRODUCTS.filter(p => cat === 'all' || p.cat === cat);
  const add = p => {
    if (p.out) return;
    setCart(c => ({
      ...c,
      [p.id]: (c[p.id] || 0) + 1
    }));
  };
  const step = (id, d) => setCart(c => {
    const q = (c[id] || 0) + d;
    const n = {
      ...c
    };
    if (q <= 0) delete n[id];else n[id] = q;
    return n;
  });
  const lines = Object.entries(cart).map(([id, qty]) => ({
    p: PRODUCTS.find(x => x.id === id),
    qty
  }));
  const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const catTab = (k, l) => {
    const on = cat === k;
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => setCat(k),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '9px 16px',
        borderRadius: 999,
        cursor: 'pointer',
        font: '600 13px var(--b23-sans)',
        whiteSpace: 'nowrap',
        border: on ? '1px solid color-mix(in srgb,var(--b23-accent) 42%,transparent)' : '1px solid var(--b23-border)',
        background: on ? 'color-mix(in srgb,var(--b23-accent) 18%,transparent)' : 'var(--b23-surface)',
        color: on ? 'var(--b23-accent-hi)' : 'var(--b23-fg-2)'
      }
    }, l);
  };
  const payBtn = (k, l, d) => {
    const on = pay === k;
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => setPay(k),
      style: {
        flex: 1,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '10px 0',
        borderRadius: 11,
        cursor: 'pointer',
        font: '600 11px var(--b23-sans)',
        border: on ? '1px solid color-mix(in srgb,var(--b23-accent) 45%,transparent)' : '1px solid var(--b23-border)',
        background: on ? 'color-mix(in srgb,var(--b23-accent) 15%,transparent)' : 'var(--b23-surface)',
        color: on ? 'var(--b23-accent-hi)' : 'var(--b23-muted)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      d: d,
      size: 17,
      sw: 1.8
    }), l);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 20,
      flexWrap: 'wrap',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: '600 28px/1.1 var(--b23-display)',
      letterSpacing: '-.02em',
      color: 'var(--b23-fg)'
    }
  }, "Point of Sale"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      font: '400 13px var(--b23-sans)',
      color: 'var(--b23-muted)'
    }
  }, "Tap a product to ring it up \xB7 cash drawer open")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '9px 16px',
      borderRadius: 13,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      lineHeight: 1.3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 10px var(--b23-mono)',
      letterSpacing: '.08em',
      color: 'var(--b23-faint)',
      textTransform: 'uppercase'
    }
  }, "Today \xB7 POS"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 15px var(--b23-mono)',
      color: 'var(--b23-fg)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "\u20B16,450")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 28,
      background: 'var(--b23-border)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      lineHeight: 1.05
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 20px var(--b23-display)',
      color: 'var(--b23-accent-hi)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "23"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 9px var(--b23-mono)',
      letterSpacing: '.1em',
      color: 'var(--b23-faint)'
    }
  }, "SALES")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 17px',
      height: 52,
      borderRadius: 14,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border-2)',
      marginBottom: 16,
      boxShadow: 'var(--b23-inset-hi)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--b23-accent-hi)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    d: ICON.search,
    size: 19,
    sw: 2
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search products to add\u2026",
    style: {
      flex: 1,
      background: 'none',
      border: 'none',
      outline: 'none',
      color: 'var(--b23-fg)',
      font: '500 15px var(--b23-sans)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 10px var(--b23-mono)',
      padding: '3px 8px',
      borderRadius: 6,
      background: 'var(--b23-surface-2)',
      border: '1px solid var(--b23-border)',
      color: 'var(--b23-faint)'
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      flexWrap: 'wrap',
      marginBottom: 18
    }
  }, POS_CATS.map(c => catTab(c.k, c.l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))',
      gap: 14
    }
  }, grid.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      position: 'relative',
      borderRadius: 14,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border)',
      overflow: 'hidden'
    }
  }, p.out && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 11,
      right: 11,
      zIndex: 2,
      padding: '3px 8px',
      borderRadius: 999,
      font: '700 9px var(--b23-mono)',
      letterSpacing: '.07em',
      background: 'color-mix(in srgb,var(--b23-danger) 16%, transparent)',
      color: 'var(--b23-danger)'
    }
  }, "OUT"), /*#__PURE__*/React.createElement("button", {
    onClick: () => add(p),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      width: '100%',
      padding: 14,
      minHeight: 148,
      background: 'none',
      border: 'none',
      cursor: p.out ? 'not-allowed' : 'pointer',
      textAlign: 'left',
      color: 'inherit',
      opacity: p.out ? 0.55 : 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 11,
      background: `color-mix(in srgb, ${p.tile} 18%, var(--b23-surface-2))`,
      border: `1px solid color-mix(in srgb, ${p.tile} 32%, var(--b23-border))`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: '700 15px var(--b23-display)',
      color: p.tile
    }
  }, initials(p.name)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 14px var(--b23-sans)',
      color: 'var(--b23-fg)',
      lineHeight: 1.3
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      font: '400 11px var(--b23-mono)',
      color: p.low || p.reorder ? 'var(--b23-warning)' : 'var(--b23-faint)'
    }
  }, p.out ? 'Out of stock' : `${p.stock} in stock`)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 5,
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 18px var(--b23-mono)',
      color: 'var(--b23-fg)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, peso(p.price)))))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      flex: '0 0 340px',
      width: 340,
      position: 'sticky',
      top: 78,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 96px)',
      borderRadius: 18,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border)',
      boxShadow: 'var(--b23-shadow-panel)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 18px 14px',
      borderBottom: '1px solid var(--b23-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: '600 15px var(--b23-display)',
      color: 'var(--b23-fg)'
    }
  }, "Current Sale"), lines.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 11px var(--b23-mono)',
      padding: '2px 8px',
      borderRadius: 999,
      background: 'color-mix(in srgb,var(--b23-accent) 22%, var(--b23-surface-2))',
      color: 'var(--b23-accent-hi)'
    }
  }, lines.reduce((s, l) => s + l.qty, 0))), lines.length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setCart({}),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      font: '500 12px var(--b23-sans)',
      color: 'var(--b23-muted)'
    }
  }, "Clear")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '6px 10px',
      minHeight: 130
    }
  }, lines.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '46px 20px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--b23-border-2)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    d: "M9 20m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0|M18 20m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0|M2 3h2.2l2.3 12.4a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L21 7H5.5",
    size: 30,
    sw: 1.6
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 13px var(--b23-sans)',
      color: 'var(--b23-fg-2)',
      marginTop: 13
    }
  }, "No items yet"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px var(--b23-sans)',
      color: 'var(--b23-muted)',
      marginTop: 4
    }
  }, "Tap a product to start a sale.")) : lines.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.p.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 8px',
      borderBottom: '1px solid var(--b23-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 13.5px var(--b23-sans)',
      color: 'var(--b23-fg)'
    }
  }, l.p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px var(--b23-mono)',
      color: 'var(--b23-faint)'
    }
  }, peso(l.p.price), " each")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      background: 'var(--b23-surface-2)',
      border: '1px solid var(--b23-border)',
      borderRadius: 9,
      padding: 2
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => step(l.p.id, -1),
    style: {
      width: 26,
      height: 26,
      borderRadius: 7,
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      color: 'var(--b23-fg-2)',
      font: '600 17px var(--b23-sans)',
      lineHeight: 1
    }
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 22,
      textAlign: 'center',
      font: '600 13px var(--b23-mono)',
      color: 'var(--b23-fg)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, l.qty), /*#__PURE__*/React.createElement("button", {
    onClick: () => step(l.p.id, 1),
    style: {
      width: 26,
      height: 26,
      borderRadius: 7,
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      color: 'var(--b23-fg-2)',
      font: '600 17px var(--b23-sans)',
      lineHeight: 1
    }
  }, "+")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 70,
      textAlign: 'right',
      font: '600 13px var(--b23-mono)',
      color: 'var(--b23-fg)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, peso(l.p.price * l.qty))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 18px',
      borderTop: '1px solid var(--b23-border)',
      background: 'var(--b23-surface-2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px var(--b23-sans)',
      color: 'var(--b23-muted)'
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 27px var(--b23-display)',
      color: 'var(--b23-fg)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, peso(total))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      marginBottom: 13
    }
  }, payBtn('cash', 'Cash', 'M2 6h20v12H2zM12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0'), payBtn('gcash', 'GCash', 'M6 2h12v20H6zM11 18h2'), payBtn('card', 'Card', 'M2 5h20v14H2zM2 10h20'), payBtn('other', 'Other', 'M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M17 14h.01')), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    style: {
      width: '100%',
      borderRadius: 12
    },
    leadingIcon: /*#__PURE__*/React.createElement(Icon, {
      d: ICON.check,
      size: 18,
      sw: 2.4
    }),
    disabled: lines.length === 0
  }, "Complete Sale"))));
}

// ==================================================================
//  PLACEHOLDER (screens not fully built in the kit)
// ==================================================================
function Placeholder({
  nav
}) {
  const meta = NAV.find(n => n.k === nav);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 460,
      textAlign: 'center',
      padding: 40,
      borderRadius: 18,
      background: 'var(--b23-surface)',
      border: '1px solid var(--b23-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 54,
      height: 54,
      borderRadius: 14,
      margin: '0 auto 18px',
      background: 'color-mix(in srgb,var(--b23-accent) 16%, var(--b23-surface-2))',
      border: '1px solid color-mix(in srgb,var(--b23-accent) 30%, var(--b23-border))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--b23-accent-hi)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    d: ICON[nav],
    size: 24
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: '600 24px var(--b23-display)',
      color: 'var(--b23-fg)'
    }
  }, meta.l), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '10px 0 0',
      font: '400 14px var(--b23-sans)',
      color: 'var(--b23-muted)'
    }
  }, "This surface follows the same shell, cards, tables and status patterns shown in Dashboard, Clients and POS.")));
}

// ==================================================================
//  APP
// ==================================================================
function App() {
  const [nav, setNav] = React.useState('dashboard');
  let screen;
  if (nav === 'dashboard') screen = /*#__PURE__*/React.createElement(Dashboard, null);else if (nav === 'clients') screen = /*#__PURE__*/React.createElement(Clients, null);else if (nav === 'pos') screen = /*#__PURE__*/React.createElement(POS, null);else screen = /*#__PURE__*/React.createElement(Placeholder, {
    nav: nav
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--b23-bg)',
      color: 'var(--b23-fg)'
    }
  }, /*#__PURE__*/React.createElement(Topbar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      minHeight: 'calc(100vh - 58px)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    nav: nav,
    setNav: setNav
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0,
      padding: '26px 30px 60px',
      maxWidth: 1320
    }
  }, screen)));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/console/console.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.KpiCard = __ds_scope.KpiCard;

__ds_ns.Money = __ds_scope.Money;

__ds_ns.Wordmark = __ds_scope.Wordmark;

})();
