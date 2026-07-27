# Navigation Expression Conventions

How the Robotics **Navigation** overlays encode meaning on a map. These are the
rules the renderers (`LaneOverlay`, `RouteOverlay`, `TrajectoryOverlay`,
`WaypointMarker`, `FacilityTransition`, `HazardMarker`, `SpatialRegion`) and the
`NavigationAnnotationLayer` follow so a single viewport reads as one system.

Scope: presentation only. Meaning (which lane is closed, which route is active)
is the product's; these conventions govern how that meaning is *drawn*. Values
live in the internal `_navigationVocabulary` module — importing it never changes
the public API.

---

## 1. One channel per question, and never color alone

Every state is carried by **at least one non-color channel** (shape, dash,
glyph, or opacity) so the map survives desaturation and red/green color-vision
deficiency. Color is a redundant reinforcement, never the sole signal. Each
convention below names its non-color channel explicitly.

---

## 2. Lines vs. points: where state lives

The single most load-bearing split.

| Element kind | Renderers | State lives as |
| --- | --- | --- |
| **Line** | Lane, Route, Trajectory | tone **+ `NAV_PATH_DASH` dash pattern** on the stroke |
| **Marker** | Waypoint, Facility pin, Robot pose | availability/identity on the body **+ at most one prioritized solid badge** |
| **Area** | Region | category/state on fill and outline **+ anchored data-quality marks when needed** |

Lines do **not** wear lifecycle/condition/availability badges — the dash carries
those, and a badge on a polyline reads as clutter and collides with labels.
Markers have no long stroke to dash, so one attached solid badge is their
non-color exception channel. They never grow a badge stack: each renderer
resolves its own priority into one visual slot while the accessible name
preserves every raw state. Waypoint uses `invalid > stale`; FacilityTransition
uses `invalid > stale > unknown`.

The only badges a line keeps are the two **data-quality flags**, `invalid` and
`stale`, exposed as `[data-*-overlay-state]` — a data error is not a lifecycle
state and has no dash of its own.

### `NAV_PATH_DASH` — the shared line-state scale

One scale, so the same meaning dashes the same on every path and co-occurring
states stay distinguishable at 2.5–4px strokes.

| Key | Pattern | Meaning |
| --- | --- | --- |
| `pending` | `2 6` | not yet traversed (route upcoming · trajectory planned) |
| `completed` | `7 4` | already traversed |
| `waiting` | `10 3 2 3` | paused, will resume |
| `conflict` | `5 3 1 3` | contested by another entity |
| `blocked` | `1 5` | cannot traverse (route/trajectory blocked · **lane closed** — the same pairing shares the `×` state glyph) |
| `rerouting` | `3 3` | being recalculated |
| `unknown` | `4 8` | traversability unknown (lane availability) |

The 11-shape `NavigationStateGlyph` set is still the canonical vocabulary for
these states — the dash *encodes* the state that the glyph *names*. The State
Badge foundation story is that shape reference. Compact markers attach at most
one solid badge; paths and areas use their own geometry channels.

---

## 3. Line roles are geometry, not color

The three line renderers must remain identifiable after color is removed:

1. **Lane** is quiet graph topology: a 1.5px neutral line with endpoint nodes.
   Its on-line direction chevron is opt-in for topology/debug views only.
2. **Route** is the selected graph plan: a 3.5–4.5px cased line with an open-V
   progress head only at the current plan boundary.
3. **Trajectory** is temporal telemetry: a 1.75–2.25px line punctuated by
   capped sample dots and a circular current-sample cursor.

Default Route and Trajectory views do not reuse `NAVIGATION_DIRECTION_PATH`.
Route segment order communicates plan direction, Trajectory sample order
communicates time, and RobotPose owns physical heading.

The remaining arrow families have separate jobs:

- `NAVIGATION_DIRECTION_PATH`: optional Lane topology/debug direction only.
- `NAV_PROGRESS_HEAD`: Route progress at the elapsed plan boundary.
- `NAVIGATION_ENDPOINT_ORIENTATION_PATH`: lane endpoint approach orientation.

Lane's default is `showDirection={false}`. A topology/debug tool may opt in only
when endpoint identity is hidden and direction would otherwise be ambiguous.

---

## 4. Selection and focus stay independent without growing a ring ladder

Selection is persistent product state; focus is a transient keyboard location.
They must remain independently visible, but they do not need identical chrome.
Each renderer chooses the smallest cue its geometry can carry:

| Geometry | Selection | Keyboard focus |
| --- | --- | --- |
| Waypoint rounded square | static 1.25× enlargement from 20px to 25px; availability fill is unchanged and the solid badge stays fixed | one silhouette shell made from a surface contrast underlay + `--color-semantic-focus-indicator` |
| Robot pose | static 1.15× body enlargement; status badge stays fixed | one outer high-contrast double ring |
| Facility / hazard pin | static 1.12× body enlargement; facility/severity fill and the status badge stay unchanged | outer contrast-backed silhouette ring |
| Region | wider semantic-color boundary; pattern and category tint remain unchanged | wider focus outline |
| Lane / route / trajectory | wider semantic-color core plus neutral casing | wider solid focus halo under the status path |

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

### 4.1 Three independent state axes

Every interactive map renderer keeps the following axes separate in DOM hooks,
accessible naming, and paint:

1. **Selection** — persistent product choice, exposed through `data-selected`
   and `aria-pressed` when the fragment is interactive.
2. **Keyboard focus** — transient input location, mirrored from
   `:focus-visible` or the controlled `focused` prop and painted with the focus
   token. Point/pin geometry adds a wider surface contrast underlay.
3. **Data/operation state** — availability, validation, freshness, lifecycle,
   or severity. It remains on the base stroke/fill, dash, slash, or state badge
   and never substitutes for selection or focus.

Co-occurrence is expected: selecting an object must not erase its focus or data
state, and focusing it must not manufacture selection. Storybook interaction
tests assert the axes independently for waypoint, robot pose, facility, hazard,
lane, route, trajectory, and region renderers.

---

## 5. Color hierarchy

Reserve the alarm hue for alarms.

| Tone | Reserved for |
| --- | --- |
| **danger** (`--viewer-danger`) | **위험 · 금지 · 차단 · 데이터 오류** — hazard *danger*, keep-out region, blocked/conflict route/trajectory/lane, and the `invalid` badge |
| **warning** (`--viewer-warning`) | caution · waiting · limit · availability unknown |
| **muted** (`--viewer-muted`) | **operationally unavailable**, unknown body/outline, planned, inactive/stale |
| **accent** (`--viewer-accent`) | current · active · facility-available; selection does not borrow this semantic color |
| **positive** (`--viewer-positive`) | completed |

**"Can't use right now" is not an alarm.** Operational unavailability
desaturates to **muted** (the greyed-out convention) and does not borrow danger
red. A facility pin retains its white-knockout slash; the smaller waypoint uses
only its muted fill and announces the full state in text/accessibility
metadata.

**`invalid` is not a whole-object repaint.** A data-quality error shows as a red
`!` badge on renderers with a badge slot (plus `aria-invalid`). It does **not**
recolor a whole line + progress
head to danger. Painting every element red stacked two signals in one spot and
made an invalid-but-active line indistinguishable from a blocked one. Lifecycle
*conditions* (blocked, conflict) still tone the line danger.

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
- State on the outline: `NAV_DASH` (`invalid` / `staleShape` / traversability
  `unknown`); `invalid`/`stale` also drop a corner badge.

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
Registered marker, progress-head, status-badge, robot-pose, waypoint, facility,
map-header, north-indicator, and scale-bar rectangles are immovable obstacles.
Route, trajectory, and lane strokes are sampled as narrow screen-space
obstacles as well, so a label cannot technically clear another label while
still painting across the path. Every label/label, label/chrome, and label/path
pair keeps an 8 CSS px buffer. Labels also stay inside a 16px SVG safe inset.

Candidate order is stable:

| Kind | Placement candidates |
| --- | --- |
| route segment | above → below |
| route progress | below → above → leading/trailing fallback |
| trajectory | above → below → leading/trailing along-path fallback |
| waypoint, facility, robot pose | top-right → top-left → bottom-right → bottom-left |
| lane, region | natural centered/normal placement only; hide if it fails |

Each candidate may receive a deterministic 2D fine nudge in 8px increments up
to 24px. If every candidate still collides, only that decorative label is
suppressed. Geometry, state badges, hit targets, accessible names, and the
ordinary-text semantic mirror do not change.

### 8.3 Priority and density

State tiers are strict: **danger/error > keyboard focus > selection > ordinary
map context**. Inside the ordinary tier the order is current route progress >
robot pose > current route segment > active trajectory > other context >
background lane/region. Kind weight only breaks a remaining tie.

Density is explicit, not inferred from an unreliable raw viewport scale:

| `detailMode` | Default visible context |
| --- | --- |
| `overview` | danger, focus, selection, current progress, current segment, active trajectory |
| `standard` | overview set + key waypoint/facility and upcoming context |
| `detail` | standard set + completed route, lane, and region context when it fits |

Visual copy is also density-aware. Standard waypoint and trajectory names use
a single ellipsized line, while facility annotations render at most one primary
and one status line. Detail mode restores full waypoint/trajectory names, but
facility annotations still cap at two visible lines; complete operational state
remains in the accessible name and belongs in the selection inspector, not as a
permanent map paragraph.

Danger, focused, and selected labels bypass density filtering but still
participate in collision placement. On the Route overview fixture the
highest-priority `현재 42%` remains visible. `교차로 → Lift A` and
`Robot 2 예상 궤적` remain eligible but may yield when their only placements
cross a route/trajectory stroke; completed `입구 → 교차로` yields by density
until detail mode or direct attention.

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
identifier. It is documented by the Codes foundation story but is no longer the
finished waypoint visual.

---

## Appendix B — Referenced siblings

- `docs/NAVIGATION_ATOMIZATION_PLAN.md` — the atomization roadmap the vocabulary
  SCOPE RULE points to (companion doc; create alongside if it is still pending).
