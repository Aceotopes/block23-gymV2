import * as React from 'react';

/**
 * Block 23 form field. Label sits above the control; the helper line below
 * is replaced by the error message (violet focus ring; rose error ring).
 * Currency fields pass `prefix="₱"`; read-only fields render on a muted fill.
 */
export interface InputProps {
  label?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  /** Error message — replaces the hint and turns the border rose. */
  error?: React.ReactNode | null;
  /** Helper text below the field. */
  hint?: React.ReactNode | null;
  /** Appends a faint “· optional” to the label. */
  optional?: boolean;
  /** Marks the field required (rose asterisk). */
  required?: boolean;
  /** Leading prefix glyph, e.g. `"₱"` (switches value to mono). */
  prefix?: React.ReactNode | null;
  /** Read-only display (muted fill, mono, focusable for copy). */
  readOnly?: boolean;
  /** Render a <textarea>. */
  multiline?: boolean;
  rows?: number;
  type?: string;
  inputMode?: string;
  style?: React.CSSProperties;
}

export function Input(props: InputProps): JSX.Element;
