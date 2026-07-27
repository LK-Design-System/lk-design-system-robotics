# LDS Robotics selection / focus audit

This audit separates persistent selection from transient keyboard focus across
the package. It records the current ownership boundary so future components do
not reuse focus chrome as a selected state.

## Navigation SVG renderers

| Component | Selection | Focus | Result |
| --- | --- | --- | --- |
| `WaypointMarker` | static 1.25× enlargement from 20px to 25px; availability fill is unchanged and the exception badge stays fixed | contrast-backed rounded-square shell | Conforms; primary role is an internal vector icon and compound data quality uses one prioritized top-right 12px solid badge |
| `RobotPoseMarker` | static 1.15× body enlargement; status badge stays fixed | outer surface + focus double ring | Conforms |
| `FacilityTransition` | static 1.12× pin-body enlargement; the prioritized solid status badge stays fixed | outer surface + focus silhouette ring | Conforms |
| `HazardMarker` | static 1.12× pin-body enlargement; severity fill is unchanged | outer surface + focus silhouette ring | Conforms; static severity adds no alarm ring or pulse |
| `LaneOverlay` | wider semantic-color core + neutral casing | wider solid focus halo | Conforms |
| `RouteOverlay` | same-width plan-color dash + wider neutral casing | wider solid segment focus halo | Conforms |
| `TrajectoryOverlay` | wider semantic-color path + neutral casing | wider solid focus halo | Conforms |
| `SpatialRegion` | wider semantic-color boundary; pattern and tint stay unchanged | wider focus outline | Conforms |

All interactive SVG fragments mirror native `:focus-visible`, suppress the
duplicate rectangular browser outline, keep `aria-pressed` for selection, and
preserve controlled `selected` / `focused` props for passive renderers.

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
