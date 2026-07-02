import * as React from 'react';

/**
 * Block 23 surface card (elevation level 1). Optional header row with a
 * mono eyebrow, a display title, and a right-aligned action. `hero` swaps
 * in the violet wash + bloom used for the single hero element per screen.
 */
export interface CardProps {
  /** Hero treatment: violet wash + glow + 20px radius. Default `false`. */
  hero?: boolean;
  /** Small uppercase mono eyebrow label. */
  eyebrow?: React.ReactNode;
  /** Display-font title. */
  title?: React.ReactNode;
  /** Right-aligned header affordance (button, link, badge). */
  action?: React.ReactNode;
  /** Interior padding (any CSS length). Default `var(--b23-card-pad)`. */
  pad?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card(props: CardProps): JSX.Element;
