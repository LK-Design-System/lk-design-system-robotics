import React from 'react';
import { waitFor } from 'storybook/test';
import { Map2DCanvas } from '@lk-robotics/lds-product';
import {
  FacilityTransition,
  LaneOverlay,
  NavigationAnnotationLayer,
  RouteOverlay,
  SpatialRegion,
  TrajectoryOverlay,
  WaypointMarker,
} from '../src/index.js';
import { NavigationMapStage } from './RoboticsNavigationStage.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';
import { assertNoLabelCollisions, collectAnnotationLabels } from './RoboticsNavigationCollision.shared.jsx';

const meta = {
  title: 'LDS Robotics/Navigation/Annotation Layer',
  tags: ['autodocs'],
  component: NavigationAnnotationLayer,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-annotation-layer--annotation-layer-overview',
      eyebrow: 'Robotics / Navigation / Annotation Layer',
      title: '한 지도의 여러 오버레이 라벨은 한 곳에서 충돌을 조정합니다',
      description:
        '여러 내비게이션 오버레이의 라벨이 겹칠 때 후보 위치와 우선순위로 충돌을 조정합니다. 오버레이 하나만 쓰거나 제품이 자체 충돌 정책을 소유한 지도에는 적용하지 마세요.',
      docsDescription:
        '여러 내비게이션 오버레이를 한 지도에 합성해 라벨이 서로 겹칠 수 있을 때 적합합니다. 라벨뿐 아니라 경로선·지도 chrome·안전 여백을 피하는 후보 위치와 최대 24px의 2D 미세 조정을 적용하고, 공간이 없으면 우선순위 낮은 라벨만 숨깁니다. 마커·상태 badge·접근 가능한 이름·semantic mirror는 절대 바뀌지 않습니다. 오버레이 하나만 단독 렌더하거나 제품이 자체 symbol collision 정책을 이미 소유한 지도에는 사용하지 마세요 — provider 없이 렌더된 오버레이는 오늘과 동일하게 동작합니다.',
    },
    docs: {
      description: {
        component: '형제 내비게이션 오버레이들의 장식 라벨 블록 간 화면 충돌을 조정하는 SVG `<g>` provider입니다.',
      },
    },
  },
};

export default meta;

function AnnotationMap({
  label,
  testId,
  width = 540,
  height = 300,
  eyebrow = 'MAP · L1',
  children,
}) {
  const svgRef = React.useRef(null);
  const [viewBoxScale, setViewBoxScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    const measure = () => {
      const nextScale = svg.getBoundingClientRect().width / width;
      if (!Number.isFinite(nextScale) || nextScale <= 0) return;
      setViewBoxScale((current) => (Math.abs(current - nextScale) < 0.0001 ? current : nextScale));
    };

    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined;
    observer?.observe(svg);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width]);

  return (
    <Map2DCanvas
      data-testid={testId}
      label={label}
      controls={false}
      panEnabled={false}
      wheelZoom={false}
      keyboard={false}
      grid={false}
      style={{ width: '100%', maxWidth: width, height: 'auto', aspectRatio: `${width} / ${height}` }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        aria-label={label}
      >
        <NavigationMapStage width={width} height={height} eyebrow={eyebrow} north>
          {children({ viewportScale: viewBoxScale })}
        </NavigationMapStage>
      </svg>
    </Map2DCanvas>
  );
}

// --- 결함 재현 픽스처 -------------------------------------------------------
// 짧은 경로의 route 진행 라벨과 trajectory 라벨이 자연 위치에서 겹치고(결함 A),
// 인접한 자동문 두 개의 라벨 블록이 서로를 덮는(결함 B) 실측 사례를 한 지도에
// 재현합니다. provider 유무 비교가 이 스토리 그룹의 핵심 증거입니다.

const SHORT_ROUTE = {
  id: 'annotation-route-short',
  label: '짧은 복합 상태 경로',
  status: 'active',
  segments: [{
    id: 'annotation-segment-short',
    mapId: 'L1',
    label: '짧은 충돌 구간',
    points: [{ x: 410, y: 96 }, { x: 418, y: 96 }, { x: 426, y: 96 }],
    phase: 'current',
    condition: 'conflict',
  }],
  progress: { segmentId: 'annotation-segment-short', fraction: 0.5 },
};

const SHORT_TRAJECTORY = {
  id: 'annotation-trajectory-short',
  label: '짧은 복합 상태 궤적',
  mapId: 'L1',
  status: 'active',
  samples: [
    { position: { x: 410, y: 190 }, timeMs: 0, headingRad: 0 },
    { position: { x: 418, y: 190 }, timeMs: 200, headingRad: 0 },
    { position: { x: 426, y: 190 }, timeMs: 400, headingRad: 0 },
  ],
  currentSampleIndex: 1,
};

const EAST_DOOR = {
  id: 'annotation-door-east',
  kind: 'door',
  label: '동측 자동문',
  facilityId: 'door-east',
  from: { mapId: 'L1', position: { x: 62, y: 70 }, label: '동측 통로', doorId: 'door-east' },
  to: { mapId: 'L1', position: { x: 98, y: 70 }, label: '포장 구역', doorId: 'door-east' },
  availability: 'available',
  doorState: 'moving',
  event: 'open',
};

const LIST_DOOR = {
  ...EAST_DOOR,
  id: 'annotation-door-list',
  label: '목록 소유 자동문',
  facilityId: 'door-list',
  from: { mapId: 'L1', position: { x: 180, y: 70 }, label: '목록 소유 입구', doorId: 'door-list' },
  to: { mapId: 'L1', position: { x: 216, y: 70 }, label: '목록 소유 출구', doorId: 'door-list' },
};

function collisionFixtures(viewportScale) {
  return (
    <>
      <FacilityTransition transition={EAST_DOOR} activeMapId="L1" viewportScale={viewportScale} onActivate={() => {}} />
      <FacilityTransition transition={LIST_DOOR} activeMapId="L1" viewportScale={viewportScale} onActivate={() => {}} />
      <RouteOverlay route={SHORT_ROUTE} activeMapId="L1" viewportScale={viewportScale} invalid stale />
      <TrajectoryOverlay trajectory={SHORT_TRAJECTORY} viewportScale={viewportScale} invalid stale />
    </>
  );
}

// --- 개요: 6종 오버레이 합성 ------------------------------------------------

const OVERVIEW_REGION = {
  id: 'annotation-zone-keepout',
  mapId: 'L1',
  label: '충전 구역 진입 금지',
  category: 'behavior',
  rule: { kind: 'keep-out' },
  shape: {
    kind: 'polygon',
    points: [{ x: 40, y: 26 }, { x: 150, y: 26 }, { x: 150, y: 94 }, { x: 40, y: 94 }],
  },
};

const OVERVIEW_LANE = {
  id: 'annotation-lane-corridor',
  label: '주 통로 A→B',
  mapId: 'L1',
  points: [{ x: 96, y: 210 }, { x: 236, y: 210 }, { x: 330, y: 120 }, { x: 452, y: 110 }],
  entry: { waypointId: 'annotation-wp-pick', orientation: 'forward' },
  exit: { waypointId: 'annotation-wp-lift', orientation: 'forward' },
  relation: { kind: 'single' },
  speedLimitMps: 0.8,
  mutexGroupId: 'corridor-2',
};

const OVERVIEW_ROUTE = {
  id: 'annotation-route-delivery',
  label: '배송 경로 17',
  status: 'active',
  segments: [{
    id: 'annotation-seg-current',
    mapId: 'L1',
    label: '교차로 → 승강기 A',
    points: [{ x: 236, y: 210 }, { x: 330, y: 120 }, { x: 430, y: 112 }],
    phase: 'current',
    condition: 'waiting',
  }],
  progress: { segmentId: 'annotation-seg-current', fraction: 0.42 },
};

const OVERVIEW_TRAJECTORY = {
  id: 'annotation-trajectory-amr7',
  label: 'AMR 7 예상 궤적',
  mapId: 'L1',
  status: 'active',
  samples: [
    { position: { x: 100, y: 224 }, timeMs: 0, headingRad: 0 },
    { position: { x: 244, y: 210 }, timeMs: 600, headingRad: -0.4 },
    { position: { x: 312, y: 156 }, timeMs: 900, headingRad: -0.7 },
    { position: { x: 448, y: 118 }, timeMs: 1500, headingRad: 0 },
  ],
  currentSampleIndex: 2,
};

const OVERVIEW_WAYPOINT = {
  id: 'annotation-wp-pick',
  label: '픽업 지점 P1',
  mapId: 'L1',
  position: { x: 96, y: 210 },
  roles: ['holding'],
  availability: 'available',
};

const OVERVIEW_FACILITY = {
  id: 'annotation-facility-lift',
  kind: 'lift',
  label: '화물 승강기 A',
  facilityId: 'lift-a',
  from: { mapId: 'L1', position: { x: 380, y: 60 }, label: '1층 승강기 접근 지점', doorId: 'lift-a-door-1f' },
  to: { mapId: 'ops-2f', position: { x: 380, y: 60 }, label: '2층 승강기 도착 지점', doorId: 'lift-a-door-2f' },
  availability: 'available',
  phase: 'approach',
  doorState: 'closed',
  motionState: 'stopped',
  operatingMode: 'agv',
  sessionState: 'requested',
  currentMapId: 'L1',
  destinationMapId: 'ops-2f',
};

export const AnnotationLayerOverview = {
  name: '개요',
  parameters: storyDescription(
    '여섯 종류의 내비게이션 오버레이를 하나의 layer 아래 합성한 기준 구성입니다. 조정 대상은 장식 라벨뿐이며, 마커·상태 badge·페인트 순서·키보드 경로는 각 오버레이 계약 그대로입니다.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 720 }}>
      <AnnotationMap label="여섯 오버레이가 합성된 내비게이션 지도" testId="annotation-overview-map">
        {({ viewportScale }) => (
          <NavigationAnnotationLayer detailMode="detail">
            <SpatialRegion region={OVERVIEW_REGION} viewportScale={viewportScale} />
            <LaneOverlay lane={OVERVIEW_LANE} viewportScale={viewportScale} />
            <RouteOverlay route={OVERVIEW_ROUTE} activeMapId="L1" viewportScale={viewportScale} />
            <TrajectoryOverlay trajectory={OVERVIEW_TRAJECTORY} viewportScale={viewportScale} />
            <WaypointMarker waypoint={OVERVIEW_WAYPOINT} viewportScale={viewportScale} />
            <FacilityTransition transition={OVERVIEW_FACILITY} activeMapId="L1" viewportScale={viewportScale} />
          </NavigationAnnotationLayer>
        )}
      </AnnotationMap>
    </main>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const map = canvasElement.querySelector('[data-testid="annotation-overview-map"]');
      const layer = map?.querySelector('[data-lk-navigation-annotation-layer]');
      if (!layer) throw new Error('Overview must compose the overlays under one annotation layer.');
      const labelCount = Number(layer.getAttribute('data-annotation-label-count'));
      const obstacleCount = Number(layer.getAttribute('data-annotation-obstacle-count'));
      if (!(labelCount >= 6) || !(obstacleCount >= 6)) {
        throw new Error(`Six overlay kinds must register labels and obstacles: ${labelCount}/${obstacleCount}.`);
      }
      assertNoLabelCollisions(map, 'Overview');
      const kinds = new Set(collectAnnotationLabels(map).map((label) => label.getAttribute('data-annotation-kind')));
      for (const kind of ['region-label', 'lane-label', 'route-segment-label', 'route-progress-label', 'trajectory-label', 'waypoint-label', 'facility-label']) {
        if (!kinds.has(kind)) throw new Error(`Annotation kind contract is missing ${kind}.`);
      }
    });
  },
};

const DENSITY_ROUTE = {
  ...OVERVIEW_ROUTE,
  id: 'annotation-route-density',
  segments: [
    {
      id: 'annotation-seg-completed',
      mapId: 'L1',
      label: '입구 적재 대기 구역 → 중앙 교차로',
      points: [{ x: 58, y: 224 }, { x: 150, y: 224 }, { x: 236, y: 210 }],
      phase: 'completed',
      condition: 'normal',
    },
    {
      ...OVERVIEW_ROUTE.segments[0],
      id: 'annotation-seg-current-density',
      label: '중앙 교차로 → 북동측 화물 승강기 A',
    },
  ],
  progress: { segmentId: 'annotation-seg-current-density', fraction: 0.42 },
};

function densityFixtures(viewportScale) {
  return (
    <>
      <SpatialRegion
        region={{ ...OVERVIEW_REGION, id: 'annotation-zone-density', label: '충전 준비 구역 장기 체류 진입 제한' }}
        viewportScale={viewportScale}
      />
      <LaneOverlay
        lane={{ ...OVERVIEW_LANE, id: 'annotation-lane-density', label: '주 통로 A에서 북동측 승강기 B까지' }}
        viewportScale={viewportScale}
      />
      <RouteOverlay route={DENSITY_ROUTE} activeMapId="L1" viewportScale={viewportScale} />
      <TrajectoryOverlay
        trajectory={{ ...OVERVIEW_TRAJECTORY, id: 'annotation-trajectory-density', label: 'AMR 7 장거리 배송 예상 궤적' }}
        viewportScale={viewportScale}
      />
      <WaypointMarker
        waypoint={{ ...OVERVIEW_WAYPOINT, id: 'annotation-wp-density', label: '북측 피킹 작업 인계 지점 P1' }}
        viewportScale={viewportScale}
      />
      <FacilityTransition
        transition={{ ...OVERVIEW_FACILITY, id: 'annotation-facility-density', label: '북동측 화물 승강기 A' }}
        activeMapId="L1"
        viewportScale={viewportScale}
      />
    </>
  );
}

export const DensityLevels = {
  name: '변형·상태 · 라벨 밀도 단계',
  parameters: storyDescription(
    '같은 긴 한국어 라벨 데이터를 overview, standard, detail로 비교합니다. overview는 현재 진행 문맥만, standard는 주요 point 이름을 한 줄로 축약하며, detail은 완료 구간·lane·region까지 후보에 포함합니다. 모든 단계에서 경로선·지도 chrome·16px 안전 여백과 충돌하면 낮은 우선순위 라벨을 숨깁니다.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 720 }}>
      {['overview', 'standard', 'detail'].map((detailMode) => (
        <AnnotationMap
          key={detailMode}
          label={`${detailMode} 라벨 밀도 지도`}
          testId={`annotation-density-${detailMode}`}
          eyebrow={`DENSITY · ${detailMode.toUpperCase()}`}
        >
          {({ viewportScale }) => (
            <NavigationAnnotationLayer detailMode={detailMode}>
              {densityFixtures(viewportScale)}
            </NavigationAnnotationLayer>
          )}
        </AnnotationMap>
      ))}
    </main>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const visibleCounts = ['overview', 'standard', 'detail'].map((detailMode) => {
        const map = canvasElement.querySelector(`[data-testid="annotation-density-${detailMode}"]`);
        const layer = map?.querySelector('[data-lk-navigation-annotation-layer]');
        if (layer?.getAttribute('data-annotation-detail-mode') !== detailMode) {
          throw new Error(`${detailMode} must remain an explicit density contract.`);
        }
        assertNoLabelCollisions(map, `Density ${detailMode}`, 8);
        return collectAnnotationLabels(map).length;
      });
      if (!(visibleCounts[0] <= visibleCounts[1] && visibleCounts[0] < visibleCounts[2])) {
        throw new Error(`Expanded detail eligibility must not reduce overview context: ${visibleCounts.join(' ≤ ')}.`);
      }

      const overview = canvasElement.querySelector('[data-testid="annotation-density-overview"]');
      const completed = overview?.querySelector('[data-annotation-id*="seg-completed"]');
      if (completed?.getAttribute('data-annotation-suppressed-reason') !== 'density') {
        throw new Error('Completed segment context must be density-suppressed in overview mode.');
      }
    });
  },
};

export const CrossEntityLabelCollisions = {
  name: '변형·상태 · 교차 개체 라벨 충돌',
  parameters: storyDescription(
    '자연 anchor에서 서로 다른 개체의 라벨이 겹치는 두 실측 사례 — route 진행 라벨 위의 trajectory 라벨, 인접 자동문 라벨 쌍 — 를 한 지도에 재현합니다. layer가 종류별 후보 위치와 제한된 2D 미세 조정으로 라벨만 분리하고 실제 anchor 좌표와 마커는 보존해야 합니다.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 720 }}>
      <AnnotationMap label="교차 개체 라벨 충돌 지도" testId="annotation-collision-map">
        {({ viewportScale }) => (
          <NavigationAnnotationLayer>
            {collisionFixtures(viewportScale)}
          </NavigationAnnotationLayer>
        )}
      </AnnotationMap>
    </main>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const map = canvasElement.querySelector('[data-testid="annotation-collision-map"]');
      assertNoLabelCollisions(map, 'Cross-entity');
      if (!map.querySelector('[data-annotation-displaced="true"]')) {
        throw new Error('The colliding fixtures must actually engage coordination.');
      }
      const layer = map.querySelector('[data-lk-navigation-annotation-layer]');
      if (layer?.getAttribute('data-annotation-suppressed-count') !== '0') {
        throw new Error('Both defect pairs must resolve by displacement alone — suppression has its own story.');
      }
      collectAnnotationLabels(map).forEach((label) => {
        const anchorX = Number(label.getAttribute('data-annotation-anchor-x'));
        const anchorY = Number(label.getAttribute('data-annotation-anchor-y'));
        if (!Number.isFinite(anchorX) || !Number.isFinite(anchorY)) {
          throw new Error('Coordinated labels must publish their true anchor coordinates.');
        }
      });
      const progressLabel = map.querySelector('[data-route-progress-label]')?.getBoundingClientRect();
      const trajectoryLabel = map.querySelector('[data-trajectory-label]')?.getBoundingClientRect();
      const eastLabel = map.querySelector('[data-transition-id="annotation-door-east"] [data-transition-label]')?.getBoundingClientRect();
      const listLabel = map.querySelector('[data-transition-id="annotation-door-list"] [data-transition-label]')?.getBoundingClientRect();
      for (const [name, a, b] of [['route/trajectory', progressLabel, trajectoryLabel], ['door pair', eastLabel, listLabel]]) {
        if (!a || !b) throw new Error(`${name} labels must both render.`);
        const overlaps = a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
        if (overlaps) throw new Error(`${name} labels still overlap across entities.`);
      }
      [...map.querySelectorAll('[data-transition-marker], [data-route-marker-badge], [data-trajectory-marker-badge]')].forEach((marker) => {
        const rect = marker.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) throw new Error('Markers and badges must keep rendered bounds under coordination.');
      });
    });
  },
};

const CLUSTER_WAYPOINTS = Array.from({ length: 14 }, (_, index) => ({
  id: `annotation-wp-cluster-${index + 1}`,
  label: `밀집 지점 ${index + 1}`,
  mapId: 'L1',
  position: { x: 240, y: 150 },
  roles: [],
  availability: index === 0 ? 'unavailable' : 'available',
}));
const CLUSTER_SELECTED_ID = 'annotation-wp-cluster-4';
const CLUSTER_FOCUSED_ID = 'annotation-wp-cluster-2';
const CLUSTER_ALARM_ID = 'annotation-wp-cluster-1';

export const LabelSuppressionPriority = {
  name: '변형·상태 · 라벨 숨김 우선순위',
  parameters: storyDescription(
    '후보 위치와 24px 미세 조정 안에 빈 슬롯이 부족할 만큼 라벨이 밀집된 경우입니다. danger > focus > selection 순으로 라벨을 보존하고 우선순위 낮은 라벨만 숨기며, 숨겨진 개체의 마커와 접근 가능한 이름은 그대로 유지됩니다.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 720 }}>
      <AnnotationMap label="라벨 숨김 우선순위 지도" testId="annotation-suppression-map">
        {({ viewportScale }) => (
          <NavigationAnnotationLayer>
            {CLUSTER_WAYPOINTS.map((waypoint) => (
              <WaypointMarker
                key={waypoint.id}
                waypoint={waypoint}
                viewportScale={viewportScale}
                selected={waypoint.id === CLUSTER_SELECTED_ID}
                focused={waypoint.id === CLUSTER_FOCUSED_ID}
                onActivate={() => {}}
              />
            ))}
          </NavigationAnnotationLayer>
        )}
      </AnnotationMap>
    </main>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const map = canvasElement.querySelector('[data-testid="annotation-suppression-map"]');
      assertNoLabelCollisions(map, 'Suppression');
      const suppressed = [...map.querySelectorAll('[data-annotation-suppressed="true"]')];
      if (suppressed.length === 0) throw new Error('The over-dense cluster must suppress at least one label.');
      suppressed.forEach((label) => {
        const view = label.ownerDocument.defaultView;
        if (view.getComputedStyle(label).visibility !== 'hidden') {
          throw new Error('Suppressed labels must hide via visibility, keeping measurable geometry.');
        }
        if ([CLUSTER_SELECTED_ID, CLUSTER_FOCUSED_ID, CLUSTER_ALARM_ID]
          .some((id) => label.getAttribute('data-annotation-id') === `waypoint:${id}:label`)) {
          throw new Error('Danger, focused, and selected entities must not lose their labels.');
        }
      });
      const protectedLabels = [CLUSTER_ALARM_ID, CLUSTER_FOCUSED_ID, CLUSTER_SELECTED_ID]
        .map((id) => map.querySelector(`[data-annotation-id="waypoint:${id}:label"]`));
      if (protectedLabels.some((label) => !label || label.getAttribute('data-annotation-suppressed') === 'true')) {
        throw new Error('Danger, focused, and selected labels must survive density suppression.');
      }
      const priorities = protectedLabels.map((label) => Number(label.getAttribute('data-annotation-priority')));
      if (!(priorities[0] > priorities[1] && priorities[1] > priorities[2])) {
        throw new Error(`Priority must be danger > focus > selection, received ${priorities.join(' > ')}.`);
      }
      if (protectedLabels[0].getAttribute('data-annotation-displaced') === 'true') {
        throw new Error('The highest-priority danger label must keep the natural position.');
      }
      suppressed.forEach((label) => {
        const marker = label.closest('[data-waypoint-marker]');
        const point = marker?.querySelector('[data-waypoint-point]')?.getBoundingClientRect();
        if (!point || point.width <= 0) throw new Error('Suppressed entities must keep their marker rendered.');
        if (!marker.getAttribute('aria-label')) throw new Error('Suppression must not change accessible names.');
      });
    });
  },
};

export const NoProviderBaseline = {
  name: '변형·상태 · 조정 없는 기준선',
  parameters: storyDescription(
    '같은 충돌 픽스처를 layer 없이 렌더한 하위 호환 기준선입니다. 오버레이 단독 출력은 조정 이전과 동일해야 하므로 자연 겹침이 그대로 남고, 어떤 조정 증거 속성도 나타나지 않아야 합니다.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 720 }}>
      <AnnotationMap label="provider 없는 기준선 지도" testId="annotation-baseline-map">
        {({ viewportScale }) => collisionFixtures(viewportScale)}
      </AnnotationMap>
    </main>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const map = canvasElement.querySelector('[data-testid="annotation-baseline-map"]');
      if (map.querySelector('[data-lk-navigation-annotation-layer], [data-annotation-displaced], [data-annotation-suppressed], [data-annotation-obstacle]')) {
        throw new Error('Without a provider, no coordination evidence may appear.');
      }
      const eastLabel = map.querySelector('[data-transition-id="annotation-door-east"] [data-transition-label]')?.getBoundingClientRect();
      const listLabel = map.querySelector('[data-transition-id="annotation-door-list"] [data-transition-label]')?.getBoundingClientRect();
      if (!eastLabel || !listLabel) throw new Error('Baseline door labels must render.');
      const naturallyOverlaps = eastLabel.left < listLabel.right - 0.5
        && eastLabel.right > listLabel.left + 0.5
        && eastLabel.top < listLabel.bottom - 0.5
        && eastLabel.bottom > listLabel.top + 0.5;
      if (!naturallyOverlaps) {
        throw new Error('Baseline fixtures must keep their natural collision — coordination, not fixture spacing, resolves it.');
      }
    });
  },
};

export const NarrowWidth = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 지도에서도 layer 조정은 카드나 여러 줄 래핑을 만들지 않고 후보 위치와 제한된 2D 미세 조정만 수행하며, 페이지 가로 overflow를 만들지 않아야 합니다.',
  ),
  render: () => (
    <div data-testid="annotation-narrow-shell" style={{ width: 320, maxWidth: '100%', minWidth: 0 }}>
      <AnnotationMap width={320} height={280} label="320px 라벨 조정 지도" testId="annotation-narrow-map">
        {({ viewportScale }) => (
          <NavigationAnnotationLayer>
            <FacilityTransition
              transition={{
                ...EAST_DOOR,
                id: 'annotation-narrow-door-a',
                from: { ...EAST_DOOR.from, position: { x: 60, y: 96 } },
                to: { ...EAST_DOOR.to, position: { x: 96, y: 96 } },
              }}
              activeMapId="L1"
              viewportScale={viewportScale}
              onActivate={() => {}}
            />
            <FacilityTransition
              transition={{
                ...LIST_DOOR,
                id: 'annotation-narrow-door-b',
                from: { ...LIST_DOOR.from, position: { x: 150, y: 96 } },
                to: { ...LIST_DOOR.to, position: { x: 186, y: 96 } },
              }}
              activeMapId="L1"
              viewportScale={viewportScale}
              onActivate={() => {}}
            />
          </NavigationAnnotationLayer>
        )}
      </AnnotationMap>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const shell = canvasElement.querySelector('[data-testid="annotation-narrow-shell"]');
      const map = canvasElement.querySelector('[data-testid="annotation-narrow-map"]');
      if (shell.scrollWidth > shell.clientWidth + 1) {
        throw new Error(`Narrow annotation map must not overflow horizontally: ${shell.scrollWidth}>${shell.clientWidth}.`);
      }
      assertNoLabelCollisions(map, 'Narrow');
    });
  },
};

export const NavigationAnnotationVisualParity = {
  ...CrossEntityLabelCollisions,
  name: 'Navigation annotation visual parity',
  tags: ['!dev', 'visual-parity'],
};
