import * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';
import type { RouteStatus } from './RouteOverlay';

export interface TrajectorySample {
  readonly position: NavigationPoint;
  readonly timeMs?: number;
  /** Source heading in radians. The path progress head follows path tangent; pose renderers may consume this separately. */
  readonly headingRad?: number;
}

export interface TrajectoryData {
  readonly id: string;
  readonly label?: string;
  /** A trajectory belongs to one map. The owning renderer performs map filtering. */
  readonly mapId: string;
  readonly status: RouteStatus;
  readonly samples: readonly TrajectorySample[];
  /** Explicit sample where the elapsed line ends and the path-tangent progress head is attached. */
  readonly currentSampleIndex?: number;
}

export interface TrajectoryOverlayProps extends NavigationSvgFeatureProps {
  trajectory: TrajectoryData;
  onActivate?: (id: string, event: NavigationActivateEvent) => void;
}

/** SVG `<g>` fragment for one dense, single-map LK Robotics trajectory. Returns `null` when fewer than two finite samples remain. */
export function TrajectoryOverlay(props: TrajectoryOverlayProps): React.JSX.Element | null;
