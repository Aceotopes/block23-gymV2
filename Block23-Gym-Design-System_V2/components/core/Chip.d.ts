import * as React from 'react';

/**
 * Block 23 filter chip (single-select, deep-linked in the real app).
 * Selected chips fill with violet-subtle + violet text; a status `dot`
 * makes the chip visually agree with the rows it filters.
 */
export interface ChipProps {
  /** Selected (active) state. Default `false`. */
  selected?: boolean;
  /** Leading status-dot color (CSS color string), e.g. a status token. */
  dot?: string | null;
  /** Optional trailing count (mono, tabular). */
  count?: number | string | null;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Chip(props: ChipProps): JSX.Element;
