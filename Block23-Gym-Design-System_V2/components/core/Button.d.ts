import * as React from 'react';

/**
 * Block 23 primary/secondary/ghost/destructive button.
 * The violet gradient (`primary`) is reserved for the single primary action
 * per screen region; use `secondary`/`ghost` for everything else and
 * `destructive` (solid red) for irreversible actions.
 *
 * @startingPoint section="Core" subtitle="Action button — violet gradient primary" viewport="700x140"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual role. `primary` = the violet gradient. Default `"primary"`. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  /** Control height. Default `"default"` (40px). */
  size?: 'sm' | 'default' | 'lg';
  /** Fully-rounded pill (true) vs radius-lg corners. Default `true`. */
  pill?: boolean;
  /** Icon element rendered before the label (e.g. a 16px lucide <svg/>). */
  leadingIcon?: React.ReactNode;
  /** Icon element rendered after the label. */
  trailingIcon?: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
