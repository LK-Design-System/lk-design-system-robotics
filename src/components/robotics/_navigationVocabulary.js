// Internal Navigation vocabulary — the single source for the line/state
// encoding VALUES shared across the Robotics Navigation renderers
// (WaypointMarker · FacilityTransition · HazardMarker · LaneOverlay ·
// RouteOverlay · TrajectoryOverlay · SpatialRegion).
//
// This is an internal `_`-prefixed module: it is imported by the renderers but
// never exported from the public entry, so promoting these constants here does
// NOT change the public API. It holds geometry/pattern scalars only — colors
// stay as the existing semantic/viewer tokens at each usage site.
//
// SCOPE RULE — only values that two or more renderers use with the SAME meaning
// on COMPARABLE geometry live here. Component-specific *encodings* deliberately
// stay in their own component, because forcing one dash onto unrelated stroke
// geometries reads wrong:
//   - the paired-relation hatch (`2 7`) — LaneOverlay, a relation cue rather
//     than a state, whose stroke geometry (offset twin line) has no analogue in
//     the other renderers.
// Long path-following STATE dashes used to be a per-renderer drift under this
// rule (`8 5`/`2 5` on lanes, `10 3 2 3`/`7 4`/… on route segments,
// `3 5`/`9 3 2 3`/`8 4`/… on trajectories); they are now the shared
// `NAV_PATH_DASH` scale below — that unification is the design decision the
// previous note deferred. The pin-ring availability dash (`6 3`) stays a
// small-ring encoding (NAV_DASH scope), not a path dash.
// See docs/NAVIGATION_ATOMIZATION_PLAN.md.

/**
 * State opacity. Every navigation renderer dims a disabled marker and softens
 * stale data by the same amount so one map reads as one system. Byte-identical
 * `disabled ? 0.45 : stale ? 0.76 : 1` was inlined in all seven renderers.
 */
export const NAV_STATE_OPACITY = { disabled: 0.45, stale: 0.76, default: 1 };

export function navStateOpacity(disabled, stale) {
  return disabled
    ? NAV_STATE_OPACITY.disabled
    : stale
      ? NAV_STATE_OPACITY.stale
      : NAV_STATE_OPACITY.default;
}

/**
 * Interaction state layering — selection and keyboard focus are independent
 * axes; data/operation state remains a third channel on base paint, dashes, or
 * badges. See docs/NAVIGATION_EXPRESSION_CONVENTIONS.md §4.1.
 *
 * FOCUS (transient, keyboard): `--color-semantic-focus-indicator`, always traces
 * the marker's OWN silhouette with non-scaling-stroke, sits OUTSIDE selection.
 * Point/pin focus adds `contrastStrokeWidth` as a surface-colored underlay.
 * Geometry hugs each shape, so this holds one named scalar per marker class.
 * Pin focus lives in `NAV_PIN.focusRing` (silhouette scale). The `path`/`route`
 * split is real: route segments render one tier wider than lane/trajectory.
 */
export const NAV_FOCUS = {
  contrastStrokeWidth: 5,
  waypointShellScale: 1.5,
  strokeWidth: 2,
  regionStrokeWidth: 6.5,
  pathHaloWidth: 11,
  routeHaloWidth: 12,
};

/**
 * SELECTION (persistent, semantic) uses geometry, never the focus color. Point
 * bodies enlarge while status badges stay fixed; paths and regions retain their
 * semantic paint and increase core/casing width. Focus remains the outer blue
 * cue, so selected + focused can coexist without sharing one visual channel.
 */
export const NAV_SELECTION = {
  waypointScale: 1.25,
  robotPoseScale: 1.15,
  pinScale: 1.12,
  regionStrokeWidth: 3.5,
  pathCasingWidth: 7.5,
  routeCasingWidth: 8.5,
  pathStrokeWidth: 4,
  trajectoryStrokeWidth: 4.5,
  routeStrokeWidth: 5,
};

/**
 * Baseline geometry by navigation line ROLE.
 *
 * State dashes may change along any line, so width and repeated geometry carry
 * the identity that must remain legible without a legend:
 * - lane: quiet topology / connectivity
 * - route: selected graph plan
 * - trajectory: time-ordered samples in free space
 */
export const NAV_LINE_ROLE = {
  lane: {
    casingWidth: 4,
    coreWidth: 1.5,
    selectedCasingWidth: 6,
    selectedCoreWidth: 3,
  },
  route: {
    casingWidth: 7,
    coreWidth: 3.5,
    currentWidth: 4.5,
  },
  trajectory: {
    casingWidth: 4.5,
    coreWidth: 1.75,
    activeWidth: 2.25,
    futureOpacity: 0.24,
  },
};

/**
 * Temporal punctuation unique to TrajectoryOverlay. Samples are capped and
 * screen-space sized so dense telemetry remains readable at every map zoom.
 * The current sample is a circular time cursor—not a route arrowhead.
 */
export const NAV_TRAJECTORY_SAMPLE = {
  radius: 1.75,
  maxVisible: 12,
  pastOpacity: 0.78,
  futureOpacity: 0.48,
  cursorOuterRadius: 5,
  cursorInnerRadius: 2.5,
  cursorCollisionRadius: 9,
};

/**
 * State dashes for small marker rings and region/facility SHAPE outlines. These
 * are shared because the same state means the same dash on comparable geometry.
 * Long path-following encodings are NOT here (see the SCOPE RULE above) — this
 * set is only the small-ring and shape-outline state vocabulary.
 *
 * - `staleRing`  — dashed ring on a small state badge or stale indicator.
 * - `staleShape` — stale dash on a region / facility outline stroke.
 * - `unknown`    — traversability / availability unknown on a shape or ring.
 * - `invalid`    — invalid geometry/data on a shape or ring.
 */
export const NAV_DASH = {
  staleRing: '2 2',
  staleShape: '2 4',
  unknown: '1 3',
  invalid: '4 3',
};

/**
 * Long path-following state dashes shared by RouteOverlay (segment
 * phase/condition), TrajectoryOverlay (status) and LaneOverlay (availability).
 * One scale so the same meaning dashes the same on every path, and states that
 * can co-occur on one map stay distinguishable at the 2.5–4px path strokes:
 *
 * - `pending`   — sparse dots: not yet traversed (route upcoming · trajectory planned).
 * - `completed` — long dash: already traversed.
 * - `waiting`   — long dash + dot: paused, will resume.
 * - `conflict`  — short dash + dot: contested by another entity.
 * - `blocked`   — dense dots: cannot traverse (route/trajectory blocked · lane
 *                 closed — the same pairing that shares the `×` state glyph).
 * - `rerouting` — dense short dash: being recalculated.
 * - `unknown`   — sparse dash: traversability unknown (lane availability).
 */
export const NAV_PATH_DASH = {
  pending: '2 6',
  completed: '7 4',
  waiting: '10 3 2 3',
  conflict: '5 3 1 3',
  blocked: '1 5',
  rerouting: '3 3',
  unknown: '4 8',
};

/**
 * Map-pin marker geometry, shared by FacilityTransition and HazardMarker so a
 * facility pin and a hazard pin read as one marker family — severity fill and
 * knockout glyph (not a different shape) distinguish them. The shadow and the
 * focus ring traces this same silhouette. Selection enlarges the complete pin
 * body while leaving external state badges fixed.
 */
export const NAV_PIN = {
  path: 'M0 15 Q-6 10 -9.2 5 A10.5 10.5 0 1 1 9.2 5 Q6 10 0 15 Z',
  shadow: { transform: 'translate(0 0.8)', fill: 'var(--color-semantic-static-black)', opacity: 0.16 },
  focusRing: { scale: 1.34, strokeWidth: 2.5 },
};

/**
 * Graph-node rounded-square silhouette. A navigation-graph point renders as
 * this shape wherever it appears, so the SAME graph node reads as the SAME symbol
 * across layers: WaypointMarker draws it at the full `radius`, and a lane
 * endpoint — which references a waypoint by id — draws the same shape at the
 * smaller `endpointRadius`. `rect(r, cornerRadius)` returns SVG rect geometry
 * for a given half-size.
 */
export const NAV_NODE = {
  radius: 10,
  cornerRadius: 4,
  endpointRadius: 4,
  endpointCornerRadius: 1.5,
  labelOffsetX: 22,
  // The primary role sits inside, availability uses the solid fill, selection
  // enlarges the body, and focus uses one contrast-backed shell. Exceptional
  // data quality lives in one fixed-size top-right badge.
  rect: (r, cornerRadius = 3) => ({
    x: -r,
    y: -r,
    width: r * 2,
    height: r * 2,
    rx: cornerRadius,
  }),
};

/**
 * Transparent WCAG 2.2 Target Size hit circle. `radius` is in the marker's
 * local units (markers that inverse-scale multiply it by `1/viewportScale`);
 * it is sized so the final on-screen target stays at least `screenTargetSize`
 * CSS px, which is asserted through the `data-screen-target-size` contract.
 */
export const NAV_HIT = { radius: 17.5, screenTargetSize: 24 };

/**
 * Small circular status badge sitting behind a NavigationStateGlyph.
 */
export const NAV_STATE_BADGE = { radius: 7, strokeWidth: 1.5 };

/**
 * Compact solid exception badge for the 20px waypoint body. It overlaps the
 * top-right corner, matching RobotPoseMarker's attached badge grammar. A
 * surface-colored separator stroke keeps the solid status tone distinct from
 * the body. The badge stays fixed while selection enlarges the body and
 * consolidates simultaneous data-quality states to one priority slot
 * (`invalid` before `stale`).
 */
export const NAV_WAYPOINT_STATUS_BADGE = {
  radius: 6,
  offsetX: 8,
  offsetY: -8,
  strokeWidth: 1.5,
  glyphSize: 8.5,
};

/**
 * Route's line-integrated current-progress head. The elapsed plan is the
 * shaft; this open V is attached with SVG `marker-end` so its tip stays on the
 * source progress position. Trajectory deliberately uses a circular
 * current-sample cursor instead.
 */
export const NAV_PROGRESS_HEAD = {
  path: 'M 2 1.5 L 16 8 L 2 14.5',
  viewBox: '0 0 18 16',
  refX: 16,
  refY: 8,
  width: 18,
  height: 16,
  collisionRadius: 20,
  obstacle: { x: -20, y: -10, width: 24, height: 20 },
  route: { casingWidth: 7, coreWidth: 4, futureOpacity: 0.34 },
};

/**
 * Text-label legibility halo — the stroke painted behind readable text via
 * `paint-order: stroke` so a label stays legible over any map content. Tiered
 * by the label's role so the identity label gets the heaviest knockout and
 * metadata the lightest. Micro on-glyph counters (e.g. a transition count on a
 * badge) keep their own thinner halo locally; this scale is for the readable
 * name / detail / caption text tiers.
 */
export const NAV_LABEL_HALO = { primary: 4, secondary: 3, caption: 3 };
