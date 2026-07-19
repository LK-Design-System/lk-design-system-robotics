import React from 'react';
import { userEvent, waitFor } from 'storybook/test';
import {
  RouteOverlay,
  TrajectoryOverlay,
  NavigationAnnotationLayer,
  SegmentedControl,
} from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import { assertNoLabelCollisions, assertPairwiseNonOverlap } from './RoboticsNavigationCollision.shared.jsx';
import {
  ACTIVE_ROUTE,
  ACTIVE_TRAJECTORY,
  L2_TRAJECTORY,
  StoryPage,
  PathMap,
  nextRender,
  assertNavigationProgressHead,
  assertNavigationStateGlyphGeometry,
  assertNavigationVectorGeometry,
} from './RoboticsNavigationRouteTrajectory.shared.jsx';

const meta = {
  title: 'LDS Robotics/Navigation/Route',
  component: RouteOverlay,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-route--route-and-trajectory-overview',
      eyebrow: 'Robotics / Navigation / Route',
      title: '계획된 그래프 경로와 로봇의 조밀한 궤적은 서로 다른 계층입니다',
      description:
        'Route는 graph segment의 phase와 condition을, Trajectory는 한 지도에서 시간 순서로 이어진 조밀한 sample을 보여줍니다. 두 선이 비슷해 보여도 상태와 진행 의미를 합치지 마세요. 정적 그래프 연결에는 Lane이, 자유 공간의 조밀한 궤적에는 Trajectory가 적합합니다.',
    },
    docs: {
      description: {
        component:
          '층별 planned graph segment와 single-map dense trajectory를 구분해 표현하는 LK Robotics Navigation Extension입니다.',
      },
    },
  },
};

export default meta;

function ActivePathLayers({ viewportScale }) {
  return (
    <>
      <RouteOverlay route={ACTIVE_ROUTE} activeMapId="L1" viewportScale={viewportScale} />
      <TrajectoryOverlay trajectory={ACTIVE_TRAJECTORY} viewportScale={viewportScale} />
    </>
  );
}

export const RouteAndTrajectoryOverview = {
  name: '개요',
  parameters: storyDescription(
    '같은 이동을 표현하는 planned route와 dense trajectory를 light/dark 지도에서 비교합니다. 둘 다 현재 지점까지의 선이 open progress head로 끝나지만, Route의 segment phase·condition과 Trajectory의 sample 순서는 별도 의미로 남습니다.',
  ),
  render: () => (
    <StoryPage
      title="Route는 선택된 graph 구간을, Trajectory는 시간 순 sample을 보여줍니다"
      description="경로의 완료·현재·예정과 대기·차단·충돌은 segment에 속합니다. 진행 head는 path tangent를 따르며 robot heading·pose를 대신하지 않습니다."
    >
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 'var(--space-4)', minWidth: 0 }}>
        <PathMap label="Light route와 trajectory 지도">
          {(cssViewBoxScale) => <ActivePathLayers viewportScale={cssViewBoxScale} />}
        </PathMap>
        <PathMap appearance="dark" label="Dark route와 trajectory 지도">
          {(cssViewBoxScale) => <ActivePathLayers viewportScale={cssViewBoxScale} />}
        </PathMap>
      </section>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    const routes = canvasElement.querySelectorAll('[data-lk-route-overlay]');
    const trajectories = canvasElement.querySelectorAll('[data-lk-trajectory-overlay]');
    if (routes.length !== 2 || trajectories.length !== 2) {
      throw new Error(`Light/dark layer parity failed: ${routes.length} routes, ${trajectories.length} trajectories.`);
    }
    routes.forEach((route) => {
      const paths = route.querySelectorAll('[data-route-path]');
      if (paths.length !== 2) throw new Error('L1 route must render only its two L1 segments.');
      if (!route.querySelector('[data-route-progress-marker][data-current-segment-id="segment-l1-current"]')) {
        throw new Error('Explicit current-segment progress marker is missing.');
      }
      assertNavigationProgressHead(route, 'Overview Route', 'route');
      assertNavigationStateGlyphGeometry(route, 'Overview Route');
      assertNavigationVectorGeometry(route, 'Overview Route');
    });
    trajectories.forEach((trajectory) => {
      const path = trajectory.querySelector('[data-trajectory-path]');
      if (!path?.getAttribute('d')?.includes('L 370 164')) throw new Error('Dense trajectory geometry is incomplete.');
      assertNavigationProgressHead(trajectory, 'Overview Trajectory', 'trajectory');
      assertNavigationStateGlyphGeometry(trajectory, 'Overview Trajectory');
    });
  },
};

const ROUTE_STATE_ROWS = [
  ['planned', 'upcoming', 'normal', 48],
  ['active', 'current', 'normal', 108],
  ['waiting', 'current', 'waiting', 168],
  ['blocked', 'current', 'blocked', 228],
  ['rerouting', 'current', 'conflict', 288],
  ['completed', 'completed', 'normal', 348],
];

const PHASE_LABEL_KO = { upcoming: '예정', current: '현재', completed: '완료' };
const CONDITION_LABEL_KO = { normal: '정상', waiting: '대기', blocked: '차단', conflict: '충돌', stale: '지연' };
const segmentStateLabel = (phase, condition) =>
  `${PHASE_LABEL_KO[phase] ?? phase} · ${CONDITION_LABEL_KO[condition] ?? condition}`;

function routeForState(status, phase, condition, y) {
  return {
    id: `route-${status}`,
    label: status,
    status,
    segments: [{
      id: `segment-${status}`,
      mapId: 'L1',
      label: segmentStateLabel(phase, condition),
      points: [{ x: 48, y }, { x: 220, y }, { x: 310, y: y - 18 }, { x: 488, y: y - 18 }],
      phase,
      condition,
    }],
    progress: status === 'active' ? { segmentId: 'segment-active', fraction: 0.55 } : undefined,
  };
}

export const RouteAndTrajectoryStates = {
  name: '변형·상태 · 구간 조건과 궤적 수명주기',
  parameters: storyDescription(
    'route status, segment phase, segment condition을 독립 조합합니다. 각 행은 색뿐 아니라 다른 line pattern과 glyph를 사용하며 rerouting trajectory도 별도 dense layer로 유지합니다.',
  ),
  render: () => (
    <StoryPage
      title="Route status와 segment phase·condition은 서로 다른 질문에 답합니다"
      description="전체 경로가 rerouting이어도 특정 segment는 conflict이고, 현재 segment가 waiting이어도 route identity와 명시적 진행 위치는 보존됩니다. 상태를 하나의 색 enum으로 압축하지 않습니다."
      maxWidth={820}
    >
      <PathMap label="route 상태와 조건 지도" height={500} svgHeight={480}>
        {(cssViewBoxScale) => (
          <>
            {ROUTE_STATE_ROWS.map(([status, phase, condition, y]) => (
              <RouteOverlay
                key={status}
                route={routeForState(status, phase, condition, y)}
                activeMapId="L1"
                viewportScale={cssViewBoxScale}
              />
            ))}
            <RouteOverlay
              route={{
                ...routeForState('active', 'current', 'normal', 426),
                id: 'route-invalid-stale',
                label: '무효 · 지연',
                segments: [{
                  ...routeForState('active', 'current', 'normal', 426).segments[0],
                  id: 'segment-invalid-stale',
                  label: '무효 · 지연',
                }],
              }}
              activeMapId="L1"
              viewportScale={cssViewBoxScale}
              invalid
              stale
            />
          </>
        )}
      </PathMap>
      <PathMap appearance="dark" label="rerouting trajectory 지도" height={220} svgHeight={200}>
        {(cssViewBoxScale) => (
          <TrajectoryOverlay
            trajectory={{
              ...ACTIVE_TRAJECTORY,
              id: 'trajectory-rerouting',
              label: '경로 재계산 중 궤적',
              status: 'rerouting',
              samples: ACTIVE_TRAJECTORY.samples.map((sample) => ({ ...sample, position: { x: sample.position.x, y: sample.position.y - 52 } })),
            }}
            viewportScale={cssViewBoxScale}
            invalid
            stale
          />
        )}
      </PathMap>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    for (const condition of ['waiting', 'blocked', 'conflict']) {
      const segment = canvasElement.querySelector(`[data-condition="${condition}"]`);
      const path = segment?.querySelector('[data-route-path]');
      if (!path?.getAttribute('stroke-dasharray')) throw new Error(`${condition} segment needs a non-color line pattern.`);
      if (!segment.querySelector(`[data-route-condition-glyph="${condition}"]`)) {
        throw new Error(`${condition} segment needs a matching glyph.`);
      }
    }
    const trajectory = canvasElement.querySelector('[data-trajectory-status="rerouting"]');
    if (!trajectory?.querySelector('[data-trajectory-path]')?.getAttribute('stroke-dasharray')) {
      throw new Error('Rerouting trajectory needs a non-color dash pattern.');
    }
    const compoundRoute = canvasElement.querySelector('[data-route-id="route-invalid-stale"]');
    if (!compoundRoute?.querySelector('[data-route-overlay-state="invalid"]') || !compoundRoute.querySelector('[data-route-overlay-state="stale"]')) {
      throw new Error('Route invalid + stale needs independent ! and ~ visual evidence.');
    }
    if (compoundRoute.style.opacity !== '0.76') {
      throw new Error(`Stale Route opacity must match the shared 0.76 contract: ${compoundRoute.style.opacity}.`);
    }
    if (!trajectory.querySelector('[data-trajectory-overlay-state="invalid"]') || !trajectory.querySelector('[data-trajectory-overlay-state="stale"]')) {
      throw new Error('Trajectory invalid + stale needs independent ! and ~ visual evidence.');
    }
    assertNavigationStateGlyphGeometry(canvasElement, 'Route/Trajectory states');
    assertNavigationVectorGeometry(canvasElement, 'Route/Trajectory states');
    const renderedKinds = new Set(Array.from(canvasElement.querySelectorAll('[data-navigation-state-glyph]'))
      .map((glyph) => glyph.getAttribute('data-navigation-state-glyph')));
    for (const kind of ['planned', 'active', 'waiting', 'blocked', 'rerouting', 'completed', 'conflict', 'invalid', 'stale']) {
      if (!renderedKinds.has(kind)) throw new Error(`State glyph mapping is missing ${kind}.`);
    }
  },
};

const SHORT_COMPOUND_ROUTE = {
  id: 'route-short-compound',
  label: '짧은 복합 상태 경로',
  status: 'active',
  segments: [{
    id: 'segment-short-compound',
    mapId: 'L1',
    label: '짧은 충돌 구간',
    points: [{ x: 260, y: 96 }, { x: 268, y: 96 }, { x: 276, y: 96 }],
    phase: 'current',
    condition: 'conflict',
  }],
  progress: { segmentId: 'segment-short-compound', fraction: 0.5 },
};

const SHORT_COMPOUND_TRAJECTORY = {
  id: 'trajectory-short-compound',
  label: '짧은 복합 상태 궤적',
  mapId: 'L1',
  status: 'active',
  samples: [
    { position: { x: 260, y: 190 }, timeMs: 0, headingRad: 0 },
    { position: { x: 268, y: 190 }, timeMs: 200, headingRad: 0 },
    { position: { x: 276, y: 190 }, timeMs: 400, headingRad: 0 },
  ],
  currentSampleIndex: 1,
};

const MID_LENGTH_EXACT_COLLISION_ROUTE = {
  id: 'route-mid-exact-collision',
  label: '중간 길이 exact-anchor 경로',
  status: 'active',
  segments: [{
    id: 'segment-mid-exact-collision',
    mapId: 'L1',
    label: '중간 길이 충돌 구간',
    points: [{ x: 54, y: 334 }, { x: 270, y: 334 }, { x: 486, y: 334 }],
    phase: 'current',
    condition: 'conflict',
  }],
  progress: { segmentId: 'segment-mid-exact-collision', fraction: 0.5 },
};

const NORMAL_PROGRESS_ROUTE = {
  id: 'route-normal-progress-spacing',
  label: '일반 진행률 경로',
  status: 'active',
  segments: [{
    id: 'segment-normal-progress-spacing',
    mapId: 'L1',
    label: '일반 진행 구간',
    points: [{ x: 54, y: 454 }, { x: 270, y: 454 }, { x: 486, y: 454 }],
    phase: 'current',
    condition: 'normal',
  }],
  progress: {
    segmentId: 'segment-normal-progress-spacing',
    fraction: 0.3,
    position: { x: 185, y: 454.5 },
  },
};

const MISMATCHED_PROGRESS_POSITION_ROUTE = {
  id: 'route-progress-position-mismatch',
  label: '진행 좌표 불일치 경로',
  status: 'active',
  segments: [{
    id: 'segment-progress-position-mismatch',
    mapId: 'L1',
    label: '좌표 불일치 구간',
    points: [{ x: 54, y: 70 }, { x: 270, y: 70 }, { x: 486, y: 70 }],
    phase: 'current',
    condition: 'normal',
  }],
  progress: {
    segmentId: 'segment-progress-position-mismatch',
    fraction: 0.25,
    position: { x: 400, y: 70 },
  },
};

const VERTICAL_PROGRESS_ROUTE = {
  id: 'route-progress-obstacle-vertical',
  label: '수직 진행 경로',
  status: 'active',
  segments: [{
    id: 'segment-progress-obstacle-vertical',
    mapId: 'L1',
    label: '수직 구간',
    points: [{ x: 120, y: 30 }, { x: 120, y: 110 }],
    phase: 'current',
    condition: 'normal',
  }],
  progress: { segmentId: 'segment-progress-obstacle-vertical', fraction: 0.5 },
};

const REVERSE_PROGRESS_ROUTE = {
  id: 'route-progress-obstacle-reverse',
  label: '역방향 진행 경로',
  status: 'active',
  segments: [{
    id: 'segment-progress-obstacle-reverse',
    mapId: 'L1',
    label: '역방향 구간',
    points: [{ x: 486, y: 100 }, { x: 306, y: 100 }],
    phase: 'current',
    condition: 'normal',
  }],
  progress: { segmentId: 'segment-progress-obstacle-reverse', fraction: 0.5 },
};

function assertProgressTextSpacing(route, label) {
  const headObstacle = route.querySelector('[data-navigation-progress-head-obstacle] rect');
  const progressText = route.querySelector('[data-route-progress-label]');
  const path = route.querySelector('[data-route-path]');
  if (!headObstacle || !progressText || !path) throw new Error(`${label} progress spacing evidence is incomplete.`);
  const headRect = headObstacle.getBoundingClientRect();
  const textRect = progressText.getBoundingClientRect();
  const pathRect = path.getBoundingClientRect();
  const headGap = textRect.top - headRect.bottom;
  const pathGap = textRect.top - pathRect.bottom;
  if (headGap < 3.9 || pathGap < 3.9) {
    throw new Error(`${label} progress text needs 4 CSS px clearance: head ${headGap}, path ${pathGap}.`);
  }
}

export const ShortPathCompoundMarkers = {
  name: '변형·상태 · 기준점 충돌 복합 표식',
  parameters: storyDescription(
    '자연 marker anchor의 실제 CSS 거리가 outline 포함 반지름과 gap보다 작을 때 Route·Trajectory badge를 compact screen-space row로 분리합니다. 경로 길이와 무관한 exact-anchor 충돌도 포함합니다.',
  ),
  render: () => (
    <div data-testid="short-path-stress" style={{ width: 320, maxWidth: '100%', minWidth: 0 }}>
      <StoryPage
        title="자연 anchor가 충돌하는 독립 상태 badge와 label은 겹치지 않습니다"
        description="각 상태의 실제 path anchor 좌표는 보존하고, 충돌한 경우에만 원 지름과 4px gap으로 계산한 중앙 badge row와 별도 상단 label row를 사용합니다."
      >
        <PathMap label="anchor 충돌 route와 trajectory 복합 상태 지도" height={510} svgHeight={520}>
          {(cssViewBoxScale) => (
            <NavigationAnnotationLayer>
              <RouteOverlay
                route={SHORT_COMPOUND_ROUTE}
                activeMapId="L1"
                viewportScale={cssViewBoxScale}
                invalid
                stale
              />
              <TrajectoryOverlay
                trajectory={SHORT_COMPOUND_TRAJECTORY}
                viewportScale={cssViewBoxScale}
                invalid
                stale
              />
              <RouteOverlay
                route={MID_LENGTH_EXACT_COLLISION_ROUTE}
                activeMapId="L1"
                viewportScale={cssViewBoxScale}
                invalid
                stale
              />
              <RouteOverlay
                route={NORMAL_PROGRESS_ROUTE}
                activeMapId="L1"
                viewportScale={cssViewBoxScale}
              />
            </NavigationAnnotationLayer>
          )}
        </PathMap>
        <PathMap
          label="fraction과 explicit position이 불일치하는 route"
          height={150}
          svgHeight={130}
          eyebrow="MISMATCH · FAIL CLOSED"
        >
          {(cssViewBoxScale) => (
            <RouteOverlay
              route={MISMATCHED_PROGRESS_POSITION_ROUTE}
              activeMapId="L1"
              viewportScale={cssViewBoxScale}
              showLabel={false}
            />
          )}
        </PathMap>
        <PathMap
          label="진행 head와 함께 회전하는 충돌 영역"
          height={160}
          svgHeight={140}
          eyebrow="OBSTACLE · PATH TANGENT"
        >
          {(cssViewBoxScale) => (
            <>
              <RouteOverlay
                route={VERTICAL_PROGRESS_ROUTE}
                activeMapId="L1"
                viewportScale={cssViewBoxScale}
                showLabel={false}
              />
              <RouteOverlay
                route={REVERSE_PROGRESS_ROUTE}
                activeMapId="L1"
                viewportScale={cssViewBoxScale}
                showLabel={false}
              />
            </>
          )}
        </PathMap>
      </StoryPage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const stress = canvasElement.querySelector('[data-testid="short-path-stress"]');
    await waitFor(() => {
      const svg = stress?.querySelector('svg[data-css-viewbox-scale]');
      const cssScale = Number(svg?.getAttribute('data-css-viewbox-scale'));
      const route = stress?.querySelector('[data-route-id="route-short-compound"]');
      const trajectory = stress?.querySelector('[data-trajectory-id="trajectory-short-compound"]');
      const midRoute = stress?.querySelector('[data-route-id="route-mid-exact-collision"]');
      const normalRoute = stress?.querySelector('[data-route-id="route-normal-progress-spacing"]');
      const mismatchRoute = stress?.querySelector('[data-route-id="route-progress-position-mismatch"]');
      const verticalRoute = stress?.querySelector('[data-route-id="route-progress-obstacle-vertical"]');
      const reverseRoute = stress?.querySelector('[data-route-id="route-progress-obstacle-reverse"]');
      if (!svg || !Number.isFinite(cssScale) || cssScale >= 0.95) {
        throw new Error(`Short-path stress did not render at a reduced CSS/viewBox scale: ${cssScale}.`);
      }
      if (route?.getAttribute('data-route-marker-layout') !== 'screen-slots'
        || trajectory?.getAttribute('data-trajectory-marker-layout') !== 'screen-slots'
        || midRoute?.getAttribute('data-route-marker-layout') !== 'screen-slots') {
        throw new Error('Every colliding Route and Trajectory fixture must opt into screen-space marker slots.');
      }
      const normalProgressHead = normalRoute?.querySelector('[data-navigation-progress-head="route"]');
      if (
        !normalProgressHead
        || normalProgressHead.hasAttribute('data-route-screen-slot')
        || normalProgressHead.getAttribute('data-route-anchor-x') !== String(NORMAL_PROGRESS_ROUTE.progress.position.x)
        || normalProgressHead.getAttribute('data-route-anchor-y') !== String(NORMAL_PROGRESS_ROUTE.progress.position.y)
      ) {
        throw new Error('The progress head must remain at its exact path anchor while colliding status badges use screen slots.');
      }
      if (!normalProgressHead.matches('[data-route-progress-carrier="core"]')) {
        throw new Error('An explicit Route progress position needs a tangent-aligned carrier at the exact source point.');
      }
      const mismatchPast = mismatchRoute?.querySelector('[data-route-progress-past]');
      if (
        mismatchRoute?.getAttribute('data-progress-position-mismatch') !== 'true'
        || mismatchPast?.getAttribute('d') !== 'M 54 70 L 162 70'
        || mismatchRoute.querySelector('[data-navigation-progress-head], [data-route-progress-carrier], [data-navigation-progress-head-obstacle]')
        || !mismatchRoute.getAttribute('aria-label')?.includes('25%')
      ) {
        throw new Error('A mismatched explicit position must fail closed without detaching the progress head from the fraction boundary.');
      }
      for (const [fixture, expectedAngle] of [[verticalRoute, 90], [reverseRoute, 180]]) {
        const headObstacle = fixture?.querySelector('[data-navigation-progress-head-obstacle]');
        if (
          headObstacle?.getAttribute('data-progress-head-angle') !== String(expectedAngle)
          || !headObstacle.getAttribute('transform')?.includes(`rotate(${expectedAngle})`)
        ) {
          throw new Error(`The progress-head obstacle must rotate with its ${expectedAngle}deg path tangent.`);
        }
      }

      const routeMarkers = Array.from(route.querySelectorAll('[data-route-marker-badge]'));
      const trajectoryMarkers = Array.from(trajectory.querySelectorAll('[data-trajectory-marker-badge]'));
      const midRouteMarkers = Array.from(midRoute.querySelectorAll('[data-route-marker-badge]'));
      if (routeMarkers.length !== 4 || trajectoryMarkers.length !== 3 || midRouteMarkers.length !== 4) {
        throw new Error('Short-path compound state is missing a Route or Trajectory marker.');
      }
      const anchoredMarkerGroups = [
        ...route.querySelectorAll('[data-route-anchor-x]'),
        ...trajectory.querySelectorAll('[data-trajectory-anchor-x]'),
        ...midRoute.querySelectorAll('[data-route-anchor-x]'),
      ];
      anchoredMarkerGroups.forEach((marker) => {
        if (!Number.isFinite(Number(marker.getAttribute(marker.hasAttribute('data-route-anchor-x') ? 'data-route-anchor-x' : 'data-trajectory-anchor-x')))) {
          throw new Error('A slotted marker lost its actual path anchor coordinates.');
        }
      });
      const routeLabel = route.querySelector('[data-route-segment-label][data-route-screen-row="label"]');
      const trajectoryLabel = trajectory.querySelector('[data-trajectory-label][data-trajectory-screen-row="label"]');
      const midRouteLabel = midRoute.querySelector('[data-route-segment-label][data-route-screen-row="label"]');
      if (!routeLabel || !trajectoryLabel || !midRouteLabel) {
        throw new Error('A colliding fixture did not move its visual label to the dedicated upper row.');
      }
      assertPairwiseNonOverlap([...routeMarkers, routeLabel], 'Route');
      assertPairwiseNonOverlap([...trajectoryMarkers, trajectoryLabel], 'Trajectory');
      assertPairwiseNonOverlap([...midRouteMarkers, midRouteLabel], 'Mid-length Route');

      const routeRowWidth = Number(route.getAttribute('data-route-marker-row-width'));
      const trajectoryRowWidth = Number(trajectory.getAttribute('data-trajectory-marker-row-width'));
      if (!(routeRowWidth > 0 && routeRowWidth < 100 && trajectoryRowWidth > 0 && trajectoryRowWidth < 100)) {
        throw new Error(`Collision rows are not compact diameter+gap layouts: ${routeRowWidth}/${trajectoryRowWidth}.`);
      }
      const routeStateGlyphs = Array.from(route.querySelectorAll('[data-navigation-state-glyph]'));
      if (routeStateGlyphs.length < 4 || routeStateGlyphs.some((glyph) => !glyph.style.color)) {
        throw new Error('Route marker outlines must retain status hue while internal SVG glyphs use viewer foreground.');
      }
      const midPathRect = midRoute.querySelector('[data-route-path]')?.getBoundingClientRect();
      const midConditionAnchor = Number(midRoute.querySelector('[data-route-condition-glyph]')?.getAttribute('data-route-anchor-x'));
      const midProgressAnchor = Number(midRoute.querySelector('[data-route-progress-marker]')?.getAttribute('data-route-anchor-x'));
      if (!midPathRect || midPathRect.width < 180 || midConditionAnchor !== midProgressAnchor) {
        throw new Error('Medium-length route did not preserve the exact natural condition/progress anchor collision.');
      }
      assertProgressTextSpacing(route, 'Short Route');
      assertProgressTextSpacing(midRoute, 'Mid-length Route');
      assertProgressTextSpacing(normalRoute, 'Normal Route');
      for (const [fixtureLabel, fixture] of [
        ['Short Route', route],
        ['Short Trajectory', trajectory],
        ['Mid-length Route', midRoute],
        ['Normal Route', normalRoute],
      ]) {
        assertNavigationStateGlyphGeometry(fixture, fixtureLabel);
        const role = fixture.hasAttribute('data-lk-trajectory-overlay') ? 'trajectory' : 'route';
        assertNavigationProgressHead(fixture, fixtureLabel, role);
        if (role === 'route') assertNavigationVectorGeometry(fixture, fixtureLabel);
      }

      // Cross-entity contract: coordinated labels never overlap each other or
      // a registered marker footprint, and the coordinator actually engaged
      // (the short route's progress label collides naturally with the short
      // trajectory's label row without it).
      assertNoLabelCollisions(stress, 'Cross-entity');
      const progressLabelRect = route.querySelector('[data-route-progress-label]')?.getBoundingClientRect();
      const trajectoryLabelRect = trajectory.querySelector('[data-trajectory-label]')?.getBoundingClientRect();
      if (!progressLabelRect || !trajectoryLabelRect) {
        throw new Error('Cross-entity fixture labels must both render.');
      }
      const defectPairOverlaps = progressLabelRect.left < trajectoryLabelRect.right - 0.5
        && progressLabelRect.right > trajectoryLabelRect.left + 0.5
        && progressLabelRect.top < trajectoryLabelRect.bottom - 0.5
        && progressLabelRect.bottom > trajectoryLabelRect.top + 0.5;
      if (defectPairOverlaps) {
        throw new Error('Route progress label and trajectory label still overlap across entities.');
      }
      if (!stress.querySelector('[data-annotation-displaced="true"], [data-annotation-suppressed="true"]')) {
        throw new Error('Cross-entity coordination did not engage on the colliding fixtures.');
      }
      const normalRouteLabels = normalRoute.querySelectorAll('[data-annotation-displaced="true"], [data-annotation-suppressed="true"]');
      if (normalRouteLabels.length > 0) {
        throw new Error('Naturally separated labels must not be displaced or suppressed.');
      }
    });
  },
};

function MultiFloorFixture() {
  const [activeMapId, setActiveMapId] = React.useState('L1');
  const trajectory = activeMapId === 'L1' ? ACTIVE_TRAJECTORY : L2_TRAJECTORY;
  return (
    <StoryPage
      title="층을 바꾸면 해당 층 segment와 trajectory만 남고 가상 연결선은 생기지 않습니다"
      description="Route는 activeMapId로 segment를 필터합니다. Trajectory는 하나의 map만 소유하므로 renderer가 mapId를 비교해 하나만 마운트합니다. 층 사이 이동은 Lift Facility Transition으로 이어집니다."
      maxWidth={820}
    >
      <SegmentedControl
        options={['L1', 'L2']}
        value={activeMapId}
        onChange={setActiveMapId}
        size="sm"
        aria-label="표시할 층"
        style={{ alignSelf: 'start' }}
      />
      <PathMap label={`${activeMapId} route와 trajectory 지도`} testId="multi-floor-path-map">
        {(cssViewBoxScale) => (
          <>
            <RouteOverlay route={ACTIVE_ROUTE} activeMapId={activeMapId} viewportScale={cssViewBoxScale} />
            <RouteOverlay route={ACTIVE_ROUTE} activeMapId="missing-map" viewportScale={cssViewBoxScale} data-empty-route-probe="" />
            <RouteOverlay
              route={{
                id: 'route-insufficient-geometry',
                label: '불충분 경로 geometry',
                status: 'planned',
                segments: [{
                  id: 'segment-insufficient-geometry',
                  mapId: activeMapId,
                  points: [{ x: 20, y: 20 }, { x: Number.NaN, y: 30 }],
                  phase: 'upcoming',
                  condition: 'normal',
                }],
              }}
              activeMapId={activeMapId}
              viewportScale={cssViewBoxScale}
              onActivate={() => {}}
              data-insufficient-route-probe=""
            />
            <TrajectoryOverlay
              trajectory={{
                id: 'trajectory-insufficient-geometry',
                label: '불충분 궤적 geometry',
                mapId: activeMapId,
                status: 'planned',
                samples: [
                  { position: { x: 20, y: 40 }, timeMs: 0 },
                  { position: { x: Number.NaN, y: 50 }, timeMs: 100 },
                ],
              }}
              viewportScale={cssViewBoxScale}
              onActivate={() => {}}
              data-insufficient-trajectory-probe=""
            />
            {trajectory.mapId === activeMapId && (
              <TrajectoryOverlay trajectory={trajectory} viewportScale={cssViewBoxScale} />
            )}
          </>
        )}
      </PathMap>
      <output data-testid="active-map-output" hidden>{activeMapId}</output>
    </StoryPage>
  );
}

export const MultiFloorFiltering = {
  name: '사용법 · 층별 경로',
  parameters: storyDescription(
    'L1/L2를 전환해 route segment와 single-map trajectory가 현재 층만 렌더하는지 확인합니다. 필터 후 남은 서로 다른 층의 끝점을 이어 붙이는 path가 없어야 합니다.',
  ),
  render: () => <MultiFloorFixture />,
  play: async ({ canvasElement }) => {
    const assertMap = (mapId, routeCount, trajectoryId, expectProgress) => {
      const segments = Array.from(canvasElement.querySelectorAll('[data-route-segment]'));
      if (segments.length !== routeCount || segments.some((segment) => segment.getAttribute('data-map-id') !== mapId)) {
        throw new Error(`${mapId} route filtering failed: ${segments.map((segment) => segment.getAttribute('data-map-id')).join(',')}`);
      }
      const route = canvasElement.querySelector('[data-lk-route-overlay]');
      const progressSegmentId = route?.getAttribute('data-progress-segment-id');
      const progressFraction = route?.getAttribute('data-progress-fraction');
      const progressInName = route?.getAttribute('aria-label')?.includes('현재 구간 42%');
      if (expectProgress && (progressSegmentId !== 'segment-l1-current' || progressFraction !== '0.42' || !progressInName)) {
        throw new Error(`${mapId} visible progress was not preserved.`);
      }
      if (!expectProgress && (progressSegmentId != null || progressFraction != null || progressInName)) {
        throw new Error(`${mapId} retained progress from a segment hidden by activeMapId.`);
      }
      const trajectory = canvasElement.querySelector('[data-lk-trajectory-overlay]');
      if (trajectory?.getAttribute('data-trajectory-id') !== trajectoryId || trajectory.getAttribute('data-map-id') !== mapId) {
        throw new Error(`${mapId} trajectory renderer filtering failed.`);
      }
    };
    if (canvasElement.querySelector('[data-empty-route-probe]')) {
      throw new Error('A route with zero visible segments must not leave an empty accessibility object.');
    }
    if (canvasElement.querySelector('[data-insufficient-route-probe], [data-insufficient-trajectory-probe]')) {
      throw new Error('Route/Trajectory with fewer than two finite points must not leave an invisible control.');
    }
    assertMap('L1', 2, 'trajectory-robot-2-l1', true);
    [...canvasElement.querySelectorAll('button')].find((btn) => btn.textContent.trim() === 'L2')?.click();
    await nextRender();
    assertMap('L2', 1, 'trajectory-robot-2-l2', false);
    const l2Path = canvasElement.querySelector('[data-route-path]')?.getAttribute('d') ?? '';
    if (!l2Path.startsWith('M 72 196') || l2Path.includes('190 154')) {
      throw new Error(`Cross-floor geometry was synthesized or L1 geometry leaked into L2: ${l2Path}`);
    }
  },
};

function PathActivationFixture() {
  const [selected, setSelected] = React.useState('');
  const [count, setCount] = React.useState(0);
  const select = (id) => {
    setSelected(id);
    setCount((value) => value + 1);
  };
  return (
    <StoryPage
      title="Route segment와 trajectory는 각각의 identity로 선택됩니다"
      description="segment activation은 routeId와 segmentId를 함께 전달하고 trajectory는 자체 id를 전달합니다. 선택 halo는 공유하지만 서로의 phase, progress, sample 상태를 변경하지 않습니다."
      maxWidth={820}
    >
      <PathMap label="route와 trajectory 선택 지도" height={460} svgHeight={440}>
        {(cssViewBoxScale) => (
          <>
            <RouteOverlay
              route={ACTIVE_ROUTE}
              activeMapId="L1"
              viewportScale={cssViewBoxScale}
              selectedSegmentId={selected.startsWith('segment:') ? selected.slice(8) : undefined}
              onActivate={({ segmentId }) => select(`segment:${segmentId}`)}
            />
            <TrajectoryOverlay
              trajectory={ACTIVE_TRAJECTORY}
              viewportScale={cssViewBoxScale}
              selected={selected === `trajectory:${ACTIVE_TRAJECTORY.id}`}
              onActivate={(id) => select(`trajectory:${id}`)}
            />
            <RouteOverlay
              route={{
                id: 'route-disabled',
                label: '비활성 경로',
                status: 'blocked',
                segments: [{
                  id: 'segment-disabled',
                  mapId: 'L1',
                  points: [{ x: 50, y: 272 }, { x: 480, y: 272 }],
                  phase: 'current',
                  condition: 'blocked',
                }],
              }}
              activeMapId="L1"
              viewportScale={cssViewBoxScale}
              disabled
              onActivate={({ segmentId }) => select(`segment:${segmentId}`)}
            />
            <TrajectoryOverlay
              trajectory={{
                id: 'trajectory-disabled',
                label: '비활성 궤적',
                mapId: 'L1',
                status: 'blocked',
                samples: [
                  { position: { x: 50, y: 314 }, timeMs: 0, headingRad: 0 },
                  { position: { x: 260, y: 308 }, timeMs: 500, headingRad: 0 },
                  { position: { x: 480, y: 314 }, timeMs: 1000, headingRad: 0 },
                ],
                currentSampleIndex: 1,
              }}
              viewportScale={cssViewBoxScale}
              disabled
              onActivate={(id) => select(`trajectory:${id}`)}
            />
            <RouteOverlay
              route={{
                id: 'route-passive-disabled',
                label: '비활성 참조 경로',
                status: 'blocked',
                segments: [{
                  id: 'segment-passive-disabled',
                  mapId: 'L1',
                  points: [{ x: 50, y: 366 }, { x: 480, y: 366 }],
                  phase: 'current',
                  condition: 'blocked',
                }],
              }}
              activeMapId="L1"
              viewportScale={cssViewBoxScale}
              focused
              disabled
              data-passive-disabled-route=""
            />
            <TrajectoryOverlay
              trajectory={{
                id: 'trajectory-passive-disabled',
                label: '비활성 참조 궤적',
                mapId: 'L1',
                status: 'blocked',
                samples: [
                  { position: { x: 50, y: 414 }, timeMs: 0, headingRad: 0 },
                  { position: { x: 260, y: 408 }, timeMs: 500, headingRad: 0 },
                  { position: { x: 480, y: 414 }, timeMs: 1000, headingRad: 0 },
                ],
                currentSampleIndex: 1,
              }}
              viewportScale={cssViewBoxScale}
              focused
              disabled
              data-passive-disabled-trajectory=""
            />
          </>
        )}
      </PathMap>
      <output data-testid="path-activation-output" hidden>{selected || '없음'} · activation {count}회</output>
    </StoryPage>
  );
}

export const PathSelectionAndActivation = {
  name: '상호작용 · 구간과 궤적 선택',
  parameters: storyDescription(
    'route segment와 trajectory의 accessible name, pointer·Enter/Space activation, Route·Trajectory disabled prevention과 선택 halo를 확인합니다.',
  ),
  render: () => <PathActivationFixture />,
  play: async ({ canvasElement }) => {
    const routeSegment = canvasElement.querySelector('[data-segment-id="segment-l1-current"]');
    const trajectory = canvasElement.querySelector('[data-trajectory-id="trajectory-robot-2-l1"]');
    const disabledSegment = canvasElement.querySelector('[data-segment-id="segment-disabled"]');
    const disabledTrajectory = canvasElement.querySelector('[data-trajectory-id="trajectory-disabled"]');
    const passiveDisabledRoute = canvasElement.querySelector('[data-passive-disabled-route]');
    const passiveDisabledTrajectory = canvasElement.querySelector('[data-passive-disabled-trajectory]');
    const output = () => canvasElement.querySelector('[data-testid="path-activation-output"]')?.textContent ?? '';
    const view = canvasElement.ownerDocument.defaultView;
    if (!routeSegment?.getAttribute('aria-label')?.includes('현재 구간') || !trajectory?.getAttribute('aria-label')?.includes('sample')) {
      throw new Error('Route segment and trajectory need meaningful accessible names.');
    }
    const routeHitCore = routeSegment.querySelector('[data-route-hit-target-core]');
    const trajectoryHitCore = trajectory.querySelector('[data-trajectory-hit-target-core]');
    if (!routeHitCore || Number(routeHitCore.getAttribute('r')) * Math.SQRT2 < 24) {
      throw new Error('Interactive route segment needs a target core containing 24×24 CSS px.');
    }
    if (!trajectoryHitCore || Number(trajectoryHitCore.getAttribute('r')) * Math.SQRT2 < 24) {
      throw new Error('Interactive trajectory needs a target core containing 24×24 CSS px.');
    }
    await userEvent.click(routeSegment);
    const routeFocusVisible = routeSegment.matches(':focus-visible');
    await waitFor(() => {
      const hasRouteFocusRing = Boolean(routeSegment.querySelector('[data-route-focus-ring]'));
      if (hasRouteFocusRing !== routeFocusVisible) {
        throw new Error('Route focus ring must mirror the native :focus-visible state.');
      }
      if (routeFocusVisible && view.getComputedStyle(routeSegment).outlineStyle !== 'none') {
        throw new Error('Route segment must not duplicate its focus ring with the global rectangular outline.');
      }
    });
    routeSegment.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await nextRender();
    if (!routeSegment.querySelector('[data-route-focus-ring]') || view.getComputedStyle(routeSegment).outlineStyle !== 'none') {
      throw new Error('Route keyboard input must restore only its shape-managed focus ring after pointer modality.');
    }
    await userEvent.click(trajectory);
    const trajectoryFocusVisible = trajectory.matches(':focus-visible');
    await waitFor(() => {
      const hasTrajectoryFocusRing = Boolean(trajectory.querySelector('[data-trajectory-focus-indicator]'));
      if (hasTrajectoryFocusRing !== trajectoryFocusVisible) {
        throw new Error('Trajectory focus indicator must mirror the native :focus-visible state.');
      }
      if (trajectoryFocusVisible && view.getComputedStyle(trajectory).outlineStyle !== 'none') {
        throw new Error('Trajectory must not duplicate its focus ring with the global rectangular outline.');
      }
    });
    trajectory.dispatchEvent(new view.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await nextRender();
    if (!trajectory.querySelector('[data-trajectory-focus-indicator]') || view.getComputedStyle(trajectory).outlineStyle !== 'none') {
      throw new Error('Trajectory keyboard input must restore only its shape-managed focus ring after pointer modality.');
    }
    if (!output().includes('activation 4회') || trajectory.getAttribute('data-selected') !== 'true') {
      throw new Error(`Path activation or trajectory selection failed: ${output()}`);
    }
    routeSegment.dispatchEvent(new view.KeyboardEvent('keydown', {
      key: 'Enter', repeat: true, bubbles: true, cancelable: true,
    }));
    trajectory.dispatchEvent(new view.KeyboardEvent('keydown', {
      key: ' ', repeat: true, bubbles: true, cancelable: true,
    }));
    await nextRender();
    if (!output().includes('activation 4회')) {
      throw new Error('Repeated Route/Trajectory keydown invoked onActivate.');
    }
    if (disabledSegment.getAttribute('tabindex') !== '-1' || disabledSegment.getAttribute('aria-disabled') !== 'true') {
      throw new Error('Disabled route segment must expose aria-disabled and leave the Tab order.');
    }
    if (disabledSegment.closest('[data-lk-route-overlay]')?.style.opacity !== '0.45') {
      throw new Error('Disabled Route opacity must match the shared 0.45 contract.');
    }
    if (disabledTrajectory?.getAttribute('tabindex') !== '-1' || disabledTrajectory.getAttribute('aria-disabled') !== 'true') {
      throw new Error('Disabled trajectory must expose aria-disabled and leave the Tab order.');
    }
    if (disabledTrajectory.style.opacity !== '0.45') {
      throw new Error('Disabled Trajectory opacity must match the shared 0.45 contract.');
    }
    for (const [name, overlay] of [
      ['Route', passiveDisabledRoute],
      ['Trajectory', passiveDisabledTrajectory],
    ]) {
      if (overlay?.getAttribute('role') !== 'img'
        || !overlay.getAttribute('aria-label')?.includes('포커스됨')
        || !overlay.getAttribute('aria-label')?.includes('선택할 수 없음')
        || overlay.style.opacity !== '0.45') {
        throw new Error(`Passive controlled-focused disabled ${name} needs explicit computed states and 0.45 opacity.`);
      }
    }
    disabledSegment.dispatchEvent(new view.MouseEvent('click', { bubbles: true, cancelable: true }));
    disabledSegment.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    disabledTrajectory.dispatchEvent(new view.MouseEvent('click', { bubbles: true, cancelable: true }));
    disabledTrajectory.dispatchEvent(new view.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await nextRender();
    if (!output().includes('activation 4회')) throw new Error('A disabled Route or Trajectory invoked onActivate.');
  },
};

export const RouteAndTrajectoryNarrow320 = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 폭에서 경로·궤적 뷰포트가 페이지를 밀어내지 않고, 시각 라벨이 잘려도 각 오버레이의 접근성 이름이 같은 정체성과 상태를 그대로 전달하는지 확인합니다.',
  ),
  render: () => (
    <div data-testid="path-narrow" style={{ width: 320, maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      <StoryPage
        title="좁은 화면에서도 경로 계층은 겹치지 않고 상세 정보는 접근성 이름으로 이어집니다"
        description="지도 안에 카드를 겹쳐 넣지 않습니다. 경로와 궤적의 선·글리프를 보존하고, 시각 라벨을 숨겨도 각 오버레이의 접근성 이름이 진행률·표본 같은 상태를 그대로 전달합니다."
      >
        <PathMap label="320px 경로·궤적 지도" height={230}>
          {(cssViewBoxScale) => (
            <>
              <RouteOverlay
                route={ACTIVE_ROUTE}
                activeMapId="L1"
                showLabel={false}
                viewportScale={cssViewBoxScale}
                tabIndex={-1}
                onActivate={() => {}}
              />
              <TrajectoryOverlay
                trajectory={ACTIVE_TRAJECTORY}
                showLabel={false}
                viewportScale={cssViewBoxScale}
                tabIndex={-1}
                onActivate={() => {}}
              />
            </>
          )}
        </PathMap>
      </StoryPage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const narrow = canvasElement.querySelector('[data-testid="path-narrow"]');
    if (!narrow || narrow.scrollWidth > narrow.clientWidth) {
      throw new Error(`Route/trajectory narrow story overflowed: ${narrow?.scrollWidth}/${narrow?.clientWidth}`);
    }
    const route = narrow.querySelector('[data-lk-route-overlay]');
    const trajectory = narrow.querySelector('[data-lk-trajectory-overlay]');
    if (!route?.getAttribute('aria-label')?.includes('현재 구간 42%')) {
      throw new Error('Hiding visual labels removed explicit route progress from the accessible name.');
    }
    if (!trajectory?.getAttribute('aria-label')?.includes('현재 sample 6')) {
      throw new Error('Hiding visual labels removed current trajectory sample from the accessible name.');
    }
    await waitFor(() => {
      const svg = narrow.querySelector('svg[data-css-viewbox-scale]');
      const cssScale = Number(svg?.getAttribute('data-css-viewbox-scale'));
      const routeScale = Number(route?.getAttribute('data-viewport-scale'));
      if (!svg || !Number.isFinite(cssScale) || cssScale >= 0.95 || Math.abs(cssScale - routeScale) > 0.01) {
        throw new Error(`Narrow SVG scale was not passed to RouteOverlay: css=${cssScale}, route=${routeScale}.`);
      }

      const assertCircleContainsTarget = (selector, name) => {
        const core = narrow.querySelector(selector);
        const rect = core?.getBoundingClientRect();
        if (!rect || Math.min(rect.width, rect.height) / Math.SQRT2 < 23.9) {
          throw new Error(`${name} hit core does not contain a 24×24 CSS px square: ${rect?.width}×${rect?.height}.`);
        }
      };
      assertCircleContainsTarget('[data-route-hit-target-core]', 'Route');
      assertCircleContainsTarget('[data-trajectory-hit-target-core]', 'Trajectory');
      assertNavigationStateGlyphGeometry(route, '320px Route');
      assertNavigationStateGlyphGeometry(trajectory, '320px Trajectory');
      assertNavigationVectorGeometry(route, '320px Route');
      assertNavigationProgressHead(route, '320px Route', 'route');
      assertNavigationProgressHead(trajectory, '320px Trajectory', 'trajectory');
    });
  },
};

export const RouteTrajectoryVisualParity = {
  ...RouteAndTrajectoryStates,
  name: 'Route and trajectory visual parity',
  tags: ['!dev', 'visual-parity'],
};
