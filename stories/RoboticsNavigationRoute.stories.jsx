import React from 'react';
import { userEvent } from 'storybook/test';
import { SegmentedControl } from '@lk-design-system/lds-core';
import {
  NavigationAnnotationLayer,
  NavigationCoordinateBoundary,
  RobotPoseMarker,
  RouteOverlay,
  TrajectoryOverlay,
} from '../src/index.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import { assertNoLabelCollisions } from './RoboticsNavigationCollision.shared.jsx';
import {
  ACTIVE_ROBOT_POSE,
  ACTIVE_ROUTE,
  ACTIVE_TRAJECTORY,
  L2_TRAJECTORY,
  PROJECTED_FRAME_L1,
  PROJECTED_FRAME_L2,
  PathMap,
  StoryPage,
  assertNavigationStateGlyphGeometry,
  assertPathSystemVisualContract,
  assertTrajectoryTemporalEncoding,
  nextRender,
} from './RoboticsNavigationRouteTrajectory.shared.jsx';

const meta = {
  title: 'LDS Robotics/Navigation/Path System/Route',
  tags: ['autodocs'],
  component: RouteOverlay,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-path-system-route--route-and-trajectory-overview',
      eyebrow: 'Robotics / Navigation / Path System / Route',
      title: 'Route는 선택된 Lane을 같은 점선과 계획색으로 표시합니다',
      description:
        '완료·현재·예정 phase, condition, executor progress는 데이터와 상세 패널에 남깁니다. 지도에서는 Route identity가 끊기거나 상태별 선 스타일로 분절되지 않습니다.',
      docsDescription:
        'Route는 Lane sequence로 구성된 선택 계획입니다. 운영 지도에서는 Lane과 같은 1.5px·4 6 점선을 계획색으로 표시하고, 실제 현재 위치와 heading은 RobotPoseMarker만 소유합니다.',
    },
    docs: {
      description: {
        component:
          'activeMapId로 graph segment를 필터하고 선택된 Lane geometry를 계획색 점선으로 표시하는 RouteOverlay입니다.',
      },
    },
  },
};

export default meta;

function ActivePathLayers({ viewportScale }) {
  return (
    <NavigationCoordinateBoundary frame={PROJECTED_FRAME_L1}>
      <NavigationAnnotationLayer detailMode="overview">
        {/* 궤적을 먼저, 계획선을 그 위에. 반대로 그리면 궤적의 표면색 casing이
            겹치는 구간의 route를 지워, "Route는 중간에서 끊기지 않는다"는 이
            스토리의 계약이 화면에서만 깨져 보인다. 점선이 실선 위에 놓이면
            계획과 실주행이 같은 자리에서도 둘 다 읽힌다. */}
        <TrajectoryOverlay trajectory={ACTIVE_TRAJECTORY} viewportScale={viewportScale} />
        <RouteOverlay route={ACTIVE_ROUTE} activeMapId="L1" viewportScale={viewportScale} />
        <RobotPoseMarker pose={ACTIVE_ROBOT_POSE} viewportScale={viewportScale} />
      </NavigationAnnotationLayer>
    </NavigationCoordinateBoundary>
  );
}

export const RouteAndTrajectoryOverview = {
  name: '개요',
  parameters: storyDescription(
    '대표 지도 하나에서 Route·Trajectory·RobotPose의 계층을 설명합니다. 테마 반복은 회귀 검증으로 분리합니다.',
  ),
  render: () => (
    <StoryPage
      title="Route는 상태와 진행률 때문에 중간에서 끊기지 않습니다"
      description="Route segment는 데이터 단위로 유지하지만 모든 casing을 먼저 그리고 모든 core를 그 위에 올려 하나의 연속된 계획선으로 읽히게 합니다."
      maxWidth={720}
    >
      <PathMap label="Route 대표 지도" eyebrow="ROUTE · L1">
        {(viewportScale) => <ActivePathLayers viewportScale={viewportScale} />}
      </PathMap>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    const routes = canvasElement.querySelectorAll('[data-lk-route-overlay]');
    const trajectories = canvasElement.querySelectorAll('[data-lk-trajectory-overlay]');
    const robotPoses = canvasElement.querySelectorAll('[data-robot-pose-marker]');
    if (routes.length !== 1 || trajectories.length !== 1 || robotPoses.length !== 1) {
      throw new Error('Route overview must render Route, Trajectory, and RobotPose once.');
    }
    routes.forEach((route) => {
      if (route.querySelectorAll('[data-route-path]').length !== 2) {
        throw new Error('L1 Route must render its two projected graph segments.');
      }
      assertNavigationStateGlyphGeometry(route, 'Route overview');
    });
    trajectories.forEach((trajectory) => assertTrajectoryTemporalEncoding(trajectory, 'Route overview Trajectory'));
    const currentSegment = canvasElement.querySelector(
      '[data-route-segment][data-phase="current"]',
    );
    const trajectory = trajectories[0];
    const robotPose = robotPoses[0];
    if (
      currentSegment?.querySelector('[data-route-segment-label]')
      || trajectory?.querySelector('[data-trajectory-label]')
      || robotPose?.querySelector('[data-robot-pose-label]')
    ) {
      throw new Error('Ordinary map identity must stay hidden until direct interaction.');
    }
    await userEvent.hover(currentSegment?.querySelector('[data-route-hit-target-core]'));
    await nextRender();
    if (!currentSegment?.querySelector('[data-route-segment-label]')) {
      throw new Error('Route hover must reveal only the directly inspected segment name.');
    }
    await userEvent.unhover(currentSegment?.querySelector('[data-route-hit-target-core]'));
    await userEvent.hover(trajectory?.querySelector('[data-trajectory-hit-target-core]'));
    await nextRender();
    if (!trajectory?.querySelector('[data-trajectory-label]')) {
      throw new Error('Trajectory hover must reveal its name.');
    }
    await userEvent.unhover(trajectory?.querySelector('[data-trajectory-hit-target-core]'));
    await userEvent.hover(robotPose);
    await nextRender();
    if (!robotPose?.querySelector('[data-robot-pose-label]')) {
      throw new Error('RobotPose hover must reveal its name.');
    }
    await userEvent.unhover(robotPose);
    await nextRender();
    if (
      currentSegment?.querySelector('[data-route-segment-label]')
      || trajectory?.querySelector('[data-trajectory-label]')
      || robotPose?.querySelector('[data-robot-pose-label]')
    ) {
      throw new Error('Transient map identity must close after pointer exit.');
    }
    canvasElement.querySelectorAll('[data-lk-navigation-annotation-layer]').forEach((layer) => (
      assertNoLabelCollisions(layer, 'Route overview', 8)
    ));
    assertPathSystemVisualContract(canvasElement, 'Route overview');
  },
};

const ROUTE_DETAIL_EXAMPLE = {
  id: 'route-detail-example',
  label: '선택된 계획 경로',
  status: 'active',
  segments: [{
    id: 'segment-detail-example',
    mapId: 'L1',
    label: '현재 · 정상',
    points: [{ x: 48, y: 132 }, { x: 220, y: 132 }, { x: 310, y: 114 }, { x: 488, y: 114 }],
    phase: 'current',
    condition: 'normal',
  }],
  progress: { segmentId: 'segment-detail-example', fraction: 0.55 },
};

export const RouteAndTrajectoryStates = {
  name: '변형·상태 · 상세값과 데이터 품질',
  parameters: storyDescription(
    'phase·condition·progress는 지도 밖 상세 정보로 묶고, 선이 실제로 달라지는 invalid·stale 품질 변형만 함께 비교합니다.',
  ),
  render: () => (
    <StoryPage
      title="Route 상태는 상세값과 데이터 품질로 나눕니다"
      description="phase·condition·progress는 지도 선을 바꾸지 않습니다. 오류와 오래됨처럼 선 자체의 신뢰도를 바꾸는 데이터 품질만 전체 Route에 적용합니다."
      maxWidth={1000}
    >
      <PathMap label="Route 대표 지도" eyebrow="ROUTE · DATA IN DETAIL" height={250} svgHeight={230}>
        {(viewportScale) => (
          <RouteOverlay
            route={ROUTE_DETAIL_EXAMPLE}
            activeMapId="L1"
            viewportScale={viewportScale}
          />
        )}
      </PathMap>
      <aside
        aria-label="Route 상세 상태 값"
        style={{
          display: 'grid',
          gap: 'var(--space-2)',
          padding: 'var(--space-4)',
          border: '1px solid var(--color-semantic-line-normal-normal)',
          borderRadius: 'var(--radius-4)',
          background: 'var(--color-semantic-background-elevated-normal)',
          color: 'var(--color-semantic-label-neutral)',
          fontSize: 'var(--body2-size)',
          lineHeight: 'var(--body2-line)',
        }}
      >
        <strong style={{ color: 'var(--color-semantic-label-strong)' }}>지도 밖 상세 값</strong>
        <span>phase · 예정 / 현재 / 완료</span>
        <span>condition · 정상 / 대기 / 차단 / 충돌</span>
        <span>lifecycle · 계획 / 주행 / 대기 / 차단 / 재계산 / 완료</span>
      </aside>
      <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, color: 'var(--color-semantic-label-strong)', fontSize: 'var(--body1-size)' }}>
          선 모양이 달라지는 예외
        </h3>
        <RouteQualityComparison />
      </section>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    const paths = [...canvasElement.querySelectorAll('[data-route-id="route-detail-example"] [data-route-path]')];
    if (
      paths.length !== 1
      || paths.some((path) => (
        path.getAttribute('stroke-width') !== '1.5'
        || path.getAttribute('opacity') !== '1'
        || path.getAttribute('stroke-dasharray') !== '4 6'
      ))
    ) {
      throw new Error('The representative Route must use the shared 1.5px 4 6 plan-colored Lane grammar.');
    }
    const invalidRoute = canvasElement.querySelector('[data-route-id="route-short-invalid"]');
    const staleRoute = canvasElement.querySelector('[data-route-id="route-short-stale"]');
    if (
      !invalidRoute?.querySelector('[data-route-path]')?.getAttribute('stroke')?.includes('--viewer-danger')
      || invalidRoute.querySelector('[data-route-freshness-pulse]')
      || !staleRoute?.querySelector('[data-route-path]')?.getAttribute('stroke')?.includes('--viewer-warning')
      || !staleRoute.querySelector('[data-route-freshness-pulse]')
      || canvasElement.querySelector('[data-route-overlay-state], [data-route-marker-badge]')
    ) {
      throw new Error('Route quality must use whole-line invalid/stale treatments without point badges.');
    }
    assertPathSystemVisualContract(canvasElement, 'Route detail-only state');
  },
};

const SHORT_ROUTE = {
  id: 'route-short-quality',
  label: '짧은 Route',
  status: 'active',
  segments: [{
    id: 'segment-short-quality',
    mapId: 'L1',
    label: '짧은 계획 구간',
    points: [{ x: 198, y: 112 }, { x: 262, y: 112 }, { x: 326, y: 112 }],
    phase: 'current',
    condition: 'normal',
  }],
  progress: { segmentId: 'segment-short-quality', fraction: 0.5 },
};

function RouteQualityComparison() {
  return (
    <section
      aria-label="Route 데이터 품질 비교"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 'var(--space-4)', minWidth: 0 }}
    >
      <PathMap label="오류 Route 지도" eyebrow="ROUTE · INVALID" height={230}>
        {(viewportScale) => (
          <RouteOverlay
            route={{ ...SHORT_ROUTE, id: 'route-short-invalid', label: '오류 Route' }}
            activeMapId="L1"
            viewportScale={viewportScale}
            invalid
          />
        )}
      </PathMap>
      <PathMap appearance="dark" label="오래된 Route 지도" eyebrow="ROUTE · STALE" height={230}>
        {(viewportScale) => (
          <RouteOverlay
            route={{ ...SHORT_ROUTE, id: 'route-short-stale', label: '오래된 Route' }}
            activeMapId="L1"
            viewportScale={viewportScale}
            stale
          />
        )}
      </PathMap>
    </section>
  );
}

export const ShortPathCompoundMarkers = {
  name: '변형·상태 · 짧은 Route와 데이터 품질',
  tags: ['!dev', 'regression'],
  parameters: storyDescription(
    '짧은 Route의 데이터 품질도 점 뱃지와 연계하지 않습니다. invalid는 정적 negative, stale은 cautionary freshness pulse로 전체 선에 적용합니다.',
  ),
  render: () => (
    <StoryPage
      title="Route 데이터 품질은 선 전체에 적용합니다"
      description="특정 지점의 사건처럼 보이는 점 뱃지는 사용하지 않습니다. 오류는 정적인 negative 선, 오래됨은 기존 LDS freshness pulse로 표현합니다."
      maxWidth={1120}
    >
      <RouteQualityComparison />
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    const invalidRoute = canvasElement.querySelector('[data-route-id="route-short-invalid"]');
    const staleRoute = canvasElement.querySelector('[data-route-id="route-short-stale"]');
    if (
      !invalidRoute?.querySelector('[data-route-path]')?.getAttribute('stroke')?.includes('--viewer-danger')
      || invalidRoute.querySelector('[data-route-freshness-pulse]')
      || !staleRoute?.querySelector('[data-route-path]')?.getAttribute('stroke')?.includes('--viewer-warning')
      || !staleRoute.querySelector('[data-route-freshness-pulse]')
      || canvasElement.querySelector('[data-route-overlay-state], [data-route-marker-badge]')
      || canvasElement.querySelector('[data-route-progress-marker], [data-route-progress-label], [data-route-condition-glyph]')
    ) {
      throw new Error('Route quality must use whole-line invalid/stale treatments without point badges.');
    }
    assertPathSystemVisualContract(canvasElement, 'Short Route');
  },
};

function MultiFloorFixture() {
  const [activeMapId, setActiveMapId] = React.useState('L1');
  const trajectory = activeMapId === 'L1' ? ACTIVE_TRAJECTORY : L2_TRAJECTORY;
  const frame = activeMapId === 'L1' ? PROJECTED_FRAME_L1 : PROJECTED_FRAME_L2;
  return (
    <StoryPage
      title="층별 필터링은 Route를 끊어 잇지 않습니다"
      description="현재 층의 segment만 표시하며 서로 다른 층의 끝점을 가상 선으로 연결하지 않습니다. 층간 이동은 Facility Transition이 소유합니다."
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
      <PathMap label={`${activeMapId} Route와 Trajectory 지도`} testId="multi-floor-path-map" eyebrow={`ROUTE · ${activeMapId}`}>
        {(viewportScale) => (
          <NavigationCoordinateBoundary frame={frame}>
            <RouteOverlay route={ACTIVE_ROUTE} activeMapId={activeMapId} viewportScale={viewportScale} />
            <TrajectoryOverlay trajectory={trajectory} viewportScale={viewportScale} showLabel={false} />
          </NavigationCoordinateBoundary>
        )}
      </PathMap>
      <output data-testid="active-map-output" hidden>{activeMapId}</output>
    </StoryPage>
  );
}

export const MultiFloorFiltering = {
  name: '사용법 · 층별 경로',
  parameters: storyDescription(
    'L1/L2를 전환해 Route segment와 single-map Trajectory가 현재 층만 렌더하는지 확인합니다.',
  ),
  render: () => <MultiFloorFixture />,
  play: async ({ canvasElement }) => {
    const assertFloor = (mapId, segmentCount, trajectoryId) => {
      const segments = [...canvasElement.querySelectorAll('[data-route-segment]')];
      const trajectory = canvasElement.querySelector('[data-lk-trajectory-overlay]');
      if (
        segments.length !== segmentCount
        || segments.some((segment) => segment.getAttribute('data-map-id') !== mapId)
        || trajectory?.getAttribute('data-trajectory-id') !== trajectoryId
      ) {
        throw new Error(`${mapId} Path System filtering failed.`);
      }
      assertPathSystemVisualContract(canvasElement, `${mapId} filtering`);
    };
    assertFloor('L1', 2, ACTIVE_TRAJECTORY.id);
    await userEvent.click([...canvasElement.querySelectorAll('button')].find((button) => button.textContent.trim() === 'L2'));
    await nextRender();
    assertFloor('L2', 1, L2_TRAJECTORY.id);
    const l2Path = canvasElement.querySelector('[data-route-path]')?.getAttribute('d') ?? '';
    if (!l2Path.startsWith('M 72 196') || l2Path.includes('190 154')) {
      throw new Error(`L1 geometry leaked into L2: ${l2Path}`);
    }
  },
};

function PathActivationFixture() {
  const [selection, setSelection] = React.useState('none');
  return (
    <StoryPage
      title="선택은 의미 색이 아니라 casing과 굵기로 표현합니다"
      description="Route segment와 Trajectory는 서로 다른 identity로 선택됩니다. 선택해도 Route phase·condition·progress의 지도 표현은 생기지 않습니다."
      maxWidth={820}
    >
      <PathMap label="Route와 Trajectory 선택 지도" eyebrow="PATH SYSTEM · SELECTION" height={300}>
        {(viewportScale) => (
          <>
            <RouteOverlay
              route={ACTIVE_ROUTE}
              activeMapId="L1"
              viewportScale={viewportScale}
              selectedSegmentId={selection.startsWith('route:') ? selection.slice(6) : undefined}
              onActivate={({ segmentId }) => setSelection(`route:${segmentId}`)}
            />
            <TrajectoryOverlay
              trajectory={ACTIVE_TRAJECTORY}
              viewportScale={viewportScale}
              selected={selection === `trajectory:${ACTIVE_TRAJECTORY.id}`}
              onActivate={(id) => setSelection(`trajectory:${id}`)}
              showLabel={false}
            />
          </>
        )}
      </PathMap>
      <output data-testid="path-selection-output">{selection}</output>
    </StoryPage>
  );
}

export const PathSelectionAndActivation = {
  name: '상호작용 · 구간과 궤적 선택',
  parameters: storyDescription(
    'Route segment와 Trajectory의 pointer activation과 선택 기하를 비교합니다.',
  ),
  render: () => <PathActivationFixture />,
  play: async ({ canvasElement }) => {
    const segment = canvasElement.querySelector(
      '[data-route-segment][data-segment-id="segment-l1-current"]',
    );
    const trajectory = canvasElement.querySelector(`[data-trajectory-id="${ACTIVE_TRAJECTORY.id}"]`);
    await userEvent.click(segment?.querySelector('[data-route-hit-target-core]'));
    await nextRender();
    if (!canvasElement.querySelector('[data-route-casing][data-segment-id="segment-l1-current"][data-route-selection-casing]')) {
      throw new Error('Selected Route segment must widen its casing.');
    }
    await userEvent.click(trajectory);
    await nextRender();
    if (trajectory.getAttribute('data-selected') !== 'true') {
      throw new Error('Trajectory selection did not update independently.');
    }
    assertPathSystemVisualContract(canvasElement, 'Path selection');
  },
};

export const RouteAndTrajectoryNarrow320 = {
  name: '반응형 · 320px 좁은 폭',
  tags: ['!dev', 'regression'],
  parameters: storyDescription(
    '320px에서도 Route 계획색 점선, Trajectory sample, RobotPose의 계층과 screen-space hit target을 유지합니다.',
  ),
  render: () => (
    <div data-testid="path-narrow" style={{ width: 320, maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      <StoryPage
        title="좁은 화면에서도 Path System 문법은 바뀌지 않습니다"
        description="Route progress와 Trajectory playback cursor를 추가하지 않고 선·sample·RobotPose의 역할을 유지합니다."
      >
        <PathMap label="320px Path System 지도" eyebrow="PATH SYSTEM · L1" aspectRatio="572 / 282">
          {(viewportScale) => <ActivePathLayers viewportScale={viewportScale} />}
        </PathMap>
      </StoryPage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const narrow = canvasElement.querySelector('[data-testid="path-narrow"]');
    if (!narrow || narrow.scrollWidth > narrow.clientWidth) {
      throw new Error(`Path System narrow story overflowed: ${narrow?.scrollWidth}/${narrow?.clientWidth}`);
    }
    assertPathSystemVisualContract(narrow, '320px Path System');
  },
};

export const RouteTrajectoryVisualParity = {
  ...RouteAndTrajectoryStates,
  name: 'Route visual parity',
  tags: ['!dev', 'visual-parity'],
};
