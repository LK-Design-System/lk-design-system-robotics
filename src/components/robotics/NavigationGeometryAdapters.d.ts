import type { NavigationMapTransform, NavigationPoint2D } from './NavigationCoordinateSystem';
import type { LaneData } from './LaneOverlay';
import type { RobotPoseData } from './RobotPoseMarker';
import type { RouteData } from './RouteOverlay';
import type { TrajectoryData } from './TrajectoryOverlay';

export const NAVIGATION_GEOMETRY_SPACE: 'svg-map';
export type NavigationGeometrySpace = typeof NAVIGATION_GEOMETRY_SPACE;

export interface WorldRouteSegmentData
  extends Omit<RouteData['segments'][number], 'points' | 'source' | 'coordinateSpace'> {
  readonly points: readonly NavigationPoint2D[];
}

export interface WorldRouteData extends Omit<RouteData, 'segments'> {
  readonly segments: readonly WorldRouteSegmentData[];
}

export interface WorldTrajectoryData
  extends Omit<TrajectoryData, 'samples' | 'source' | 'coordinateSpace'> {
  readonly samples: readonly (Omit<TrajectoryData['samples'][number], 'position'> & {
    readonly position: NavigationPoint2D;
  })[];
}

export interface WorldLaneData extends Omit<LaneData, 'points' | 'source' | 'coordinateSpace'> {
  readonly points: readonly NavigationPoint2D[];
}

export interface WorldRobotPoseData
  extends Omit<RobotPoseData, 'position' | 'source' | 'coordinateSpace' | 'localization'> {
  readonly position: NavigationPoint2D;
}

export interface NavigationSingleMapProjectionOptions {
  readonly transform: NavigationMapTransform;
}

export interface NavigationMultiMapProjectionOptions {
  readonly transformsByMap:
    | Readonly<Record<string, NavigationMapTransform>>
    | ReadonlyMap<string, NavigationMapTransform>;
}

export function projectNavigationWorldPoints(
  points: readonly NavigationPoint2D[],
  transform: NavigationMapTransform,
): readonly NavigationPoint2D[];

export function adaptWorldRouteToRoute(
  route: WorldRouteData,
  options: NavigationSingleMapProjectionOptions | NavigationMultiMapProjectionOptions,
): RouteData;

export function adaptWorldTrajectoryToTrajectory(
  trajectory: WorldTrajectoryData,
  options: NavigationSingleMapProjectionOptions,
): TrajectoryData;

export function adaptWorldRobotPoseToPose(
  pose: WorldRobotPoseData,
  options: NavigationSingleMapProjectionOptions,
): RobotPoseData;

export function adaptWorldLaneToLane(
  lane: WorldLaneData,
  options: NavigationSingleMapProjectionOptions,
): LaneData;
