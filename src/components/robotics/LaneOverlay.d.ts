import * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';

export type LaneId = string;
export type LaneAvailability = 'available' | 'closed' | 'unknown';
export type LaneOrientationConstraint = 'unconstrained' | 'forward' | 'backward';

export interface LaneEndpointData {
  readonly waypointId: string;
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
  /** Show entry/exit endpoint chrome. Disable when a composed waypoint layer owns the same endpoint identities. @default true */
  showEndpoints?: boolean;
  onActivate?: (id: string, event: NavigationActivateEvent) => void;
}

/** SVG `<g>` fragment for one directed LK Robotics navigation lane. Returns `null` when fewer than two finite points remain. */
export function LaneOverlay(props: LaneOverlayProps): React.JSX.Element | null;
