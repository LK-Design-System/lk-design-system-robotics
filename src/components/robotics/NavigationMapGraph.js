const DEFAULT_ENDPOINT_TOLERANCE = 0.001;

/**
 * A referential-integrity failure in a serializable navigation map graph.
 * Renderers deliberately do not repair these errors with substitute markers.
 */
export class NavigationGraphError extends Error {
  constructor(issues) {
    super(`Navigation map graph is invalid: ${issues.map((issue) => issue.code).join(', ')}.`);
    this.name = 'NavigationGraphError';
    this.code = 'NAVIGATION_GRAPH_INVALID';
    this.issues = Object.freeze(issues);
  }
}

function finitePoint(point) {
  return Number.isFinite(point?.x) && Number.isFinite(point?.y);
}

function pointDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function indexed(records, kind, issues) {
  const byId = new Map();
  for (const record of records ?? []) {
    const id = record?.id;
    if (typeof id !== 'string' || id.length === 0) {
      issues.push({ code: 'MISSING_ID', kind });
    } else if (byId.has(id)) {
      issues.push({ code: 'DUPLICATE_ID', kind, id });
    } else {
      byId.set(id, record);
    }
  }
  return byId;
}

function resolveWaypoint(waypoints, waypointId, owner, issues) {
  const waypoint = waypoints.get(waypointId);
  if (!waypoint) {
    issues.push({ code: 'WAYPOINT_REFERENCE_MISSING', owner, waypointId });
    return undefined;
  }
  if (!finitePoint(waypoint.position)) {
    issues.push({ code: 'WAYPOINT_POSITION_INVALID', owner, waypointId });
    return undefined;
  }
  return waypoint;
}

function verifyBoundary({ owner, boundary, waypoint, mapId, point, tolerance, issues }) {
  if (!waypoint) return;
  if (waypoint.mapId !== mapId) {
    issues.push({
      code: 'WAYPOINT_MAP_MISMATCH', owner, boundary, waypointId: waypoint.id,
      expectedMapId: mapId, actualMapId: waypoint.mapId,
    });
  }
  if (!finitePoint(point)) {
    issues.push({ code: 'BOUNDARY_COORDINATE_INVALID', owner, boundary });
  } else if (pointDistance(point, waypoint.position) > tolerance) {
    issues.push({
      code: 'WAYPOINT_COORDINATE_MISMATCH', owner, boundary, waypointId: waypoint.id,
      tolerance, point, waypointPosition: waypoint.position,
    });
  }
}

function endpointWaypointId(endpoint) {
  return typeof endpoint?.waypointId === 'string' && endpoint.waypointId.length > 0
    ? endpoint.waypointId
    : undefined;
}

function transitionConnectsWaypoints(transition, firstWaypointId, secondWaypointId) {
  const fromId = endpointWaypointId(transition?.from);
  const toId = endpointWaypointId(transition?.to);
  return (fromId === firstWaypointId && toId === secondWaypointId)
    || (fromId === secondWaypointId && toId === firstWaypointId);
}

/**
 * Inspect graph data without throwing. Call assertNavigationMapGraph at the
 * adapter/store boundary before passing data to map renderers.
 */
export function validateNavigationMapGraph(graph, options = {}) {
  const issues = [];
  const tolerance = Number.isFinite(options.endpointTolerance) && options.endpointTolerance >= 0
    ? options.endpointTolerance
    : DEFAULT_ENDPOINT_TOLERANCE;
  const waypoints = indexed(graph?.waypoints, 'waypoint', issues);
  const lanes = indexed(graph?.lanes, 'lane', issues);
  const transitions = indexed(graph?.facilityTransitions, 'facilityTransition', issues);
  const routes = indexed(graph?.routes, 'route', issues);

  for (const waypoint of waypoints.values()) {
    if (typeof waypoint.mapId !== 'string' || !finitePoint(waypoint.position)) {
      issues.push({ code: 'WAYPOINT_INVALID', waypointId: waypoint.id });
    }
  }

  for (const lane of lanes.values()) {
    const owner = `lane:${lane.id}`;
    if (!Array.isArray(lane.points) || lane.points.length < 2 || !lane.points.every(finitePoint)) {
      issues.push({ code: 'LANE_GEOMETRY_INVALID', owner });
      continue;
    }
    const entryId = endpointWaypointId(lane.entry);
    const exitId = endpointWaypointId(lane.exit);
    if (!entryId || !exitId) {
      issues.push({ code: 'LANE_ENDPOINT_REFERENCE_MISSING', owner });
      continue;
    }
    const entry = resolveWaypoint(waypoints, entryId, owner, issues);
    const exit = resolveWaypoint(waypoints, exitId, owner, issues);
    verifyBoundary({ owner, boundary: 'entry', waypoint: entry, mapId: lane.mapId, point: lane.points[0], tolerance, issues });
    verifyBoundary({ owner, boundary: 'exit', waypoint: exit, mapId: lane.mapId, point: lane.points.at(-1), tolerance, issues });
  }

  const referencedTransitionIds = new Set();
  const validateTransitionReference = (transitionId, owner, firstWaypointId, secondWaypointId) => {
    if (!transitionId) return;
    referencedTransitionIds.add(transitionId);
    const transition = transitions.get(transitionId);
    if (!transition) {
      issues.push({ code: 'FACILITY_TRANSITION_REFERENCE_MISSING', owner, transitionId });
    } else if (firstWaypointId && secondWaypointId && !transitionConnectsWaypoints(transition, firstWaypointId, secondWaypointId)) {
      issues.push({ code: 'FACILITY_TRANSITION_BOUNDARY_MISMATCH', owner, transitionId, firstWaypointId, secondWaypointId });
    }
  };

  for (const transition of transitions.values()) {
    for (const [boundary, endpoint] of [['from', transition.from], ['to', transition.to]]) {
      if (!endpoint) continue;
      const waypointId = endpointWaypointId(endpoint);
      if (!waypointId) continue;
      const waypoint = resolveWaypoint(waypoints, waypointId, `facilityTransition:${transition.id}`, issues);
      verifyBoundary({
        owner: `facilityTransition:${transition.id}`,
        boundary,
        waypoint,
        mapId: endpoint.mapId,
        point: endpoint.position,
        tolerance,
        issues,
      });
    }
  }

  for (const lane of lanes.values()) {
    for (const transitionId of [...(lane.entry?.transitionIds ?? []), ...(lane.exit?.transitionIds ?? [])]) {
      const endpointId = lane.entry?.transitionIds?.includes(transitionId)
        ? endpointWaypointId(lane.entry)
        : endpointWaypointId(lane.exit);
      validateTransitionReference(transitionId, `lane:${lane.id}`, endpointId, undefined);
    }
  }

  for (const route of routes.values()) {
    if (!Array.isArray(route.segments) || route.segments.length === 0) {
      issues.push({ code: 'ROUTE_SEGMENTS_MISSING', routeId: route.id });
      continue;
    }
    const segmentIds = new Set();
    let previous;
    for (const segment of route.segments) {
      const owner = `route:${route.id}/segment:${segment?.id ?? '?'}`;
      if (!segment?.id || segmentIds.has(segment.id)) issues.push({ code: 'DUPLICATE_SEGMENT_ID', owner });
      segmentIds.add(segment?.id);
      if (!Array.isArray(segment?.points) || segment.points.length < 2 || !segment.points.every(finitePoint)) {
        issues.push({ code: 'ROUTE_SEGMENT_GEOMETRY_INVALID', owner });
        continue;
      }
      const laneIds = segment.laneIds?.filter(Boolean) ?? [];
      let entryId = endpointWaypointId(segment.entryWaypointId ? { waypointId: segment.entryWaypointId } : undefined);
      let exitId = endpointWaypointId(segment.exitWaypointId ? { waypointId: segment.exitWaypointId } : undefined);
      if (laneIds.length > 0) {
        const chain = laneIds.map((laneId) => lanes.get(laneId));
        if (chain.some((lane) => !lane)) {
          for (const laneId of laneIds) if (!lanes.has(laneId)) issues.push({ code: 'LANE_REFERENCE_MISSING', owner, laneId });
          continue;
        }
        if (chain.some((lane) => lane.mapId !== segment.mapId)) {
          issues.push({ code: 'ROUTE_LANE_MAP_MISMATCH', owner, mapId: segment.mapId });
        }
        for (let index = 1; index < chain.length; index += 1) {
          if (endpointWaypointId(chain[index - 1].exit) !== endpointWaypointId(chain[index].entry)) {
            issues.push({ code: 'LANE_CHAIN_DISCONNECTED', owner, previousLaneId: chain[index - 1].id, laneId: chain[index].id });
          }
        }
        const derivedEntryId = endpointWaypointId(chain[0].entry);
        const derivedExitId = endpointWaypointId(chain.at(-1).exit);
        if (entryId && entryId !== derivedEntryId) issues.push({ code: 'ROUTE_ENTRY_REFERENCE_MISMATCH', owner, waypointId: entryId, laneWaypointId: derivedEntryId });
        if (exitId && exitId !== derivedExitId) issues.push({ code: 'ROUTE_EXIT_REFERENCE_MISMATCH', owner, waypointId: exitId, laneWaypointId: derivedExitId });
        entryId = derivedEntryId;
        exitId = derivedExitId;
      } else if (!entryId || !exitId) {
        issues.push({ code: 'ROUTE_BOUNDARY_REFERENCE_MISSING', owner });
        continue;
      }
      const entry = resolveWaypoint(waypoints, entryId, owner, issues);
      const exit = resolveWaypoint(waypoints, exitId, owner, issues);
      verifyBoundary({ owner, boundary: 'entry', waypoint: entry, mapId: segment.mapId, point: segment.points[0], tolerance, issues });
      verifyBoundary({ owner, boundary: 'exit', waypoint: exit, mapId: segment.mapId, point: segment.points.at(-1), tolerance, issues });
      if (previous) {
        if (previous.mapId === segment.mapId && previous.exitId !== entryId) {
          issues.push({ code: 'ROUTE_SEGMENTS_DISCONNECTED', routeId: route.id, previousSegmentId: previous.id, segmentId: segment.id });
        }
        if (previous.mapId !== segment.mapId) {
          if (!previous.exitTransitionId || previous.exitTransitionId !== segment.entryTransitionId) {
            issues.push({ code: 'CROSS_MAP_TRANSITION_MISSING', routeId: route.id, previousSegmentId: previous.id, segmentId: segment.id });
          } else {
            validateTransitionReference(previous.exitTransitionId, owner, previous.exitId, entryId);
          }
        }
      }
      if (segment.entryTransitionId) validateTransitionReference(segment.entryTransitionId, owner, undefined, undefined);
      if (segment.exitTransitionId) validateTransitionReference(segment.exitTransitionId, owner, undefined, undefined);
      previous = { id: segment.id, mapId: segment.mapId, exitId, exitTransitionId: segment.exitTransitionId };
    }
  }

  for (const transitionId of referencedTransitionIds) {
    const transition = transitions.get(transitionId);
    if (!transition) continue;
    if (!endpointWaypointId(transition.from) || !endpointWaypointId(transition.to)) {
      issues.push({ code: 'REFERENCED_TRANSITION_ENDPOINT_MISSING', transitionId });
    }
  }

  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues), endpointTolerance: tolerance });
}

/** Throw NavigationGraphError when a graph cannot safely be rendered as connected navigation data. */
export function assertNavigationMapGraph(graph, options) {
  const result = validateNavigationMapGraph(graph, options);
  if (!result.valid) throw new NavigationGraphError(result.issues);
  return true;
}
