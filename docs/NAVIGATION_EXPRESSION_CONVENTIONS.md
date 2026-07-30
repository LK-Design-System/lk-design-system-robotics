# Navigation Expression Conventions

| Field | Value |
| --- | --- |
| Type | Convention |
| Status | Current |
| Owner | Robotics domain engineering (shared policy: Design system owner) |
| Last reviewed | 2026-07-30 |
| Source | Upstream `NAVIGATION_EXPRESSION_CONVENTIONS.md` (authoritative) · `src/components/robotics/_navigationVocabulary.js` |

How the Robotics **Navigation** overlays encode meaning on a map. These are the
rules the renderers (`LaneOverlay`, `RouteOverlay`, `TrajectoryOverlay`,
`WaypointMarker`, `FacilityTransition`, `HazardMarker`, `SpatialRegion`) and the
`NavigationAnnotationLayer` follow so a single viewport reads as one system.

Scope: presentation only. Meaning (which lane is closed, which route is active)
is the product's; these conventions govern how that meaning is *drawn*. Values
live in the internal `_navigationVocabulary` module — importing it never changes
the public API.

Governance: the main LDS Navigation expression convention and its
`ROBOTICS_NAVIGATION_STATE_BADGE_CONTRACT.json` are authoritative for shared
policy. This document is the Robotics consumer explanation and may specialize
marker geometry, but it must not replace the LDS rules for one solid badge
slot, state priority, semantic color, or accessible-state preservation.

---

## 1. One channel per question, and never color alone

Every state is carried by **at least one non-color channel** (shape, dash,
glyph, opacity, or explicit text in the label/detail surface) so the map
survives desaturation and red/green color-vision deficiency. Color is a
redundant reinforcement, never the sole source of the exact state name.

---

## 2. Lines vs. points: where state lives

The single most load-bearing split.

| Element kind | Renderers | State lives as |
| --- | --- | --- |
| **Lane line** | Lane | stable `4 6`, 1.5px graph dash **+ state tone + explicit state text** |
| **Plan line** | Route | the same `4 6`, 1.5px selected-Lane dash **+ route identity tone + explicit layer/detail text** |
| **Execution line** | Trajectory | stable 2.25px primary/accent solid stroke **+ capped sample dots + explicit status text** |
| **Marker** | Waypoint, Facility pin, Robot pose | availability/identity/operation tone on the body **+ at most one prioritized solid badge** |
| **Area** | Region | category pattern **+ state tone on fill and outline**; no floating badge |

Lines do **not** wear lifecycle/condition/availability badges. Trajectory keeps
one solid identity line and leaves lifecycle state in its label, accessible
name, and detail surface. Route replaces the selected Lane paint with the same
graph-line grammar in the plan identity tone and leaves
phase/condition/progress in the detail surface. Lane keeps one role texture and names runtime state
in its visible label/detail surface and accessible name; its tone is redundant.
A badge on a polyline reads as clutter and collides with labels.
Markers have no long stroke to dash, so one attached solid badge is their
non-color exception channel. They never grow a badge stack: each renderer
resolves its own priority into one visual slot while the accessible name
preserves every raw state. Waypoint uses `invalid > stale`; FacilityTransition
uses `invalid > stale > unknown`.

RobotPose keeps routine fleet density low: `moving` uses accent plus its motion
ring, `idle` uses neutral, and `paused` uses cautionary without a badge.
`fault`, `offline`, `stale`, `unknown`, and `invalid` retain one prioritized
exception glyph so the exact exceptional state is not communicated by color
alone. A custom robot identity color applies only to the normal moving state;
operational warning, error, and offline tones take precedence.

Route and Trajectory do not attach point badges for **data quality**, because
`invalid` and `stale` describe the complete plan/sample set rather than one
coordinate. Following the existing LDS StatusIndicator pulse policy, `stale`
uses the cautionary tone and the shared 1.7s freshness pulse; `invalid` is a
static negative line and takes precedence when both are true. Reduced-motion
removes the pulse while the cautionary line and explicit status text remain.
Lifecycle variants otherwise share one stroke grammar; their exact state is
explicit text rather than a second line-style code operators must memorize.

---

## 3. Line roles are geometry, not color

### 3.0 One Path System, three component contracts

Lane, Route, and Trajectory remain separate component APIs because they have
different data lifetimes, interaction targets, and update rates. They are not
separate design systems. Storybook and product composition treat them as one
`Navigation / Path System`:

1. **Lane — topology:** possible graph connectivity.
2. **Route — plan:** the selected Lane sequence and segment phases.
3. **Trajectory — temporal execution:** time-ordered samples observed or
   predicted for one robot.

Documentation must first show these layers together in that order, then expose
the component-specific lifecycle and edge cases below the shared overview.
Directional cues are a subordinate Path System rule, not a standalone
Foundation asset category.

The development Storybook keeps a deliberately small public hierarchy:

1. **Path System / Overview** — one composed operational map and the ownership
   boundary between topology, plan, execution, and localization.
2. **Shared Rules** — only cross-layer rules such as direction, progress, and
   playback cues.
3. **Lane** — overview, runtime constraints, and selection behavior.
4. **Route** — overview, detail/data-quality states, floor filtering, and
   segment selection.
5. **Trajectory** — overview, recording playback, and lifecycle/data-quality
   states.

Theme parity, 320px fixtures, short-geometry guards, pointer-only contracts,
and compound collision probes are regression fixtures rather than navigation
pages. A visible overview uses one representative map; repeated light/dark
copies are reserved for automated visual parity. State pages repeat geometry
only when the rendered result is materially different.

Lane and Route intentionally share one graph-line grammar because they are
mutually exclusive paints of the same geometry; layer/detail text carries the
exact identity without color. Trajectory remains geometrically distinct:

1. **Lane** is quiet graph topology: a 1.5px line with a stable `4 6` dash and
   endpoint nodes. Availability does not change that role texture: available
   is neutral, closed/conflict is danger, and unknown is warning. The exact
   state name stays in label/detail text. Direction is a sparse, separate cue
   for selected, zoomed, or editing contexts rather than a repeated dash shape.
   Because closed and conflict share the danger tone, **the at-rest distinction
   between them is owned by a conflict-point marker**, not by the lane paint: a
   conflict is an event with a coordinate, so the hazard vocabulary's collision
   pin (kind `obstacle`, severity by classification) is placed at the contention
   point. This is the concrete form of "surfaced by hazards, alerts, and the
   detail panel" below — the lane keeps one dash and one tone.
2. **Route** is the selected graph plan: the referenced Lane geometry is
   removed from base topology paint and replaced by one 1.5px, `4 6` line in the
   plan identity tone (`RouteOverlay`'s `ROUTE_IDENTITY_TONE`, on
   `--color-semantic-data-viz-series-5`). Segment phase, condition, and executor
   progress remain in data and the detail panel; they do not alter the
   operational map stroke.
3. **Trajectory** is temporal telemetry: a stable 2.25px solid line punctuated
   by capped sample dots. Lifecycle state never changes its tone, dash, or
   width. A circular temporal cursor is opt-in for sample inspection, not for
   replaying a robot pose.

All four operational layers share one projected map frame and one physical
corridor. A Route-selected Lane is never painted twice: Route replaces its
base Lane paint, while unselected branches remain neutral Lane lines.
Trajectory may deviate within a configured cross-track tolerance; RobotPose
comes from localization and sits near the executable Trajectory. A large
deviation is an explicit off-route exception, never a normal composition example.

Route keeps one identity tone (`ROUTE_IDENTITY_TONE`), the Lane width/dash, and
opacity across segment phases and conditions. There is no `--viewer-route`
viewer role: the identity tone is an upstream semantic token, not a runtime
custom property the host overrides, so it is not in the manifest's
`inheritedRuntimeCustomProperties`. Safety-critical blockage or
conflict is surfaced by Lane availability, hazards, alerts, and the detail
panel instead of fragmenting the selected plan line.

Lane, Route, and Trajectory do not paint generic on-line direction arrows.
Lane entry/exit order communicates graph direction, Route segment order
communicates plan direction, Trajectory sample order communicates time, and
RobotPose exclusively owns current physical position and heading. Position-like
Route progress is not part of the map vocabulary. Trajectory cursor cues are
hidden by default. Recorded driving replay moves a replay-context RobotPose;
the timeline owns the selected time:

- `RouteOverlay` retains progress in its data model for detail consumers but
  never paints a progress head, percentage, or partially completed stroke.
- `TrajectoryOverlay showTimeCursor={false}` shows the sample geometry without
  implying a robot position; `true` is reserved for sample inspection/debug.
- `TrajectoryOverlay playbackTimeMs` is a controlled recording time. The
  overlay interpolates elapsed/future geometry and an optional inspection
  cursor, but never owns a timer, autoplay, looping, or transport controls.
- `RobotPoseMarker context="replay"` reuses the pose anatomy and heading for a
  recorded pose while suppressing live motion treatment and labeling the marker
  as recording replay.
- `adaptWorldRobotPoseToPose` projects localization position and heading
  independently from Trajectory samples.
- Route `entryTransitionId` / `exitTransitionId` remain data references.
  `showTransitions={false}` prevents the ambiguous generic `T`; a composed
  `FacilityTransition` layer owns the actual door, lift, or dock marker.

Lane endpoint orientation constraints stay in data, the accessible name, and
the selected detail surface. They do not paint an endpoint arrow because that
shape collides with Waypoint pose/orientation and RobotPose heading.

---

## 4. Selection and focus stay independent without growing a ring ladder

Selection is persistent product state; focus is a transient keyboard location.
They must remain independently visible, but they do not need identical chrome.
Each renderer chooses the smallest cue its geometry can carry:

| Geometry | Selection | Keyboard focus |
| --- | --- | --- |
| Waypoint rounded square | static 1.25× enlargement + selection seat; availability fill is unchanged and the solid badge stays fixed | one silhouette shell made from a surface contrast underlay + `--color-semantic-focus-indicator` |
| Robot pose | static 1.25× body enlargement + selection seat; exception glyph stays fixed | one outer high-contrast double ring |
| Facility / hazard pin | static 1.25× body enlargement + selection seat; facility/severity fill and the status badge stay unchanged | outer contrast-backed silhouette ring |
| Region | wider semantic-color boundary; pattern and category tint remain unchanged | wider focus outline |
| Lane / route / trajectory | wider semantic-color core plus neutral casing | wider solid focus halo under the status path |

Every point marker uses **one selection scale (1.25×)** and one **selection
seat**: the marker's own silhouette re-drawn behind it as a
`--viewer-surface-elevated` die-cut matte with a hairline `--viewer-border` rim
(`NAV_SELECTION.seat`). Scale is a relative cue — obvious beside an unselected
sibling, invisible on a marker alone on a map — so the seat carries the absolute
"this one is selected" reading. It sits behind the silhouette, which is why it
can coexist with the hazard severity double edge (no third coloured outline) and
with the blue focus shell (different colour, different layer).

Compact markers never stack status badges. The waypoint is the strictest case:

- selection enlarges the complete marker body and role icon from 20px to 25px;
- focus contributes one visible outer shell;
- the most specific role occupies the interior as a consistent SVG icon using
  **`charger > parking > holding > passthrough`**;
- availability uses one solid fill color;
- data quality uses one top-right 12px solid badge with priority
  **`invalid > stale`**, never two stacked badges;
- unavailable uses a muted fill, and disabled keeps the shared opacity
  treatment.

The accessible name still announces every role and true state even when the
marker shows only the primary role icon, availability fill, and highest-priority
data-quality badge.
Point-marker selection uses a one-shot 160ms ease-out scale transition; path and
region selection use the same duration for stroke-width changes. Both become
immediate under `prefers-reduced-motion` and never repeat. A pulse is not a
selection, focus, or static severity cue; reserve repeating motion for an
explicitly modeled live alarm or activity state.

### 4.1 Four independent state axes

Every interactive map renderer keeps the following axes separate in DOM hooks,
accessible naming, and paint:

1. **Highlight preview** — transient pointer or linked-list preview, exposed
   through `data-highlighted`. RobotPose uses a small 1.08× body enlargement
   without creating keyboard focus or selection.
2. **Selection** — persistent product choice, exposed through `data-selected`
   and `aria-pressed` when the fragment is interactive.
3. **Keyboard focus** — transient input location, mirrored from
   `:focus-visible` or the controlled `focused` prop and painted with the focus
   token. Point/pin geometry adds a wider surface contrast underlay.
4. **Data/operation state** — availability, validation, freshness, lifecycle,
   or severity. It remains on the base stroke/fill, dash, slash, or state badge
   and never substitutes for selection or focus.

Co-occurrence is expected: highlighting an object must not manufacture keyboard
focus, selecting it must not erase its focus or data state, and focusing it must
not manufacture selection. Storybook interaction
tests assert the axes independently for waypoint, robot pose, facility, hazard,
lane, route, trajectory, and region renderers.

---

## 5. Color hierarchy

Reserve the alarm hue for alarms.

| Tone | Reserved for |
| --- | --- |
| **danger** (`--viewer-danger`) | **위험 · 금지 · 차단 · 데이터 오류** — hazard *danger*, keep-out region, blocked/conflict trajectory/lane, and invalid region boundary/fill |
| **warning** (`--viewer-warning`) | caution · limit · availability unknown |
| **muted** (`--viewer-muted`) | **operationally unavailable**, unknown body/outline, planned, inactive/stale |
| **accent** (`--viewer-accent`) | current · active · facility-available; selection does not borrow this semantic color |
| **positive** (`--viewer-positive`) | completed lifecycle outside Route phase encoding |

**"Can't use right now" is not an alarm.** Operational unavailability
desaturates to **muted** (the greyed-out convention) and does not borrow danger
red. A facility pin retains its white-knockout slash; the smaller waypoint uses
only its muted fill and announces the full state in text/accessibility
metadata.

**`invalid` is not a whole-object repaint.** A data-quality error shows as a red
`!` badge on renderers with a badge slot (plus `aria-invalid`). It does **not**
recolor a whole line to danger. Painting every element red stacked two signals in one spot and
made an invalid-but-active line indistinguishable from a blocked one. Lifecycle
*conditions* (blocked, conflict) still tone Trajectory and Lane danger; Route
condition remains a detail-level fact.

**Hazard severity is a classification, not a live alarm.** A static hazard uses
the cautionary or danger fill and exposes the severity in its accessible name;
it does not add a persistent ring or pulse. Motion is reserved for a separately
defined real-time `activeAlarm` state so a registered danger location never
pretends that an alarm event is currently firing.

---

## 6. Shared silhouettes: one graph entity, one symbol

A given graph entity reads as the same shape wherever it appears:

- **Graph node** = the `NAV_NODE` rounded square. A `WaypointMarker` draws it at
  `radius` 10 with a 4px corner radius; a lane endpoint (which references a
  waypoint by id) draws the same shape at `endpointRadius` 4. Never a circle in
  one place and a rounded square in another. Waypoint availability changes its
  solid fill; the primary role is a surface-knockout vector icon inside the same
  silhouette, and invalid/stale data quality overlaps its top-right corner as a
  single 12px solid badge.
- **Map pin** = `NAV_PIN.path`, shared by facility and hazard so they read as
  one marker family; severity/availability fill and the knockout glyph — not a
  different outline — distinguish them.

---

## 7. Regions: fill, then hatch

A region must read as an *area*, not a few stray lines, when zoomed out or laid
over the map's own grid:

- A faint **base tint** (`fillOpacity` ~0.1 in the region's tone) under the
  category hatch.
- Category hatch on top: behavior `diagonal`, terrain `contour`, facility
  **`dot`** (a dot field — *not* a grid, which would collide with the map
  canvas's own square grid and read as empty map).
- State uses color only on the outline and faint base tint: `invalid` uses
  `--viewer-danger`, while `stale`, disabled, and unknown traversability use
  `--viewer-muted`.
- Regions never render a floating state badge or a persistent pulse. The
  accessible name and product inspector retain the explicit state text.

---

## 8. Labels (annotation layer)

`NavigationAnnotationLayer` is the public composition boundary; individual
route, trajectory, waypoint, facility, lane, region, and robot-pose labels stay
internal to their renderer. A map that composes two or more of these overlays
places their shared SVG stage below one layer. Standalone overlays remain
pixel-compatible when no provider is present.

### 8.1 External category evidence

This contract adapts, rather than copies, the following authoritative map-label
systems:

- [Mapbox label placement](https://docs.mapbox.com/help/dive-deeper/optimize-map-label-placement/)
  establishes collision avoidance, ordered variable anchors, radial offset,
  sort priority, and hiding when no valid placement remains.
- [ArcGIS Standard Label Engine](https://pro.arcgis.com/en/pro-app/3.6/help/mapping/text/label-with-the-standard-label-engine.htm)
  establishes label priority, feature weights, buffer, alternate placement,
  and removal before overlap.
- [QGIS label settings](https://docs.qgis.org/4.2/en/docs/user_manual/style_library/label_settings.html)
  establishes obstacle weights, scale/pixel visibility, fallback placements,
  z-order, and callouts for placements that no longer read as attached.
- [OGC Testbed-14 Symbology Engineering Report](https://docs.ogc.org/per/18-029.html)
  confirms `labelObstacle` and priority as portable symbology concepts.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and
  [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color)
  require sufficient text/graphic contrast and a non-color channel for state.

The LDS adaptation deliberately omits automatic callout leaders in v1. A
leaderless fine adjustment is capped at 24 CSS px; a farther arbitrary move
would break feature association, so the label is hidden instead. A named
quadrant or along-path fallback is an alternate anchor, not an unbounded nudge.

### 8.2 Deterministic placement contract

Labels are placed greedily by `(priority desc, kind-weight desc, id asc)`.
Registered marker, status-badge, robot-pose, waypoint, facility,
map-header, north-indicator, and scale-bar rectangles are immovable obstacles.
Route, trajectory, and lane strokes are sampled as narrow screen-space
obstacles as well, so a label cannot technically clear another label while
still painting across the path. Every label/label, label/chrome, and label/path
pair keeps an 8 CSS px buffer. Labels also stay inside a 16px SVG safe inset.

Candidate order is stable:

| Kind | Placement candidates |
| --- | --- |
| route segment | above → below |
| trajectory | above → below → leading/trailing along-path fallback |
| waypoint, facility, robot pose | top-right → top-left → bottom-right → bottom-left |
| lane, region | natural centered/normal placement only; hide if it fails |

Each candidate may receive a deterministic 2D fine nudge in 8px increments up
to 24px. If every candidate still collides, only that decorative label is
suppressed. Geometry, state badges, hit targets, accessible names, and the
ordinary-text semantic mirror do not change.

### 8.3 Priority and density

State tiers are strict: **danger/error > keyboard focus > selection > ordinary
map context**. Inside the ordinary tier the order is robot pose >
current route segment > active trajectory > other context >
background lane/region. Kind weight only breaks a remaining tie.

Density is explicit, not inferred from an unreliable raw viewport scale:

| `detailMode` | Default visible context |
| --- | --- |
| `overview` | danger, focus, selection, current segment, active trajectory |
| `standard` | overview set + key waypoint/facility and upcoming context |
| `detail` | standard set + completed route, lane, and region context when it fits |

Visual copy is also density-aware. Standard waypoint and trajectory names use
a single ellipsized line, while facility annotations render at most one primary
and one status line. Detail mode restores full waypoint/trajectory names, but
facility annotations still cap at two visible lines; complete operational state
remains in the accessible name and belongs in the selection inspector, not as a
permanent map paragraph.

Danger, focused, and selected labels bypass density filtering but still
participate in collision placement. On the Route overview fixture
`교차로 → Lift A` and `Robot 2 예상 궤적` remain eligible but may yield when
their only placements cross a route/trajectory stroke; completed
`입구 → 교차로` yields by density until detail mode or direct attention.
Executor percentage is not an operational map annotation.

All navigation renderers use the same progressive-disclosure policy before
collision placement. `NavigationAnnotationLayer` owns the default and
Waypoint, RobotPose, HazardMarker, FacilityTransition, SpatialRegion, Lane,
Route, and Trajectory inherit it:

- `labelVisibility="interaction"` is the default. Names appear only for
  pointer hover, keyboard focus, or selection. Safety and data-quality state
  stay continuously legible through geometry, pattern, color, state badges,
  and accessible names rather than forced visible text.
- `priority` is an explicit product override that also reveals
  renderer-defined operational priority. `always` and `hidden` are explicit
  documentation/product overrides.
- Hover and focus reveal the primary name only. Secondary annotations
  default to `detailVisibility="selected"` and belong to the persistent
  selection or priority state; `always` and `hidden` remain explicit overrides.
- Touch has no hover dependency: tap activation selects the map object and
  keeps its label visible. Complete identity and state remain in the accessible
  name even while visual text is hidden.
- Lane endpoint identity belongs to `WaypointMarker`, not `LaneOverlay`.
  Product maps compose the referenced waypoint objects at the first/last Lane
  points. `showEndpoints` defaults to `false`; its circle/square fallback is
  retained only for isolated diagnostics and legacy compatibility.
- Graph input must pass `assertNavigationMapGraph` at the adapter/store boundary.
  Every `Lane.entry/exit.waypointId` resolves to a Waypoint on the same map at
  the Lane's first/last coordinate. A Route segment either resolves an ordered
  `laneIds` chain or supplies both `entryWaypointId` and `exitWaypointId`.
  Adjacent same-map Route segments share that waypoint; cross-map adjacency
  shares one `FacilityTransition` whose endpoints resolve the two Waypoints.
  Invalid references are data errors, never a reason to render a substitute
  entry/exit glyph. See `NavigationMapGraph` and `check:navigation-graph`.
- The transient name is still a `NavigationAnnotationBlock`, not a generic
  HTML tooltip, so it obeys the shared collision, safe-inset, and priority
  contract.

The legacy `showLabel` prop remains as a compatibility bridge: explicit
`true` maps to `labelVisibility="always"` plus
`detailVisibility="always"`, explicit `false` maps to `hidden`, and explicit
visibility policies win when both are supplied.

### 8.4 Validation contract

The annotation stories cover 540px and 320px surfaces, long Korean labels,
light/dark Route composition, density tiers, no-provider parity, and a compound
danger + focus + selection cluster. Acceptance is:

- no expanded label/label, label/chrome, or label/path overlap at an 8px buffer;
- no leaderless fine nudge over 24px;
- no horizontal overflow at 320px;
- standalone no-provider output stays uncoordinated;
- suppression never removes the feature's accessible name;
- label text remains at least 4.5:1 and non-text state graphics at least 3:1.

---

## Appendix A — Waypoint role pictograms

*Status: all primary-role pictograms shipped. `_navigationRoleGlyph` owns the
font-independent shapes and `ROLE_GLYPH_KINDS` is the roster.*

The 20px waypoint rounded square carries one surface-knockout role icon over its
solid availability fill. A data-quality 12px solid badge may overlap the top-right
corner without replacing that role:

| Role | Icon |
| --- | --- |
| holding | pause bars |
| passthrough | forward arrow |
| parking | vector `P` |
| charger | bolt |

When roles overlap, the marker shows one primary icon using
`charger > parking > holding > passthrough`. The full role set remains in the
accessible name and inspector data. The map legend draws the same four vector
icons; it never asks operators to decode H/T/P/C from the map.

`ROLE_CODE` remains the stable internal/data-attribute and serialization
identifier, while `ANNOTATION_CODE` supplies compact secondary annotation text.
Neither registry is a visual Foundation asset. Their value and role-glyph parity
are guarded by `scripts/check-navigation-encoding.mjs`; the Waypoint and its
legend stories own the actual vector-role and annotation presentation.

---

## Appendix B — Referenced siblings

- `docs/NAVIGATION_ATOMIZATION_PLAN.md` — the atomization roadmap the vocabulary
  SCOPE RULE points to (companion doc; create alongside if it is still pending).
