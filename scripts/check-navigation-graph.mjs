import assert from 'node:assert/strict';
import {
  NavigationGraphError,
  assertNavigationMapGraph,
  validateNavigationMapGraph,
} from '../src/components/robotics/NavigationMapGraph.js';

const waypoint = (id, mapId, x, y) => ({ id, label: id, mapId, position: { x, y } });

const validGraph = {
  waypoints: [
    waypoint('wp-l1-entry', 'L1', 0, 0),
    waypoint('wp-l1-lift', 'L1', 100, 0),
    waypoint('wp-l2-lift', 'L2', 10, 10),
    waypoint('wp-l2-exit', 'L2', 60, 10),
  ],
  lanes: [
    {
      id: 'lane-l1', mapId: 'L1', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      entry: { waypointId: 'wp-l1-entry' }, exit: { waypointId: 'wp-l1-lift' },
    },
    {
      id: 'lane-l2', mapId: 'L2', points: [{ x: 10, y: 10 }, { x: 60, y: 10 }],
      entry: { waypointId: 'wp-l2-lift' }, exit: { waypointId: 'wp-l2-exit' },
    },
  ],
  facilityTransitions: [{
    id: 'lift-a', kind: 'lift', label: 'Lift A', facilityId: 'lift-a', availability: 'available',
    from: { mapId: 'L1', position: { x: 100, y: 0 }, waypointId: 'wp-l1-lift' },
    to: { mapId: 'L2', position: { x: 10, y: 10 }, waypointId: 'wp-l2-lift' },
    phase: 'moving', doorState: 'closed',
  }],
  routes: [{
    id: 'route-1', status: 'active',
    segments: [
      {
        id: 'segment-l1', mapId: 'L1', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        laneIds: ['lane-l1'], exitTransitionId: 'lift-a', phase: 'current',
      },
      {
        id: 'segment-l2', mapId: 'L2', points: [{ x: 10, y: 10 }, { x: 60, y: 10 }],
        laneIds: ['lane-l2'], entryTransitionId: 'lift-a', phase: 'upcoming',
      },
    ],
  }],
};

assert.equal(assertNavigationMapGraph(validGraph), true);

const danglingLane = structuredClone(validGraph);
danglingLane.lanes[0].exit.waypointId = 'missing-waypoint';
assert.throws(
  () => assertNavigationMapGraph(danglingLane),
  (error) => error instanceof NavigationGraphError
    && error.issues.some((issue) => issue.code === 'WAYPOINT_REFERENCE_MISSING'),
);

const shiftedEndpoint = structuredClone(validGraph);
shiftedEndpoint.lanes[0].points[1] = { x: 99, y: 0 };
assert.equal(
  validateNavigationMapGraph(shiftedEndpoint).issues.some((issue) => issue.code === 'WAYPOINT_COORDINATE_MISMATCH'),
  true,
);

const disconnectedRoute = structuredClone(validGraph);
disconnectedRoute.routes[0].segments[1].entryTransitionId = undefined;
assert.throws(
  () => assertNavigationMapGraph(disconnectedRoute),
  (error) => error instanceof NavigationGraphError
    && error.issues.some((issue) => issue.code === 'CROSS_MAP_TRANSITION_MISSING'),
);

console.log('Navigation graph contract passed (waypoint references, endpoint coordinates, route lane chains, and facility boundaries).');
