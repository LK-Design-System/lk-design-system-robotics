# LDS Robotics selection / focus audit

| Field | Value |
| --- | --- |
| Type | Audit |
| Status | Current |
| Owner | Robotics domain engineering |
| Last reviewed | 2026-07-30 |
| Source | `NAV_SELECTION` / `NAV_FOCUS` in `src/components/robotics/_navigationVocabulary.js` |

This audit separates persistent selection from transient keyboard focus across
the package. It records the current ownership boundary so future components do
not reuse focus chrome as a selected state.

## Navigation SVG renderers

| Component | Selection | Focus | Result |
| --- | --- | --- | --- |
| `WaypointMarker` | static 1.25× enlargement + selection seat; availability fill is unchanged and the exception badge stays fixed | contrast-backed rounded-square shell | Conforms; primary role is an internal vector icon and compound data quality uses one prioritized top-right 12px solid badge |
| `RobotPoseMarker` | static 1.25× body enlargement + selection seat; prioritized exception glyph stays fixed | outer surface + focus double ring | Conforms; routine state uses body tone and only fault/offline/stale/unknown/invalid retain a glyph |
| `FacilityTransition` | static 1.25× pin-body enlargement + selection seat; the prioritized solid status badge stays fixed | outer surface + focus silhouette ring | Conforms |
| `HazardMarker` | static 1.25× pin-body enlargement + selection seat; severity fill is unchanged | outer surface + focus silhouette ring | Conforms; static severity adds no alarm ring or pulse — the seat sits behind the silhouette, so `danger + selected` never becomes a triple coloured edge |
| `LaneOverlay` | wider semantic-color core + neutral casing | wider solid focus halo | Conforms |
| `RouteOverlay` | same-width plan-color dash + wider neutral casing | wider solid segment focus halo | Conforms |
| `TrajectoryOverlay` | wider semantic-color path + neutral casing | wider solid focus halo | Conforms |
| `SpatialRegion` | wider semantic-color boundary; pattern and tint stay unchanged | wider focus outline | Conforms |

Point-marker selection is one shared recipe owned by `NAV_SELECTION`: a 1.25×
enlargement (relative cue — visible next to unselected siblings) plus a
"selection seat", the marker silhouette re-drawn behind the body in
`--viewer-surface-elevated` with a hairline `--viewer-border` rim (absolute cue
— visible on a marker alone on a map). The seat lives behind the silhouette so
it stacks under semantic paint and stays clear of the blue focus ring.

All interactive SVG fragments mirror native `:focus-visible`, suppress the
duplicate rectangular browser outline, keep `aria-pressed` for selection, and
preserve controlled `selected` / `focused` props for passive renderers.
`RobotPoseMarker highlighted` is a separate transient linked-preview cue and
never sets `data-focused` or paints the keyboard focus ring. Like selection it
is a PAIR — 1.12× scale (`robotPoseHighlightScale`, relative) plus a standoff
hairline ring (`NAV_SELECTION.preview`, absolute). The pair exists because the
preview is usually driven from a linked list row: measured on the fleet console,
the scale grows the body 3.34px while the cursor that triggered it sits 771px
away, so scale alone left the operator hunting for which of ten markers moved.
The ring is suppressed while selected or focused (the seat and the accent ring
already own those markers) and sits outside the scale group so it holds still
while the body grows under it.

Motion policy: selection geometry is static — the scale transition that used to
apply to every selection-scale group ran on ARRIVAL for already-selected markers
(measured: ~1.3s of wrong geometry on a cold first paint, and a matching
intermittent failure in geometry assertions). Motion now applies only to the
preview scale, which is never true at mount.

## Robotics DOM surfaces

- `TopicTree`, editor toolbars, layer panels, floor selectors, and viewer
  toolbars delegate selection and roving focus to LDS Product/Core components.
  Their row/tool selection must not be reimplemented inside Robotics.
- `Joystick` and `ManualControlSession` use focus rings only for keyboard safety
  and do not expose a selected state.
- `RobotStatusCard` uses primary surface + border for persistent selection and a
  separate `:focus-visible` outline for keyboard focus. Its Storybook contract
  verifies the combined selected-and-focused state as well as `aria-pressed`.

## Review rule

When a component adds a state, first classify it as selection, keyboard focus,
data quality, availability, or live activity. Selection uses static geometry,
focus alone uses the focus color, and data/operation state owns semantic paint.
Add at most one visual channel per class, prioritize mutually competing data
badges, and never use repeating animation to stand in for static classification.
