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
| **Point** | Waypoint, Facility pin, Region | a **glyph badge** at a corner/anchor |

Lines do **not** wear lifecycle/condition/availability badges — the dash carries
those, and a badge on a polyline reads as clutter and collides with labels.
Points have no long stroke to dash, so a badge is their non-color channel.

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
Badge foundation story is that shape reference; the shapes render as badges only
on point elements (unknown / invalid / stale).

---

## 3. Arrows: one per line, in a fixed hierarchy

Three arrow families, three jobs — never interchange them:

1. **Direction chevron** (`NAVIGATION_DIRECTION_PATH`, a filled ►, 12×12px at
   viewportScale 1) — travel *heading* riding on the line. Its area centroid is
   the local origin, so rotation alone points it.
2. **Progress head** (`NAV_PROGRESS_HEAD`, an open ‹ casing+core V attached with
   `marker-end`) — the *current position* at the elapsed line's end.
3. **Endpoint orientation arrow** (`NAVIGATION_ENDPOINT_ORIENTATION_PATH`, a
   stroked shaft-and-head →) — a lane endpoint's approach orientation, pointing
   *away* from the path.

**One arrow per stretch of line.** The progress head already states direction on
its segment, so the chevron is *suppressed* wherever a progress head shows
(`isProgressSegment && progressHeadVisible`). A head-less line (a planned
trajectory) still gets a chevron.

**Layer deference.** When a composed viewer stacks a route/trajectory over the
lane it rides, the higher layer's arrow already states direction, so the lane's
own chevron is turned off (`showDirection={false}`). One corridor, one arrow.

Rank: **current position (head) > heading (chevron)**. The head is larger
(~18px) than the chevron (~12px) so position outranks heading visually.

---

## 4. Selection & focus: trace the silhouette, don't recolor meaning

Every marker class shows selection/focus as a ring that **traces its own
silhouette**, nested outside → in as *focus ⊃ selection ⊃ shape*, so selection
never overrides a meaning-carrying fill or stroke:

- **Pins** (facility, hazard): scale `NAV_PIN.path` — focus `1.34`, selection `1.16`.
- **Waypoint diamond**: scale the diamond — focus shell `1.5`
  (`NAV_FOCUS.waypointShellScale`), selection ring `NAV_NODE.selectionRingScale`
  `1.28`. The point keeps its surface fill + availability stroke in every state.
- **Region**: stroke the polygon outline (focus/selection widths in
  `NAV_FOCUS`/`NAV_SELECTION`), never refilling the pattern.
- **Line**: a translucent accent halo one tier wider on route.

Focus uses `--color-semantic-focus-indicator`; selection uses `--viewer-accent`.

---

## 5. Color hierarchy

Reserve the alarm hue for alarms.

| Tone | Reserved for |
| --- | --- |
| **danger** (`--viewer-danger`) | **위험 · 금지 · 차단 · 데이터 오류** — hazard *danger*, keep-out region, blocked route/trajectory/lane, `invalid` |
| **warning** (`--viewer-warning`) | caution · waiting · limit · availability unknown |
| **muted** (`--viewer-muted`) | **operationally unavailable**, unknown body/outline, planned, inactive/stale |
| **accent** (`--viewer-accent`) | current · active · facility-available · selection |
| **positive** (`--viewer-positive`) | completed |

**"Can't use right now" is not an alarm.** Operational unavailability
desaturates to **muted** (the greyed-out convention) and lets a **slash shape**
carry the meaning — it does not borrow danger red. Applied consistently to the
waypoint (muted stroke + foreground slash) and the facility pin (muted pin +
white-knockout slash). Only a genuine *data error* (`invalid`) keeps the danger
attention ring.

**Second channel for the top severity.** A `danger` hazard also wears a
persistent alarm halo (`NAV_PIN.alarmRing`, scale 1.5) that a `caution` hazard
does not — severity survives desaturation, not on fill hue alone.

---

## 6. Shared silhouettes: one graph entity, one symbol

A given graph entity reads as the same shape wherever it appears:

- **Graph node** = the `NAV_NODE` diamond. A `WaypointMarker` draws it at
  `radius` 7; a lane endpoint (which references a waypoint by id) draws the same
  diamond at `endpointRadius` 4. Never a circle in one place and a diamond in
  another.
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

Labels negotiate one deterministic vertical layout: placed greedily by
(priority desc, kind-weight desc, id asc); obstacles (marker/badge footprints)
are immovable; a label whose natural spot is free never moves; when every
candidate within `maxLabelDisplacementPx` collides, the label is **suppressed**
rather than displaced. Priority is state-first (`annotationPriority`): selected
outranks focused outranks alarm outranks emphasized; kind weight only breaks
ties. Identity is always preserved in the accessible name even when the visual
label is clipped or suppressed.

---

## Appendix A — Proposed: waypoint role pictograms (design, not yet built)

*Status: design for review. Tracks task "역할 픽토그램 도입 설계". Not implemented —
the recommended scope is deliberately narrow and needs a pick before building.*

**Today.** A waypoint's roles render as compact **letter codes** in the detail
line beside the marker (`H` holding · `T` passthrough · `P` parking · `C`
charger), from `ROLE_CODE` in `_navigationEncoding`. This is language-neutral and
compact, but `C`/`H`/`T` need the legend to decode.

**Finding.** Fleet-management UIs lean on pictograms for roles that have a
universal symbol; letter codes read as a decoder puzzle. But two caveats pull
against a wholesale conversion:

1. **`P` for parking is already a worldwide convention** — the letter *is* the
   pictogram. Converting it gains nothing.
2. The marker is a small diamond already carrying corner state badges; adding
   role glyphs *on* the node would crowd it.

**Recommendation — enhance the code line, don't move glyphs onto the node.**
Keep roles in the detail line, but swap the few codes that have an unambiguous
universal symbol for a small inline pictogram, following the facility
knockout-glyph precedent (`_FacilityGlyph`) for visual family:

| Role | Today | Proposed |
| --- | --- | --- |
| charger | `C` | ⚡ bolt pictogram |
| parking | `P` | keep `P` (already conventional) |
| holding | `H` | keep `H` (no universal symbol; revisit) |
| passthrough | `T` | keep `T` (no universal symbol; revisit) |

**Open decision (pick before building):**
- **A — minimal:** charger ⚡ only; everything else stays a code. Lowest risk,
  highest convention payoff.
- **B — full glyph set:** author a pictogram per role (new `_navigationRoleGlyph`
  atom), retire the letter codes. Bigger surface: new atom + `ROLE_CODE`
  migration + `Codes` foundation story rewrite + legend updates.

Either way: on-node placement is rejected (crowding); pictograms live in the
detail line at code size, and the accessible name keeps the full role words.

---

## Appendix B — Referenced siblings

- `docs/NAVIGATION_ATOMIZATION_PLAN.md` — the atomization roadmap the vocabulary
  SCOPE RULE points to (companion doc; create alongside if it is still pending).
