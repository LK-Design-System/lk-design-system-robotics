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
//   - lane availability/unknown path dashes (`8 5` / `2 5`) and the conflict
//     hatch (`2 7`) — LaneOverlay
//   - route segment condition/phase dashes (`10 3 2 3`, `1 5`, `7 4`, …) — RouteOverlay
//   - trajectory status dashes (`3 5`, `9 3 2 3`, `8 4`, …) — TrajectoryOverlay
//   - the availability-unavailable dash, which is a 3-way drift across a pin
//     ring (`6 3`), a lane path (`8 5`) and a route segment (`1 5`); unifying it
//     needs a design decision, not a mechanical hoist.
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
 * Interaction state layering — the two independent axes every navigation marker
 * uses. See docs/NAVIGATION_EXPRESSION_CONVENTIONS.md §2.5.
 *
 * FOCUS (transient, keyboard): `--color-semantic-focus-indicator`, always traces
 * the marker's OWN silhouette with non-scaling-stroke, sits OUTSIDE selection.
 * Geometry hugs each shape, so this holds one named scalar per marker class.
 * Pin focus lives in `NAV_PIN.focusRing` (silhouette scale). The `path`/`route`
 * split is real: route segments render one tier wider than lane/trajectory.
 */
export const NAV_FOCUS = {
  waypointShellScale: 1.5,
  strokeWidth: 2,
  regionStrokeWidth: 6.5,
  pathHaloWidth: 10,
  routeHaloWidth: 11,
};

/**
 * SELECTION (persistent, semantic): `--viewer-accent`, the INNER/tighter cue vs
 * focus. It never recolors meaning-encoded fills (pin severity, region texture,
 * path status), so each geometry uses its strongest allowed cue: waypoint solid
 * fill, pin ring (`NAV_PIN.selectionRing`, 1.16 < focus 1.34), region outline
 * (thinner than focus), path translucent accent halo (`haloOpacity`, width one
 * tier wider on route). Path base/emphasis/casing widths belong to the separate
 * path-stroke set, not here.
 */
export const NAV_SELECTION = {
  regionStrokeWidth: 3.5,
  haloOpacity: 0.24,
  pathHaloWidth: 7,
  routeHaloWidth: 8,
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
 * Map-pin marker geometry, shared by FacilityTransition and HazardMarker so a
 * facility pin and a hazard pin read as one marker family — severity fill and
 * knockout glyph (not a different shape) distinguish them. The shadow and the
 * focus/selection rings all trace this same silhouette; rings are applied with
 * a `scale()` transform plus `vector-effect="non-scaling-stroke"`.
 */
export const NAV_PIN = {
  path: 'M0 15 Q-6 10 -9.2 5 A10.5 10.5 0 1 1 9.2 5 Q6 10 0 15 Z',
  shadow: { transform: 'translate(0 0.8)', fill: 'var(--color-semantic-static-black)', opacity: 0.16 },
  focusRing: { scale: 1.34, strokeWidth: 2.5 },
  selectionRing: { scale: 1.16, strokeWidth: 2 },
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
 * Line-integrated current-progress head shared by RouteOverlay and
 * TrajectoryOverlay. The elapsed/current path is the shaft; this open V is
 * attached with SVG `marker-end` so its tip stays on the source position and
 * its orientation follows the incoming path tangent. Marker dimensions are
 * screen-space dimensions after the owning renderer applies viewportScale's
 * inverse to markerWidth/markerHeight.
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
  trajectory: { casingWidth: 6.5, coreWidth: 3.5, futureOpacity: 0.28 },
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
