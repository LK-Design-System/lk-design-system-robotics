import {
  NavigationCoordinateError,
  assertNavigationFrameCompatible,
  createNavigationFrameRef,
} from './NavigationCoordinateSystem.js';

export const NAVIGATION_GEOMETRY_SPACE = 'svg-map';

function fail(code, message, details) {
  throw new NavigationCoordinateError(code, message, details);
}

function requireTransform(transform, label) {
  if (!transform?.metadata || typeof transform.worldToSvg !== 'function') {
    fail('MISSING_TRANSFORM', `${label} requires a NavigationMapTransform.`);
  }
  return transform;
}

function resolveTransform(mapId, options, label) {
  const direct = options?.transform;
  const mapped = options?.transformsByMap instanceof Map
    ? options.transformsByMap.get(mapId)
    : options?.transformsByMap?.[mapId];
  const transform = requireTransform(mapped ?? direct, label);
  if (mapId != null && mapId !== transform.metadata.mapId) {
    fail('MAP_MISMATCH', `${label} map ${mapId} does not match ${transform.metadata.mapId}.`, {
      actualMapId: mapId,
      expectedMapId: transform.metadata.mapId,
    });
  }
  return transform;
}

function projectedFrame(source, transform, label) {
  const frame = source
    ? createNavigationFrameRef(source)
    : createNavigationFrameRef(transform.metadata);
  assertNavigationFrameCompatible(frame, transform.metadata);
  return frame;
}

export function projectNavigationWorldPoints(points, transform) {
  requireTransform(transform, 'World-point projection');
  if (!Array.isArray(points) || points.length < 2) {
    fail('INVALID_POLYLINE', 'A projected navigation polyline requires at least two world points.', {
      length: points?.length,
    });
  }
  return Object.freeze(points.map((point) => transform.worldToSvg(point)));
}

export function adaptWorldRouteToRoute(route, options = {}) {
  if (!Array.isArray(route?.segments) || route.segments.length === 0) {
    fail('INVALID_ROUTE', 'A world route requires at least one segment.');
  }
  const segments = route.segments.map((segment) => {
    const transform = resolveTransform(segment?.mapId, options, `Route segment ${segment?.id ?? ''}`.trim());
    return Object.freeze({
      ...segment,
      mapId: transform.metadata.mapId,
      source: projectedFrame(segment?.source, transform, 'Route segment'),
      coordinateSpace: NAVIGATION_GEOMETRY_SPACE,
      points: projectNavigationWorldPoints(segment?.points, transform),
    });
  });
  if (
    route.progress
    && !segments.some((segment) => segment.id === route.progress.segmentId)
  ) {
    fail('INVALID_ROUTE_PROGRESS', 'Route progress must reference one projected segment.', {
      segmentId: route.progress.segmentId,
    });
  }
  return Object.freeze({
    ...route,
    segments: Object.freeze(segments),
  });
}

export function adaptWorldTrajectoryToTrajectory(trajectory, options = {}) {
  const transform = resolveTransform(trajectory?.mapId, options, 'Trajectory');
  if (!Array.isArray(trajectory?.samples) || trajectory.samples.length < 2) {
    fail('INVALID_TRAJECTORY', 'A world trajectory requires at least two samples.', {
      length: trajectory?.samples?.length,
    });
  }
  let previousTimeMs = -Infinity;
  const samples = trajectory.samples.map((sample, index) => {
    if (Number.isFinite(sample?.timeMs) && sample.timeMs < previousTimeMs) {
      fail('OUT_OF_ORDER_TIME', `Trajectory sample ${index} timestamp is out of order.`, {
        index,
        previousTimeMs,
        timeMs: sample.timeMs,
      });
    }
    if (Number.isFinite(sample?.timeMs)) previousTimeMs = sample.timeMs;
    return Object.freeze({
      ...sample,
      position: transform.worldToSvg(sample?.position),
      headingRad: Number.isFinite(sample?.headingRad)
        ? transform.worldHeadingToSvg(sample.headingRad)
        : undefined,
    });
  });
  return Object.freeze({
    ...trajectory,
    mapId: transform.metadata.mapId,
    source: projectedFrame(trajectory?.source, transform, 'Trajectory'),
    coordinateSpace: NAVIGATION_GEOMETRY_SPACE,
    samples: Object.freeze(samples),
  });
}

export function adaptWorldRobotPoseToPose(pose, options = {}) {
  const transform = resolveTransform(pose?.mapId, options, 'Robot pose');
  return Object.freeze({
    ...pose,
    mapId: transform.metadata.mapId,
    source: projectedFrame(pose?.source, transform, 'Robot pose'),
    coordinateSpace: NAVIGATION_GEOMETRY_SPACE,
    position: transform.worldToSvg(pose?.position),
    headingRad: Number.isFinite(pose?.headingRad)
      ? transform.worldHeadingToSvg(pose.headingRad)
      : undefined,
  });
}

export function adaptWorldLaneToLane(lane, options = {}) {
  const transform = resolveTransform(lane?.mapId, options, 'Lane');
  return Object.freeze({
    ...lane,
    mapId: transform.metadata.mapId,
    source: projectedFrame(lane?.source, transform, 'Lane'),
    coordinateSpace: NAVIGATION_GEOMETRY_SPACE,
    points: projectNavigationWorldPoints(lane?.points, transform),
  });
}
