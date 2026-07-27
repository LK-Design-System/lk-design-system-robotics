import * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';
import type { NavigationFrameRef } from './NavigationCoordinateSystem';
import type { NavigationGeometrySpace } from './NavigationGeometryAdapters';

export type LaneId = string;
export type LaneAvailability = 'available' | 'closed' | 'unknown';
export type LaneOrientationConstraint = 'unconstrained' | 'forward' | 'backward';

export interface LaneEndpointData {
  readonly waypointId: string;
  /** Approach constraint retained for planning/detail surfaces; no endpoint arrow is painted on the map. */
  readonly orientation?: LaneOrientationConstraint;
  /** Neutral references to FacilityTransition records; no kind or live state is inferred here. */
  readonly transitionIds?: readonly string[];
}

export type LaneRelation =
  | { readonly kind: 'single' }
  | { readonly kind: 'paired'; readonly pairedLaneId: string };

/** Serializable graph topology. Runtime availability and conflict are render props. */
export interface LaneData {
  readonly id: string;
  readonly label?: string;
  readonly mapId: string;
  /** Source frame/version/time retained after projection into SVG map space. */
  readonly source?: NavigationFrameRef;
  /** Proof that points were projected from world coordinates into SVG map space. */
  readonly coordinateSpace?: NavigationGeometrySpace;
  /** Directed geometry from entry to exit in map coordinates. */
  readonly points: readonly NavigationPoint[];
  readonly entry: LaneEndpointData;
  readonly exit: LaneEndpointData;
  readonly relation?: LaneRelation;
  readonly speedLimitMps?: number;
  readonly mutexGroupId?: string;
}

export interface LaneOverlayProps extends NavigationSvgFeatureProps {
  lane: LaneData;
  /** Runtime traversal state, independent from static graph topology. @default "available" */
  availability?: LaneAvailability;
  /** Runtime schedule/resource conflict, independent from availability. @default false */
  conflict?: boolean;
  /**
   * Legacy endpoint fallback for isolated diagnostics. Product maps should
   * render the referenced identities with WaypointMarker instead. @default false
   */
  showEndpoints?: boolean;
  onActivate?: (id: string, event: NavigationActivateEvent) => void;
}

/** SVG `<g>` fragment for one directed LK Robotics navigation lane. Returns `null` when fewer than two finite points remain. */
export function LaneOverlay(props: LaneOverlayProps): React.JSX.Element | null;
