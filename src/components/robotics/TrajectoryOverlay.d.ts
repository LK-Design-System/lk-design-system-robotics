import * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';
import type { NavigationFrameRef, NavigationTimestamp } from './NavigationCoordinateSystem';
import type { NavigationGeometrySpace } from './NavigationGeometryAdapters';
import type { RouteStatus } from './RouteOverlay';

export interface TrajectorySample {
  readonly position: NavigationPoint;
  readonly timeMs?: number;
  /** Source heading in radians. TrajectoryOverlay does not render it as physical robot heading. */
  readonly headingRad?: number;
  readonly stamp?: NavigationTimestamp;
}

export interface TrajectoryData {
  readonly id: string;
  readonly label?: string;
  /** A trajectory belongs to one map. The owning renderer performs map filtering. */
  readonly mapId: string;
  /** Source frame/version/time retained after projection into SVG map space. */
  readonly source?: NavigationFrameRef;
  /** Proof that samples were projected from world coordinates into SVG map space. */
  readonly coordinateSpace?: NavigationGeometrySpace;
  readonly status: RouteStatus;
  readonly samples: readonly TrajectorySample[];
  /** Explicit playback sample. It becomes visible only when showTimeCursor is enabled. */
  readonly currentSampleIndex?: number;
}

export interface TrajectoryOverlayProps extends NavigationSvgFeatureProps {
  trajectory: TrajectoryData;
  /** Show the current sample as a playback/debug cursor and split elapsed/future styling. Operational maps should leave this off so RobotPose owns current position. @default false */
  showTimeCursor?: boolean;
  /** Controlled recording-playback time in milliseconds. When finite, the cursor is interpolated between timed samples and takes precedence over currentSampleIndex. */
  playbackTimeMs?: number;
  onActivate?: (id: string, event: NavigationActivateEvent) => void;
}

/** SVG `<g>` fragment for one dense, single-map LK Robotics trajectory. Returns `null` when fewer than two finite samples remain. */
export function TrajectoryOverlay(props: TrajectoryOverlayProps): React.JSX.Element | null;
