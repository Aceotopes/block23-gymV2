import * as React from 'react';

/**
 * Block 23 brand wordmark: a violet-gradient "23" tile + "Block 23" in
 * Space Grotesk with a mono sub-label. There is no logo file — this is the
 * mark. Replace only the tile if an official logo is later supplied.
 *
 * @startingPoint section="Brand" subtitle="Block 23 wordmark" viewport="700x120"
 */
export interface WordmarkProps {
  /** Mono sub-label under the name. Default `"GYM · OPERATIONS"`. */
  subLabel?: string;
  /** Show the sub-label. Default `true`. */
  showSub?: boolean;
  /** Tile size in px (name scales independently). Default `30`. */
  size?: number;
  style?: React.CSSProperties;
}

export function Wordmark(props: WordmarkProps): JSX.Element;
