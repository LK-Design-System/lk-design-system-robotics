import * as React from 'react';

/**
 * Annotation kinds participating in cross-entity label coordination, in
 * ascending paint-order weight: region < lane < route < trajectory <
 * waypoint < facility/hazard < robot pose. State always outranks kind: danger/error,
 * keyboard focus, and selection are strict descending priority tiers.
 */
export type NavigationAnnotationKind =
  | 'region-label'
  | 'lane-label'
  | 'route-segment-label'
  | 'route-progress-label'
  | 'trajectory-label'
  | 'waypoint-label'
  | 'facility-label'
  | 'hazard-label'
  | 'robot-pose-label';

export type NavigationAnnotationDetailMode = 'overview' | 'standard' | 'detail';

export interface NavigationAnnotationLayerProps
  extends Omit<React.SVGAttributes<SVGGElement>, 'transform'> {
  children?: React.ReactNode;
  /** Explicit label-density tier. State-critical labels remain visible in every tier. */
  detailMode?: NavigationAnnotationDetailMode;
  /** Maximum leaderless 2D nudge in CSS px after conventional placements are tried. */
  maxLabelDisplacementPx?: number;
  /** Minimum free CSS px kept on every side of label and obstacle rects. */
  labelGapPx?: number;
}

/**
 * SVG `<g>` fragment coordinating screen-space label collisions across the
 * navigation overlays composed under it. Labels try kind-specific placements
 * and then a bounded 2D nudge; when no free slot remains, only the
 * lowest-priority label is hidden — markers, state badges, accessible names,
 * and the semantic mirror are never affected. Overlays rendered without this
 * provider behave exactly as standalone fragments.
 */
export function NavigationAnnotationLayer(
  props: NavigationAnnotationLayerProps,
): React.JSX.Element;
