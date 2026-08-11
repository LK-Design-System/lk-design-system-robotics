# LDS Robotics UI adoption contract

| Field | Value |
| --- | --- |
| Type | Robotics adoption delta |
| Status | Current |
| Owner | Robotics domain engineering |
| Last reviewed | 2026-08-09 |

This document adds Robotics-specific decisions to the shared LDS UI adoption contract. The shared six-facet contract and report schema are projected into [`package/`](package/) from a hash-pinned upstream LDS source; they are not re-authored here.

Component replacement alone is not LDS adoption completion.

## Required workflow

1. Inventory the complete requested route, surface, states, copy, assets, and interaction paths before editing.
2. Use `full-surface` for migration, conversion, restyling, parity work, or a material redesign of an existing surface. `changed-ui` is valid only for an explicitly bounded incremental adoption whose unchanged UI is outside scope.
3. Complete every decision in the six shared facets and component mapping. Record `not-applicable` with a concrete reason; `blocked` is not completion.
4. Complete each applicable Robotics decision in the table below and attach source, story, visual, token, asset, or check evidence that actually resolves in the consumer repository.
5. Verify normal and narrow viewports, light and dark appearance when supported, ready and non-ready states, keyboard/focus behavior, and reduced motion where motion exists.

## Robotics-specific decision map

| Concern | Required decision | Canonical source |
| --- | --- | --- |
| Coordinate boundary | Frame, map version, timestamp, projection proof, stale-data policy, and ROS/world/SVG/screen conversion owner | [`NAVIGATION_COORDINATE_CONTRACT.md`](NAVIGATION_COORDINATE_CONTRACT.md) |
| Navigation expression | Lane, route, trajectory, waypoint, robot pose, facility, hazard, and region vocabulary; color/non-color cue separation | [`NAVIGATION_EXPRESSION_CONVENTIONS.md`](NAVIGATION_EXPRESSION_CONVENTIONS.md) |
| Occupancy map | Free/occupied/unknown semantics, row order, origin, resolution, palette neutrality, and invalid-data behavior | [`OCCUPANCY_MAP_CONVENTIONS.md`](OCCUPANCY_MAP_CONVENTIONS.md) |
| Selection and focus | Static selection geometry, keyboard focus ownership, focus restoration, and non-color distinction | [`SELECTION_FOCUS_AUDIT.md`](SELECTION_FOCUS_AUDIT.md) |
| Overlay feedback | Non-blocking overlay scope, inert/pointer behavior, status semantics, and retained-content behavior | [`OVERLAY_STATUS_CHIP.md`](OVERLAY_STATUS_CHIP.md) |
| Units and telemetry | Unit source, locale formatting, precision, missing values, timestamp age, and accessible pronunciation | `LDS Robotics/Foundation/Unit Format` in Storybook |
| Domain symbols | Reuse the code-owned facility, hazard, marker, and state registries; record semantics and non-color cues | `docs/package/domain-symbol-registry.json` and the Robotics Foundation stories |
| Manual control and safety | UI session and feedback ownership versus product authorization, command transport, deadman, safety PLC, and emergency-stop authority | [`FLEET_UI_REFERENCE_PLAN.md`](FLEET_UI_REFERENCE_PLAN.md) |

## Ownership boundary

Robotics UI owns presentation and pure projection/validation helpers. Products own live data, permissions, workflows, commands, recovery policy, and safety authority. LDS3D owns WebGL, Three/R3F, camera controls, render loops, and 3D picking.

When adoption uncovers a missing shared component, semantic token, icon, asset, or cross-component pattern, document the seam and open separately scoped work in the owning LDS package. Do not create a local fork or silently expand a conversion task.

## Completion evidence

The report must use the packaged schema and checklist. Copy the report example and its sibling schema together so the relative `$schema` remains resolvable, replace every placeholder, and validate it with the pinned LDS conformance command. Story evidence must name an existing built Storybook ID; file-backed evidence must be a repository-relative path, not a prose command.
