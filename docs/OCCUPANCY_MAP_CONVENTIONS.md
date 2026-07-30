# Occupancy Map Conventions

| Field | Value |
| --- | --- |
| Type | Convention |
| Status | Current |
| Owner | Robotics domain engineering |
| Last reviewed | 2026-07-30 |

`OccupancyMapLayer` draws the structural base map below navigation overlays.
It does not infer rooms or traversable interiors from closed lines.

## Semantic states

| State | Meaning | Visual rule |
| --- | --- | --- |
| `free` | Observed, traversable map space | Neutral map surface |
| `occupied` | Wall or fixed obstacle | Strongest neutral contrast |
| `unknown` | Unobserved, indeterminate, or missing map space | Receding neutral surface |

Map colors are deliberately neutral. Viewer accent blue remains reserved for
current, active, and selected navigation content.

The default numeric classification follows occupancy-grid conventions:

- values `<= 25` are `free`;
- values `>= 65` are `occupied`;
- `-1`, missing values, non-finite values, and values between the thresholds
  are `unknown`.

Products may change the thresholds when their source format uses a different
probability scale. The source adapter owns coordinate conversion and semantic
classification; the component only presents the supplied grid.

## Composition

`OccupancyMapLayer` is an SVG fragment and must be mounted inside an
application-owned SVG within `Map2DCanvas`. Put it below `SpatialRegion`,
`LaneOverlay`, `RouteOverlay`, `WaypointMarker`, and `RobotPoseMarker`.

```jsx
<Map2DCanvas>
  <svg viewBox="0 0 640 480">
    <OccupancyMapLayer map={map} />
    <RouteOverlay route={route} activeMapId={mapId} />
    <RobotPoseMarker pose={pose} />
  </svg>
</Map2DCanvas>
```

`SpatialRegion` remains an operational overlay for behavior, facility, and
terrain meaning. It must not be used to approximate walls or unknown space.

## Rendering constraints

- Do not flood-fill a closed outline and call the result free space.
- Do not use accent, warning, or danger hues for the three base-map states.
- Keep the base layer pointer-passive so map features receive interaction.
- `rowOrder` describes data serialization only. Use
  `adaptRosOccupancyGrid()` or `createNavigationMapTransform()` for world-to-SVG
  conversion; do not reinterpret `rowOrder` as an axis transform.
- The layer uses dedicated neutral component tokens for free, occupied,
  unknown, and boundary roles in each appearance; it does not add a competing
  state-color vocabulary.
- The SVG implementation merges horizontal runs. Products displaying very
  large or frequently updated grids should rasterize upstream and preserve the
  same neutral free/occupied/unknown hierarchy.

## Reference basis

- ROS `nav_msgs/OccupancyGrid` defines row-major cell probabilities from
  `0..100` with `-1` reserved for unknown:
  https://docs.ros.org/en/melodic/api/nav_msgs/html/msg/OccupancyGrid.html
- Navigation2's current map-saver defaults use free `0.25` and occupied `0.65`
  thresholds:
  https://github.com/ros-navigation/navigation2/blob/main/nav2_bringup/params/nav2_params.yaml

These references determine the default value contract. LDS adapts their data
semantics to the existing viewer token system rather than copying RViz styling.

The complete frame, map-version, timestamp, origin, rotation, inverse
projection, and multi-floor contract lives in
[NAVIGATION_COORDINATE_CONTRACT.md](NAVIGATION_COORDINATE_CONTRACT.md).
