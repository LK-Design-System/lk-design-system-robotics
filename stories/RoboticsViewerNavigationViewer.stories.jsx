import React from 'react';
import { userEvent, waitFor } from 'storybook/test';
import {
  Map2DCanvas,
  RouteOverlay,
  TrajectoryOverlay,
  WaypointMarker,
  LaneOverlay,
  SpatialRegion,
  FacilityTransition,
  LayerPanel,
  SelectionInspector,
  Legend,
} from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import { StoryPage } from './RoboticsNavigationRouteTrajectory.shared.jsx';
import { NavigationMapStage } from './RoboticsNavigationStage.shared.jsx';

const meta = {
  title: 'LDS Robotics/Viewer/Navigation Viewer',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-viewer-navigation-viewer--overview',
      eyebrow: 'Robotics / Viewer / Navigation Viewer',
      title: '내비게이션 오버레이를 지도 캔버스와 패널로 합성한 뷰어입니다',
      description:
        '영역·레인·경로·궤적·웨이포인트·설비 전이 오버레이를 Map2DCanvas 위에 얹고, LayerPanel 트리 하나가 레이어와 객체의 선택·표시·잠금을, SelectionInspector와 Legend가 선택 상태와 계층 부호를 담당하는 합성 뷰어 씬입니다. 지도와 패널이 하나의 선택·표시·잠금 상태를 공유하는 제품형 내비게이션 뷰어를 조립할 때 사용합니다. 완성된 제품 화면이나 경로 계획·운영 권한·백엔드 상태를 이 패턴에 넣는 용도에는 사용하지 마세요. 지도 도형은 포인터 전용(aria-hidden)이고 키보드·스크린 리더 탐색은 패널 트리에 위임합니다. 이 합성은 제품이 뷰어를 조립하는 방식의 표준 예시이며, 렌더러의 값·표현 어휘는 Foundation 원자가, 표현/경계 규약은 NAVIGATION_EXPRESSION_CONVENTIONS가 소유합니다.',
    },
    docs: {
      description: {
        component:
          '내비게이션 오버레이 렌더러들을 2D 지도 캔버스 + 레이어·객체 트리 패널 + 선택 검사기 + 범례로 합성한 제품형 뷰어 씬입니다. 하나의 선택 identity와 표시·잠금 상태를 네 표면이 공유하고, 지도는 포인터 전용이며 키보드·스크린 리더 탐색은 트리 패널이 담당합니다.',
      },
    },
  },
};

export default meta;

function nextRender() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

// A composed navigation viewer: one 2D map canvas renders the pointer-only
// overlay fragments while a single layer/object tree panel owns keyboard and
// screen-reader selection, per-layer and per-object visibility, and pointer
// locks. A selection inspector and a legend echo the same identity and state.
// This is a PRODUCT composition — the overlays are the design-system
// renderers, and this page shows how a product assembles them into a viewer —
// so it lives in the Viewer group, not on a renderer page. See
// docs/NAVIGATION_EXPRESSION_CONVENTIONS.md.
const MIRROR_MAP_ID = 'ops-1f';

const MIRROR_KEEPOUT_REGION = {
  id: 'zone-keepout',
  mapId: MIRROR_MAP_ID,
  label: '충전 구역 진입 금지',
  category: 'behavior',
  rule: { kind: 'keep-out' },
  shape: {
    kind: 'polygon',
    points: [{ x: 40, y: 26 }, { x: 150, y: 26 }, { x: 150, y: 94 }, { x: 40, y: 94 }],
  },
};

const MIRROR_LOBBY_REGION = {
  id: 'zone-lift-lobby',
  mapId: MIRROR_MAP_ID,
  label: '승강기 로비',
  category: 'facility',
  kind: 'lift-lobby',
  facilityId: 'lift-a',
  shape: { kind: 'circle', center: { x: 496, y: 96 }, radius: 40 },
};

const MIRROR_LANE = {
  id: 'lane-corridor',
  label: '주 통로 A→B',
  mapId: MIRROR_MAP_ID,
  points: [{ x: 96, y: 210 }, { x: 236, y: 210 }, { x: 330, y: 120 }, { x: 452, y: 110 }],
  entry: { waypointId: 'wp-pick', orientation: 'forward' },
  exit: { waypointId: 'wp-lift', orientation: 'forward', transitionIds: ['facility-lift'] },
  relation: { kind: 'single' },
  speedLimitMps: 0.8,
  mutexGroupId: 'corridor-2',
};

const MIRROR_ROUTE = {
  id: 'route-delivery-17',
  label: '배송 경로 17',
  status: 'active',
  segments: [
    {
      id: 'route-seg-completed',
      mapId: MIRROR_MAP_ID,
      label: '픽업 → 교차로',
      points: [{ x: 96, y: 210 }, { x: 200, y: 210 }, { x: 236, y: 210 }],
      laneIds: ['lane-corridor'],
      phase: 'completed',
      condition: 'normal',
    },
    {
      id: 'route-seg-current',
      mapId: MIRROR_MAP_ID,
      label: '교차로 → 승강기 A',
      points: [{ x: 236, y: 210 }, { x: 330, y: 120 }, { x: 430, y: 112 }],
      laneIds: ['lane-corridor'],
      exitTransitionId: 'facility-lift',
      phase: 'current',
      condition: 'waiting',
    },
  ],
  // Keep the explicit progress anchor away from the current segment's midpoint
  // (the condition badge's natural anchor): at ~equal anchors the renderer's
  // collision rule correctly lifts both badges into a detached screen-slot
  // row, which is stress-fixture territory — a representative viewer scene
  // should read with every badge sitting on its own path anchor.
  progress: { segmentId: 'route-seg-current', fraction: 0.72 },
};

const MIRROR_ROUTE_CURRENT_SEGMENT_ID = 'route-seg-current';
const mirrorRouteSegmentKey = (segmentId) => `paths:${MIRROR_ROUTE.id}:${segmentId}`;

const MIRROR_TRAJECTORY = {
  id: 'trajectory-amr-7',
  label: 'AMR 7 예상 궤적',
  mapId: MIRROR_MAP_ID,
  status: 'active',
  samples: [
    { position: { x: 100, y: 224 }, timeMs: 0, headingRad: 0 },
    { position: { x: 178, y: 222 }, timeMs: 300, headingRad: -0.08 },
    { position: { x: 244, y: 210 }, timeMs: 600, headingRad: -0.4 },
    { position: { x: 312, y: 156 }, timeMs: 900, headingRad: -0.7 },
    { position: { x: 388, y: 124 }, timeMs: 1200, headingRad: -0.3 },
    { position: { x: 448, y: 118 }, timeMs: 1500, headingRad: 0 },
  ],
  currentSampleIndex: 3,
};

const MIRROR_PICK_WAYPOINT = {
  id: 'wp-pick',
  label: '픽업 지점 P1',
  mapId: MIRROR_MAP_ID,
  position: { x: 96, y: 210 },
  roles: ['holding'],
  availability: 'available',
};

const MIRROR_LIFT_WAYPOINT = {
  id: 'wp-lift',
  label: '승강기 접근 지점',
  mapId: MIRROR_MAP_ID,
  position: { x: 452, y: 104 },
  roles: ['passthrough'],
  annotations: [{ kind: 'lift-approach', label: '승강기 A 접근' }],
  availability: 'available',
};

const MIRROR_FACILITY = {
  id: 'facility-lift',
  kind: 'lift',
  label: '화물 승강기 A',
  facilityId: 'lift-a',
  from: {
    mapId: MIRROR_MAP_ID,
    position: { x: 496, y: 96 },
    label: '1층 승강기 접근 지점',
    waypointId: 'wp-lift',
    regionId: 'zone-lift-lobby',
    doorId: 'lift-a-door-1f',
  },
  to: {
    mapId: 'ops-2f',
    position: { x: 496, y: 96 },
    label: '2층 승강기 도착 지점',
    doorId: 'lift-a-door-2f',
  },
  availability: 'available',
  phase: 'approach',
  doorState: 'closed',
  motionState: 'stopped',
  operatingMode: 'agv',
  sessionState: 'requested',
  currentMapId: MIRROR_MAP_ID,
  destinationMapId: 'ops-2f',
};

// One tone name per layer keeps the tree rows, the map legend, and the
// LayerPanel tone vocabulary aligned to the same semantic color tokens.
const TONE_COLOR = {
  neutral: 'var(--color-semantic-label-neutral)',
  signal: 'var(--color-semantic-primary-normal)',
  positive: 'var(--color-semantic-status-positive)',
  cautionary: 'var(--color-semantic-status-cautionary)',
};

// Layer identity shared by the map, the layer/object tree, and the legend.
const MIRROR_LAYERS = [
  { id: 'regions', label: '영역', description: '동작·시설·지형', tone: 'cautionary' },
  { id: 'lanes', label: '레인', description: '방향 그래프 연결', tone: 'signal' },
  { id: 'paths', label: '경로·궤적', description: '계획 구간과 조밀 궤적', tone: 'positive' },
  { id: 'waypoints', label: '웨이포인트', description: '그래프 지점', tone: 'neutral' },
  { id: 'facilities', label: '설비 전이', description: '문·승강기·도크', tone: 'signal' },
];

// One registry drives the tree panel, the inspector, and the selection
// identity so the mirror can never drift from what the map renders. Inspector
// and row values use the Korean vocabulary; raw enums/ids stay in fixture
// props only.
const MIRROR_FEATURES = [
  {
    key: 'regions:zone-keepout',
    layerId: 'regions',
    listName: '충전 구역 진입 금지',
    item: { label: '충전 구역 진입 금지', kind: '동작 영역', status: '진입 금지', statusTone: 'cautionary' },
    sections: [{ title: '영역', fields: [{ label: '분류', value: '동작 · 진입 금지' }, { label: '형태', value: '다각형 4점' }] }],
  },
  {
    key: 'regions:zone-lift-lobby',
    layerId: 'regions',
    listName: '승강기 로비',
    item: { label: '승강기 로비', kind: '시설 영역', status: '승강기 A', statusTone: 'signal' },
    sections: [{ title: '영역', fields: [{ label: '분류', value: '시설 · 승강기 로비' }, { label: '설비', value: '화물 승강기 A' }, { label: '형태', value: '원형 r40' }] }],
  },
  {
    key: 'lanes:lane-corridor',
    layerId: 'lanes',
    listName: '주 통로 A→B',
    item: { label: '주 통로 A→B', kind: '레인', status: '통행 가능', statusTone: 'positive' },
    sections: [{ title: '토폴로지', fields: [{ label: '방향', value: 'A → B (단방향)' }, { label: '속도 제한', value: 0.8, unit: 'm/s' }, { label: '상호 배제', value: '통로 그룹 2' }] }],
  },
  {
    key: mirrorRouteSegmentKey('route-seg-completed'),
    layerId: 'paths',
    routeId: MIRROR_ROUTE.id,
    segmentId: 'route-seg-completed',
    listName: '배송 경로 17 · 픽업 → 교차로',
    item: { label: '배송 경로 17 · 픽업 → 교차로', kind: '계획 경로 구간', status: '통과 완료', statusTone: 'positive' },
    sections: [{ title: '구간 identity', fields: [{ label: '경로', value: MIRROR_ROUTE.label }, { label: '구간', value: '픽업 → 교차로' }, { label: '단계', value: '완료' }, { label: '조건', value: '정상' }] }],
  },
  {
    key: mirrorRouteSegmentKey(MIRROR_ROUTE_CURRENT_SEGMENT_ID),
    layerId: 'paths',
    routeId: MIRROR_ROUTE.id,
    segmentId: MIRROR_ROUTE_CURRENT_SEGMENT_ID,
    listName: '배송 경로 17 · 교차로 → 승강기 A',
    item: { label: '배송 경로 17 · 교차로 → 승강기 A', kind: '계획 경로 구간', status: '현재 · 대기', statusTone: 'cautionary' },
    sections: [{ title: '구간 identity', fields: [{ label: '경로', value: MIRROR_ROUTE.label }, { label: '구간', value: '교차로 → 승강기 A' }, { label: '단계', value: '현재' }, { label: '조건', value: '대기', tone: 'cautionary' }, { label: '진행률', value: '72%' }] }],
  },
  {
    key: 'paths:trajectory-amr-7',
    layerId: 'paths',
    listName: 'AMR 7 예상 궤적',
    item: { label: 'AMR 7 예상 궤적', kind: '궤적', status: '이동 중', statusTone: 'signal' },
    sections: [{ title: '샘플', fields: [{ label: '표본 수', value: 6 }, { label: '현재 표본', value: 3 }, { label: '소속 지도', value: '1층 작업장' }] }],
  },
  {
    key: 'waypoints:wp-pick',
    layerId: 'waypoints',
    listName: '픽업 지점 P1',
    item: { label: '픽업 지점 P1', kind: '웨이포인트', status: '사용 가능', statusTone: 'positive' },
    sections: [{ title: '지점', fields: [{ label: '역할', value: '대기 가능' }, { label: '좌표', value: '96, 210' }] }],
  },
  {
    key: 'waypoints:wp-lift',
    layerId: 'waypoints',
    listName: '승강기 접근 지점',
    item: { label: '승강기 접근 지점', kind: '웨이포인트', status: '사용 가능', statusTone: 'positive' },
    sections: [{ title: '지점', fields: [{ label: '역할', value: '정차 금지 통과' }, { label: '주석', value: '승강기 A 접근' }] }],
  },
  {
    key: 'facilities:facility-lift',
    layerId: 'facilities',
    listName: '화물 승강기 A',
    item: { label: '화물 승강기 A', kind: '설비 전이 · 승강기', status: '접근 중', statusTone: 'signal' },
    sections: [{ title: '독립 상태', fields: [{ label: '단계', value: '접근' }, { label: '문', value: '닫힘' }, { label: '세션', value: '요청됨' }, { label: '운영 모드', value: 'AGV' }] }],
  },
];

const MIRROR_LEGEND_ITEMS = [
  { id: 'regions', label: '영역', color: TONE_COLOR.cautionary, shape: 'square' },
  { id: 'lanes', label: '레인 (방향선)', color: TONE_COLOR.signal, shape: 'line' },
  { id: 'route', label: '현재 경로 구간 · 대기 (점선)', color: 'var(--color-semantic-status-cautionary-foreground)', shape: 'line', dashed: true },
  { id: 'trajectory', label: '현재 궤적 · 이동 중 (실선)', color: TONE_COLOR.signal, shape: 'line' },
  { id: 'waypoints', label: '웨이포인트', color: TONE_COLOR.neutral, shape: 'dot' },
  { id: 'facilities', label: '설비 전이', color: TONE_COLOR.signal, shape: 'dot' },
];

function featureByKey(key) {
  return MIRROR_FEATURES.find((feature) => feature.key === key);
}

// LayerPanel tree: 5 layer groups, each carrying its objects as child rows.
// Rows reuse the panel's own selection, tone dot, status meta, visibility, and
// lock affordances — the named object list IS the layer panel, not a second
// hand-rolled list.
const MIRROR_LAYER_TREE = MIRROR_LAYERS.map((layer) => {
  const features = MIRROR_FEATURES.filter((feature) => feature.layerId === layer.id);
  return {
    id: layer.id,
    label: layer.label,
    description: layer.description,
    tone: layer.tone,
    count: features.length,
    children: features.map((feature) => ({
      id: feature.key,
      label: feature.listName,
      tone: layer.tone,
      status: feature.item.status,
    })),
  };
});

const ALL_VISIBLE_IDS = [
  ...MIRROR_LAYERS.map((layer) => layer.id),
  ...MIRROR_FEATURES.map((feature) => feature.key),
];

// Full-bleed 2D map canvas: the shared navigation stage fills the viewer frame
// and every overlay fragment receives the measured CSS/viewBox scale so visual
// glyphs and pointer cores keep their intended screen-space size. The scene is
// a fixed composition — pan/zoom wiring belongs to the consuming product.
function ViewerMapCanvas({ children }) {
  const svgRef = React.useRef(null);
  const [cssViewBoxScale, setCssViewBoxScale] = React.useState(1);

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const view = svg.ownerDocument.defaultView;
    const updateScale = () => {
      const width = svg.getBoundingClientRect().width;
      if (width <= 0) return;
      const nextScale = width / 540;
      setCssViewBoxScale((current) => Math.abs(current - nextScale) > 0.001 ? nextScale : current);
    };
    updateScale();
    const observer = view?.ResizeObserver ? new view.ResizeObserver(updateScale) : null;
    observer?.observe(svg);
    view?.addEventListener('resize', updateScale);
    return () => {
      observer?.disconnect();
      view?.removeEventListener('resize', updateScale);
    };
  }, []);

  return (
    <Map2DCanvas
      appearance="light"
      label="내비게이션 뷰어 지도"
      source="1층 작업장"
      controls={false}
      panEnabled={false}
      wheelZoom={false}
      keyboard={false}
      grid={false}
      defaultViewport={{ x: 0, y: 0, z: 1 }}
      data-testid="mirror-map"
      style={{ width: '100%', height: 'auto', aspectRatio: '540 / 290' }}
    >
      <svg
        ref={svgRef}
        width="540"
        height="290"
        viewBox="0 0 540 290"
        data-css-viewbox-scale={cssViewBoxScale.toFixed(4)}
        aria-hidden="true"
        style={{ display: 'block', width: '100cqw', height: 'auto' }}
      >
        <NavigationMapStage width={540} height={290} scaleBar={{ px: 100, label: '5 m' }}>
          {typeof children === 'function' ? children(cssViewBoxScale) : children}
        </NavigationMapStage>
      </svg>
    </Map2DCanvas>
  );
}

const PANEL_CHROME = {
  minWidth: 0,
  overflow: 'hidden',
  border: '1px solid var(--color-semantic-line-normal-normal)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-semantic-background-elevated-normal)',
};

function SemanticMirrorFixture() {
  const [selectedKey, setSelectedKey] = React.useState('');
  const [visibleIds, setVisibleIds] = React.useState(ALL_VISIBLE_IDS);
  const [lockedIds, setLockedIds] = React.useState([]);

  const groupVisible = (layerId) => visibleIds.includes(layerId);
  const featureVisible = (key) => {
    const feature = featureByKey(key);
    return feature != null && groupVisible(feature.layerId) && visibleIds.includes(key);
  };
  const featureLocked = (key) => {
    const feature = featureByKey(key);
    return feature != null && (lockedIds.includes(key) || lockedIds.includes(feature.layerId));
  };

  // Pointer selection from the map honors the panel's lock state; panel rows
  // themselves stay selectable, like locked layers in an editor.
  const selectFromMap = (key) => {
    if (featureLocked(key)) return;
    setSelectedKey(key);
  };

  const selectedFeature = selectedKey ? featureByKey(selectedKey) : undefined;
  const selectedGroup = !selectedFeature && selectedKey
    ? MIRROR_LAYERS.find((layer) => layer.id === selectedKey)
    : undefined;
  const selectedFeatureHidden = selectedFeature ? !featureVisible(selectedFeature.key) : false;

  const selectedRouteSegmentId = selectedFeature?.routeId === MIRROR_ROUTE.id
    ? selectedFeature.segmentId
    : undefined;

  // Route segments hide honestly by filtering the route data the renderer
  // receives — a hidden segment is genuinely absent, not painted over.
  const visibleRouteSegments = MIRROR_ROUTE.segments.filter(
    (segment) => featureVisible(mirrorRouteSegmentKey(segment.id)),
  );
  const routeForRender = {
    ...MIRROR_ROUTE,
    segments: visibleRouteSegments,
    progress: visibleRouteSegments.some((segment) => segment.id === MIRROR_ROUTE.progress.segmentId)
      ? MIRROR_ROUTE.progress
      : undefined,
  };

  let inspectorItem;
  let inspectorSections = [];
  if (selectedFeature) {
    inspectorItem = {
      ...selectedFeature.item,
      status: selectedFeatureHidden ? '숨김' : selectedFeature.item.status,
      statusTone: selectedFeatureHidden ? undefined : selectedFeature.item.statusTone,
    };
    inspectorSections = selectedFeatureHidden
      ? [{ title: '표시', fields: [{ label: '표시 상태', value: '숨김', tone: 'cautionary' }] }, ...selectedFeature.sections]
      : selectedFeature.sections;
  } else if (selectedGroup) {
    const groupFeatures = MIRROR_FEATURES.filter((feature) => feature.layerId === selectedGroup.id);
    const visible = groupVisible(selectedGroup.id);
    inspectorItem = {
      label: selectedGroup.label,
      kind: '레이어',
      status: visible ? '표시' : '숨김',
      statusTone: visible ? 'signal' : undefined,
    };
    inspectorSections = [{
      title: '레이어',
      fields: [
        { label: '구성', value: selectedGroup.description },
        { label: '객체 수', value: groupFeatures.length },
        { label: '표시 상태', value: visible ? '표시' : '숨김', tone: visible ? undefined : 'cautionary' },
      ],
    }];
  }

  const selectionOutputLabel = selectedFeature?.item.label ?? selectedGroup?.label ?? '없음';
  const selectionOutputHidden = selectedFeature
    ? selectedFeatureHidden
    : selectedGroup != null && !groupVisible(selectedGroup.id);

  return (
    <StoryPage
      title="지도, 레이어·객체 패널, 선택 요약이 하나의 상태를 공유합니다"
      description="지도 도형은 포인터로만 선택되고 접근성 트리와 포커스 순서에서는 빠집니다. 키보드·스크린 리더 사용자는 레이어·객체 패널에서 같은 객체를 선택하고, 패널의 표시 토글은 지도 조각을, 잠금 토글은 지도 포인터 선택을 제어합니다. 선택 검사기와 범례는 상태를 색뿐 아니라 형태·문자로 전달합니다."
      maxWidth={1120}
    >
      <div
        className="lk-nvw"
        data-testid="semantic-mirror"
        style={{ containerType: 'inline-size', width: '100%', minWidth: 0 }}
      >
        <style>{`
          .lk-nvw__layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(272px, 336px);
            gap: var(--space-4);
            align-items: start;
            min-width: 0;
          }
          @container (max-width: 719px) {
            .lk-nvw__layout {
              grid-template-columns: minmax(0, 1fr);
            }
          }
        `}</style>
        <div className="lk-nvw__layout">
          <section aria-label="내비게이션 지도" style={{ display: 'grid', gap: 'var(--space-3)', alignContent: 'start', minWidth: 0 }}>
            <ViewerMapCanvas>
              {(cssViewBoxScale) => (
                <>
                  {featureVisible('regions:zone-keepout') && (
                    <SpatialRegion
                      region={MIRROR_KEEPOUT_REGION}
                      viewportScale={cssViewBoxScale}
                      tabIndex={-1} showLabel={false}
                      aria-hidden="true"
                      selected={selectedKey === 'regions:zone-keepout'}
                      onActivate={() => selectFromMap('regions:zone-keepout')}
                    />
                  )}
                  {featureVisible('regions:zone-lift-lobby') && (
                    <SpatialRegion
                      region={MIRROR_LOBBY_REGION}
                      viewportScale={cssViewBoxScale}
                      tabIndex={-1} showLabel={false}
                      aria-hidden="true"
                      selected={selectedKey === 'regions:zone-lift-lobby'}
                      onActivate={() => selectFromMap('regions:zone-lift-lobby')}
                    />
                  )}
                  {featureVisible('lanes:lane-corridor') && (
                    <LaneOverlay
                      lane={MIRROR_LANE}
                      viewportScale={cssViewBoxScale}
                      tabIndex={-1}
                      aria-hidden="true"
                      showEndpoints={false}
                      // 이 코리도 위를 배송 경로·궤적이 달리며 상위 레이어에서 이미
                      // 방향을 표시하므로 레인 자체 셰브론은 끕니다(코리도당 화살표 1개).
                      showDirection={false}
                      selected={selectedKey === 'lanes:lane-corridor'}
                      onActivate={() => selectFromMap('lanes:lane-corridor')}
                    />
                  )}
                  {groupVisible('paths') && visibleRouteSegments.length > 0 && (
                    <RouteOverlay
                      route={routeForRender}
                      activeMapId={MIRROR_MAP_ID}
                      viewportScale={cssViewBoxScale}
                      tabIndex={-1}
                      aria-hidden="true"
                      showLabel={false}
                      selectedSegmentId={selectedRouteSegmentId}
                      onActivate={({ segmentId }) => selectFromMap(mirrorRouteSegmentKey(segmentId))}
                    />
                  )}
                  {featureVisible('paths:trajectory-amr-7') && (
                    <TrajectoryOverlay
                      trajectory={MIRROR_TRAJECTORY}
                      viewportScale={cssViewBoxScale}
                      tabIndex={-1}
                      aria-hidden="true"
                      showLabel={false}
                      selected={selectedKey === 'paths:trajectory-amr-7'}
                      onActivate={() => selectFromMap('paths:trajectory-amr-7')}
                    />
                  )}
                  {featureVisible('waypoints:wp-pick') && (
                    <WaypointMarker
                      waypoint={MIRROR_PICK_WAYPOINT}
                      viewportScale={cssViewBoxScale}
                      tabIndex={-1} showLabel={false}
                      aria-hidden="true"
                      selected={selectedKey === 'waypoints:wp-pick'}
                      onActivate={() => selectFromMap('waypoints:wp-pick')}
                    />
                  )}
                  {featureVisible('waypoints:wp-lift') && (
                    <WaypointMarker
                      waypoint={MIRROR_LIFT_WAYPOINT}
                      viewportScale={cssViewBoxScale}
                      tabIndex={-1} showLabel={false}
                      aria-hidden="true"
                      selected={selectedKey === 'waypoints:wp-lift'}
                      onActivate={() => selectFromMap('waypoints:wp-lift')}
                    />
                  )}
                  {featureVisible('facilities:facility-lift') && (
                    <FacilityTransition
                      transition={MIRROR_FACILITY}
                      activeMapId={MIRROR_MAP_ID}
                      viewportScale={cssViewBoxScale}
                      tabIndex={-1}
                      aria-hidden="true"
                      showLabel={false}
                      selected={selectedKey === 'facilities:facility-lift'}
                      onActivate={() => selectFromMap('facilities:facility-lift')}
                    />
                  )}
                </>
              )}
            </ViewerMapCanvas>
            <div data-testid="mirror-legend">
              <Legend items={MIRROR_LEGEND_ITEMS} direction="horizontal" size="sm" aria-label="지도 계층 범례" />
            </div>
          </section>

          <aside aria-label="뷰어 패널" style={{ display: 'grid', gap: 'var(--space-4)', alignContent: 'start', minWidth: 0 }}>
            <div style={PANEL_CHROME}>
              <LayerPanel
                title="레이어와 객체"
                label="내비게이션 레이어와 객체"
                layers={MIRROR_LAYER_TREE}
                activeLayerId={selectedKey}
                onActiveLayerChange={(id) => setSelectedKey(id)}
                visibleLayerIds={visibleIds}
                onVisibleLayerIdsChange={(ids) => setVisibleIds(ids)}
                lockedLayerIds={lockedIds}
                onLockedLayerIdsChange={(ids) => setLockedIds(ids)}
                data-testid="mirror-list"
              />
            </div>
            <div style={PANEL_CHROME}>
              <SelectionInspector
                item={inspectorItem}
                sections={inspectorSections}
                emptyLabel="패널이나 지도에서 객체를 선택하세요"
                onClearSelection={inspectorItem ? () => setSelectedKey('') : undefined}
              />
            </div>
          </aside>
        </div>
        <output hidden data-testid="mirror-selection">
          선택: {selectionOutputLabel}{selectionOutputHidden ? ' · 숨김' : ''}
        </output>
      </div>
    </StoryPage>
  );
}

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '레이어·객체 트리에서 고른 객체가 지도 선택 표식·선택 요약과 함께 바뀌고, 지도 포인터 선택도 같은 트리 행과 검사기에 반영됩니다. 표시 토글은 레이어·객체 단위로 지도 조각을 감추고(경로 구간은 데이터에서 실제로 빠집니다), 잠금 토글은 지도 포인터 선택만 차단합니다. 지도 도형은 포인터로만 선택되고 Tab 순서와 접근성 트리에서는 빠집니다.',
  ),
  render: () => <SemanticMirrorFixture />,
  play: async ({ canvasElement }) => {
    const map = canvasElement.querySelector('[data-testid="mirror-map"]');
    const panel = canvasElement.querySelector('[data-testid="mirror-list"]');
    const legend = canvasElement.querySelector('[data-testid="mirror-legend"]');
    const root = canvasElement.querySelector('[data-testid="semantic-mirror"]');
    const tree = panel?.querySelector('[role="tree"]');
    if (!map || !panel || !legend || !root || !tree) throw new Error('Navigation viewer scaffold is incomplete.');

    const selectionOutput = () => canvasElement.querySelector('[data-testid="mirror-selection"]')?.textContent ?? '';
    const rowFor = (key) => panel.querySelector(`[data-layer-id="${key}"]`);

    const legendItems = Array.from(legend.querySelectorAll('li'));
    const routeLegend = legendItems.find((item) => item.textContent?.includes('현재 경로 구간 · 대기'));
    const trajectoryLegend = legendItems.find((item) => item.textContent?.includes('현재 궤적 · 이동 중'));
    if (!routeLegend || !trajectoryLegend
      || getComputedStyle(routeLegend.firstElementChild).borderTopStyle !== 'dashed'
      || getComputedStyle(trajectoryLegend.firstElementChild).borderTopStyle !== 'solid') {
      throw new Error('Legend must mirror the current waiting route dash and active trajectory solid encoding.');
    }

    // 1. Selecting a tree row drives the map data-selected and the summary.
    const treeSelections = [
      ['lanes:lane-corridor', '[data-lane-id="lane-corridor"]', '주 통로'],
      [mirrorRouteSegmentKey('route-seg-completed'), '[data-segment-id="route-seg-completed"]', '배송 경로 17 · 픽업 → 교차로'],
      [mirrorRouteSegmentKey(MIRROR_ROUTE_CURRENT_SEGMENT_ID), `[data-segment-id="${MIRROR_ROUTE_CURRENT_SEGMENT_ID}"]`, '배송 경로 17 · 교차로 → 승강기 A'],
      ['paths:trajectory-amr-7', '[data-trajectory-id="trajectory-amr-7"]', 'AMR 7 예상 궤적'],
      ['waypoints:wp-pick', '[data-waypoint-id="wp-pick"]', '픽업 지점 P1'],
      ['facilities:facility-lift', '[data-lds-facility-transition][data-transition-id="facility-lift"]', '화물 승강기 A'],
    ];
    for (const [key, mapSelector, name] of treeSelections) {
      const row = rowFor(key);
      if (!row) throw new Error(`Missing tree row for ${key}.`);
      row.click();
      await waitFor(() => {
        const feature = map.querySelector(mapSelector);
        if (feature?.getAttribute('data-selected') !== 'true') {
          throw new Error(`Selecting "${key}" in the tree did not mark ${mapSelector} as selected.`);
        }
        if (row.getAttribute('aria-selected') !== 'true') {
          throw new Error(`Tree row ${key} did not report aria-selected.`);
        }
        if (!selectionOutput().includes(name)) {
          throw new Error(`Selection summary did not follow the tree selection for ${key}: ${selectionOutput()}`);
        }
      });
    }

    // 2. Pointer selection preserves route segment identity, and the reverse
    // map -> tree direction stays in sync without stealing focus.
    const mapSelections = [
      ['[data-segment-id="route-seg-completed"]', mirrorRouteSegmentKey('route-seg-completed'), '배송 경로 17 · 픽업 → 교차로'],
      [`[data-segment-id="${MIRROR_ROUTE_CURRENT_SEGMENT_ID}"]`, mirrorRouteSegmentKey(MIRROR_ROUTE_CURRENT_SEGMENT_ID), '배송 경로 17 · 교차로 → 승강기 A'],
      ['[data-trajectory-id="trajectory-amr-7"]', 'paths:trajectory-amr-7', 'AMR 7 예상 궤적'],
    ];
    for (const [mapSelector, key, name] of mapSelections) {
      const mapFeature = map.querySelector(mapSelector);
      if (!mapFeature) throw new Error(`Missing pointer-only map feature ${mapSelector}.`);
      await userEvent.click(mapFeature);
      const activeElement = canvasElement.ownerDocument.activeElement;
      if (activeElement === mapFeature || mapFeature.contains(activeElement)) {
        throw new Error(`Pointer-only map feature ${mapSelector} became document.activeElement.`);
      }
      await waitFor(() => {
        if (mapFeature?.getAttribute('data-selected') !== 'true' || rowFor(key)?.getAttribute('aria-selected') !== 'true') {
          throw new Error(`Selecting ${mapSelector} on the map did not preserve identity in the tree.`);
        }
        if (!selectionOutput().includes(name)) {
          throw new Error(`Selection summary did not preserve map identity for ${key}: ${selectionOutput()}`);
        }
      });
      if (key === mirrorRouteSegmentKey('route-seg-completed')
        && map.querySelector(`[data-segment-id="${MIRROR_ROUTE_CURRENT_SEGMENT_ID}"]`)?.getAttribute('data-selected') !== 'false') {
        throw new Error('Selecting the completed route segment also selected the current segment.');
      }
      if (key === mirrorRouteSegmentKey(MIRROR_ROUTE_CURRENT_SEGMENT_ID)
        && map.querySelector('[data-segment-id="route-seg-completed"]')?.getAttribute('data-selected') !== 'false') {
        throw new Error('Selecting the current route segment also selected the completed segment.');
      }
    }
    const pointerOnlyRoute = map.querySelector('[data-segment-id="route-seg-current"]');
    const selectionBeforeKey = selectionOutput();
    pointerOnlyRoute?.dispatchEvent(new canvasElement.ownerDocument.defaultView.KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true,
    }));
    await nextRender();
    if (selectionOutput() !== selectionBeforeKey) {
      throw new Error('aria-hidden pointer-only Route responded to keyboard activation.');
    }

    // 3. Pointer-selectable map identities are mirrored one-to-one by tree
    // object rows, and every identity defers screen-reader traversal.
    const mapSvg = map.querySelector('svg[data-css-viewbox-scale]');
    const mapIdentities = [
      ...Array.from(mapSvg?.querySelectorAll('[data-lds-spatial-region]') ?? []),
      mapSvg?.querySelector('[data-lk-lane-overlay]'),
      ...Array.from(mapSvg?.querySelectorAll('[data-route-segment]') ?? []),
      mapSvg?.querySelector('[data-lk-trajectory-overlay]'),
      ...Array.from(mapSvg?.querySelectorAll('[data-waypoint-id]') ?? []),
      mapSvg?.querySelector('[data-lds-facility-transition]'),
    ].filter(Boolean);
    if (mapIdentities.length !== 9) {
      throw new Error(`Expected 9 pointer-selectable map identities, received ${mapIdentities.length}.`);
    }
    if (mapSvg?.querySelector('[data-lane-endpoint]')) {
      throw new Error('Waypoint-owned endpoint identities must not duplicate Lane endpoint chrome in the composed map.');
    }
    for (const identity of mapIdentities) {
      if (!identity.closest('[aria-hidden="true"]')) {
        throw new Error('Every pointer-selectable map identity must defer screen-reader traversal to the panel tree.');
      }
    }
    const pointerOnlyPaths = [
      ...Array.from(mapSvg?.querySelectorAll('[data-route-segment]') ?? []),
      mapSvg?.querySelector('[data-lk-trajectory-overlay]'),
    ].filter(Boolean);
    for (const identity of pointerOnlyPaths) {
      if (identity.hasAttribute('role')
        || identity.hasAttribute('tabindex')
        || identity.hasAttribute('aria-label')
        || identity.hasAttribute('aria-pressed')
        || identity.getAttribute('focusable') !== 'false') {
        throw new Error('Pointer-only Route/Trajectory must not expose button semantics or focusability.');
      }
    }
    const objectRows = Array.from(panel.querySelectorAll('[role="treeitem"][data-layer-id*=":"]'));
    if (objectRows.length !== mapIdentities.length) {
      throw new Error(`Panel tree must mirror every pointer-selectable map identity: map ${mapIdentities.length}, tree ${objectRows.length}.`);
    }
    const allRows = Array.from(panel.querySelectorAll('[role="treeitem"]'));
    if (allRows.filter((row) => row.tabIndex === 0).length !== 1) {
      throw new Error('Panel tree must expose exactly one roving keyboard entry point.');
    }

    // 4. Group visibility toggle hides only that layer's fragments.
    if (!map.querySelector('[data-waypoint-id="wp-pick"]')) throw new Error('Waypoint fragment should start visible.');
    const waypointGroupToggle = rowFor('waypoints')?.querySelector('[data-layer-action="visibility"]');
    if (!waypointGroupToggle) throw new Error('Waypoint layer visibility toggle is missing.');
    waypointGroupToggle.click();
    await waitFor(() => {
      if (map.querySelector('[data-waypoint-id="wp-pick"]') || map.querySelector('[data-waypoint-id="wp-lift"]')) {
        throw new Error('Hiding the waypoint layer must remove its map fragments.');
      }
    });
    if (!map.querySelector('[data-lane-id="lane-corridor"]') || !map.querySelector('[data-lds-facility-transition][data-transition-id="facility-lift"]')) {
      throw new Error('Hiding one layer must not remove the others.');
    }

    // 5. A selection retained on a now-hidden layer is explicitly marked 숨김.
    rowFor('waypoints:wp-pick')?.click();
    await waitFor(() => {
      if (!selectionOutput().includes('숨김')) {
        throw new Error(`Selecting a feature on a hidden layer must surface a 숨김 state: ${selectionOutput()}`);
      }
    });
    if (!rowFor('waypoints')?.getAttribute('aria-label')?.includes('숨김')) {
      throw new Error('Hidden layer group rows must be labelled 숨김.');
    }
    waypointGroupToggle.click();
    await waitFor(() => {
      if (!map.querySelector('[data-waypoint-id="wp-pick"]')) {
        throw new Error('Restoring the layer must re-render its fragments.');
      }
    });

    // 6. Object-level visibility hides exactly one fragment; a hidden route
    // segment disappears from the rendered route data, not just its paint.
    rowFor('waypoints:wp-pick')?.querySelector('[data-layer-action="visibility"]')?.click();
    await waitFor(() => {
      if (map.querySelector('[data-waypoint-id="wp-pick"]')) {
        throw new Error('Hiding one waypoint object must remove exactly that fragment.');
      }
      if (!map.querySelector('[data-waypoint-id="wp-lift"]')) {
        throw new Error('Hiding one waypoint object must not remove its siblings.');
      }
    });
    rowFor('waypoints:wp-pick')?.querySelector('[data-layer-action="visibility"]')?.click();
    // Wait for the restore to flush before the next toggle: two back-to-back
    // toggles in one task would let the second compute its visibility set from
    // a stale render and silently drop the restore.
    await waitFor(() => {
      if (!map.querySelector('[data-waypoint-id="wp-pick"]')) {
        throw new Error('Restoring the waypoint object must re-render its fragment.');
      }
    });
    const completedSegmentKey = mirrorRouteSegmentKey('route-seg-completed');
    rowFor(completedSegmentKey)?.querySelector('[data-layer-action="visibility"]')?.click();
    await waitFor(() => {
      if (map.querySelector('[data-segment-id="route-seg-completed"]')) {
        throw new Error('Hiding a route segment object must remove that segment from the rendered route.');
      }
      if (!map.querySelector(`[data-segment-id="${MIRROR_ROUTE_CURRENT_SEGMENT_ID}"]`)) {
        throw new Error('Hiding one route segment must keep the remaining segment rendered.');
      }
    });
    rowFor(completedSegmentKey)?.querySelector('[data-layer-action="visibility"]')?.click();
    await waitFor(() => {
      if (!map.querySelector('[data-segment-id="route-seg-completed"]')) {
        throw new Error('Restoring a route segment object must re-render it.');
      }
    });

    // 7. A locked object stays selectable in the panel but ignores map pointer
    // selection until unlocked.
    rowFor('facilities:facility-lift')?.click();
    await waitFor(() => {
      if (!selectionOutput().includes('화물 승강기 A')) {
        throw new Error('Facility selection did not land before the lock check.');
      }
    });
    const laneLockToggle = rowFor('lanes:lane-corridor')?.querySelector('[data-layer-action="lock"]');
    if (!laneLockToggle) throw new Error('Lane object lock toggle is missing.');
    laneLockToggle.click();
    await nextRender();
    await userEvent.click(map.querySelector('[data-lane-id="lane-corridor"]'));
    await nextRender();
    if (!selectionOutput().includes('화물 승강기 A')) {
      throw new Error(`Locked lane must ignore map pointer selection: ${selectionOutput()}`);
    }
    laneLockToggle.click();
    await nextRender();
    await userEvent.click(map.querySelector('[data-lane-id="lane-corridor"]'));
    await waitFor(() => {
      if (!selectionOutput().includes('주 통로')) {
        throw new Error(`Unlocked lane must accept map pointer selection again: ${selectionOutput()}`);
      }
    });

    // 8. The composed layout does not create horizontal overflow.
    if (root.scrollWidth > root.clientWidth + 1) {
      throw new Error(`Navigation viewer overflowed horizontally: ${root.scrollWidth}/${root.clientWidth}.`);
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 의미 목록 연동',
  parameters: storyDescription(
    '320px 폭에서 지도 캔버스와 패널이 세로로 쌓이고, 모든 지도 fragment가 측정된 CSS/viewBox scale을 받아 포인터 코어를 24 CSS px로 유지하며, 접근성 탐색은 레이어·객체 패널에 위임합니다.',
  ),
  render: () => (
    <div data-testid="semantic-mirror-narrow" style={{ width: 320, maxWidth: '100%', minWidth: 0 }}>
      <SemanticMirrorFixture />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const narrow = canvasElement.querySelector('[data-testid="semantic-mirror-narrow"]');
    const map = narrow?.querySelector('[data-testid="mirror-map"]');
    const root = narrow?.querySelector('[data-testid="semantic-mirror"]');
    if (!narrow || !map || !root) throw new Error('Narrow navigation viewer scaffold is incomplete.');

    await waitFor(() => {
      const svg = map.querySelector('svg[data-css-viewbox-scale]');
      const cssScale = Number(svg?.getAttribute('data-css-viewbox-scale'));
      if (!svg || !Number.isFinite(cssScale) || cssScale >= 0.95) {
        throw new Error(`Navigation viewer did not render at a narrow CSS/viewBox scale: ${cssScale}.`);
      }

      for (const selector of ['[data-lk-route-overlay]', '[data-lk-trajectory-overlay]']) {
        const overlayScale = Number(map.querySelector(selector)?.getAttribute('data-viewport-scale'));
        if (!Number.isFinite(overlayScale) || Math.abs(overlayScale - cssScale) > 0.01) {
          throw new Error(`${selector} did not receive the measured CSS/viewBox scale: ${overlayScale}/${cssScale}.`);
        }
      }

      const circleCoreSelectors = [
        ['Lane', '[data-lane-actual-hit-core]'],
        ['Route', '[data-route-hit-target-core]'],
        ['Trajectory', '[data-trajectory-actual-hit-core]'],
        ['Waypoint', '[data-waypoint-hit-area]'],
        ['FacilityTransition', '[data-transition-hit-area]'],
      ];
      for (const [name, selector] of circleCoreSelectors) {
        const cores = Array.from(map.querySelectorAll(selector));
        if (cores.length === 0) throw new Error(`${name} actual pointer core is missing.`);
        for (const core of cores) {
          const rect = core.getBoundingClientRect();
          if (Math.min(rect.width, rect.height) / Math.SQRT2 < 23.9) {
            throw new Error(`${name} core does not contain a 24×24 CSS px square: ${rect.width}×${rect.height}.`);
          }
        }
      }

      const regionTargets = Array.from(map.querySelectorAll('[data-region-geometry]'));
      if (regionTargets.length !== 2 || regionTargets.some((target) => {
        const rect = target.getBoundingClientRect();
        return Math.min(rect.width, rect.height) < 23.9;
      })) {
        throw new Error('SpatialRegion pointer geometry must retain a 24×24 CSS px target at 320px.');
      }
    });

    const mapIdentities = [
      ...map.querySelectorAll('[data-lds-spatial-region]'),
      map.querySelector('[data-lk-lane-overlay]'),
      ...map.querySelectorAll('[data-route-segment]'),
      map.querySelector('[data-lk-trajectory-overlay]'),
      ...map.querySelectorAll('[data-waypoint-id]'),
      map.querySelector('[data-lds-facility-transition]'),
    ].filter(Boolean);
    if (mapIdentities.length !== 9 || mapIdentities.some((identity) => !identity.closest('[aria-hidden="true"]'))) {
      throw new Error('Narrow map identities must be aria-hidden and mirrored by the panel tree.');
    }
    const pointerOnlyPaths = [
      ...map.querySelectorAll('[data-route-segment]'),
      map.querySelector('[data-lk-trajectory-overlay]'),
    ].filter(Boolean);
    if (pointerOnlyPaths.some((identity) => (
      identity.hasAttribute('role')
      || identity.hasAttribute('tabindex')
      || identity.hasAttribute('aria-label')
      || identity.getAttribute('focusable') !== 'false'
    ))) {
      throw new Error('Narrow pointer-only Route/Trajectory retained hidden button semantics.');
    }
    if (root.scrollWidth > root.clientWidth + 1 || narrow.scrollWidth > narrow.clientWidth + 1) {
      throw new Error(`Narrow navigation viewer overflowed: root ${root.scrollWidth}/${root.clientWidth}, wrapper ${narrow.scrollWidth}/${narrow.clientWidth}.`);
    }
  },
};
