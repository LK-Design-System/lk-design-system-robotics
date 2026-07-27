import assert from 'node:assert/strict';
import {
  NavigationCoordinateError,
  assertNavigationFrameCompatible,
  classifyNavigationFreshness,
  covariance2dEllipse,
  createNavigationMapTransform,
} from '../src/components/robotics/NavigationCoordinateSystem.js';
import {
  adaptRosOccupancyGrid,
  adaptRosPathToTrajectory,
  adaptRosPoseWithCovarianceStamped,
} from '../src/components/robotics/NavigationRosAdapters.js';
import {
  adaptWorldLaneToLane,
  adaptWorldRobotPoseToPose,
  adaptWorldRouteToRoute,
  adaptWorldTrajectoryToTrajectory,
} from '../src/components/robotics/NavigationGeometryAdapters.js';

const close = (actual, expected, message, epsilon = 1e-8) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${message}: ${actual} != ${expected}`);
};

const pointClose = (actual, expected, message) => {
  close(actual.x, expected.x, `${message}.x`);
  close(actual.y, expected.y, `${message}.y`);
};

const baseMetadata = {
  mapId: 'warehouse-L1',
  frameId: 'warehouse_L1/map',
  mapVersion: 'sha256:fixture-v1',
  stamp: { sec: 20, nanosec: 0 },
  loadedAt: { sec: 10, nanosec: 0 },
  widthCells: 4,
  heightCells: 2,
  resolutionMPerCell: 0.5,
  origin: { xM: 10, yM: -2, yawRad: Math.PI / 2 },
};

const transform = createNavigationMapTransform(baseMetadata, {
  svgUnitsPerMeter: 20,
  svgOrigin: { x: 5, y: 7 },
});

pointClose(transform.worldToSvg({ x: 10, y: -2 }), { x: 5, y: 27 }, 'origin maps to SVG bottom-left');
pointClose(
  transform.svgToWorld(transform.worldToSvg({ x: 9.25, y: -0.4 })),
  { x: 9.25, y: -0.4 },
  'world/SVG round trip',
);
pointClose(
  transform.gridCellToWorld({ column: 0, row: 0 }),
  { x: 9.75, y: -1.75 },
  'rotated grid-cell center',
);
const cellRoundTrip = transform.worldToGridCell(transform.gridCellToWorld({ column: 3, row: 1 }));
assert.equal(cellRoundTrip.column, 3);
assert.equal(cellRoundTrip.row, 1);
assert.equal(cellRoundTrip.inside, true);
close(cellRoundTrip.columnFloat, 3.5, 'grid column round trip');
close(cellRoundTrip.rowFloat, 1.5, 'grid row round trip');
assert.equal(transform.worldToGridCell({ x: 20, y: 20 }).inside, false);

const projectedRoute = adaptWorldRouteToRoute({
  id: 'route-world-1',
  status: 'active',
  segments: [{
    id: 'segment-world-1',
    mapId: 'warehouse-L1',
    points: [{ x: 10, y: -2 }, { x: 9.5, y: -1.5 }],
    phase: 'current',
    condition: 'normal',
  }],
  progress: { segmentId: 'segment-world-1', fraction: 0.5 },
}, { transform });
assert.equal(projectedRoute.segments[0].coordinateSpace, 'svg-map');
assert.equal(projectedRoute.segments[0].source.frameId, 'warehouse_L1/map');
pointClose(projectedRoute.segments[0].points[0], { x: 5, y: 27 }, 'route world projection');

const projectedTrajectory = adaptWorldTrajectoryToTrajectory({
  id: 'trajectory-world-1',
  mapId: 'warehouse-L1',
  status: 'planned',
  samples: [
    { position: { x: 10, y: -2 }, timeMs: 0, headingRad: Math.PI / 2 },
    { position: { x: 9.5, y: -1.5 }, timeMs: 500, headingRad: Math.PI / 2 },
  ],
}, { transform });
assert.equal(projectedTrajectory.coordinateSpace, 'svg-map');
pointClose(projectedTrajectory.samples[1].position, transform.worldToSvg({ x: 9.5, y: -1.5 }), 'trajectory world projection');
close(
  projectedTrajectory.samples[0].headingRad,
  transform.worldHeadingToSvg(Math.PI / 2),
  'trajectory heading projection',
);

const projectedRobotPose = adaptWorldRobotPoseToPose({
  id: 'robot-world-1',
  label: 'Robot 1',
  mapId: 'warehouse-L1',
  position: { x: 9.5, y: -1.5 },
  headingRad: Math.PI / 2,
  state: 'moving',
}, { transform });
assert.equal(projectedRobotPose.coordinateSpace, 'svg-map');
assert.equal(projectedRobotPose.source.frameId, 'warehouse_L1/map');
pointClose(projectedRobotPose.position, transform.worldToSvg({ x: 9.5, y: -1.5 }), 'robot pose world projection');
close(
  projectedRobotPose.headingRad,
  transform.worldHeadingToSvg(Math.PI / 2),
  'robot pose heading projection',
);

const projectedLane = adaptWorldLaneToLane({
  id: 'lane-world-1',
  mapId: 'warehouse-L1',
  points: [{ x: 10, y: -2 }, { x: 9.5, y: -1.5 }],
  entry: { waypointId: 'a' },
  exit: { waypointId: 'b' },
}, { transform });
assert.equal(projectedLane.coordinateSpace, 'svg-map');
pointClose(projectedLane.points[0], { x: 5, y: 27 }, 'lane world projection');
assert.throws(
  () => adaptWorldRouteToRoute({
    id: 'wrong-map',
    status: 'planned',
    segments: [{
      id: 'wrong-map-segment',
      mapId: 'warehouse-L2',
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      phase: 'upcoming',
    }],
  }, { transform }),
  (error) => error instanceof NavigationCoordinateError && error.code === 'MAP_MISMATCH',
);

const axisTransform = createNavigationMapTransform({
  ...baseMetadata,
  origin: { xM: 0, yM: 0, yawRad: 0 },
});
close(axisTransform.worldHeadingToSvg(Math.PI / 2), -Math.PI / 2, 'ROS north points up in SVG');
close(axisTransform.svgHeadingToWorld(-Math.PI / 2), Math.PI / 2, 'SVG heading round trip');

const viewport = transform.withViewport({
  viewport: { x: 30, y: -12, z: 2 },
  svgCssScale: 0.5,
  screenOrigin: { x: 100, y: 50 },
});
pointClose(
  viewport.screenToWorld(viewport.worldToScreen({ x: 9.25, y: -0.4 })),
  { x: 9.25, y: -0.4 },
  'world/screen round trip',
);

assert.equal(
  assertNavigationFrameCompatible(
    baseMetadata,
    { ...baseMetadata, stamp: { sec: 20, nanosec: 500_000_000 } },
    { maxAgeMs: 500 },
  ),
  true,
);
assert.throws(
  () => assertNavigationFrameCompatible(baseMetadata, { ...baseMetadata, mapVersion: 'v2' }),
  (error) => error instanceof NavigationCoordinateError && error.code === 'FRAME_MISMATCH',
);
assert.deepEqual(
  classifyNavigationFreshness(
    { sec: 10, nanosec: 0 },
    { sec: 12, nanosec: 0 },
    { staleAfterMs: 1_000, expiredAfterMs: 5_000 },
  ),
  { state: 'stale', ageMs: 2_000 },
);

const covariance = new Array(36).fill(0);
covariance[0] = 4;
covariance[7] = 1;
covariance[35] = 0.09;
assert.deepEqual(covariance2dEllipse(covariance), {
  majorRadiusM: 4,
  minorRadiusM: 2,
  yawRad: 0,
  standardDeviations: 2,
  yawVariance: 0.09,
});

const occupancyMessage = {
  header: { frame_id: 'warehouse_L1/map', stamp: { sec: 20, nanosec: 0 } },
  info: {
    map_load_time: { sec: 10, nanosec: 0 },
    width: 4,
    height: 2,
    resolution: 0.5,
    origin: {
      position: { x: 10, y: -2, z: 0 },
      orientation: { x: 0, y: 0, z: Math.sin(Math.PI / 4), w: Math.cos(Math.PI / 4) },
    },
  },
  data: new Int8Array(8),
};
const adaptedMap = adaptRosOccupancyGrid(occupancyMessage, {
  mapId: 'warehouse-L1',
  mapVersion: 'sha256:fixture-v1',
  svgUnitsPerMeter: 20,
  svgOrigin: { x: 5, y: 7 },
});
assert.equal(adaptedMap.layerMap.resolution, 10);
assert.equal(adaptedMap.layerMap.source.frameId, 'warehouse_L1/map');
assert.equal(adaptedMap.rowOrder, 'bottom-to-top');
pointClose(adaptedMap.transform.worldToSvg({ x: 10, y: -2 }), { x: 5, y: 27 }, 'adapter origin');

const poseAt = (x, y, sec) => ({
  header: { frame_id: 'warehouse_L1/map', stamp: { sec, nanosec: 0 } },
  pose: {
    position: { x, y, z: 0 },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
  },
});
const trajectory = adaptRosPathToTrajectory({
  header: occupancyMessage.header,
  poses: [poseAt(10, -2, 20), poseAt(9.5, -1.5, 21)],
}, {
  transform: adaptedMap.transform,
  id: 'path-1',
  label: 'Robot 1 plan',
  currentSampleIndex: 0,
});
assert.equal(trajectory.source.mapVersion, 'sha256:fixture-v1');
assert.equal(trajectory.coordinateSpace, 'svg-map');
assert.deepEqual(trajectory.samples.map((sample) => sample.timeMs), [0, 1_000]);
pointClose(trajectory.samples[0].position, { x: 5, y: 27 }, 'path projection');

const adaptedPose = adaptRosPoseWithCovarianceStamped({
  header: occupancyMessage.header,
  pose: {
    pose: poseAt(9.5, -1.5, 20).pose,
    covariance,
  },
}, {
  transform: adaptedMap.transform,
  id: 'robot-1',
  label: 'Robot 1',
  state: 'moving',
});
assert.equal(adaptedPose.source.frameId, 'warehouse_L1/map');
assert.equal(adaptedPose.localization.ellipse.majorRadius, 80);
assert.equal(adaptedPose.localization.ellipse.minorRadius, 40);

assert.throws(
  () => adaptRosPathToTrajectory({
    header: occupancyMessage.header,
    poses: [poseAt(10, -2, 21), poseAt(9.5, -1.5, 20)],
  }, {
    transform: adaptedMap.transform,
    id: 'out-of-order',
  }),
  (error) => error instanceof NavigationCoordinateError && error.code === 'OUT_OF_ORDER_TIME',
);

console.log('Navigation coordinate contract passed (world/SVG/screen round trips, line adapters, ROS adapters, frames, time, covariance).');
