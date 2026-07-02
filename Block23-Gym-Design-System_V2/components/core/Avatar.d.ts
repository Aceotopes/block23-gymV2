import * as React from 'react';

/**
 * Block 23 avatar — initials on a neutral circle (no client photos at MVP).
 * `accent` applies the violet-tinted treatment used for the signed-in owner.
 */
export interface AvatarProps {
  /** Initials, e.g. `"MR"`. */
  initials: string;
  /** Diameter in px. Default `32`. */
  size?: number;
  /** Violet-tinted (signed-in user) treatment. Default `false`. */
  accent?: boolean;
  /** Dim for archived/inactive rows. Default `false`. */
  dim?: boolean;
  style?: React.CSSProperties;
}

export function Avatar(props: AvatarProps): JSX.Element;
