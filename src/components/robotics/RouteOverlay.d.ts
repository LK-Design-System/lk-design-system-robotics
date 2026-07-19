import * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';

export type RouteStatus = 'planned' | 'active' | 'waiting' | 'blocked' | 'rerouting' | 'completed';
export type RouteSegmentPhase = 'completed' | 'current' | 'upcoming';
export type RouteSegmentCondition = 'normal' | 'waiting' | 'blocked' | 'conflict';

export interface RouteSegmentData {
  readonly id: string;
  readonly mapId: string;
  readonly label?: string;
  readonly points: readonly NavigationPoint[];
  /** Static graph lanes represented by this planned segment. */
  readonly laneIds?: readonly string[];
  /** Neutral FacilityTransition references at segment boundaries. */
  readonly entryTransitionId?: string;
  readonly exitTransitionId?: string;
  /** Progress phase, independent from the segment's current condition. */
  readonly phase: RouteSegmentPhase;
  /** Runtime condition, independent from completed/current/upcoming phase. */
  readonly condition?: RouteSegmentCondition;
}

export interface RouteProgressData {
  /** Segment that owns the current line-integrated progress head. */
  readonly segmentId: string;
  /** Explicit progress within that segment only, from 0 to 1. */
  readonly fraction: number;
  /** Optional exact head position for the same fraction boundary. A mismatch over 2 CSS px suppresses the head. */
  readonly position?: NavigationPoint;
}

export interface RouteData {
  readonly id: string;
  readonly label?: string;
  readonly status: RouteStatus;
  readonly segments: readonly RouteSegmentData[];
  /** Never inferred from phase, status, or segment counts. */
  readonly progress?: RouteProgressData;
}

export interface RouteSelection {
  readonly routeId: string;
  readonly segmentId: string;
}

export interface RouteOverlayProps extends NavigationSvgFeatureProps {
  route: RouteData;
  /** Only segments on this map are rendered; cross-floor connectors are never synthesized. */
  activeMapId: string;
  /** Optional segment-level selection when the whole route is not selected. */
  selectedSegmentId?: string;
  onActivate?: (target: RouteSelection, event: NavigationActivateEvent) => void;
}

/** SVG `<g>` fragment for one map-filtered planned graph route. Returns `null` when the active map has no renderable segment. */
export function RouteOverlay(props: RouteOverlayProps): React.JSX.Element | null;
