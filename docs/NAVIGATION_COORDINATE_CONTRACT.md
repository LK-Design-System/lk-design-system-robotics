# Navigation Coordinate Contract

Navigation graphics are only trustworthy when map, route, trajectory, pose,
waypoint, region, and facility data share one explicit frame and timestamp
contract. A coincident pair of `x`/`y` numbers is not evidence that two records
belong to the same coordinate space.

## Ownership boundary

Robotics UI owns the renderer-facing coordinate contract and pure projection
helpers. It does not own ROS transport, TF authority, localization, map
selection, or safety decisions.

The product adapter must:

1. obtain a source record with `frame_id` and timestamp;
2. resolve any required TF at that timestamp;
3. identify the floor map and immutable map version;
4. project world/map coordinates through `NavigationMapTransform`;
5. pass only the projected SVG geometry plus its retained `source` metadata to
   the SVG renderers.

The transform chain is:

```text
source frame --TF at stamp--> floor map frame
             --NavigationMapTransform--> SVG map space
             --NavigationViewportTransform--> screen CSS pixels
```

`NavigationCoordinateSystem` implements the two transformations on the right.

`NavigationCoordinateBoundary` is the composition guard. Place it around the
SVG layers for one active map. Occupancy, route, trajectory, robot pose,
waypoint, lane, region, hazard, and facility layers whose `mapId`, `frameId`,
or immutable `mapVersion` differs are suppressed instead of being silently
drawn in the wrong coordinate space.

For line geometry, matching frame metadata is not sufficient. Route,
Trajectory, and Lane renderers inside the boundary also require
`coordinateSpace: "svg-map"`. That proof is emitted by:

- `adaptWorldRouteToRoute`
- `adaptWorldTrajectoryToTrajectory`
- `adaptWorldLaneToLane`
- `adaptRosPathToTrajectory`

Raw world/ROS coordinates must never be passed directly to an SVG overlay.
Legacy preprojected data can still render outside a coordinate boundary, but
production map composition should use the boundary and one of these adapters.
The source adapter remains responsible for the TF operation on the left.

## Canonical source metadata

Every live or persisted geometry record must retain:

- `mapId`: product identity of the selected map or floor;
- `frameId`: source coordinate frame, normally a floor-specific map frame;
- `mapVersion`: immutable map revision or content digest;
- `stamp`: source measurement/planning timestamp where applicable.

Static map metadata additionally contains:

- `widthCells` and `heightCells`;
- `resolutionMPerCell`;
- real-world `origin` as `xM`, `yM`, and REP-103 `yawRad`;
- optional `loadedAt`.

The renderer models keep `mapId` for filtering and may carry a `source`
property for traceability. When `source.mapId` contradicts the renderer
`mapId`, the affected fragment does not render.

## Axis and angle conventions

Source coordinates follow ROS REP-103:

- SI length in meters;
- radians for angles;
- right-handed coordinates;
- positive yaw counter-clockwise.

SVG map space uses positive X to the right and positive Y downward. Therefore
the map projection includes a Y reflection. Do not pass ROS yaw directly to an
SVG `rotate()` call. Use `worldHeadingToSvg()` and `svgHeadingToWorld()`.

The occupancy grid origin is the world pose of the bottom-left corner of cell
`(0, 0)`. `gridCellToWorld()` defaults to cell centers; pass
`{ anchor: "corner" }` only when a grid boundary is intended.

## Public projection API

```js
const transform = createNavigationMapTransform({
  mapId: 'warehouse-L1',
  frameId: 'warehouse_L1/map',
  mapVersion: 'sha256:...',
  widthCells: 640,
  heightCells: 480,
  resolutionMPerCell: 0.05,
  origin: { xM: -12.4, yM: 8.1, yawRad: 0 },
}, {
  svgUnitsPerMeter: 20,
});

const markerPoint = transform.worldToSvg({ x: 2.5, y: 1.2 });
const worldPoint = transform.svgToWorld(markerPoint);
const svgHeading = transform.worldHeadingToSvg(robotYaw);
```

For map interaction, compose the projection with the current viewport:

```js
const screen = transform.withViewport({
  viewport: { x: panX, y: panY, z: zoom },
  svgCssScale,
  screenOrigin: { x: canvasLeft, y: canvasTop },
});

const goalInWorld = screen.screenToWorld({ x: pointerClientX, y: pointerClientY });
```

This inverse transform must be used for goal placement, region editing, hit
inspection, and measurement. Reimplementing the equation in product screens
is not allowed.

## ROS adapters

`NavigationRosAdapters` accepts structural ROS message objects without adding a
ROS runtime dependency:

- `adaptRosOccupancyGrid()` validates dimensions, data length, frame identity,
  `m/cell` resolution, planar origin quaternion, map version, and timestamp;
- `adaptRosPathToTrajectory()` rejects frame mismatches and out-of-order pose
  timestamps, then projects positions and headings;
- `adaptRosPoseWithCovarianceStamped()` projects pose and produces a 2D
  covariance ellipse.

The path adapter returns `TrajectoryData`, not `RouteData`: ROS `nav_msgs/Path`
is an ordered pose sequence and does not carry the graph-segment phase,
condition, lane identity, or facility-transition semantics required by
`RouteData`.

## Freshness and uncertainty

Use `classifyNavigationFreshness()` with a product-owned policy. It reports
`fresh`, `stale`, `expired`, or `future`; it does not guess thresholds.

Pose covariance is reduced to a configurable standard-deviation ellipse using
the X/Y submatrix of the ROS 6x6 covariance. `RobotPoseMarker` renders that
ellipse in map space while keeping its stroke non-scaling. Products may omit
the covariance display at overview density, but they must not relabel an
uncertain pose as exact.

## Multi-floor maps

Each floor has an independent `mapId`, `frameId`, map version, origin, and
transform. A lift or ramp may reference endpoints on two floors, but no
straight Euclidean connector is synthesized between their coordinate spaces.
The localization/transition authority decides when the active floor changes.

If an installation requires a building-wide coordinate system, products may
add a building frame above floor frames. Floor-local rendering still uses the
selected floor transform.

## Failure policy

The coordinate helpers throw `NavigationCoordinateError` for:

- missing identities or timestamps required by an operation;
- non-finite coordinates;
- invalid resolution or grid size;
- non-planar map/pose orientation;
- frame or map-version mismatch;
- non-invertible transforms;
- malformed covariance;
- out-of-order path timestamps.

Do not catch these errors and silently substitute identity transforms. The
product should reject the layer, preserve the last known valid rendering when
appropriate, and expose an explicit data/transform error state.

## Verification

`npm run check:coordinates` covers:

- rotated-origin world/SVG round trips;
- grid-cell center and bounds conversion;
- ROS-to-SVG yaw conversion;
- screen/world round trips with pan, zoom, and CSS/viewBox scale;
- frame, version, and age policies;
- OccupancyGrid, Path, and PoseWithCovariance adapters;
- covariance ellipse calculation;
- malformed and out-of-order source rejection.

## Reference basis

- ROS REP-103, SI units and coordinate conventions:
  https://reps.openrobotics.org/rep-0103/
- ROS REP-105, mobile-platform frames and multi-map transitions:
  https://reps.openrobotics.org/rep-0105/
- ROS 2 `nav_msgs/OccupancyGrid`:
  https://github.com/ros2/common_interfaces/blob/rolling/nav_msgs/msg/OccupancyGrid.msg
- ROS 2 `nav_msgs/MapMetaData`:
  https://github.com/ros2/common_interfaces/blob/rolling/nav_msgs/msg/MapMetaData.msg
- ROS 2 `nav_msgs/Path`:
  https://github.com/ros2/common_interfaces/blob/rolling/nav_msgs/msg/Path.msg
- ROS 2 `geometry_msgs/PoseWithCovarianceStamped`:
  https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/PoseWithCovarianceStamped.msg
- RViz covariance display:
  https://docs.ros.org/en/jazzy/p/rviz_default_plugins/generated/classrviz__default__plugins_1_1displays_1_1PoseWithCovarianceDisplay.html
