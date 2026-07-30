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
// Trajectory keeps one solid identity stroke; lifecycle state stays in text and
// detail surfaces rather than changing line geometry.
// Lane and Route share one graph-line grammar. Route is the selected subset of
// Lane, so it keeps the same width and dash cadence and changes only identity
// tone. Trajectory stays a thin temporal line with samples.
// while runtime availability/conflict changes tone and is named in label/detail
// text. Any small-ring availability dash stays component-local rather than
// becoming a path or area state encoding.
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
  // 1.15였다. 34px 원에서 5px 차이는 비교 대상이 옆에 없으면 보이지 않아, 상호작용
  // 상태 스토리에서 기본과 선택이 육안 동일했다 — pinScale을 1.12에서 올린 것과 같은
  // 이유로 waypointScale에 맞춘다. 셋이 같은 값이면 "선택 = 1.25배"라는 규칙 하나만
  // 기억하면 된다.
  robotPoseScale: 1.25,
  // Pins were the weakest selection cue in the set at 1.12: on a 35x42 pin that
  // is a 4x5px delta, and a marker alone on a map has nothing to compare against.
  // Scale is the only channel available here - Hazard already spends its outline
  // on severity, so a selection border would make `danger + selected` a triple
  // edge. Matched to waypointScale instead of inventing a fourth number.
  pinScale: 1.25,
  /**
   * Hover/list-preview enlargement for the pose body. 1.08 was under 3px on a
   * ~34px circle and read as "no change"; 1.12 is perceptible while staying
   * clearly below the 1.25 selection scale — hover is transient and has the
   * cursor for context, so it may be subtler than selection. Lives here (like
   * regionHoverStrokeWidth) so stories assert the constant, not a literal.
   */
  robotPoseHighlightScale: 1.12,
  /**
   * Selection seat: a die-cut matte behind the selected point marker — the
   * silhouette re-drawn in `--viewer-surface-elevated` with a hairline
   * `--viewer-border` rim. Scale alone is a RELATIVE cue: 1.25x is obvious next
   * to an unselected sibling and invisible on a marker alone on a map. The seat
   * is the absolute cue, and it lives BEHIND the silhouette, so it stacks with
   * Hazard's severity double edge (no third coloured outline) and stays clear
   * of the blue focus ring (different colour, different layer).
   */
  seat: {
    margin: 6,
    borderWidth: 1.5,
    fill: 'var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))',
    rim: 'var(--viewer-border, var(--color-semantic-line-normal-normal))',
  },
  regionStrokeWidth: 3.5,
  /** Region outline below selection: hover lifts the edge, rest sits quiet. */
  regionHoverStrokeWidth: 2,
  regionRestStrokeWidth: 1.5,
  pathCasingWidth: 7.5,
  routeCasingWidth: 6,
  pathStrokeWidth: 4,
  trajectoryStrokeWidth: 4.5,
  routeStrokeWidth: 1.5,
};

/**
 * Baseline geometry by navigation line ROLE.
 *
 * Width and repeated geometry carry the role identity that must remain legible
 * without a legend:
 * - lane: quiet topology / connectivity
 * - route: selected graph plan
 * - trajectory: time-ordered samples in free space
 */
export const NAV_LINE_ROLE = {
  lane: {
    /** Stable topology texture. Runtime state changes tone, never this dash. */
    dash: '4 6',
    casingWidth: 4,
    coreWidth: 1.5,
    selectedCasingWidth: 6,
    selectedCoreWidth: 3,
  },
  route: {
    /** Selected Lane sequence: same geometry and texture, plan identity tone. */
    dash: '4 6',
    casingWidth: 4,
    coreWidth: 1.5,
    pulseWidth: 5.5,
  },
  trajectory: {
    casingWidth: 4.5,
    coreWidth: 1.75,
    activeWidth: 2.25,
    pulseWidth: 6,
    futureOpacity: 0.24,
  },
};

/**
 * Temporal punctuation unique to TrajectoryOverlay. Samples are capped and
 * screen-space sized so dense telemetry remains readable at every map zoom.
 * The current sample is a circular time cursor—not a route arrowhead.
 */
export const NAV_TRAJECTORY_SAMPLE = {
  // 이 반경은 궤적 core(2.25px)보다 커야 한다. 이전 1.5는 지름 3px이라 같은 색
  // 선 위에서 양쪽으로 0.375px만 삐져나왔고, 결과적으로 이 컴포넌트를 Lane·Route와
  // 구분 짓는 유일한 표현인 시간 순 sample이 보이지 않았다. 2.4는 지름 4.8px이라
  // 선 밖으로 1.275px씩 나와 염주처럼 읽힌다.
  //
  // 표면색 링은 쓰지 않는다. 링을 두르면 sample마다 선이 끊겨, 유효한 궤적은 하나의
  // 끊김 없는 선이어야 한다는 규약을 깬다(`data-trajectory-sample`에 stroke가 없어야
  // 한다고 play가 단언한다). 굵기만으로 구분하고 선은 잇는다.
  radius: 2.4,
  maxVisible: 12,
  pastOpacity: 0.78,
  futureOpacity: 0.48,
  cursorOuterRadius: 5,
  cursorInnerRadius: 2.5,
  cursorCollisionRadius: 9,
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

/** Shared availability fills for the Waypoint body and its legend specimen. */
export const NAV_WAYPOINT_AVAILABILITY_FILL = Object.freeze({
  available: 'color-mix(in srgb, var(--color-semantic-status-positive-foreground) 72%, var(--viewer-foreground, var(--color-semantic-label-strong)))',
  unavailable: 'var(--viewer-muted, var(--color-semantic-label-neutral))',
  unknown: 'color-mix(in srgb, var(--viewer-warning, var(--color-semantic-status-cautionary-foreground)) 70%, var(--viewer-foreground, var(--color-semantic-label-strong)))',
});

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
 * Text-label legibility halo — the stroke painted behind readable text via
 * `paint-order: stroke` so a label stays legible over any map content. Tiered
 * by the label's role so the identity label gets the heaviest knockout and
 * metadata the lightest. Micro on-glyph counters (e.g. a transition count on a
 * badge) keep their own thinner halo locally; this scale is for the readable
 * name / detail / caption text tiers.
 */
export const NAV_LABEL_HALO = { primary: 4, secondary: 3, caption: 3 };

/**
 * Text-label size ramp, tiered to match NAV_LABEL_HALO.
 *
 * Stroke width, radius, opacity, dash, and halo were centralised here from the
 * start; type was the one visual property left to each call site. That is why
 * every overlay independently landed on the same three tokens while fixtures
 * drifted to raw 8–11px — the convention existed but had nowhere to live. Read
 * this alongside NAV_LABEL_HALO: a tier's size and its knockout are chosen
 * together, so changing one here without the other breaks the legibility
 * contract on busy map content.
 */
export const NAV_LABEL_TYPE = {
  /** Entity identity — waypoint name, robot name. */
  primary: 'var(--label2-size)',
  /** Entity detail line — region label, lane label, facility label. */
  secondary: 'var(--caption1-size)',
  /** Sub-detail and ambient map chrome — the floor of the ramp. */
  caption: 'var(--caption2-size)',
};

/**
 * Deliberately NOT on the ramp above: marks painted inside a glyph, such as the
 * `?` in an unknown-state badge or a transition counter. Those are sized to the
 * shape that contains them (NAV_STATE_BADGE is radius 7, so its counter cannot
 * exceed ~9 user units) and live in SVG user space rather than CSS text space.
 * Pulling them onto the readable-text ramp would overflow the glyph. This
 * mirrors the same carve-out NAV_LABEL_HALO already documents.
 */
export const NAV_GLYPH_COUNTER_SIZE = 9;
