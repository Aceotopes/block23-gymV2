import * as React from 'react';

/**
 * Block 23 status badge — a pill carrying color + label + shape/icon.
 * Status is NEVER conveyed by color alone: always render the label text and
 * a dot/hollow-dot/icon. `outline` is the VOID / Cancelled treatment.
 *
 * @startingPoint section="Core" subtitle="Status pill — color + label + shape" viewport="700x120"
 */
export interface BadgeProps {
  /** Semantic hue. Default `"neutral"`. */
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'atRisk' | 'neutral';
  /** Leading shape. `dot` = filled, `hollow` = ring, `none` = no glyph. Default `"dot"`. */
  shape?: 'dot' | 'hollow' | 'none';
  /** Custom leading icon (a small lucide <svg/>); overrides `shape`. */
  icon?: React.ReactNode;
  /** Outline/strikethrough treatment for VOID & Cancelled. Default `false`. */
  outline?: boolean;
  /** The label text (mandatory — status is never color alone). */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge(props: BadgeProps): JSX.Element;
