import {
  NavigationCoordinateError,
  covariance2dEllipse,
  createNavigationFrameRef,
  createNavigationMapTransform,
  navigationStampToMilliseconds,
  normalizeNavigationStamp,
  quaternionToPlanarYaw,
} from './NavigationCoordinateSystem.js';
import { NAVIGATION_GEOMETRY_SPACE } from './NavigationGeometryAdapters.js';

function fail(code, message, details) {
  throw new NavigationCoordinateError(code, message, details);
}

function headerFrameId(message) {
  return message?.header?.frame_id ?? message?.header?.frameId;
}

function headerStamp(message) {
  return normalizeNavigationStamp(message?.header?.stamp);
}

function requireMatchingFrame(message, transform, label) {
  const frameId = headerFrameId(message);
  if (typeof frameId !== 'string' || frameId.trim() === '') {
    fail('MISSING_FRAME', `${label} requires header.frame_id.`);
  }
  if (frameId !== transform.metadata.frameId) {
    fail('FRAME_MISMATCH', `${label} frame ${frameId} does not match ${transform.metadata.frameId}.`, {
      actualFrameId: frameId,
      expectedFrameId: transform.metadata.frameId,
    });
  }
  return frameId;
}

function quaternionHasMagnitude(quaternion) {
  if (quaternion == null) return false;
  return Math.hypot(
    Number(quaternion.x) || 0,
    Number(quaternion.y) || 0,
    Number(quaternion.z) || 0,
    Number(quaternion.w) || 0,
  ) > 1e-9;
}

function poseFromStamped(value) {
  return value?.pose?.pose ?? value?.pose;
}

function relativeTimeMs(stamp, origin) {
  const value = navigationStampToMilliseconds(stamp);
  const base = navigationStampToMilliseconds(origin);
  return value == null || base == null ? undefined : value - base;
}

export function adaptRosOccupancyGrid(message, options = {}) {
  const info = message?.info;
  const width = Number(info?.width);
  const height = Number(info?.height);
  const resolution = Number(info?.resolution);
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    fail('INVALID_GRID_SIZE', 'OccupancyGrid width and height must be positive integers.', {
      width: info?.width,
      height: info?.height,
    });
  }
  if (!(Number.isFinite(resolution) && resolution > 0)) {
    fail('INVALID_GRID_RESOLUTION', 'OccupancyGrid resolution must be positive m/cell.', {
      resolution: info?.resolution,
    });
  }
  const data = message?.data;
  if (data == null || typeof data.length !== 'number' || data.length !== width * height) {
    fail('GRID_DATA_LENGTH', 'OccupancyGrid data length must equal width * height.', {
      expected: width * height,
      actual: data?.length,
    });
  }
  const frameId = headerFrameId(message);
  if (typeof frameId !== 'string' || frameId.trim() === '') {
    fail('MISSING_FRAME', 'OccupancyGrid requires header.frame_id.');
  }
  const originPose = info?.origin ?? {};
  const origin = originPose.position ?? {};
  const yawRad = quaternionToPlanarYaw(originPose.orientation);
  const metadata = {
    ...createNavigationFrameRef({
      mapId: options.mapId,
      frameId,
      mapVersion: options.mapVersion,
      stamp: headerStamp(message),
    }),
    widthCells: width,
    heightCells: height,
    resolutionMPerCell: resolution,
    origin: {
      xM: Number(origin.x ?? 0),
      yM: Number(origin.y ?? 0),
      yawRad,
    },
    loadedAt: normalizeNavigationStamp(info.map_load_time ?? info.mapLoadTime),
  };
  const transform = createNavigationMapTransform(metadata, {
    svgUnitsPerMeter: options.svgUnitsPerMeter,
    svgOrigin: options.svgOrigin,
  });
  const layerMap = Object.freeze({
    width,
    height,
    resolution: resolution * transform.svgUnitsPerMeter,
    data,
    origin: Object.freeze({
      x: transform.svgOrigin.x,
      y: transform.svgOrigin.y,
      headingRad: 0,
    }),
    source: createNavigationFrameRef(metadata),
    coordinateSpace: NAVIGATION_GEOMETRY_SPACE,
  });
  return Object.freeze({
    frame: createNavigationFrameRef(metadata),
    metadata: transform.metadata,
    transform,
    layerMap,
    rowOrder: 'bottom-to-top',
  });
}

export function adaptRosPathToTrajectory(message, options = {}) {
  const transform = options.transform;
  if (!transform?.metadata || typeof transform.worldToSvg !== 'function') {
    fail('MISSING_TRANSFORM', 'Path adaptation requires a NavigationMapTransform.');
  }
  const frameId = requireMatchingFrame(message, transform, 'Path');
  const poses = message?.poses;
  if (!Array.isArray(poses) || poses.length < 2) {
    fail('INVALID_PATH', 'Path requires at least two poses.', { length: poses?.length });
  }
  const pathStamp = headerStamp(message);
  const firstStamped = poses.find((sample) => sample?.header?.stamp)?.header?.stamp;
  const timeOrigin = normalizeNavigationStamp(firstStamped) ?? pathStamp;
  let previousTimeMs = -Infinity;
  const samples = poses.map((sample, index) => {
    const sampleFrameId = headerFrameId(sample);
    if (sampleFrameId && sampleFrameId !== frameId) {
      fail('FRAME_MISMATCH', `Path pose ${index} uses frame ${sampleFrameId}.`, {
        index,
        actualFrameId: sampleFrameId,
        expectedFrameId: frameId,
      });
    }
    const pose = poseFromStamped(sample);
    const worldPosition = pose?.position;
    const position = transform.worldToSvg({
      x: worldPosition?.x,
      y: worldPosition?.y,
    });
    const stamp = normalizeNavigationStamp(sample?.header?.stamp);
    const timeMs = relativeTimeMs(stamp, timeOrigin);
    if (timeMs != null && timeMs < previousTimeMs) {
      fail('OUT_OF_ORDER_TIME', `Path pose ${index} timestamp is out of order.`, {
        index,
        previousTimeMs,
        timeMs,
      });
    }
    if (timeMs != null) previousTimeMs = timeMs;
    const sourceYaw = quaternionHasMagnitude(pose?.orientation)
      ? quaternionToPlanarYaw(pose.orientation)
      : undefined;
    return Object.freeze({
      position,
      timeMs,
      headingRad: sourceYaw == null ? undefined : transform.worldHeadingToSvg(sourceYaw),
      stamp,
    });
  });
  const frame = createNavigationFrameRef({
    mapId: transform.metadata.mapId,
    frameId,
    mapVersion: transform.metadata.mapVersion,
    stamp: pathStamp,
  });
  return Object.freeze({
    id: options.id,
    label: options.label,
    mapId: transform.metadata.mapId,
    source: frame,
    coordinateSpace: NAVIGATION_GEOMETRY_SPACE,
    status: options.status ?? 'planned',
    samples: Object.freeze(samples),
    currentSampleIndex: options.currentSampleIndex,
  });
}

export function adaptRosPoseWithCovarianceStamped(message, options = {}) {
  const transform = options.transform;
  if (!transform?.metadata || typeof transform.worldToSvg !== 'function') {
    fail('MISSING_TRANSFORM', 'Pose adaptation requires a NavigationMapTransform.');
  }
  const frameId = requireMatchingFrame(message, transform, 'PoseWithCovarianceStamped');
  const stampedPose = message?.pose;
  const pose = stampedPose?.pose ?? stampedPose;
  const position = transform.worldToSvg({
    x: pose?.position?.x,
    y: pose?.position?.y,
  });
  const sourceYaw = quaternionToPlanarYaw(pose?.orientation);
  const covariance = stampedPose?.covariance;
  const ellipse = covariance == null
    ? undefined
    : covariance2dEllipse(covariance, {
        standardDeviations: options.standardDeviations,
      });
  const frame = createNavigationFrameRef({
    mapId: transform.metadata.mapId,
    frameId,
    mapVersion: transform.metadata.mapVersion,
    stamp: headerStamp(message),
  });
  return Object.freeze({
    id: options.id,
    label: options.label,
    mapId: transform.metadata.mapId,
    source: frame,
    coordinateSpace: NAVIGATION_GEOMETRY_SPACE,
    position,
    headingRad: transform.worldHeadingToSvg(sourceYaw),
    state: options.state ?? 'unknown',
    color: options.color,
    localization: ellipse ? Object.freeze({
      covariance: Object.freeze(Array.from(covariance, Number)),
      ellipse: Object.freeze({
        majorRadius: ellipse.majorRadiusM * transform.svgUnitsPerMeter,
        minorRadius: ellipse.minorRadiusM * transform.svgUnitsPerMeter,
        headingRad: transform.worldHeadingToSvg(ellipse.yawRad),
        standardDeviations: ellipse.standardDeviations,
        yawVariance: ellipse.yawVariance,
      }),
    }) : undefined,
  });
}
