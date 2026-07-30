import React from 'react';
import {
  LaneOverlay,
  NavigationAnnotationLayer,
  NavigationCoordinateBoundary,
  RobotPoseMarker,
  RouteOverlay,
  TrajectoryOverlay,
  adaptWorldLaneToLane,
} from '../src/index.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import {
  ACTIVE_ROUTE,
  ACTIVE_ROBOT_POSE,
  ACTIVE_TRAJECTORY,
  PathMap,
  PROJECTED_FRAME_L1,
  ROUTE_TRANSFORM_L1,
  StoryPage,
  assertPathSystemVisualContract,
} from './RoboticsNavigationRouteTrajectory.shared.jsx';

const PATH_SYSTEM_LANES = [
  {
    id: 'lane-entry',
    points: [{ x: 4.4, y: 5.4 }, { x: 13, y: 5.4 }, { x: 19, y: 9.6 }],
    entry: 'entry',
    exit: 'junction',
  },
  {
    id: 'lane-corridor-b',
    points: [{ x: 19, y: 9.6 }, { x: 28.4, y: 13.8 }, { x: 45.6, y: 13.8 }],
    entry: 'junction',
    exit: 'lift-a',
  },
  {
    id: 'lane-branch-north',
    points: [{ x: 19, y: 9.6 }, { x: 26, y: 18.2 }, { x: 42, y: 18.2 }],
    entry: 'junction',
    exit: 'north-storage',
  },
  {
    id: 'lane-bypass',
    points: [{ x: 13, y: 5.4 }, { x: 23, y: 2.4 }, { x: 36, y: 2.4 }],
    entry: 'entry-split',
    exit: 'south-storage',
  },
].map((lane) => adaptWorldLaneToLane({
  id: lane.id,
  mapId: 'L1',
  points: lane.points,
  entry: { waypointId: lane.entry, orientation: 'unconstrained' },
  exit: { waypointId: lane.exit, orientation: 'unconstrained' },
  relation: { kind: 'single' },
}, { transform: ROUTE_TRANSFORM_L1 }));

const ACTIVE_ROUTE_LANE_IDS = new Set(
  ACTIVE_ROUTE.segments
    .filter((segment) => segment.mapId === 'L1')
    .flatMap((segment) => segment.laneIds ?? []),
);
const UNSELECTED_PATH_SYSTEM_LANES = PATH_SYSTEM_LANES.filter(
  (lane) => !ACTIVE_ROUTE_LANE_IDS.has(lane.id),
);

const MAX_NORMAL_CROSS_TRACK_M = 0.6;

function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function pointToPolylineDistance(point, points) {
  let distance = Infinity;
  for (let index = 1; index < points.length; index += 1) {
    distance = Math.min(distance, pointToSegmentDistance(point, points[index - 1], points[index]));
  }
  return distance;
}

const STAGES = [
  {
    id: 'lane',
    number: '01',
    name: 'Lane',
    role: '가능한 연결',
    description: '지도에 비교적 오래 유지되는 그래프 토폴로지입니다.',
  },
  {
    id: 'route',
    number: '02',
    name: 'Route',
    role: '선택된 계획',
    description: 'Lane 중 선택된 계획을 같은 굵기·점선의 계획색으로 표시하며 phase는 상세 정보에 남깁니다.',
  },
  {
    id: 'trajectory',
    number: '03',
    name: 'Trajectory',
    role: '시간 순 실행',
    description: '선택된 Route corridor 안에서 시간 순 sample과 실행 형상을 표시합니다.',
  },
];

function LaneNetwork({ viewportScale }) {
  return UNSELECTED_PATH_SYSTEM_LANES.map((lane) => (
    <LaneOverlay
      key={lane.id}
      lane={lane}
      showEndpoints={false}
      showLabel={false}
      viewportScale={viewportScale}
    />
  ));
}

function PathSystemLayers({ viewportScale }) {
  return (
    <NavigationCoordinateBoundary frame={PROJECTED_FRAME_L1}>
      <NavigationAnnotationLayer detailMode="overview">
        <LaneNetwork viewportScale={viewportScale} />
        <RouteOverlay
          route={ACTIVE_ROUTE}
          activeMapId="L1"
          viewportScale={viewportScale}
        />
        <TrajectoryOverlay
          trajectory={ACTIVE_TRAJECTORY}
          viewportScale={viewportScale}
        />
        <RobotPoseMarker
          pose={ACTIVE_ROBOT_POSE}
          viewportScale={viewportScale}
        />
      </NavigationAnnotationLayer>
    </NavigationCoordinateBoundary>
  );
}

function RoleCard({ stage }) {
  return (
    <article
      data-path-system-stage={stage.id}
      style={{
        display: 'grid',
        alignContent: 'start',
        gap: 'var(--space-3)',
        minWidth: 0,
      }}
    >
      <header style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 'var(--space-3)', alignItems: 'start' }}>
        <span
          aria-hidden="true"
          style={{
            color: 'var(--color-semantic-label-neutral)',
            fontSize: 'var(--caption1-size)',
            fontWeight: 'var(--fw-bold)',
            letterSpacing: '0.08em',
            paddingTop: 3,
          }}
        >
          {stage.number}
        </span>
        <span style={{ display: 'grid', gap: 2 }}>
          <strong style={{ color: 'var(--color-semantic-label-strong)', fontSize: 'var(--body1-size)' }}>
            {stage.name} · {stage.role}
          </strong>
          <span style={{ color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--body2-size)', lineHeight: 1.55 }}>
            {stage.description}
          </span>
        </span>
      </header>
    </article>
  );
}

const meta = {
  title: 'LDS Robotics/Navigation/Path System',
  tags: ['autodocs'],
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-path-system--overview',
      eyebrow: 'Robotics / Navigation / Path System',
      title: 'Lane → Route → Trajectory를 하나의 경로 체계로 읽습니다',
      description:
        '세 컴포넌트는 데이터 수명과 상호작용이 달라 분리하지만, 사용자가 한 지도에서 함께 해석하는 하나의 Path System으로 설계하고 검증합니다.',
      docsDescription:
        'Lane·Route·Trajectory를 독립적인 선 스타일이 아니라 topology → plan → temporal execution의 관계로 정의하는 통합 진입점입니다.',
    },
    docs: {
      description: {
        component:
          'Lane, Route, Trajectory의 의미·시각 우선순위·합성 순서를 한 화면에서 비교하는 Navigation Path System 문서입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '같은 map frame과 같은 이동 corridor에 Lane → Route → Trajectory → RobotPose를 누적해 각 계층의 책임을 비교합니다.',
  ),
  render: () => (
    <StoryPage
      title="경로 경험은 하나, 컴포넌트 계약은 셋입니다"
      description="Lane은 가능한 연결, Route는 그중 선택된 계획, Trajectory는 해당 corridor 안의 시간 순 실행입니다. Route는 Lane과 같은 1.5px·4 6 점선을 계획색으로 바꾸고, Trajectory는 얇은 실선과 sample로 구분합니다."
      maxWidth={860}
    >
      <section
        aria-label="Path System의 세 계층"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))',
          gap: 'var(--space-4)',
          minWidth: 0,
        }}
      >
        {STAGES.map((stage) => <RoleCard key={stage.id} stage={stage} />)}
      </section>
      <section data-path-system-map style={{ width: '100%', maxWidth: 580, minWidth: 0 }}>
        <PathMap
          label="Lane, Route, Trajectory 합성 지도"
          eyebrow="PATH SYSTEM · L1"
          height={270}
          svgHeight={250}
          annotationDetailMode="overview"
        >
          {(viewportScale) => <PathSystemLayers viewportScale={viewportScale} />}
        </PathMap>
      </section>
      <p data-current-position-owner style={{ margin: 0, color: 'var(--color-semantic-label-strong)', fontSize: 'var(--body2-size)', fontWeight: 'var(--fw-bold)', lineHeight: 1.6 }}>
        현재 위치와 heading은 독립 localization인 RobotPose만 표시합니다. Route 진행률·phase·condition은 상세 정보에서 확인하며 지도 선에는 투영하지 않습니다.
      </p>
      <p style={{ margin: 0, color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--body2-size)', lineHeight: 1.6 }}>
        정상 장면에서는 Trajectory와 RobotPose가 선택 Route에서 0.6m 이내에 있어야 합니다. 이를 벗어나면 정상 합성이 아니라 경로 이탈 상태로 처리합니다.
      </p>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Path System overview');
    const stages = canvasElement.querySelectorAll('[data-path-system-stage]');
    const map = canvasElement.querySelector('[data-path-system-map]');
    if (stages.length !== STAGES.length || !map) {
      throw new Error('Path System overview must render all three semantic stages.');
    }
    if (map.querySelectorAll('[data-navigation-line-role="lane"]').length !== UNSELECTED_PATH_SYSTEM_LANES.length
      || map.querySelectorAll('[data-navigation-line-role="route"]').length !== 1
      || map.querySelectorAll('[data-navigation-line-role="trajectory"]').length !== 1) {
      throw new Error('The composed map must contain topology, plan, and temporal execution together.');
    }
    if ([...map.querySelectorAll('[data-lane-id]')].some((lane) => ACTIVE_ROUTE_LANE_IDS.has(lane.getAttribute('data-lane-id')))) {
      throw new Error('A Lane selected by the active Route must be replaced by Route paint, not rendered underneath it.');
    }
    if (canvasElement.querySelector('[data-vector-glyph="direction"]')) {
      throw new Error('Path System overview must not restore generic on-line direction triangles.');
    }
    if (map.querySelector('[data-navigation-progress-head], [data-route-progress-label], [data-trajectory-time-cursor]')) {
      throw new Error('Operational Path System maps must not render route progress or trajectory playback position cues.');
    }
    if (map.querySelectorAll('[data-robot-pose-marker]').length !== 1) {
      throw new Error('RobotPose must be the only current-position owner in the Path System overview.');
    }
    const currentRoute = ACTIVE_ROUTE.segments.find(
      (segment) => segment.mapId === 'L1' && segment.phase === 'current',
    );
    const maxCrossTrackSvg = MAX_NORMAL_CROSS_TRACK_M * ROUTE_TRANSFORM_L1.svgUnitsPerMeter;
    const trajectoryRouteDistance = Math.max(
      ...ACTIVE_TRAJECTORY.samples.map((sample) => pointToPolylineDistance(sample.position, currentRoute.points)),
    );
    const robotRouteDistance = pointToPolylineDistance(ACTIVE_ROBOT_POSE.position, currentRoute.points);
    const robotTrajectoryDistance = pointToPolylineDistance(
      ACTIVE_ROBOT_POSE.position,
      ACTIVE_TRAJECTORY.samples.map((sample) => sample.position),
    );
    if (
      trajectoryRouteDistance > maxCrossTrackSvg
      || robotRouteDistance > maxCrossTrackSvg
      || robotTrajectoryDistance > maxCrossTrackSvg
    ) {
      throw new Error(
        `Normal Path System geometry left its corridor: trajectory=${trajectoryRouteDistance}, robot-route=${robotRouteDistance}, robot-trajectory=${robotTrajectoryDistance}.`,
      );
    }
    if (
      currentRoute.condition !== 'normal'
      || ACTIVE_TRAJECTORY.status !== 'active'
      || ACTIVE_ROBOT_POSE.state !== 'moving'
    ) {
      throw new Error('The operational overview must use one coherent normal/active/moving snapshot.');
    }
    const routePaths = [...map.querySelectorAll('[data-route-path]')];
    const routeStrokes = new Set(routePaths.map((path) => getComputedStyle(path).stroke));
    const routeWidths = new Set(routePaths.map((path) => path.getAttribute('stroke-width')));
    // The plan identity tone is RouteOverlay's ROUTE_IDENTITY_TONE, built on
    // --color-semantic-data-viz-series-5. This used to look for --viewer-route,
    // which is not a token: it appears only in prose and in this assertion, is
    // absent from the manifest's inheritedRuntimeCustomProperties, and is defined
    // nowhere - so `var(--viewer-route, …)` would always fall back and the check
    // could never pass. The intent (one identity tone, never a lifecycle tone,
    // Lane's width and dash) is unchanged.
    if (
      routePaths.some((path) => !path.getAttribute('stroke')?.includes('--color-semantic-data-viz-series-5'))
      || routePaths.some((path) => /positive|warning|cautionary/.test(path.getAttribute('stroke') ?? ''))
      || routePaths.some((path) => path.getAttribute('stroke-dasharray') !== '4 6' || path.getAttribute('opacity') !== '1')
      || routeStrokes.size !== 1
      || routeWidths.size !== 1
      || routeWidths.values().next().value !== '1.5'
    ) {
      throw new Error('Route must remain the same 1.5px 4 6 graph line as Lane, changing only to the plan identity tone.');
    }
    if (map.querySelector('[data-trajectory-label]')) {
      throw new Error('The composed overview must not duplicate Robot identity with a trajectory label.');
    }
  },
};
