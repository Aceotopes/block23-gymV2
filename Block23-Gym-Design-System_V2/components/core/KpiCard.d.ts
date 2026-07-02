import * as React from 'react';

export interface KpiDelta {
  /** Direction: `up` (emerald ▲) · `down` (red ▼) · `flat` (neutral –). */
  dir: 'up' | 'down' | 'flat';
  /** The change value, already formatted, e.g. `"+3"`, `"+8.0%"`. */
  value: string;
  /** Trailing context in faint text, e.g. `"from last month"`. */
  note?: string;
}

/**
 * Block 23 KPI card: mono uppercase label, big display value (tabular), and a
 * directional delta. Zero renders as `0`/`₱0`, never blank.
 *
 * @startingPoint section="Core" subtitle="KPI card — label, value, delta" viewport="700x180"
 */
export interface KpiCardProps {
  /** Uppercase mono label, e.g. `"ACTIVE MEMBERS"`. */
  label: React.ReactNode;
  /** The metric value (pre-formatted string or node). */
  value: React.ReactNode;
  /** Optional directional delta line. */
  delta?: KpiDelta | null;
  /** Optional status icon shown before the label. */
  icon?: React.ReactNode;
  /** Tints the border + label for alert cards, e.g. `var(--b23-warning)`. */
  accentBorder?: string | null;
  /** Override the value color (defaults to primary text). */
  valueColor?: string;
  style?: React.CSSProperties;
}

export function KpiCard(props: KpiCardProps): JSX.Element;
