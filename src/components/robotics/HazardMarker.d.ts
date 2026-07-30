import type * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';
import type { NavigationFrameRef } from './NavigationCoordinateSystem';

/** Point-hazard categories the AGV must avoid. Broad keep-out *areas* belong to
 * `SpatialRegion`; passages the AGV *uses* belong to `FacilityTransition`. The
 * same physical ramp may be a traversable `FacilityTransition` for one fleet
 * and a `ramp` hazard for another — the product owns that classification. */
/** `obstacle` marks a *static/semi-static* registered collision point (pillar,
 * protruding equipment, low clearance, standing storage). Dynamic obstacles the
 * robot senses at runtime (people, forklifts, dropped boxes) are the product's
 * live perception layers, never this static annotation. */
/**
 * `obstacle`은 길을 막은 물체, `conflict`는 두 이동체가 같은 좌표를 두고
 * 경합하는 상태입니다 — 원인도 해소 방법도 다르므로(치우기 vs 통행 순서 조정)
 * 실루엣을 공유하지 않습니다.
 */
export type HazardKind = 'stairs' | 'ramp' | 'dropoff' | 'obstacle' | 'conflict';

/** Product-owned avoidance weight; the marker never infers it from kind or position. */
export type HazardSeverity = 'caution' | 'danger';

/** Serializable renderer-neutral hazard model; renderer handles are not stored here. */
export interface HazardData {
  readonly id: string;
  readonly label: string;
  readonly kind: HazardKind;
  readonly mapId: string;
  /** Source frame/version/time retained after projection into SVG map space. */
  readonly source?: NavigationFrameRef;
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
