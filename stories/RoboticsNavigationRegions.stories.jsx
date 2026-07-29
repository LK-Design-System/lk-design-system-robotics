import React from 'react';
import { userEvent } from 'storybook/test';
import { Map2DCanvas } from '@lk-robotics/lds-product';
import { SpatialRegion } from '../src/index.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import { NavigationLegend, NavigationMapStage } from './RoboticsNavigationStage.shared.jsx';
import { assertSharedFocusIndicator } from './RoboticsNavigationAssert.shared.jsx';

const meta = {
  title: 'LDS Robotics/Navigation/Regions',
  tags: ['autodocs'],
  component: SpatialRegion,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-regions--spatial-region-overview',
      eyebrow: 'Robotics / Navigation Regions',
      title: '공간 영역은 행동 규칙·설비 범위·지형 통행성을 서로 다른 의미로 보여줍니다',
      description:
        '운영자가 지도에서 진입 금지, 승강기 객실, 경사면처럼 면적을 가진 조건을 구분해야 할 때 사용합니다. 점 위치에는 Waypoint, 선 연결에는 Lane, 설비의 진행 상태에는 Facility Transition이 적합합니다.',
    },
    docs: {
      description: {
        component: '행동·설비·지형 영역을 renderer-neutral 데이터와 SVG reference fragment로 표현하는 LK Robotics extension입니다.',
      },
    },
  },
};

export default meta;

const keepOutRegion = {
  id: 'keep-out-west',
  mapId: 'warehouse-1f',
  label: '서측 적재 구역',
  category: 'behavior',
  rule: { kind: 'keep-out' },
  shape: {
    kind: 'polygon',
    points: [
      { x: 32, y: 38 },
      { x: 194, y: 38 },
      { x: 184, y: 126 },
      { x: 44, y: 126 },
    ],
  },
};

const liftCabinRegion = {
  id: 'lift-cabin-a',
  mapId: 'warehouse-1f',
  label: '화물 승강기 A',
  category: 'facility',
  kind: 'lift-cabin',
  facilityId: 'lift-a',
  shape: { kind: 'circle', center: { x: 318, y: 84 }, radius: 48 },
};

const slopeRegion = {
  id: 'slope-east',
  mapId: 'warehouse-1f',
  label: '동측 램프',
  category: 'terrain',
  kind: 'slope',
  traversability: 'restricted',
  grade: { value: 8, unit: 'percent', directionRad: 1.57 },
  shape: {
    kind: 'polygon',
    points: [
      { x: 88, y: 178 },
      { x: 412, y: 178 },
      { x: 390, y: 254 },
      { x: 112, y: 254 },
    ],
  },
};

function RegionMap({ children, appearance = 'light', width = 480, height = 288, label = '공간 영역 지도', testId, eyebrow = 'ZONES · L1' }) {
  return (
    <Map2DCanvas
      data-testid={testId}
      label={label}
      appearance={appearance}
      controls={false}
      panEnabled={false}
      wheelZoom={false}
      keyboard={false}
      grid={false}
      style={{ width: '100%', maxWidth: width, height: 'auto', aspectRatio: `${width} / ${height}` }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" style={{ display: 'block', width: '100%', height: 'auto' }} aria-label={label}>
        <NavigationMapStage width={width} height={height} eyebrow={eyebrow} north>
          {children}
        </NavigationMapStage>
      </svg>
    </Map2DCanvas>
  );
}

function pointInsidePolygon(point, points) {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const currentPoint = points[index];
    const previousPoint = points[previous];
    const crosses = (currentPoint.y > point.y) !== (previousPoint.y > point.y)
      && point.x < ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) / (previousPoint.y - currentPoint.y) + currentPoint.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function OverviewFixture() {
  const [selectedId, setSelectedId] = React.useState(liftCabinRegion.id);
  return (
    <main style={{ display: 'grid', gap: 'var(--space-3)', width: 'min(100%, 720px)' }}>
      <RegionMap testId="region-overview-map">
        {[keepOutRegion, liftCabinRegion, slopeRegion].map((region) => (
          <SpatialRegion
            key={region.id}
            region={region}
            selected={selectedId === region.id}
            onActivate={setSelectedId}
          />
        ))}
      </RegionMap>
      {/* The three category patterns are the whole point of this story and
          nothing on the map spells them out, so the key ships with it. */}
      <NavigationLegend regions={['behavior', 'facility', 'terrain']} />
    </main>
  );
}

export const SpatialRegionOverview = {
  name: '개요',
  parameters: storyDescription(
    '진입 금지 행동 영역, 승강기 객실 설비 영역, 8% 경사 지형 영역을 한 지도에서 비교합니다. category는 서로 다른 pattern과 라벨로 구분되고, 선택은 원래 의미 stroke 색을 유지한 경계 굵기 확대로 표시되어야 합니다.',
  ),
  render: () => <OverviewFixture />,
  play: async ({ canvasElement }) => {
    const regions = Array.from(canvasElement.querySelectorAll('[data-lds-spatial-region]'));
    if (regions.length !== 3) throw new Error(`Expected three region categories, received ${regions.length}.`);

    const patterns = new Map(regions.map((region) => [region.dataset.regionCategory, region.dataset.regionPattern]));
    if (patterns.get('behavior') !== 'diagonal' || patterns.get('facility') !== 'dot' || patterns.get('terrain') !== 'contour') {
      throw new Error(`Region category patterns are incomplete: ${JSON.stringify(Object.fromEntries(patterns))}`);
    }

    const slope = canvasElement.querySelector('[data-region-id="slope-east"]');
    const slopeName = slope?.getAttribute('aria-label') ?? '';
    if (!slopeName.includes('8%') || !slopeName.includes('1.57 rad') || !slopeName.includes('제한 통행')) {
      throw new Error(`Slope grade, direction, and traversability must remain explicit: ${slopeName}`);
    }

    const scalingStrokes = canvasElement.querySelectorAll('[data-lds-spatial-region] [vector-effect]');
    if (scalingStrokes.length === 0 || Array.from(scalingStrokes).some((node) => node.getAttribute('vector-effect') !== 'non-scaling-stroke')) {
      throw new Error('Every region stroke must remain non-scaling.');
    }
  },
};

const speedRegion = {
  ...keepOutRegion,
  id: 'speed-zone',
  label: '교차 통로',
  rule: { kind: 'speed-limit', speedLimitMps: 0.8 },
};

const unknownTerrain = {
  ...slopeRegion,
  id: 'terrain-unknown',
  label: '검사 전 램프',
  traversability: 'unknown',
};

export const DarkPatternsAndStates = {
  name: '변형·상태 · 다크와 패턴',
  parameters: {
    ...storyDescription(
      '다크 지도에서 0.8m/s 속도 제한, 상태 미확인 지형, 선택·지연·오류 설비 영역을 비교합니다. category는 pattern으로, 상태는 면·외곽선 색으로 구분하며 영역 위에는 badge나 지속 pulse를 올리지 않습니다.',
    ),
    backgrounds: { default: 'Navy' },
  },
  render: () => (
    <main style={{ width: 'min(100%, 720px)' }}>
      <RegionMap appearance="dark" label="다크 공간 영역 지도">
        <SpatialRegion region={speedRegion} />
        <SpatialRegion region={unknownTerrain} />
        <SpatialRegion region={liftCabinRegion} selected stale />
        <SpatialRegion
          region={{
            ...liftCabinRegion,
            id: 'invalid-door-area',
            label: '출입문 A',
            kind: 'door-area',
            shape: { kind: 'circle', center: { x: 420, y: 214 }, radius: 30 },
          }}
          invalid
        />
      </RegionMap>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const staleRegion = canvasElement.querySelector('[data-region-id="lift-cabin-a"]');
    const invalidRegion = canvasElement.querySelector('[data-region-id="invalid-door-area"]');
    const staleGeometry = staleRegion?.querySelector('[data-region-geometry]');
    const invalidGeometry = invalidRegion?.querySelector('[data-region-geometry]');
    if (!staleRegion || !invalidRegion || !staleGeometry || !invalidGeometry) {
      throw new Error('Dark region state fixtures are incomplete.');
    }
    if (staleGeometry.getAttribute('stroke') !== 'var(--viewer-muted, var(--color-semantic-label-alternative))') {
      throw new Error('Stale area must use the muted boundary/fill tone.');
    }
    if (invalidGeometry.getAttribute('stroke') !== 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))') {
      throw new Error('Invalid area must use the danger boundary/fill tone.');
    }
    if (canvasElement.querySelector('[data-region-invalid-mark], [data-region-stale-mark]')) {
      throw new Error('Area state must not render a floating badge.');
    }
    if (staleGeometry.hasAttribute('stroke-dasharray') || invalidGeometry.hasAttribute('stroke-dasharray')) {
      throw new Error('Area state must remain color-only on top of its category pattern.');
    }
  },
};

const concaveKeepOutRegion = {
  ...keepOutRegion,
  id: 'concave-keep-out',
  label: '오목 금지',
  shape: {
    kind: 'polygon',
    points: [
      { x: 92, y: 62 },
      { x: 366, y: 62 },
      { x: 366, y: 78 },
      { x: 168, y: 78 },
      { x: 168, y: 206 },
      { x: 366, y: 206 },
      { x: 366, y: 250 },
      { x: 92, y: 250 },
    ],
  },
};

export const ConcaveGeometryAndCompoundStates = {
  name: '변형·상태 · 오목 영역의 내부 앵커',
  parameters: storyDescription(
    '단순 꼭짓점 평균이 영역 밖의 빈 공간에 놓이는 C형 polygon입니다. point-on-surface 라벨은 실제 면 내부에 남고, 선택은 경계 굵기·포커스는 파란 외곽선·오류와 지연은 면과 외곽선 상태색으로 분리됩니다.',
  ),
  render: () => (
    <main style={{ width: 'min(100%, 520px)' }}>
      <RegionMap width={360} height={280} label="오목 공간 영역 상태 지도">
        <SpatialRegion region={concaveKeepOutRegion} selected focused invalid stale />
      </RegionMap>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const region = canvasElement.querySelector('[data-region-id="concave-keep-out"]');
    const label = region?.querySelector('[data-region-label]');
    const geometry = region?.querySelector('[data-region-geometry]');
    const tint = region?.querySelector('[data-region-tint]');
    if (!region || !label || !geometry || !tint) throw new Error('Concave region state fixture is incomplete.');
    if (region.getAttribute('role') !== 'img' || region.hasAttribute('aria-pressed')) {
      throw new Error('Passive selected region must remain an image without aria-pressed.');
    }
    if (region.getAttribute('aria-invalid') !== 'true') throw new Error('Invalid region must expose aria-invalid.');

    const name = region.getAttribute('aria-label') ?? '';
    for (const state of ['선택됨', '포커스됨', '잘못된 영역', '데이터 지연']) {
      if (!name.includes(state)) throw new Error(`Accessible name is missing the visible region state: ${state}.`);
    }
    for (const selector of [
      '[data-region-selection-geometry]',
      '[data-region-focus-ring]',
    ]) {
      if (!region.querySelector(selector)) throw new Error(`Concave compound-state geometry is missing: ${selector}.`);
    }
    if (region.querySelector('[data-region-invalid-mark], [data-region-stale-mark], [data-navigation-state-glyph]')) {
      throw new Error('Area state must stay in its stroke/fill channels without a floating badge.');
    }
    if (geometry.getAttribute('stroke') !== 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))'
      || tint.getAttribute('fill') !== 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))') {
      throw new Error('Invalid region must apply the danger tone to both boundary and faint area tint.');
    }
    if (geometry.hasAttribute('stroke-dasharray')) {
      throw new Error('Region state must not add a dash channel; category pattern and state color are sufficient.');
    }
    assertSharedFocusIndicator(region.querySelector('[data-region-focus-ring]'), 'Region');
    const focusWidth = Number(region.querySelector('[data-region-focus-ring]')?.getAttribute('stroke-width'));
    const selectionWidth = Number(region.querySelector('[data-region-selection-geometry]')?.getAttribute('stroke-width'));
    if (!Number.isFinite(focusWidth) || !Number.isFinite(selectionWidth) || (focusWidth - selectionWidth) / 2 < 1.5) {
      throw new Error(`Compound region must preserve at least a 1.5px visible focus band outside selection: ${focusWidth}/${selectionWidth}.`);
    }

    const points = concaveKeepOutRegion.shape.points;
    const naiveAverage = points.reduce(
      (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
      { x: 0, y: 0 },
    );
    if (pointInsidePolygon(naiveAverage, points)) throw new Error('Stress polygon must keep its naive vertex average outside the visible surface.');

    const anchor = {
      x: Number(label.dataset.regionAnchorX),
      y: Number(label.dataset.regionAnchorY),
    };
    if (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y) || !pointInsidePolygon(anchor, points)) {
      throw new Error(`Point-on-surface anchor must remain inside the concave polygon: ${JSON.stringify(anchor)}.`);
    }

    const opacity = Number(canvasElement.ownerDocument.defaultView.getComputedStyle(region).opacity);
    if (Math.abs(opacity - 0.76) > 0.001) throw new Error(`Stale region opacity must remain 0.76, received ${opacity}.`);
  },
};

const filteredRegion = {
  ...keepOutRegion,
  id: 'other-map-region',
  mapId: 'warehouse-2f',
};

const hiddenRegion = {
  ...liftCabinRegion,
  id: 'hidden-region',
};

const disabledRegion = {
  ...liftCabinRegion,
  id: 'disabled-region',
  label: '권한 없는 충전 구역',
  kind: 'charger-area',
  shape: { kind: 'circle', center: { x: 370, y: 110 }, radius: 42 },
};

const pointerOnlyRegion = {
  ...liftCabinRegion,
  id: 'pointer-only-region',
  label: '목록 소유 영역',
  kind: 'dock-area',
  shape: { kind: 'circle', center: { x: 250, y: 110 }, radius: 32 },
};

function InteractionFixture() {
  const activeMapId = 'warehouse-1f';
  const [activation, setActivation] = React.useState({ id: '없음', count: 0 });
  const regions = [slopeRegion, pointerOnlyRegion, filteredRegion, hiddenRegion, disabledRegion];
  const activate = (id) => setActivation((current) => ({ id, count: current.count + 1 }));

  return (
    <main style={{ display: 'grid', gap: 'var(--space-3)', width: 'min(100%, 720px)' }}>
      <RegionMap testId="region-interaction-map" label="영역 상호작용 지도">
        {regions
          .filter((region) => region.mapId === activeMapId)
          .map((region) => (
            <SpatialRegion
              key={region.id}
              region={region}
              hidden={region.id === hiddenRegion.id}
              disabled={region.id === disabledRegion.id}
              aria-hidden={region.id === pointerOnlyRegion.id ? 'true' : undefined}
              tabIndex={region.id === disabledRegion.id ? 0 : undefined}
              onActivate={activate}
            />
          ))}
      </RegionMap>
      <output hidden data-testid="region-activation" data-activation-count={activation.count}>
        활성화: {activation.id} · {activation.count}회
      </output>
    </main>
  );
}

function waitForRender() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

export const InteractionAndMapFiltering = {
  name: '상호작용 · 활성화와 지도 필터',
  parameters: storyDescription(
    'renderer가 active map에 속한 region만 전달하고, 컴포넌트는 hidden과 disabled를 적용하는 상황입니다. pointer·Enter·Space가 같은 inspect callback을 호출하며 disabled region은 소비자가 tabIndex 0을 넘겨도 초점 순서와 실행에서 제외되어야 합니다.',
  ),
  render: () => <InteractionFixture />,
  play: async ({ canvasElement }) => {
    const visible = canvasElement.querySelector('[data-region-id="slope-east"]');
    const pointerOnly = canvasElement.querySelector('[data-region-id="pointer-only-region"]');
    const disabled = canvasElement.querySelector('[data-region-id="disabled-region"]');
    if (!visible || !pointerOnly || !disabled) throw new Error('Visible, pointer-only, and disabled active-map regions must render.');
    if (canvasElement.querySelector('[data-region-id="other-map-region"]') || canvasElement.querySelector('[data-region-id="hidden-region"]')) {
      throw new Error('Renderer filtering and hidden behavior must remove unrelated regions.');
    }
    if (disabled.tabIndex !== -1 || disabled.getAttribute('aria-disabled') !== 'true') {
      throw new Error('Disabled interactive regions must override consumer tabIndex and expose aria-disabled.');
    }
    const disabledOpacity = Number(canvasElement.ownerDocument.defaultView.getComputedStyle(disabled).opacity);
    if (Math.abs(disabledOpacity - 0.45) > 0.001) {
      throw new Error(`Disabled region opacity must remain 0.45, received ${disabledOpacity}.`);
    }

    const view = canvasElement.ownerDocument.defaultView;
    await userEvent.click(visible);
    const regionFocusVisible = visible.matches(':focus-visible');
    await waitForRender();
    const hasRegionFocusRing = Boolean(visible.querySelector('[data-region-focus-ring]'));
    if (hasRegionFocusRing !== regionFocusVisible
      || (regionFocusVisible && view.getComputedStyle(visible).outlineStyle !== 'none')) {
      throw new Error('Spatial region must mirror :focus-visible with one shape-managed ring and no rectangular outline.');
    }
    visible.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await waitForRender();
    if (!visible.querySelector('[data-region-focus-ring]') || view.getComputedStyle(visible).outlineStyle !== 'none') {
      throw new Error('Spatial region keyboard input must restore only its shape-managed focus ring after pointer modality.');
    }
    visible.dispatchEvent(new view.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await waitForRender();

    const output = canvasElement.querySelector('[data-testid="region-activation"]');
    if (output?.dataset.activationCount !== '3' || !output.textContent?.includes('slope-east')) {
      throw new Error(`Pointer, Enter, and Space must activate the same region callback: ${output?.textContent}`);
    }
    visible.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true }));
    await waitForRender();
    if (output?.dataset.activationCount !== '3') throw new Error('Repeated region keydown must not emit another inspect activation.');

    if (pointerOnly.hasAttribute('role') || pointerOnly.hasAttribute('tabindex') || pointerOnly.hasAttribute('aria-label')
      || pointerOnly.getAttribute('focusable') !== 'false' || pointerOnly.getAttribute('aria-hidden') !== 'true') {
      throw new Error('Pointer-only region must be hidden from AT and non-focusable without duplicate control semantics.');
    }
    if (pointerOnly.querySelector('[data-region-label]')) {
      throw new Error('A list-owned pointer-only region must not duplicate its label on the map.');
    }
    const pointerBounds = pointerOnly.querySelector('[data-region-geometry]')?.getBoundingClientRect();
    const visibleLabelBounds = Array.from(canvasElement.querySelectorAll('[data-region-label] text'))
      .map((label) => label.getBoundingClientRect());
    if (!pointerBounds || visibleLabelBounds.some((label) => (
      pointerBounds.left < label.right
      && pointerBounds.right > label.left
      && pointerBounds.top < label.bottom
      && pointerBounds.bottom > label.top
    ))) {
      throw new Error('A pointer-only region must not visually capture another region label.');
    }
    await userEvent.click(pointerOnly.querySelector('[data-region-geometry]'));
    await waitForRender();
    if (output?.dataset.activationCount !== '4' || !output.textContent?.includes('pointer-only-region')) {
      throw new Error(`Pointer-only region must preserve pointer selection: ${output?.textContent}`);
    }
    const focusedNode = canvasElement.ownerDocument.activeElement;
    if (focusedNode === pointerOnly || pointerOnly.contains(focusedNode)) {
      throw new Error('Pointer-only region selection moved focus into an aria-hidden SVG fragment.');
    }
    pointerOnly.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await waitForRender();
    if (output?.dataset.activationCount !== '4') throw new Error('Pointer-only region must not provide hidden keyboard activation.');

    disabled.dispatchEvent(new view.MouseEvent('click', { bubbles: true, cancelable: true }));
    disabled.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await waitForRender();
    if (output?.dataset.activationCount !== '4') throw new Error('Disabled region activation must be blocked.');
  },
};

const narrowSpeedRegion = {
  ...speedRegion,
  id: 'narrow-speed',
  shape: {
    kind: 'polygon',
    points: [
      { x: 18, y: 34 },
      { x: 300, y: 34 },
      { x: 286, y: 112 },
      { x: 30, y: 112 },
    ],
  },
};

const narrowSlopeRegion = {
  ...slopeRegion,
  id: 'narrow-slope',
  shape: {
    kind: 'polygon',
    points: [
      { x: 28, y: 164 },
      { x: 292, y: 164 },
      { x: 270, y: 248 },
      { x: 48, y: 248 },
    ],
  },
};

export const NarrowWidth = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 지도에서 속도 제한과 경사 라벨을 함께 읽는 상황입니다. SVG fragment와 screen-space 라벨이 페이지 가로 스크롤을 만들지 않고 viewport 안에서 잘리는지 확인하세요.',
  ),
  render: () => (
    <div data-testid="narrow-region-shell" style={{ width: 320, maxWidth: '100%', minWidth: 0 }}>
      <RegionMap width={320} height={280} label="320px 공간 영역 지도" testId="narrow-region-map">
        <SpatialRegion region={narrowSpeedRegion} />
        <SpatialRegion region={narrowSlopeRegion} />
      </RegionMap>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector('[data-testid="narrow-region-shell"]');
    const map = canvasElement.querySelector('[data-testid="narrow-region-map"]');
    if (!shell || !map) throw new Error('Narrow region fixture is missing.');
    if (shell.scrollWidth > shell.clientWidth || map.scrollWidth > map.clientWidth) {
      throw new Error(`Region map must not create horizontal overflow: shell ${shell.scrollWidth}/${shell.clientWidth}, map ${map.scrollWidth}/${map.clientWidth}.`);
    }
    if (shell.getBoundingClientRect().width > 320.5) throw new Error('Narrow region shell exceeds 320px.');
  },
};

export const SpatialRegionVisualParity = {
  ...DarkPatternsAndStates,
  name: 'Spatial region visual parity',
  tags: ['!dev', 'visual-parity'],
};
