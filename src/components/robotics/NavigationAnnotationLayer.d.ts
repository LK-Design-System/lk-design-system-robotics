import * as React from 'react';

/**
 * Annotation kinds participating in cross-entity label coordination, in
 * ascending paint-order weight: region < lane < route < trajectory <
 * waypoint < facility. State always outranks kind: a selected entity's label
 * wins over every unselected label regardless of kind.
 */
export type NavigationAnnotationKind =
  | 'region-label'
  | 'lane-label'
  | 'route-segment-label'
  | 'route-progress-label'
  | 'trajectory-label'
  | 'waypoint-label'
  | 'facility-label';

export interface NavigationAnnotationLayerProps
  extends Omit<React.SVGAttributes<SVGGElement>, 'transform'> {
  children?: React.ReactNode;
  /** Maximum vertical label displacement in CSS px before suppression. */
  maxLabelDisplacementPx?: number;
  /** Minimum free CSS px kept between coordinated label and obstacle rects. */
  labelGapPx?: number;
}

/**
 * SVG `<g>` fragment coordinating screen-space label collisions across the
 * navigation overlays composed under it. Labels nudge vertically first; when
 * no free slot remains within `maxLabelDisplacementPx`, only the
 * lowest-priority label is hidden — markers, state badges, accessible names,
 * and the semantic mirror are never affected. Overlays rendered without this
 * provider behave exactly as standalone fragments.
 */
export function NavigationAnnotationLayer(
  props: NavigationAnnotationLayerProps,
): React.JSX.Element;
