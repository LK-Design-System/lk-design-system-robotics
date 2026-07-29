# Fleet UI reference and implementation plan

Status: Phase 0–2 first increment implemented  
Research date: 2026-07-28  
Target package: `@lk-robotics/lds-robotics-ui`

Implemented in this increment:

- Fleet state axes and TypeScript contracts.
- `FleetHealthSummary` and `FleetRobotRow`.
- `RobotStatusCard` comfortable/compact/single-line densities, canonical
  connection state, and an accessible status-detail channel; `FleetRobotRow`
  composes its compact variant without replacing the card anatomy.
- A controlled summary/filter/list/map Storybook composition with synchronized
  selection and highlighting. The map uses LDS `Map2DCanvas`,
  `OccupancyMapLayer`, `SpatialRegion`, `LaneOverlay`, and `RobotPoseMarker`
  rather than Story-only floor-plan SVG.
- Deterministic 10-robot heterogeneous and 100-robot density fixtures.
- Desktop and narrow responsive layouts.

Deferred to later increments:

- Loading, empty, partial-data, and saved-view compositions.
- Incident triage and synchronized replay.
- Command lifecycle, control ownership, and multi-target review.
- Mission queues and traffic-conflict presentation.

## 1. Decision

LDS already has strong single-robot presentation and operation primitives. The
next gap is not another generic dashboard card. It is a fleet domain layer that
lets products:

1. see the state of many robots,
2. find the robot that needs attention,
3. keep list, map, mission, incident, and time context synchronized,
4. drill into the existing single-robot viewer and manual-control components,
5. perform fleet actions without hiding eligibility, authority, or partial
   failure.

The implementation should therefore add fleet semantics, focused fleet
components, and reference compositions. It should not copy a vendor dashboard
or introduce transport, scheduling, traffic-control, or safety logic into the
design system.

## 2. Current LDS baseline

### Already available

- `RobotStatusCard`: compact single-robot identity, connection, battery, mode,
  and selection.
- `ConnectionBadge`, `BatteryGauge`, `TelemetryValue`, `TelemetryGauge`:
  connection and scalar telemetry presentation.
- `ViewerFrame`, `VideoStreamTile`, `Map2DCanvas`, `Scene3DFrame`,
  `ViewerToolbar`: live visual sources with independent availability,
  connection, freshness, and playback axes.
- `ManualControlSession`, `Joystick`, `DirectionalPad`: authority, arm,
  deadman, focus release, link loss, and stop-request lifecycle.
- `OccupancyMapLayer`, `RobotPoseMarker`, `RouteOverlay`,
  `TrajectoryOverlay`, `LaneOverlay`, `SpatialRegion`, `WaypointMarker`,
  `FacilityTransition`, `HazardMarker`: renderer-neutral 2D navigation
  vocabulary.
- Product primitives such as `DataGrid`, `FilterBar`, `SavedViewControl`,
  `DashboardShell`, `PrimaryDetail`, `DockPanel`, `Timeline`, `StatusBadge`,
  and `ConfirmDialog`.

### Missing or incomplete

- A fleet state contract shared by heterogeneous robots.
- Fleet-level health and attention roll-up.
- A dense fleet row that exposes mission, incident, freshness, and
  intervention context.
- A canonical list-to-map selection and filtering composition.
- Fleet incident triage and mission tracking compositions.
- A synchronized playback controller shared by map, video, telemetry, logs,
  and events. The existing `Timeline` is an event list, not a playback
  timeline.
- Operator identity, control ownership, and handoff presentation.
- A generic command lifecycle beyond the stop-specific lifecycle in
  `ManualControlSession`.
- Multi-target action review, eligibility, progress, and partial-result
  presentation.
- Traffic conflict, reservation, congestion, and queue presentation.

## 3. References and what LDS should learn from them

Only official product documentation, official product pages, or official
standards are used below.

### Formant

References:

- [Fleet observability](https://docs.formant.io/docs/fleet-observability)
- [Timeline](https://docs.formant.io/docs/getting-started-the-timeline)
- [Create a view and add modules](https://docs.formant.io/docs/getting-started-create-a-view-and-add-modules)
- [Build a teleoperation interface](https://docs.formant.io/en_US/docs/getting-started-build-a-teleoperation-interface)

Observed patterns:

- Devices are organized into groups and group views can aggregate live,
  historical, and analytical data.
- One view-level timeline drives multiple modules and can seek to an event,
  replay surrounding data, and change playback speed.
- Teleoperation separates display modules from control modules and exposes the
  current device and session state.

LDS application:

- Define controlled fleet scope and grouping semantics.
- Add a shared playback cursor contract instead of independent timelines per
  panel.
- Keep Observe and Operate as explicit product modes; reuse
  `ManualControlSession` as the operation boundary.

Do not copy:

- Formant's visual theme, fixed module catalogue, or application navigation.
- A configurable dashboard builder before LDS has stable fleet semantics.

### InOrbit

References:

- [Developer documentation](https://developer.inorbit.ai/docs)
- [Mission tracking tutorial](https://developer.inorbit.ai/tutorials)

Observed patterns:

- Fleet widgets are distinct from robot and navigation widgets.
- The documented fleet set includes fleet status, incident timeline, incident
  list, KPI, locations, audit log, and fleet mission tracker.
- Incident list and incident timeline synchronize and can drill into a
  historical “Time Capsule.”
- Tags conditionally adapt dashboards for heterogeneous robot types.
- A heterogeneous fleet may need summarized health instead of pretending all
  robots share identical status columns.

LDS application:

- Separate fleet, robot, navigation, mission, and replay scopes in stories and
  public contracts.
- Treat incident triage and replay as one workflow.
- Support heterogeneous rows through optional capabilities and slots, while
  keeping a small common state vocabulary.
- Add an explicit `unknown`/`unsupported` distinction; missing capability must
  not look like a fault.

Do not copy:

- InOrbit's configuration-as-code schema or full widget system.
- Product-specific KPI definitions.

### Boston Dynamics Orbit

References:

- [Orbit product page](https://bostondynamics.com/products/orbit/)
- [Orbit developer overview](https://dev.bostondynamics.com/docs/concepts/orbit/about_orbit.html)

Observed patterns:

- Facility maps combine live robot locations, missions, alerts, and inspection
  context.
- Fleet management connects mission editing and scheduling, remote operation,
  performance summaries, and multi-site aggregation.
- Mission and teleoperation history are retained as operational records.

LDS application:

- Make the map a first-class fleet selection surface, not a decorative panel.
- Provide a multi-site/site/fleet/robot hierarchy pattern.
- Preserve the transition from fleet alert to robot context to remote
  operation.

Do not copy:

- Spot-specific mission authoring or inspection-domain objects into the generic
  fleet layer.

### MiR Fleet and OTTO Fleet Manager

References:

- [MiR Fleet](https://mobile-industrial-robots.com/products/software/mir-fleet)
- [OTTO Fleet Manager](https://ottomotors.com/fleet-manager/)

Observed patterns:

- Fleet operation is task- and traffic-oriented, not only device-health
  monitoring.
- Assignment considers location and availability.
- Fleet systems expose mission priority, obstacles, route disruption,
  congestion avoidance, charging, and enterprise integration.
- MiR documents role permissions and audit logging as fleet-scale operational
  requirements.

LDS application:

- Keep robot health, task state, and traffic state as separate axes.
- Add mission queue and traffic stories after the fleet overview contract is
  stable.
- Design multi-target actions around eligibility and partial results.
- Reuse generic tables and filters before creating specialized queue
  components.

Do not copy:

- Scheduling, robot assignment, charging, routing, or deadlock algorithms.
  Those remain application/service responsibilities.

### Foxglove

References:

- [Events](https://docs.foxglove.dev/docs/data/events)
- [Layouts](https://docs.foxglove.dev/docs/visualization/layouts)
- [Fleet](https://foxglove.dev/product/fleet)

Observed patterns:

- Events are time ranges with typed properties, not only timestamped messages.
- Events appear on the playback bar and open the synchronized visualization at
  the relevant time range.
- Reusable layouts coordinate multiple panels and global variables.
- Live robot access and recorded-data investigation use related visual tools
  while remaining distinct modes.

LDS application:

- Model incidents/events with start and end time, category, severity, source,
  and robot identity.
- Define live versus replay mode explicitly.
- Put shared time selection in a controlled context so map, video, telemetry,
  and logs cannot silently display different moments.

Do not copy:

- A general developer visualization workbench. LDS only needs the playback and
  coordinated-selection contracts required by LK products.

### VDA 5050 and Open-RMF

References:

- [VDA 5050 version 3.0.0](https://www.vda.de/en/news/publications/publication/vda-5050)
- [Official VDA 5050 repository](https://github.com/VDA5050/VDA5050)
- [Open-RMF demos and dashboard](https://github.com/open-rmf/rmf_demos)

Observed patterns:

- VDA 5050 defines vendor-neutral order and state exchange between mobile
  robots and fleet control.
- Open-RMF validates the need to show robot states, active tasks, task
  dispatch, and shared traffic coordination for multiple fleets.

LDS application:

- Use these sources to validate naming and extensibility of the fleet state
  model.
- Keep protocol adapters outside presentation components.
- Make the UI model capable of representing vendor, serial identity,
  order/task state, position, connection, and reported errors without binding
  the component API directly to one protocol version.

Do not copy:

- VDA 5050 is not a safety standard and must not be treated as one.
- LDS must not implement fleet-control or traffic-deconfliction logic.

## 4. Proposed fleet state model

Do not derive the entire robot row from a single `status` value. Keep the
following axes orthogonal:

| Axis | Example values | Presentation responsibility |
| --- | --- | --- |
| Connection | connecting, connected, degraded, reconnecting, disconnected, failed | Reuse `ConnectionBadge` |
| Freshness | current, delayed, stale, unknown | Timestamp and freshness label |
| Operability | available, busy, blocked, unavailable, unknown | Can this robot accept work? |
| Mission | idle, queued, assigned, executing, paused, completed, failed, cancelled | Current work truth |
| Safety | normal, protective-stop, software-stop-requested, e-stopped, unknown | Safety-significant state label |
| Control | autonomous, supervised, manual, teleoperated, unavailable | Operating mode |
| Authority | unclaimed, requested, owned, denied, revoked, unknown | Control ownership truth |
| Attention | none, info, warning, critical | Derived triage priority only |

Rules:

- `attention` is a derived sorting and notification aid. It must not replace
  the source axes.
- Offline, stale, unavailable, and e-stopped are different truths.
- `unsupported` means a robot lacks a capability. `unknown` means the
  capability exists but its current truth is unavailable.
- All critical states use text and shape/icon in addition to color.
- Applications own source normalization and timestamps; LDS owns consistent
  presentation.

## 5. Implementation plan

### Phase 0 — Fleet contract and fixtures

Deliver:

- Type-only fleet domain contract for robot identity, capabilities, state axes,
  incidents, missions, and command results.
- Representative fixtures for:
  - homogeneous AMR fleet,
  - mixed AMR/quadruped fleet,
  - 100-robot dense fleet,
  - stale and partially disconnected fleet,
  - mixed capability fleet.
- A decision record defining `unknown`, `unsupported`, `stale`, `offline`,
  `blocked`, and `critical`.

Gate:

- The same model must support Formant-style observability, MiR/OTTO-style task
  operations, and VDA/Open-RMF-style heterogeneous identities without
  protocol-specific props.

### Phase 1 — Fleet overview primitives

Add to `lds-robotics-ui`:

- `FleetHealthSummary`
  - total, online, attention, unavailable, stale, and critical counts;
  - controlled filter activation;
  - no hidden derivation of source state.
- `FleetRobotRow`
  - dense identity and selection;
  - connection, freshness, operability, mission, battery, attention, and
    optional capability slots;
  - suitable for virtualization by the consuming application.
- `FleetAttentionBadge`
  - compact derived triage signal with accessible source summary.

Retain:

- `RobotStatusCard` as the compact single-robot picker. Do not turn it into a
  full fleet dashboard card.
- Let `FleetRobotRow` compose the compact `RobotStatusCard` without replacing
  its name / connection-and-battery / trailing-state anatomy; keep additional
  Fleet-only state in data attributes and the accessible description.

Compose from existing product primitives:

- `FilterBar`, `SavedViewControl`, `SearchField`, `Tag`, `DataGrid`,
  `DashboardShell`, `PrimaryDetail`.

Stories:

- Overview with summary + filters + dense list.
- Loading, empty, partial, stale, and offline-preserved states.
- Homogeneous versus heterogeneous columns.
- Narrow and 100-row density fixtures.

### Phase 2 — List, map, and detail synchronization

Add patterns and stories before adding more components:

- Controlled `selectedRobotIds`, `focusedRobotId`, and `activeRobotId`.
- List hover/focus and `RobotPoseMarker` focus parity.
- Site/floor filtering shared by list and map.
- Primary-detail drill-in that retains fleet filter and selection context.
- Multi-select visually separated from the single active robot.

Potential small primitive:

- `FleetScopeBreadcrumb` only if existing `Breadcrumb` composition cannot
  clearly express organization/site/fleet/robot.

Gate:

- Keyboard selection in the list must reveal the same robot on the map.
- Map selection must not reset filters or scroll context.
- A hidden or filtered robot must not remain an invisible active command
  target.

### Phase 3 — Incident triage and synchronized replay

Coordinate with `lds-product` for a generic controlled playback primitive:

- `PlaybackBar` or `PlaybackController`
  - live/replay mode,
  - cursor time,
  - visible time range,
  - play/pause,
  - speed,
  - seek to event,
  - explicit data coverage and gaps.

Add to `lds-robotics-ui`:

- `FleetIncidentRow`
  - robot, interval, severity, category, status, assignee, and freshness.
- `IncidentRangeMarker`
  - event range for the shared playback bar.
- A replay composition using existing map, video, telemetry, log, and timeline
  components.

Stories:

- Incident list + event ranges + synchronized robot map/video/telemetry.
- Data gap during an incident.
- Live-to-replay transition and return-to-live confirmation.

Gate:

- Every participating panel must expose the same cursor time and whether its
  content is current, missing, or stale at that time.

### Phase 4 — Command and control ownership

Add:

- `ControlOwnership`
  - owner identity, requested-by identity, lease/expiry, and handoff state.
- `CommandStatus`
  - queued, sent, accepted, executing, succeeded, failed, cancelled, expired.
- `FleetActionReview`
  - target count and explicit target list,
  - eligible/ineligible reasons,
  - permission and authority summary,
  - progress and partial-result presentation.

Integrate:

- A fleet row can enter the existing `ManualControlSession`.
- `ManualControlSession.authority` remains the safety gate; operator identity
  is additional context, not a replacement.

Application-owned:

- Authentication, authorization decisions, command transport, retry policy,
  watchdogs, E-stop guarantees, and audit persistence.

### Phase 5 — Mission and traffic patterns

Start with compositions using existing primitives:

- Mission queue using `DataGrid`, `StatusBadge`, and `Timeline`.
- Fleet map with routes, lanes, spatial regions, facilities, and robot poses.
- Traffic state legend and conflict details.

Add specialized components only after product fixtures prove repeated need:

- `MissionStatus`
- `TrafficConflictMarker`
- `ReservationOverlay`
- `TrafficZoneLegend`

Application-owned:

- Task assignment, priority calculation, route planning, congestion handling,
  reservation, deadlock detection, elevator coordination, and charging policy.

## 6. Package ownership

| Concern | Owner |
| --- | --- |
| Generic filters, grids, shells, dialogs, playback mechanics | `lds-core` / `lds-product` |
| Fleet robot, mission, incident, ownership, and traffic presentation | `lds-robotics-ui` |
| 2D robot/map overlays and coordinate projection | `lds-robotics-ui` |
| WebGL, Three/R3F lifecycle, point clouds, TF rendering | LDS3D |
| Fleet manager, robot adapters, ROS/VDA/RMF transport | Product/application |
| Scheduling, traffic algorithms, command execution, safety guarantees | Product/application/backend |

## 7. Validation matrix

Every fleet component or composition must be checked against:

- 1, 10, and 100+ robots.
- Light and dark viewer surroundings.
- Keyboard-only list/map navigation.
- Screen-reader names that retain robot identity and raw state.
- Color-independent warning and critical encoding.
- Long Korean and English robot/site/mission names.
- Mixed capabilities and unsupported fields.
- Stale data, clock skew, data gaps, reconnecting, and offline states.
- Partial command eligibility and partial command failure.
- Reduced motion.
- Visual regression at desktop and narrow widths.

## 8. Recommended first increment

The first implementation increment should contain only:

1. Fleet domain types and fixtures.
2. `FleetHealthSummary`.
3. `FleetRobotRow`.
4. A Storybook reference composition using existing filters, list, map, and
   `RobotStatusCard`/`RobotPoseMarker`.
5. Interaction and accessibility tests for list-map synchronization.

This increment proves the fleet overview and drill-down contract without
prematurely building mission scheduling, replay infrastructure, or bulk
command execution.
