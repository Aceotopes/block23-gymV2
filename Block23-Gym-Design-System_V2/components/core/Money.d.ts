import * as React from 'react';

/**
 * Block 23 money cell — tabular mono, ₱ prefix, exactly 2 decimals,
 * right-aligned. `void` strikes the amount through (excluded from totals);
 * `negative` renders red with a leading minus.
 */
export interface MoneyProps {
  /** Number (formatted to en-PH, 2dp) or a pre-formatted string. */
  amount: number | string;
  /** Currency symbol. Default `"₱"`. */
  currency?: string;
  /** Presentation. Default `"default"`. */
  variant?: 'default' | 'void' | 'negative' | 'muted' | 'strong';
  /** Text alignment. Default `"right"`. */
  align?: 'left' | 'right' | 'center';
  /** Font size in px. Default `14`. */
  size?: number;
  style?: React.CSSProperties;
}

export function Money(props: MoneyProps): JSX.Element;
