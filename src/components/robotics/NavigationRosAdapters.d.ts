import type {
  NavigationFrameRef,
  NavigationMapMetadata,
  NavigationMapTransform,
  NavigationPoint2D,
  NavigationTimestamp,
} from './NavigationCoordinateSystem';
import type { OccupancyMapData, OccupancyRowOrder } from './OccupancyMapLayer';
import type { RobotPoseData, RobotPoseState } from './RobotPoseMarker';
import type { RouteStatus } from './RouteOverlay';
import type { TrajectoryData } from './TrajectoryOverlay';

export interface RosTimeLike {
  readonly sec: number;
  readonly nanosec: number;
}

export interface RosHeaderLike {
  readonly frame_id?: string;
  readonly frameId?: string;
  readonly stamp?: RosTimeLike;
}

export interface RosPointLike {
  readonly x: number;
  readonly y: number;
  readonly z?: number;
}

export interface RosQuaternionLike {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface RosPoseLike {
  readonly position: RosPointLike;
  readonly orientation: RosQuaternionLike;
}

export interface RosOccupancyGridLike {
  readonly header: RosHeaderLike;
  readonly info: {
    readonly map_load_time?: RosTimeLike;
    readonly mapLoadTime?: RosTimeLike;
    readonly resolution: number;
    readonly width: number;
    readonly height: number;
    readonly origin: RosPoseLike;
  };
  readonly data: ArrayLike<number>;
}

export interface RosPoseStampedLike {
  readonly header?: RosHeaderLike;
  readonly pose: RosPoseLike;
}

export interface RosPathLike {
  readonly header: RosHeaderLike;
  readonly poses: readonly RosPoseStampedLike[];
}

export interface RosPoseWithCovarianceStampedLike {
  readonly header: RosHeaderLike;
  readonly pose: {
    readonly pose: RosPoseLike;
    readonly covariance: ArrayLike<number>;
  };
}

export interface AdaptedRosOccupancyGrid {
  readonly frame: NavigationFrameRef;
  readonly metadata: NavigationMapMetadata;
  readonly transform: NavigationMapTransform;
  readonly layerMap: OccupancyMapData;
  readonly rowOrder: Extract<OccupancyRowOrder, 'bottom-to-top'>;
}

export function adaptRosOccupancyGrid(
  message: RosOccupancyGridLike,
  options: {
    readonly mapId: string;
    readonly mapVersion: string;
    readonly svgUnitsPerMeter?: number;
    readonly svgOrigin?: NavigationPoint2D;
  },
): AdaptedRosOccupancyGrid;

export function adaptRosPathToTrajectory(
  message: RosPathLike,
  options: {
    readonly transform: NavigationMapTransform;
    readonly id: string;
    readonly label?: string;
    readonly status?: RouteStatus;
    readonly currentSampleIndex?: number;
  },
): TrajectoryData;

export function adaptRosPoseWithCovarianceStamped(
  message: RosPoseWithCovarianceStampedLike,
  options: {
    readonly transform: NavigationMapTransform;
    readonly id: string;
    readonly label: string;
    readonly state?: RobotPoseState;
    readonly color?: string;
    readonly standardDeviations?: number;
  },
): RobotPoseData;

export type { NavigationTimestamp };
