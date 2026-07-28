import type { FacilityTransitionData } from './FacilityTransition';
import type { LaneData } from './LaneOverlay';
import type { RouteData } from './RouteOverlay';
import type { WaypointData } from './WaypointMarker';

/** Serializable graph data that must be validated before map rendering. */
export interface NavigationMapGraph {
  readonly waypoints: readonly WaypointData[];
  readonly lanes: readonly LaneData[];
  readonly routes?: readonly RouteData[];
  readonly facilityTransitions?: readonly FacilityTransitionData[];
}

export interface NavigationMapGraphValidationOptions {
  /** Maximum allowed map-coordinate delta between an endpoint record and its waypoint. @default 0.001 */
  readonly endpointTolerance?: number;
}

export interface NavigationGraphIssue {
  readonly code: string;
  readonly [key: string]: unknown;
}

export interface NavigationMapGraphValidationResult {
  readonly valid: boolean;
  readonly issues: readonly NavigationGraphIssue[];
  readonly endpointTolerance: number;
}

export class NavigationGraphError extends Error {
  readonly code: 'NAVIGATION_GRAPH_INVALID';
  readonly issues: readonly NavigationGraphIssue[];
}

/** Inspect graph data without throwing. */
export function validateNavigationMapGraph(
  graph: NavigationMapGraph,
  options?: NavigationMapGraphValidationOptions,
): NavigationMapGraphValidationResult;

/** Throw NavigationGraphError when graph identities, map IDs, coordinates, or route continuity are invalid. */
export function assertNavigationMapGraph(
  graph: NavigationMapGraph,
  options?: NavigationMapGraphValidationOptions,
): true;
