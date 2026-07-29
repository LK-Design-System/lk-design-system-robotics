import React from 'react';
import { userEvent, waitFor } from 'storybook/test';
import { Map2DCanvas } from '@lk-robotics/lds-product';
import { NavigationAnnotationLayer, WaypointMarker } from '../src/index.js';
import { NAV_SELECTION } from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationVocabulary';
import { NAV_WAYPOINT_STATUS_BADGE } from '../src/components/robotics/_navigationVocabulary.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import { NavigationLegend, NavigationMapStage } from './RoboticsNavigationStage.shared.jsx';
import { assertContrastBackedFocus, contrastRatio } from './RoboticsNavigationAssert.shared.jsx';

const meta = {
  title: 'LDS Robotics/Navigation/Waypoint',
  tags: ['autodocs'],
  component: WaypointMarker,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-waypoint--overview',
      eyebrow: 'Robotics / Waypoint',
      title: '웨이포인트는 지도 위치와 겹칠 수 있는 역할을 함께 설명합니다',
      description:
        '운영자가 내비게이션 그래프의 지점을 선택하고 holding·passthrough·parking·charger 역할과 시설 주석을 확인할 때 적합합니다. 면적을 가진 구역이나 실제 주행 궤적에는 Waypoint 대신 Region 또는 Trajectory 계열을 사용하세요.',
    },
    docs: {
      description: {
        component:
          'WaypointMarker는 renderer-neutral WaypointData를 한 SVG g 조각으로 표현합니다. 가장 구체적인 역할은 20px 라운드 스퀘어 내부 벡터 아이콘, 가용성은 본체 채움, invalid·stale 데이터 품질은 RobotPoseMarker와 같은 우측 상단 12px solid badge 하나로 표현합니다. 기본 priority 라벨은 평소 숨고 hover·focus·selection 또는 주의 상태에서 이름을 공개하며, 시설 주석은 선택된 지점에만 표시합니다. 모든 역할과 상태는 라벨 가시성과 무관하게 접근 가능한 이름에 보존됩니다.',
      },
    },
  },
  argTypes: {
    labelVisibility: {
      control: 'inline-radio',
      options: ['priority', 'interaction', 'always', 'hidden'],
      description: '이름 라벨 공개 정책. 기본 priority는 상호작용·선택·주의 상태만 표시합니다.',
      table: { defaultValue: { summary: 'interaction' } },
    },
    detailVisibility: {
      control: 'inline-radio',
      options: ['selected', 'always', 'hidden'],
      description: '시설 주석 등 보조 상세의 공개 정책.',
      table: { defaultValue: { summary: 'selected' } },
    },
    showLabel: {
      control: 'boolean',
      description: '이전 호환용 스위치입니다. 새 사용처는 labelVisibility를 사용합니다.',
      table: { category: 'Deprecated' },
    },
  },
};

export default meta;

const ROLE_NAMES = {
  holding: '대기 가능',
  passthrough: '정차 금지 통과',
  parking: '비상 주차',
  charger: '충전',
};

const overviewWaypoints = [
  {
    id: 'wp-holding',
    label: 'Hold A',
    mapId: 'L1',
    position: { x: 78, y: 78 },
    roles: ['holding'],
    availability: 'available',
  },
  {
    id: 'wp-passthrough',
    label: 'Corridor 2',
    mapId: 'L1',
    position: { x: 260, y: 78 },
    roles: ['passthrough'],
    availability: 'available',
  },
  {
    id: 'wp-parking',
    label: 'Park 03',
    mapId: 'L1',
    position: { x: 420, y: 188 },
    roles: ['parking'],
    availability: 'available',
  },
  {
    id: 'wp-charger',
    label: 'Charge B',
    mapId: 'L1',
    position: { x: 610, y: 188 },
    roles: ['holding', 'charger'],
    annotations: [{ kind: 'dock', label: 'Charging dock B', sourceId: 'dock-b' }],
    availability: 'unknown',
  },
];

const comparisonWaypoints = [
  {
    id: 'wp-comparison-hold',
    label: 'Hold',
    mapId: 'L2',
    position: { x: 72, y: 70 },
    roles: ['holding'],
    availability: 'unknown',
  },
  {
    id: 'wp-comparison-lift',
    label: 'Lift A',
    mapId: 'L2',
    position: { x: 224, y: 142 },
    roles: ['holding', 'parking'],
    annotations: [{ kind: 'lift-approach', label: 'Lift A approach', sourceId: 'lift-a' }],
    availability: 'available',
  },
  {
    id: 'wp-comparison-dock',
    label: 'Dock 2',
    mapId: 'L2',
    position: { x: 386, y: 70 },
    roles: ['charger'],
    annotations: [{ kind: 'dock', label: 'Dock 2', sourceId: 'dock-2' }],
    availability: 'unavailable',
  },
];

const comparisonMarkerStates = {
  'wp-comparison-lift': { invalid: true },
  'wp-comparison-dock': { focused: true },
};

const compoundWaypoints = [
  {
    id: 'wp-compound',
    label: 'Lift lobby A',
    mapId: 'L3',
    position: { x: 104, y: 74 },
    roles: ['holding', 'parking', 'charger'],
    annotations: [
      { kind: 'lift-approach', label: 'Lift A approach', sourceId: 'lift-a' },
      { kind: 'door-approach', label: 'Lift A outer door', sourceId: 'door-l3-a' },
      { kind: 'mutex', label: 'Lift A lobby mutex', sourceId: 'mutex-lift-a' },
    ],
    availability: 'available',
  },
  {
    id: 'wp-stale',
    label: 'Clean 4',
    mapId: 'L3',
    position: { x: 314, y: 74 },
    roles: ['holding'],
    annotations: [{ kind: 'cleaning', label: 'Cleaning station 4', sourceId: 'clean-4' }],
    availability: 'available',
  },
  {
    id: 'wp-invalid',
    label: 'Transfer',
    mapId: 'L3',
    position: { x: 492, y: 74 },
    roles: ['passthrough'],
    annotations: [
      { kind: 'dispenser', label: 'Material dispenser', sourceId: 'disp-1' },
      { kind: 'ingestor', label: 'Material ingestor', sourceId: 'ing-1' },
    ],
    availability: 'unknown',
  },
  {
    id: 'wp-unavailable',
    label: 'Dock 7',
    mapId: 'L3',
    position: { x: 210, y: 196 },
    roles: ['parking', 'charger'],
    annotations: [{ kind: 'dock', label: 'Dock 7', sourceId: 'dock-7' }],
    availability: 'unavailable',
  },
  {
    id: 'wp-disabled',
    label: 'Vendor point',
    mapId: 'L3',
    position: { x: 430, y: 196 },
    annotations: [{ kind: 'custom', label: 'Vendor calibration point', sourceId: 'vendor-17' }],
    availability: 'available',
  },
];

function assertWaypointFocusLabelGap(marker, context) {
  const focus = marker?.querySelector('[data-waypoint-focus-contrast]')
    || marker?.querySelector('[data-waypoint-focus-indicator]');
  const label = marker?.querySelector('[data-waypoint-label]');
  if (!focus || !label) throw new Error(`${context} focus/label anatomy is incomplete.`);

  const gap = label.getBoundingClientRect().left - focus.getBoundingClientRect().right;
  if (gap < 3) {
    throw new Error(`${context} focus rectangle is only ${gap.toFixed(2)}px from its label; expected at least 3px.`);
  }
}

function assertWaypointRoleSlot(marker, expectedRole, context) {
  const point = marker?.querySelector('[data-waypoint-point]');
  const slot = marker?.querySelector('[data-waypoint-role-slot]');
  if (!point || !slot) throw new Error(`${context} role-in-square anatomy is incomplete.`);
  if (
    point.localName !== 'rect'
    || point.getAttribute('width') !== '20'
    || point.getAttribute('height') !== '20'
    || point.getAttribute('rx') !== '4'
  ) {
    throw new Error(`${context} must use the shared 20px rounded-square silhouette.`);
  }
  if (slot.getAttribute('data-waypoint-primary-role') !== expectedRole) {
    throw new Error(`${context} expected primary role ${expectedRole}.`);
  }

  if (!slot.querySelector(`[data-navigation-role-glyph="${expectedRole}"]`) || slot.querySelector('text')) {
    throw new Error(`${context} role must use the internal vector icon.`);
  }

  const pointBounds = point.getBoundingClientRect();
  const slotBounds = slot.getBoundingClientRect();
  const tolerance = 0.5;
  if (
    slotBounds.left < pointBounds.left - tolerance
    || slotBounds.right > pointBounds.right + tolerance
    || slotBounds.top < pointBounds.top - tolerance
    || slotBounds.bottom > pointBounds.bottom + tolerance
  ) {
    throw new Error(`${context} role escaped the rounded square.`);
  }
}

function assertWaypointStateChannels(marker, expectedKind, context) {
  const point = marker?.querySelector('[data-waypoint-point][data-waypoint-state-color]');
  const availability = marker?.getAttribute('data-availability') || 'unknown';
  if (!point || point.getAttribute('data-waypoint-status-kind') !== availability) {
    throw new Error(`${context} expected availability ${availability} on the waypoint body fill.`);
  }
  if (marker.querySelector('[data-waypoint-unavailable-indicator]')) {
    throw new Error(`${context} regressed to a slash instead of the availability fill.`);
  }

  const expectedBadgeKind = ['invalid', 'stale'].includes(expectedKind) ? expectedKind : null;
  const badges = [...marker.querySelectorAll('[data-waypoint-status-badge]')];
  if (expectedBadgeKind == null) {
    if (badges.length > 0) {
      throw new Error(`${context} rendered a data-quality badge without invalid or stale state.`);
    }
  } else {
    const badge = marker.querySelector(`[data-waypoint-status-badge="${expectedBadgeKind}"]`);
    const circle = badge?.querySelector('[data-waypoint-status-badge-circle]');
    const glyph = badge?.querySelector(`[data-navigation-state-glyph="${expectedBadgeKind}"]`);
    if (
      badges.length !== 1
      || !badge
      || !circle
      || !glyph
      || circle.getAttribute('r') !== String(NAV_WAYPOINT_STATUS_BADGE.radius)
      || badge.getAttribute('data-waypoint-status-badge-style') !== 'solid'
      || circle.hasAttribute('stroke-dasharray')
    ) {
      throw new Error(`${context} must render one solid ${expectedBadgeKind} waypoint micro badge.`);
    }
    const pointBounds = point.getBoundingClientRect();
    const badgeBounds = circle.getBoundingClientRect();
    const overlapWidth = Math.min(pointBounds.right, badgeBounds.right) - Math.max(pointBounds.left, badgeBounds.left);
    const overlapHeight = Math.min(pointBounds.bottom, badgeBounds.bottom) - Math.max(pointBounds.top, badgeBounds.top);
    const fullyInside = (
      badgeBounds.left >= pointBounds.left
      && badgeBounds.right <= pointBounds.right
      && badgeBounds.top >= pointBounds.top
      && badgeBounds.bottom <= pointBounds.bottom
    );
    if (overlapWidth <= 0 || overlapHeight <= 0 || fullyInside) {
      throw new Error(`${context} micro badge must overlap the waypoint corner without being contained by it.`);
    }
  }

  const view = marker.ownerDocument.defaultView;
  const style = view.getComputedStyle(point);
  if (style.fill === 'none' || style.fill === 'transparent') {
    throw new Error(`${context} state color is not visible as a solid waypoint fill.`);
  }
}

function assertWaypointSelectionScale(marker, context) {
  const visual = marker?.querySelector('[data-waypoint-selection-visual]');
  const point = marker?.querySelector('[data-waypoint-point]');
  if (!visual || !point) throw new Error(`${context} selection-scale anatomy is incomplete.`);
  if (
    visual.getAttribute('data-waypoint-selected-scale') !== String(NAV_SELECTION.waypointScale)
    || visual.style.transform !== `scale(${NAV_SELECTION.waypointScale})`
  ) {
    throw new Error(`${context} must enlarge the 20px marker to 25px when selected.`);
  }
  if (marker.querySelector('[data-waypoint-selected-outline]')) {
    throw new Error(`${context} must not reuse an accent outline for selection.`);
  }
}

function assertWaypointCompactText(marker, context) {
  const primary = marker?.querySelector('[data-waypoint-primary-label]');
  const details = marker?.querySelector('[data-waypoint-details]');
  if (!primary || !details) throw new Error(`${context} compact text anatomy is incomplete.`);
  if (
    primary.getAttribute('font-size') !== 'var(--label2-size)'
    || details.getAttribute('font-size') !== 'var(--caption2-size)'
  ) {
    throw new Error(`${context} identity/details typography tokens changed.`);
  }
  const view = marker.ownerDocument.defaultView;
  const primarySize = Number.parseFloat(view.getComputedStyle(primary).fontSize);
  const detailsSize = Number.parseFloat(view.getComputedStyle(details).fontSize);
  const detailsBounds = details.getBoundingClientRect();
  if (!(detailsSize > 0 && detailsSize < primarySize && detailsBounds.width > 0 && detailsBounds.height > 0)) {
    throw new Error(`${context} compact role/annotation text did not render below the identity size.`);
  }
}

function WaypointGraphic({
  waypoints,
  viewportScale,
  selectedId,
  markerStates = {},
  onActivate,
  labelVisibility,
  detailVisibility,
  width = 700,
  height = 260,
  label = '내비게이션 그래프 웨이포인트',
}) {
  const mapId = waypoints[0]?.mapId ? `MAP ${waypoints[0].mapId}` : undefined;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-label={label}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <NavigationMapStage width={width} height={height} eyebrow={mapId} north>
        {/* 레이어가 없으면 라벨이 협상을 거치지 않고 natural 위치에 그대로 앉는다.
            그러면 스테이지 패널 경계도 적용되지 않아, 오른쪽 끝 마커의 라벨이
            그려진 지도 밖으로 삐져나간다. 가시성 정책은 마커 prop이 그대로
            소유하도록 always로 열어둔다. */}
        <NavigationAnnotationLayer labelVisibility="always" detailVisibility="always">
          {waypoints.map((waypoint) => (
            <WaypointMarker
            key={waypoint.id}
            waypoint={waypoint}
            viewportScale={viewportScale}
            selected={selectedId === waypoint.id || markerStates[waypoint.id]?.selected}
            focused={markerStates[waypoint.id]?.focused}
            disabled={markerStates[waypoint.id]?.disabled}
            invalid={markerStates[waypoint.id]?.invalid}
            stale={markerStates[waypoint.id]?.stale}
              labelVisibility={labelVisibility}
              detailVisibility={detailVisibility}
              onActivate={onActivate}
            />
          ))}
        </NavigationAnnotationLayer>
      </NavigationMapStage>
    </svg>
  );
}

function MapSurface({
  waypoints,
  selectedId,
  markerStates,
  onActivate,
  labelVisibility,
  detailVisibility,
  appearance = 'light',
  width = 700,
  height = 300,
  label,
}) {
  return (
    <Map2DCanvas
      label={label || `${appearance === 'dark' ? '어두운' : '밝은'} 웨이포인트 지도`}
      appearance={appearance}
      controls={false}
      grid={false}
      // The canvas frames the stage, so it must not outrun it: without the cap
      // the card stretches to the page column while the fixed-width stage stays
      // left-aligned inside it, leaving a lopsided band down the right edge.
      style={{ width: '100%', maxWidth: width, height }}
    >
      {({ viewport }) => (
        <WaypointGraphic
          waypoints={waypoints}
          viewportScale={viewport.z}
          selectedId={selectedId}
          markerStates={markerStates}
          onActivate={onActivate}
          labelVisibility={labelVisibility}
          detailVisibility={detailVisibility}
          width={width}
          height={height}
        />
      )}
    </Map2DCanvas>
  );
}

function MarkerSelectionFixture() {
  const [selectedId, setSelectedId] = React.useState('wp-holding');
  const [activationCount, setActivationCount] = React.useState(0);

  const selectWaypoint = (waypointId) => {
    setSelectedId(waypointId);
    setActivationCount((count) => count + 1);
  };

  return (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 900, minWidth: 0 }}>
      <MapSurface
        waypoints={overviewWaypoints}
        selectedId={selectedId}
        onActivate={selectWaypoint}
        height={300}
        label="1층 웨이포인트 선택 지도"
      />
      <p data-activation-log style={{ margin: 0, color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--caption1-size)', fontVariantNumeric: 'tabular-nums' }}>
        선택 활성화 <span data-activation-count="">{activationCount}</span>회
      </p>
    </main>
  );
}

function OverviewMapFixture() {
  const [selectedId, setSelectedId] = React.useState('wp-charger');

  return (
    <main style={{ display: 'grid', gap: 'var(--space-5)', width: '100%', maxWidth: 900, minWidth: 0 }}>
      <MapSurface
        waypoints={overviewWaypoints}
        selectedId={selectedId}
        onActivate={setSelectedId}
        // The story promises that error/stale/unavailable waypoints keep a
        // standing label while ordinary ones stay quiet until interaction.
        // That is the 'priority' mode; the inherited default is 'interaction',
        // which would silently drop the standing half of that contract.
        labelVisibility="priority"
        height={300}
        label="1층 웨이포인트 역할 지도"
      />
      <NavigationLegend
        roles={['holding', 'passthrough', 'parking', 'charger']}
        annotations={['dock']}
        states={['available', 'unknown']}
        statePresentation="waypoint"
      />
    </main>
  );
}

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '같은 내비게이션 그래프에서 대기·통과·주차·충전 역할과 상태를 비교하는 대표 뷰입니다. 평상시에는 마커가 역할과 가용성을 전달하고, hover·키보드 focus에는 이름 한 줄, 선택에는 이름과 시설 주석을 지속 표시합니다. 오류·오래된 데이터·사용 불가는 직접 주의가 필요한 우선 라벨로 남습니다.',
  ),
  render: () => <OverviewMapFixture />,
  play: async ({ canvasElement }) => {
    const holding = canvasElement.querySelector('[data-waypoint-id="wp-holding"]');
    const passthrough = canvasElement.querySelector('[data-waypoint-id="wp-passthrough"]');
    const parking = canvasElement.querySelector('[data-waypoint-id="wp-parking"]');
    const charger = canvasElement.querySelector('[data-waypoint-id="wp-charger"]');
    if (!holding || !passthrough || !parking || !charger) throw new Error('Waypoint overview markers are incomplete.');

    const name = holding.getAttribute('aria-label') || '';
    if (!name.includes('Hold A') || !name.includes('지도 L1') || !name.includes('대기 지점') || !name.includes('가용성 사용 가능')) {
      throw new Error(`Waypoint accessible name lost identity or semantics: ${name}`);
    }
    assertWaypointRoleSlot(holding, 'holding', 'Holding waypoint');
    assertWaypointRoleSlot(passthrough, 'passthrough', 'Passthrough waypoint');
    assertWaypointRoleSlot(parking, 'parking', 'Parking waypoint');
    assertWaypointRoleSlot(charger, 'charger', 'Charger waypoint');
    assertWaypointStateChannels(holding, 'available', 'Available waypoint');
    assertWaypointStateChannels(charger, 'unknown', 'Unknown waypoint');
    if (holding.querySelector('[data-navigation-role-glyph="holding"]')?.getAttribute('data-navigation-role-glyph-form') !== 'plain-flag') {
      throw new Error('Holding waypoint must use the plain flag role glyph.');
    }
    if (passthrough.querySelector('[data-navigation-role-glyph="passthrough"]')?.getAttribute('data-navigation-role-glyph-form') !== 'double-chevron') {
      throw new Error('Passthrough waypoint must use the double-chevron role glyph.');
    }
    if (
      holding.getAttribute('data-label-visibility') !== 'priority'
      || holding.querySelector('[data-waypoint-label]')
    ) {
      throw new Error('Ordinary waypoint labels must stay quiet until direct interaction.');
    }
    const selectedLabel = charger.querySelector('[data-waypoint-label]');
    const chargerDetails = charger.querySelector('[data-waypoint-details]')?.textContent ?? '';
    if (!selectedLabel || chargerDetails !== 'dock') {
      throw new Error(`Selected charger must retain its name and facility detail, received ${chargerDetails}.`);
    }

    await userEvent.hover(holding);
    await waitFor(() => {
      if (
        holding.getAttribute('data-hovered') !== 'true'
        || !holding.querySelector('[data-waypoint-primary-label]')
        || holding.querySelector('[data-waypoint-details]')
      ) {
        throw new Error('Hovered waypoint must reveal only its primary name.');
      }
    });
    await userEvent.unhover(holding);
    await waitFor(() => {
      if (holding.querySelector('[data-waypoint-label]')) {
        throw new Error('Ordinary waypoint label must close when hover leaves.');
      }
    });

    await userEvent.click(holding);
    await waitFor(() => {
      if (
        holding.getAttribute('aria-pressed') !== 'true'
        || !holding.querySelector('[data-waypoint-primary-label]')
        || charger.querySelector('[data-waypoint-label]')
      ) {
        throw new Error('Selection must persist one waypoint label and release the previous detail label.');
      }
    });
    if (holding.getAttribute('aria-label')?.includes('선택됨') !== true) {
      throw new Error('Selected waypoint accessible name must announce persistent selection.');
    }
    const availableLegend = canvasElement.querySelector('[data-waypoint-legend-state="available"] rect:last-child');
    const unknownLegend = canvasElement.querySelector('[data-waypoint-legend-state="unknown"] rect:last-child');
    if (
      !availableLegend?.getAttribute('fill')?.includes('positive')
      || !unknownLegend?.getAttribute('fill')?.includes('--viewer-warning')
      || canvasElement.querySelector('[data-navigation-legend] [data-navigation-state-glyph="unknown"]')
    ) {
      throw new Error('Waypoint availability legend must mirror the rounded-square body fill instead of a generic state glyph.');
    }
  },
};

export const SelectionSync = {
  name: '상호작용 · 선택과 활성화',
  parameters: storyDescription(
    '지도 마커를 포인터·키보드로 선택·활성화하는 계약을 확인합니다. 클릭·Enter·Space가 마커를 선택(aria-pressed)하고, :focus-visible 미러링과 반복 keydown 억제가 지켜지며, 선택이 중복 live region을 만들지 않아야 합니다.',
  ),
  render: () => <MarkerSelectionFixture />,
  play: async ({ canvasElement }) => {
    const holding = canvasElement.querySelector('[data-waypoint-id="wp-holding"]');
    const passthrough = canvasElement.querySelector('[data-waypoint-id="wp-passthrough"]');
    if (!holding || !passthrough) throw new Error('Waypoint selection markers are incomplete.');

    await userEvent.click(passthrough);
    await waitFor(() => {
      if (passthrough.getAttribute('aria-pressed') !== 'true') throw new Error('Pointer activation did not select the waypoint.');
    });

    holding.focus();
    const holdingFocusVisible = holding.matches(':focus-visible');
    await waitFor(() => {
      const hasFocusIndicator = Boolean(holding.querySelector('[data-waypoint-focus-indicator]'));
      if (hasFocusIndicator !== holdingFocusVisible) {
        throw new Error('Waypoint focus indicator must mirror the native :focus-visible state.');
      }
      if (holdingFocusVisible && canvasElement.ownerDocument.defaultView.getComputedStyle(holding).outlineStyle !== 'none') {
        throw new Error('Waypoint must use one shape-managed focus ring without the global rectangular outline.');
      }
    });
    if (holdingFocusVisible) assertWaypointFocusLabelGap(holding, 'Overview waypoint');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      if (holding.getAttribute('aria-pressed') !== 'true') throw new Error('Enter did not activate the focused waypoint.');
      if (!holding.querySelector('[data-waypoint-focus-indicator]')) {
        throw new Error('Waypoint keyboard input must restore its shape-managed focus indicator after pointer modality.');
      }
      assertContrastBackedFocus(
        holding,
        '[data-waypoint-focus-contrast]',
        '[data-waypoint-focus-indicator]',
        'Waypoint',
      );
      if (canvasElement.ownerDocument.defaultView.getComputedStyle(holding).outlineStyle !== 'none') {
        throw new Error('Waypoint keyboard modality must not restore the global rectangular outline.');
      }
    });
    assertWaypointFocusLabelGap(holding, 'Keyboard-modality waypoint');

    passthrough.focus();
    await userEvent.keyboard(' ');
    await waitFor(() => {
      if (passthrough.getAttribute('aria-pressed') !== 'true') throw new Error('Space did not activate the focused waypoint.');
    });

    if (canvasElement.querySelector('[aria-live], [role="status"], [role="alert"]')) {
      throw new Error('Waypoint selection must not create a redundant live region.');
    }
    const activationCount = () => canvasElement.querySelector('[data-activation-count]')?.textContent ?? '';
    await waitFor(() => {
      if (activationCount() !== '3') throw new Error(`Waypoint activation count is incomplete: ${activationCount()}.`);
    });
    holding.focus();
    const view = canvasElement.ownerDocument.defaultView;
    holding.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true }));
    holding.dispatchEvent(new view.KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (activationCount() !== '3') throw new Error('Repeated waypoint keydown invoked onActivate.');
  },
};

const pointerOnlyWaypoint = {
  id: 'wp-pointer-only',
  label: 'Pointer-only waypoint',
  mapId: 'L5',
  position: { x: 100, y: 88 },
  roles: ['holding'],
  availability: 'unknown',
};

const passiveFocusedWaypoint = {
  id: 'wp-passive-focused',
  label: 'Passive focused waypoint',
  mapId: 'L5',
  position: { x: 250, y: 150 },
  roles: ['parking'],
  availability: 'available',
};

function WaypointPointerOnlyFixture() {
  const [activations, setActivations] = React.useState(0);
  return (
    <main style={{ display: 'grid', gap: 'var(--space-3)', width: '100%', maxWidth: 620 }}>
      <Map2DCanvas label="포인터 전용 웨이포인트 지도" controls={false} grid={false} style={{ width: '100%', height: 240 }}>
        <svg width="460" height="210" viewBox="0 0 460 210" role="group" aria-label="포인터 전용 웨이포인트 계층">
          <WaypointMarker
            waypoint={pointerOnlyWaypoint}
            selected
            focused
            invalid
            aria-hidden="true"
            onActivate={() => setActivations((count) => count + 1)}
          />
          <WaypointMarker waypoint={passiveFocusedWaypoint} focused />
        </svg>
      </Map2DCanvas>
      <output data-testid="waypoint-pointer-output" hidden>activation {activations}회</output>
    </main>
  );
}

export const PointerOnlyMapFragment = {
  name: '상호작용 · 포인터 전용 지도 조각',
  parameters: storyDescription(
    'aria-hidden waypoint가 접근성 tree와 Tab 순서에서 빠지고 pointer click만 유지하는지, passive controlled focus가 계산 이름과 visual ring에 함께 반영되는지 확인합니다.',
  ),
  render: () => <WaypointPointerOnlyFixture />,
  play: async ({ canvasElement }) => {
    const pointerOnly = canvasElement.querySelector('[data-waypoint-id="wp-pointer-only"]');
    const passive = canvasElement.querySelector('[data-waypoint-id="wp-passive-focused"]');
    const output = () => canvasElement.querySelector('[data-testid="waypoint-pointer-output"]')?.textContent ?? '';
    if (!pointerOnly || !passive) throw new Error('Waypoint pointer-only fixture is incomplete.');
    for (const attribute of ['role', 'aria-label', 'aria-pressed', 'aria-disabled', 'aria-invalid', 'tabindex']) {
      if (pointerOnly.hasAttribute(attribute)) throw new Error(`Pointer-only waypoint retained ${attribute}.`);
    }
    if (pointerOnly.getAttribute('aria-hidden') !== 'true' || pointerOnly.getAttribute('focusable') !== 'false') {
      throw new Error('Pointer-only waypoint must be aria-hidden and explicitly unfocusable.');
    }
    if (pointerOnly.querySelector('[data-waypoint-focus-indicator]')) {
      throw new Error('Pointer-only waypoint must suppress controlled focus chrome.');
    }
    await userEvent.click(pointerOnly);
    await waitFor(() => {
      if (!output().includes('activation 1회')) throw new Error('Pointer-only waypoint click did not preserve its callback.');
    });
    if (canvasElement.ownerDocument.activeElement === pointerOnly) {
      throw new Error('Pointer down focused the pointer-only waypoint.');
    }
    const view = canvasElement.ownerDocument.defaultView;
    for (const event of [
      new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      new view.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
      new view.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true }),
    ]) pointerOnly.dispatchEvent(event);
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (!output().includes('activation 1회')) throw new Error('Pointer-only waypoint accepted keyboard activation.');

    const passiveName = passive.getAttribute('aria-label') ?? '';
    if (passive.getAttribute('role') !== 'img' || !passiveName.includes('포커스됨')) {
      throw new Error(`Passive focused waypoint name is incomplete: ${passiveName}`);
    }
    if (!passive.querySelector('[data-waypoint-focus-indicator]')) {
      throw new Error('Passive controlled waypoint focus ring is missing.');
    }
    assertWaypointFocusLabelGap(passive, 'Passive controlled waypoint');
    assertWaypointStateChannels(pointerOnly, 'invalid', 'Pointer-only invalid waypoint');
    if (
      !pointerOnly.querySelector('[data-waypoint-status-badge="invalid"]')
      || pointerOnly.getAttribute('data-availability') !== 'unknown'
      || pointerOnly.getAttribute('data-invalid') !== 'true'
    ) {
      throw new Error('Pointer-only compound state must preserve raw semantics while showing invalid in the micro badge.');
    }
  },
};

export const LightAndDark = {
  name: '변형·상태 · 밝은·어두운 지도',
  parameters: storyDescription(
    '같은 웨이포인트와 운영 상태를 light·dark 지도에서 나란히 비교합니다. 배경이 바뀌어도 역할 벡터 아이콘은 라운드 스퀘어 안에 머물고, unknown·unavailable 가용성은 본체 채움, invalid 데이터 품질은 우측 상단 solid micro badge로 구분되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 'var(--space-4)', width: '100%', maxWidth: 940 }}>
      <section aria-labelledby="waypoint-light" style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
        <strong id="waypoint-light">Light</strong>
        <MapSurface waypoints={comparisonWaypoints} markerStates={comparisonMarkerStates} detailVisibility="always" appearance="light" width={460} height={260} />
      </section>
      <section aria-labelledby="waypoint-dark" style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
        <strong id="waypoint-dark">Dark</strong>
        <MapSurface waypoints={comparisonWaypoints} markerStates={comparisonMarkerStates} detailVisibility="always" appearance="dark" width={460} height={260} />
      </section>
    </main>
  ),
  play: async ({ canvasElement }) => {
    await canvasElement.ownerDocument.fonts.ready;
    const viewers = [...canvasElement.querySelectorAll('[data-viewer-appearance]')];
    if (viewers.length !== 2) throw new Error(`Waypoint light/dark parity expected 2 viewers, found ${viewers.length}.`);
    viewers.forEach((viewer) => {
      const appearance = viewer.getAttribute('data-viewer-appearance');
      const unknown = viewer.querySelector('[data-waypoint-id="wp-comparison-hold"]');
      const invalid = viewer.querySelector('[data-waypoint-id="wp-comparison-lift"]');
      const focused = viewer.querySelector('[data-waypoint-id="wp-comparison-dock"]');
      const unknownSurface = unknown?.querySelector('[data-waypoint-point]');
      const invalidSurface = invalid?.querySelector('[data-waypoint-point]');
      if (!unknownSurface || !invalidSurface) {
        throw new Error(`${appearance} waypoint contrast fixture is incomplete.`);
      }
      assertWaypointFocusLabelGap(focused, `${appearance} focused waypoint`);
      assertWaypointRoleSlot(unknown, 'holding', `${appearance} unknown waypoint`);
      assertWaypointRoleSlot(invalid, 'parking', `${appearance} invalid waypoint`);
      assertWaypointStateChannels(unknown, 'unknown', `${appearance} unknown waypoint`);
      assertWaypointStateChannels(invalid, 'invalid', `${appearance} invalid waypoint`);
      assertWaypointStateChannels(focused, 'unavailable', `${appearance} unavailable waypoint`);
      assertWaypointCompactText(invalid, `${appearance} annotated waypoint`);
      const view = canvasElement.ownerDocument.defaultView;
      const unknownStyle = view.getComputedStyle(unknownSurface);
      const invalidStyle = view.getComputedStyle(invalidSurface);
      const unknownRole = unknown.querySelector('[data-navigation-role-glyph] path');
      const invalidRole = invalid.querySelector('[data-navigation-role-glyph] path');
      const unknownRatio = contrastRatio(view.getComputedStyle(unknownRole).fill, unknownStyle.fill);
      const invalidRatio = contrastRatio(view.getComputedStyle(invalidRole).fill, invalidStyle.fill);
      if (unknownRatio < 3 || invalidRatio < 3) {
        throw new Error(`${appearance} waypoint role-on-state contrast failed: unknown ${unknownRatio.toFixed(2)}:1, invalid ${invalidRatio.toFixed(2)}:1.`);
      }
    });
  },
};

function CompoundStateFixture() {
  const [activation, setActivation] = React.useState('none');
  const markerStates = {
    'wp-compound': { selected: true },
    'wp-stale': { stale: true },
    'wp-invalid': { invalid: true },
    'wp-unavailable': { focused: true },
    'wp-disabled': { disabled: true },
  };

  return (
    <main style={{ display: 'grid', gap: 'var(--space-3)', width: '100%', maxWidth: 760, minWidth: 0 }}>
      <MapSurface
        waypoints={compoundWaypoints}
        markerStates={markerStates}
        onActivate={(waypointId) => setActivation(waypointId)}
        width={620}
        height={280}
        label="중첩 역할과 운영 상태 지도"
      />
      <p hidden data-compound-activation>
        activated: {activation}
      </p>
    </main>
  );
}

export const CompoundRolesAndStates = {
  name: '변형·상태 · 중첩 역할과 운영 상태',
  parameters: storyDescription(
    '여러 역할·시설 주석이 겹친 지점과 selected·focused·stale·unknown+invalid·unavailable·disabled 상태를 한 지도에서 비교합니다. 가장 구체적인 역할 하나는 내부 벡터 아이콘, 가용성은 본체 채움, invalid·stale은 12px solid badge 한 자리, 선택은 20px에서 25px로 정적 확대, 포커스는 고대비 외곽 링으로 분리되는지 확인하세요.',
  ),
  render: () => <CompoundStateFixture />,
  play: async ({ canvasElement }) => {
    await canvasElement.ownerDocument.fonts.ready;
    const disabled = canvasElement.querySelector('[data-waypoint-id="wp-disabled"]');
    const unavailable = canvasElement.querySelector('[data-waypoint-id="wp-unavailable"]');
    const stale = canvasElement.querySelector('[data-waypoint-id="wp-stale"]');
    const compound = canvasElement.querySelector('[data-waypoint-id="wp-compound"]');
    const unknownInvalid = canvasElement.querySelector('[data-waypoint-id="wp-invalid"]');
    const log = canvasElement.querySelector('[data-compound-activation]');
    if (!disabled || !unavailable || !stale || !compound || !unknownInvalid || !log) throw new Error('Compound waypoint fixture is incomplete.');

    const before = log.textContent;
    await userEvent.click(disabled);
    const view = canvasElement.ownerDocument.defaultView;
    disabled.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    disabled.dispatchEvent(new view.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await waitFor(() => {
      if (log.textContent !== before) throw new Error('Disabled waypoint emitted an activation.');
    });
    const disabledOpacity = Number(view.getComputedStyle(disabled).opacity);
    if (Math.abs(disabledOpacity - 0.45) > 0.001) {
      throw new Error(`Disabled waypoint opacity must remain 0.45, received ${disabledOpacity}.`);
    }

    await userEvent.click(unavailable);
    await waitFor(() => {
      if (!log.textContent.includes('wp-unavailable')) throw new Error('Unavailable waypoint must remain inspectable.');
    });

    assertWaypointSelectionScale(compound, 'Selected compound waypoint');
    if (!canvasElement.querySelector('[data-waypoint-focus-indicator]')) throw new Error('Focused waypoint lost its focus indicator.');
    if (!canvasElement.querySelector('[data-waypoint-focus-contrast]')) throw new Error('Focused waypoint lost its contrast underlay.');
    assertWaypointStateChannels(stale, 'stale', 'Stale waypoint');
    assertWaypointStateChannels(unknownInvalid, 'invalid', 'Unknown + invalid waypoint');
    assertWaypointStateChannels(unavailable, 'unavailable', 'Unavailable waypoint');
    assertWaypointRoleSlot(compound, 'charger', 'Compound role waypoint');
    assertWaypointRoleSlot(unknownInvalid, 'passthrough', 'Invalid waypoint');
    assertWaypointFocusLabelGap(unavailable, 'Compound focused waypoint');
    assertWaypointCompactText(compound, 'Compound role/annotation waypoint');
    const unknownInvalidName = unknownInvalid.getAttribute('aria-label') ?? '';
    if (
      !unknownInvalid.querySelector('[data-waypoint-status-badge="invalid"]')
      || !unknownInvalidName.includes('가용성 상태 미확인')
      || !unknownInvalidName.includes('데이터 오류')
    ) {
      throw new Error(`Unknown + invalid waypoint must announce both semantics and show one invalid micro badge: ${unknownInvalidName}`);
    }
  },
};

const priorityWaypoint = {
  id: 'wp-priority',
  label: 'Dock 12',
  mapId: 'L3',
  position: { x: 310, y: 120 },
  roles: ['parking', 'charger'],
  annotations: [{ kind: 'dock', label: 'Dock 12', sourceId: 'dock-12' }],
  availability: 'unknown',
};

function CompoundStatePriorityFixture() {
  return (
    <main style={{ display: 'grid', gap: 'var(--space-3)', width: '100%', maxWidth: 760, minWidth: 0 }}>
      <MapSurface
        waypoints={[priorityWaypoint]}
        markerStates={{ 'wp-priority': { selected: true, focused: true, invalid: true, stale: true } }}
        width={620}
        height={240}
        label="복합 상태 우선순위 지도"
      />
    </main>
  );
}

export const CompoundStatePriority = {
  name: '변형·상태 · 복합 상태 우선순위',
  parameters: storyDescription(
    '선택·포커스·오래된 데이터·데이터 오류·가용성 미확인이 동시에 걸리는 최악 조합입니다. 충전 역할은 내부 벡터 아이콘, unknown은 본체 채움, invalid > stale 우선순위는 고정 크기 12px solid badge 하나, 선택은 25px 정적 확대, 포커스는 고대비 외곽 링으로 분리되는지 확인하세요.',
  ),
  render: () => <CompoundStatePriorityFixture />,
  play: async ({ canvasElement }) => {
    await canvasElement.ownerDocument.fonts.ready;
    const marker = canvasElement.querySelector('[data-waypoint-id="wp-priority"]');
    if (!marker) throw new Error('Compound-state priority waypoint is missing.');

    const point = marker.querySelector('[data-waypoint-point][data-waypoint-status-kind="unknown"]');
    const statusBadge = marker.querySelector('[data-waypoint-status-badge="invalid"]');
    const focusContrast = marker.querySelector('[data-waypoint-focus-contrast]');
    const focusIndicator = marker.querySelector('[data-waypoint-focus-indicator]');
    if (!point || !statusBadge || !focusContrast || !focusIndicator) {
      throw new Error('Compound waypoint must retain unknown fill, one invalid micro badge, selection, and both focus layers.');
    }
    if (
      marker.querySelector('[data-waypoint-selected-indicator]')
      || marker.querySelector('[data-waypoint-attention]')
      || marker.querySelectorAll('[data-waypoint-status-badge]').length !== 1
      || !statusBadge.querySelector('[data-navigation-state-glyph="invalid"]')
    ) {
      throw new Error('Compound waypoint must consolidate invalid + stale into one invalid micro badge.');
    }
    const accessibleName = marker.getAttribute('aria-label') ?? '';
    for (const stateName of ['선택됨', '포커스됨', '데이터 오류', '오래된 데이터', '가용성 상태 미확인']) {
      if (!accessibleName.includes(stateName)) {
        throw new Error(`Compound waypoint accessible name lost ${stateName}: ${accessibleName}`);
      }
    }
    assertContrastBackedFocus(
      marker,
      '[data-waypoint-focus-contrast]',
      '[data-waypoint-focus-indicator]',
      'Waypoint',
    );
    assertWaypointSelectionScale(marker, 'Compound priority waypoint');
    if (marker.querySelector('[data-waypoint-selection-visual]')?.contains(statusBadge)) {
      throw new Error('The waypoint micro badge must remain fixed while selection enlarges the body.');
    }
    assertWaypointStateChannels(marker, 'invalid', 'Compound priority state');
    assertWaypointRoleSlot(marker, 'charger', 'Compound priority role');
    assertWaypointFocusLabelGap(marker, 'Compound-state priority waypoint');
  },
};

const zoomWaypoint = {
  id: 'wp-zoom',
  label: 'Zoom target',
  mapId: 'L4',
  position: { x: 60, y: 52 },
  roles: ['holding'],
  availability: 'available',
};

export const ZoomAndHitArea = {
  name: '상호작용 · 확대·축소와 입력 면적',
  parameters: storyDescription(
    '50%·100%·200% 세계 배율에서 같은 waypoint를 비교합니다. 위치는 world transform을 따르되 marker와 24×24 정사각형을 포함하는 35px 원형 입력 면적은 화면 크기를 유지하고 stroke가 배율에 따라 두꺼워지지 않는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', width: '100%', maxWidth: 720 }}>
      {[0.5, 1, 2].map((zoom) => (
        <figure key={zoom} data-zoom-sample={zoom} style={{ display: 'grid', gap: 'var(--space-2)', margin: 0 }}>
          <svg
            width="180"
            height="120"
            viewBox="0 0 180 120"
            role="group"
            aria-label={`${Math.round(zoom * 100)}% waypoint 배율`}
            style={{ display: 'block', border: '1px solid var(--color-semantic-line-normal-normal)', borderRadius: 'var(--radius-md)', background: 'var(--color-semantic-background-elevated-normal)' }}
          >
            <g transform={`scale(${zoom})`}>
              <WaypointMarker waypoint={zoomWaypoint} viewportScale={zoom} showLabel={false} onActivate={() => {}} />
            </g>
          </svg>
          <figcaption style={{ color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--caption1-size)' }}>
            {Math.round(zoom * 100)}%
          </figcaption>
        </figure>
      ))}
    </main>
  ),
  play: async ({ canvasElement }) => {
    const samples = [...canvasElement.querySelectorAll('[data-zoom-sample]')];
    if (samples.length !== 3) throw new Error('Zoom samples are incomplete.');

    samples.forEach((sample) => {
      const zoom = Number(sample.dataset.zoomSample);
      const screenSpace = sample.querySelector('[data-waypoint-screen-space]');
      const hitArea = sample.querySelector('[data-waypoint-hit-area]');
      const point = sample.querySelector('[data-waypoint-point]');
      if (!screenSpace || !hitArea || !point) throw new Error(`Zoom ${zoom} marker anatomy is incomplete.`);

      const expectedTransform = `scale(${1 / zoom})`;
      if (screenSpace.getAttribute('transform') !== expectedTransform) {
        throw new Error(`Zoom ${zoom} did not apply inverse screen scaling.`);
      }
      const hitRadius = Number(hitArea.getAttribute('r'));
      if (hitArea.getAttribute('data-screen-target-size') !== '24' || hitRadius * Math.SQRT2 < 24) {
        throw new Error(`Zoom ${zoom} lost the 24px activation target.`);
      }
      if (point.getAttribute('vector-effect') !== 'non-scaling-stroke') {
        throw new Error(`Zoom ${zoom} point stroke scales with the world.`);
      }

      const bounds = hitArea.getBoundingClientRect();
      const minimumCircularBounds = 24 * Math.SQRT2;
      if (bounds.width < minimumCircularBounds || bounds.height < minimumCircularBounds) {
        throw new Error(`Zoom ${zoom} rendered circular hit area too small to contain 24×24 CSS px: ${bounds.width}×${bounds.height}.`);
      }
    });
  },
};

const narrowWaypoints = [
  { ...overviewWaypoints[0], position: { x: 58, y: 58 } },
  { ...overviewWaypoints[3], position: { x: 190, y: 142 } },
];

function NarrowFixture() {
  const [selectedId, setSelectedId] = React.useState('wp-holding');
  return (
    <div data-narrow-waypoint-frame style={{ display: 'grid', gap: 'var(--space-4)', width: 320, maxWidth: '100%', minWidth: 0 }}>
      <MapSurface
        waypoints={narrowWaypoints}
        selectedId={selectedId}
        markerStates={{ 'wp-charger': { focused: true } }}
        onActivate={setSelectedId}
        width={300}
        height={220}
        label="320px 웨이포인트 지도"
      />
    </div>
  );
}

export const NarrowWidth = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 작업 영역에서 웨이포인트 지도가 가로 overflow 없이 접히고, 지도 표식이 좁아져도 포인터로 선택할 수 있는지 확인합니다.',
  ),
  render: () => <NarrowFixture />,
  play: async ({ canvasElement }) => {
    await canvasElement.ownerDocument.fonts.ready;
    const frame = canvasElement.querySelector('[data-narrow-waypoint-frame]');
    if (!frame) throw new Error('Narrow waypoint frame is missing.');
    if (frame.scrollWidth > frame.clientWidth) {
      throw new Error(`Waypoint narrow layout overflowed: ${frame.scrollWidth}px > ${frame.clientWidth}px.`);
    }

    const marker = canvasElement.querySelector('[data-waypoint-id="wp-charger"]');
    if (!marker) throw new Error('Narrow waypoint marker is missing.');
    await userEvent.click(marker);
    await waitFor(() => {
      if (marker.getAttribute('aria-pressed') !== 'true') throw new Error('Narrow map marker did not select on pointer.');
      assertWaypointFocusLabelGap(marker, '320px waypoint');
      assertWaypointStateChannels(marker, 'unknown', '320px unknown waypoint');
      assertWaypointRoleSlot(marker, 'charger', '320px charger waypoint');
      assertWaypointCompactText(marker, '320px role/annotation waypoint');
    });
  },
};

export const WaypointVisualParity = {
  ...CompoundRolesAndStates,
  name: 'Waypoint visual parity',
  tags: ['!dev', 'visual-parity'],
};

export const WaypointCompoundStateParity = {
  ...CompoundStatePriority,
  name: 'Waypoint compound-state priority parity',
  tags: ['!dev', 'visual-parity'],
};
