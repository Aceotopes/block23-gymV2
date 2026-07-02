import React from 'react';

/**
 * Block 23 — form field. Label above (never placeholder-as-label);
 * helper below is replaced by the error message on error. Focus =
 * violet border + violet-20% ring. `prefix` for currency (₱).
 */
export function Input({
  label,
  value,
  onChange,
  placeholder,
  error = null,
  hint = null,
  optional = false,
  required = false,
  prefix = null,      // e.g. '₱'
  readOnly = false,
  multiline = false,
  rows = 3,
  type = 'text',
  inputMode,
  style = {},
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--b23-danger-rose)' : focus ? 'var(--b23-accent)' : 'var(--b23-border-2)';
  const ring = error
    ? '0 0 0 3px rgba(251,113,133,.16)'
    : focus ? '0 0 0 3px var(--b23-focus-ring)' : 'none';

  const fieldFont = { font: '400 14px var(--b23-sans)', color: 'var(--b23-fg)' };
  const shell = {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', boxSizing: 'border-box',
    padding: multiline ? '12px 14px' : '0 14px',
    minHeight: multiline ? 72 : 44,
    borderRadius: 'var(--b23-radius-lg)',
    background: readOnly ? 'var(--b23-surface-2)' : 'var(--b23-bg)',
    border: `1px solid ${readOnly ? 'var(--b23-border)' : borderColor}`,
    boxShadow: ring,
    transition: 'border-color var(--b23-dur-fast), box-shadow var(--b23-dur-fast)',
  };
  const controlStyle = {
    flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none',
    fontVariantNumeric: 'tabular-nums', resize: multiline ? 'vertical' : 'none',
    ...fieldFont,
    color: readOnly ? 'var(--b23-muted)' : 'var(--b23-fg)',
    fontFamily: readOnly || prefix ? 'var(--b23-mono)' : 'var(--b23-sans)',
    padding: multiline ? 0 : '12px 0',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{ font: '600 12.5px var(--b23-sans)', color: 'var(--b23-fg-2)' }}>
          {label}
          {required && <span style={{ color: 'var(--b23-danger-rose)' }}> *</span>}
          {optional && <span style={{ font: '400 12px var(--b23-sans)', color: 'var(--b23-faint)' }}> · optional</span>}
        </label>
      )}
      <div style={shell}>
        {prefix && <span style={{ font: '500 15px var(--b23-mono)', color: 'var(--b23-muted)' }}>{prefix}</span>}
        {multiline ? (
          <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} readOnly={readOnly}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={{ ...controlStyle, lineHeight: 1.5 }} />
        ) : (
          <input value={value} onChange={onChange} placeholder={placeholder} type={type} inputMode={inputMode} readOnly={readOnly}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={controlStyle} />
        )}
      </div>
      {error ? (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 12px var(--b23-sans)', color: 'var(--b23-danger-rose)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
          {error}
        </div>
      ) : hint ? (
        <div style={{ font: '400 12px var(--b23-sans)', color: 'var(--b23-faint)' }}>{hint}</div>
      ) : null}
    </div>
  );
}
