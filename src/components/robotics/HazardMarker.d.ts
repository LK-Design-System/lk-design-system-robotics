import type * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';

/** Point-hazard categories the AGV must avoid. Broad keep-out *areas* belong to
 * `SpatialRegion`; passages the AGV *uses* belong to `FacilityTransition`. The
 * same physical ramp may be a traversable `FacilityTransition` for one fleet
 * and a `ramp` hazard for another — the product owns that classification. */
/** `obstacle` marks a *static/semi-static* registered collision point (pillar,
 * protruding equipment, low clearance, standing storage). Dynamic obstacles the
 * robot senses at runtime (people, forklifts, dropped boxes) are the product's
 * live perception layers, never this static annotation. */
export type HazardKind = 'stairs' | 'ramp' | 'dropoff' | 'obstacle';

/** Product-owned avoidance weight; the marker never infers it from kind or position. */
export type HazardSeverity = 'caution' | 'danger';

/** Serializable renderer-neutral hazard model; renderer handles are not stored here. */
export interface HazardData {
  readonly id: string;
  readonly label: string;
  readonly kind: HazardKind;
  readonly mapId: string;
  readonly position: NavigationPoint;
  readonly severity: HazardSeverity;
}

export interface HazardMarkerProps extends NavigationSvgFeatureProps {
  /** Serializable renderer-neutral hazard model. */
  hazard: HazardData;
  /** Select/inspect activation only; never plans avoidance or issues a command. Disabled markers do not call the callback. */
  onActivate?: (hazardId: string, event: NavigationActivateEvent) => void;
}

/** SVG fragment for one point hazard the AGV must avoid, drawn as the shared map-pin silhouette on a severity-colored badge. Must be mounted inside an application-owned svg. */
export function HazardMarker(props: HazardMarkerProps): React.JSX.Element;
