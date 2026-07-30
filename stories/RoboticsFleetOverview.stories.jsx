import React from 'react';
import { Legend, Map2DCanvas } from '@lk-robotics/lds-product';
import { userEvent, waitFor } from 'storybook/test';
import {
  FleetHealthSummary,
  FleetRobotRow,
  LaneOverlay,
  NavigationAnnotationLayer,
  OccupancyMapLayer,
  RobotPoseMarker,
  SpatialRegion,
} from '../src/index.js';
import { NAV_SELECTION } from '../src/components/robotics/_navigationVocabulary.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import {
  DENSE_FLEET_ROBOTS,
  FLEET_COUNTS,
  FLEET_ROBOTS,
  matchesFleetFilters,
} from './RoboticsFleetOverview.fixtures.js';

function incidentDetail(count) {
  if (!count) return null;
  return `인시던트 ${count}건`;
}

const FLEET_MAP_WIDTH = 720;
const FLEET_MAP_HEIGHT = 420;
const FLEET_MAP_ID = 'seoul-rnd-L1';

function createFleetOccupancyMap() {
  const width = 36;
  const height = 21;
  const data = new Int8Array(width * height).fill(-1);
  const setCell = (column, row, value) => {
    if (column < 0 || column >= width || row < 0 || row >= height) return;
    data[row * width + column] = value;
  };

  for (let row = 1; row < height - 1; row += 1) {
    for (let column = 1; column < width - 1; column += 1) {
      setCell(column, row, 0);
    }
  }

  for (let column = 1; column < width - 1; column += 1) {
    setCell(column, 1, 100);
    setCell(column, height - 2, 100);
  }
  for (let row = 1; row < height - 1; row += 1) {
    setCell(1, row, 100);
    setCell(width - 2, row, 100);
  }

  for (let row = 2; row < height - 2; row += 1) {
    if (![5, 6, 14, 15].includes(row)) {
      setCell(12, row, 100);
      setCell(24, row, 100);
    }
  }
  for (let column = 2; column < width - 2; column += 1) {
    if (![7, 8, 17, 18, 29, 30].includes(column)) {
      setCell(column, 10, 100);
    }
  }

  return {
    width,
    height,
    resolution: 20,
    data,
  };
}

const FLEET_OCCUPANCY_MAP = createFleetOccupancyMap();

// The canvas encodes region category as a fill pattern — diagonal hatching for
// behavior, a dot field for facility — and lanes as a dashed line. None of that
// is decodable from the map alone, so the composition owns the key.
const FLEET_MAP_LEGEND = [
  { id: 'operation', label: '운영 구역', color: 'var(--color-semantic-primary-normal)' },
  { id: 'facility', label: '설비 구역', color: 'var(--color-semantic-label-neutral)' },
  {
    id: 'lane',
    label: '주행 통로',
    color: 'var(--color-semantic-label-alternative)',
    shape: 'line',
    dashed: true,
  },
];

const FLEET_REGIONS = [
  {
    id: 'receiving-zone',
    mapId: FLEET_MAP_ID,
    label: 'A동 입고',
    category: 'behavior',
    rule: { kind: 'operation-area' },
    shape: {
      kind: 'polygon',
      points: [
        { x: 44, y: 44 },
        { x: 220, y: 44 },
        { x: 220, y: 176 },
        { x: 44, y: 176 },
      ],
    },
  },
  {
    id: 'work-zone',
    mapId: FLEET_MAP_ID,
    label: 'B동 조립',
    category: 'behavior',
    rule: { kind: 'operation-area' },
    shape: {
      kind: 'polygon',
      points: [
        { x: 268, y: 44 },
        { x: 476, y: 44 },
        { x: 476, y: 176 },
        { x: 268, y: 176 },
      ],
    },
  },
  {
    id: 'charging-zone',
    mapId: FLEET_MAP_ID,
    label: '충전 뱅크 A',
    category: 'facility',
    kind: 'charger-area',
    facilityId: 'charger-bank-a',
    shape: {
      kind: 'polygon',
      points: [
        { x: 44, y: 236 },
        { x: 220, y: 236 },
        { x: 220, y: 376 },
        { x: 44, y: 376 },
      ],
    },
  },
  {
    id: 'docking-zone',
    mapId: FLEET_MAP_ID,
    label: '도킹 뱅크 B',
    category: 'facility',
    kind: 'dock-area',
    facilityId: 'dock-bank-b',
    shape: {
      kind: 'polygon',
      points: [
        { x: 508, y: 228 },
        { x: 676, y: 228 },
        { x: 676, y: 376 },
        { x: 508, y: 376 },
      ],
    },
  },
];

const FLEET_LANES = [
  {
    id: 'lane-north',
    label: '북측 주 통로',
    mapId: FLEET_MAP_ID,
    coordinateSpace: 'svg-map',
    points: [
      { x: 72, y: 210 },
      { x: 648, y: 210 },
    ],
    entry: { waypointId: 'north-west', orientation: 'forward' },
    exit: { waypointId: 'north-east', orientation: 'forward' },
    relation: { kind: 'single' },
  },
  {
    id: 'lane-west',
    label: '서측 작업 통로',
    mapId: FLEET_MAP_ID,
    coordinateSpace: 'svg-map',
    points: [
      { x: 250, y: 72 },
      { x: 250, y: 348 },
    ],
    entry: { waypointId: 'west-north', orientation: 'forward' },
    exit: { waypointId: 'west-south', orientation: 'forward' },
    relation: { kind: 'single' },
  },
  {
    id: 'lane-east',
    label: '동측 작업 통로',
    mapId: FLEET_MAP_ID,
    coordinateSpace: 'svg-map',
    points: [
      { x: 490, y: 72 },
      { x: 490, y: 348 },
    ],
    entry: { waypointId: 'east-north', orientation: 'forward' },
    exit: { waypointId: 'east-south', orientation: 'forward' },
    relation: { kind: 'single' },
  },
  {
    id: 'lane-dock',
    label: '도킹 진입 통로',
    mapId: FLEET_MAP_ID,
    coordinateSpace: 'svg-map',
    points: [
      { x: 490, y: 306 },
      { x: 612, y: 306 },
    ],
    entry: { waypointId: 'dock-approach', orientation: 'forward' },
    exit: { waypointId: 'dock-bank-b', orientation: 'forward' },
    relation: { kind: 'single' },
  },
];

function FleetMap({
  robots,
  selectedRobotId,
  highlightedRobotId,
  onSelectRobot,
  onHighlightRobot,
}) {
  const svgRef = React.useRef(null);
  const [viewportScale, setViewportScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const view = svg.ownerDocument.defaultView;
    const updateScale = () => {
      const renderedWidth = svg.getBoundingClientRect().width;
      if (!renderedWidth) return;
      const nextScale = renderedWidth / FLEET_MAP_WIDTH;
      setViewportScale((current) => (
        Math.abs(current - nextScale) > 0.001 ? nextScale : current
      ));
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
      appearance="dark"
      label="서울 R&D 센터 1층 Fleet 지도"
      source="서울 R&D 센터 · 1층"
      controls={false}
      panEnabled={false}
      wheelZoom={false}
      keyboard={false}
      grid={false}
      status={`${robots.length}대 표시`}
      data-testid="fleet-map"
      style={{
        width: '100%',
        height: 'auto',
        minHeight: 0,
        alignSelf: 'start',
        // Share the card curvature so the light list and the dark canvas read
        // as one surface family rather than two pasted-together panels.
        borderRadius: 'var(--radius-xl)',
        aspectRatio: `${FLEET_MAP_WIDTH} / ${FLEET_MAP_HEIGHT}`,
      }}
    >
      <svg
        ref={svgRef}
        width={FLEET_MAP_WIDTH}
        height={FLEET_MAP_HEIGHT}
        viewBox={`0 0 ${FLEET_MAP_WIDTH} ${FLEET_MAP_HEIGHT}`}
        role="group"
        aria-label="Fleet 로봇 위치"
        style={{ display: 'block', width: '100cqw', height: 'auto' }}
      >
        <OccupancyMapLayer
          map={FLEET_OCCUPANCY_MAP}
          rowOrder="top-to-bottom"
          decorative={false}
          label="서울 R&D 센터 1층 점유 지도"
        />
        <NavigationAnnotationLayer
          detailMode="detail"
          labelVisibility="priority"
          detailVisibility="selected"
        >
          {FLEET_REGIONS.map((region) => (
            <SpatialRegion
              key={region.id}
              region={region}
              viewportScale={viewportScale}
              showLabel
              aria-hidden="true"
            />
          ))}
          {FLEET_LANES.map((lane) => (
            <LaneOverlay
              key={lane.id}
              lane={lane}
              viewportScale={viewportScale}
              showLabel={false}
              showEndpoints={false}
              aria-hidden="true"
            />
          ))}
          {robots.map((robot) => (
            <RobotPoseMarker
              key={robot.id}
              pose={robot.pose}
              viewportScale={viewportScale}
              selected={selectedRobotId === robot.id}
              highlighted={highlightedRobotId === robot.id}
              stale={robot.state.freshness === 'stale'}
              onActivate={(robotId) => onSelectRobot(robotId)}
              onPointerEnter={() => onHighlightRobot(robot.id)}
              onPointerLeave={() => onHighlightRobot(null)}
            />
          ))}
        </NavigationAnnotationLayer>
      </svg>
    </Map2DCanvas>
  );
}

function FleetOverviewFixture() {
  const [filters, setFilters] = React.useState([]);
  const [selectedRobotId, setSelectedRobotId] = React.useState(FLEET_ROBOTS[0].id);
  const [highlightedRobotId, setHighlightedRobotId] = React.useState(null);
  const filteredRobots = FLEET_ROBOTS.filter((robot) => matchesFleetFilters(robot, filters));

  const changeFilters = (nextFilters) => {
    setFilters(nextFilters);
    setSelectedRobotId((current) => (
      FLEET_ROBOTS.some((robot) => robot.id === current && matchesFleetFilters(robot, nextFilters))
        ? current
        : FLEET_ROBOTS.find((robot) => matchesFleetFilters(robot, nextFilters))?.id ?? null
    ));
    setHighlightedRobotId(null);
  };

  return (
    <main
      data-testid="fleet-overview"
      style={{
        display: 'grid',
        gap: 'var(--space-4)',
        width: '100%',
        maxWidth: 1280,
        minWidth: 0,
      }}
    >
      <FleetHealthSummary
        counts={FLEET_COUNTS}
        activeFilters={filters}
        onFiltersChange={changeFilters}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(480px, 100%), 1fr))',
          gap: 'var(--space-4)',
          alignItems: 'stretch',
          minWidth: 0,
        }}
      >
        <section
          aria-label="Fleet 로봇 목록"
          style={{
            minWidth: 0,
            // Cap the list near the map's own height so the right column has no
            // dead space, and so a stacked narrow viewport still shows the map.
            maxHeight: 'min(440px, 50vh)',
            overflow: 'auto',
            padding: 'var(--space-2)',
          }}
        >
          <div role="list" style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {filteredRobots.map((robot) => (
              <div role="listitem" key={robot.id}>
                <FleetRobotRow
                  robot={robot}
                  selected={selectedRobotId === robot.id}
                  highlighted={highlightedRobotId === robot.id}
                  updatedAtLabel={robot.state.freshness === 'current' ? '8초 전' : robot.state.freshness === 'delayed' ? '42초 전' : '4분 전'}
                  detail={incidentDetail(robot.incidents)}
                  onActivate={setSelectedRobotId}
                  onHighlightChange={setHighlightedRobotId}
                />
              </div>
            ))}
          </div>
        </section>
        <div
          style={{
            display: 'grid',
            gap: 'var(--space-2)',
            alignContent: 'start',
            minWidth: 0,
          }}
        >
          <FleetMap
            robots={filteredRobots}
            selectedRobotId={selectedRobotId}
            highlightedRobotId={highlightedRobotId}
            onSelectRobot={setSelectedRobotId}
            onHighlightRobot={setHighlightedRobotId}
          />
          <Legend size="sm" aria-label="지도 표기" items={FLEET_MAP_LEGEND} />
        </div>
      </div>
    </main>
  );
}

function HundredRobotDensityFixture() {
  const [filters, setFilters] = React.useState([]);
  const filteredRobots = DENSE_FLEET_ROBOTS.filter((robot) => matchesFleetFilters(robot, filters));

  return (
    <main
      data-testid="fleet-density"
      style={{ width: 'min(760px, 100%)', display: 'grid', gap: 'var(--space-4)' }}
    >
      <FleetHealthSummary
        counts={{ total: 100, connected: 51, attention: 13, unavailable: 16, stale: 16, critical: 4 }}
        activeFilters={filters}
        onFiltersChange={setFilters}
      />
      <section
        aria-label="100대 Fleet 목록"
        style={{
          maxHeight: 640,
          overflow: 'auto',
          padding: 'var(--space-2)',
        }}
      >
        <div role="list" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {filteredRobots.map((robot) => (
            <div role="listitem" key={robot.id}>
              <FleetRobotRow
                robot={robot}
                updatedAtLabel={robot.state.freshness === 'current' ? '12초 전' : '2분 전'}
                detail={incidentDetail(robot.incidents)}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Fleet/Overview',
  tags: ['autodocs'],
  component: FleetHealthSummary,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-fleet-overview--overview',
      eyebrow: 'Robotics / Fleet Overview',
      title: 'Fleet 전체에서 조치가 필요한 로봇을 찾고 지도에서 같은 대상을 확인합니다',
      description:
        'Fleet 상태 요약은 제품이 계산한 범위를 필터로 전환하고, 로봇 목록과 지도는 하나의 선택·강조 상태를 공유합니다. 연결·신선도·가용성·임무·안전 상태는 하나의 health 값으로 합치지 않습니다.',
    },
    docs: {
      description: {
        component:
          'FleetHealthSummary와 FleetRobotRow를 Map2DCanvas, OccupancyMapLayer, SpatialRegion, LaneOverlay, RobotPoseMarker와 조합한 Fleet 관제 기준 패턴입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '이기종 로봇 10대를 상태 요약·밀도 높은 목록·지도에서 함께 확인합니다. 요약 필터를 적용해도 선택 대상이 화면 밖의 숨은 명령 대상으로 남지 않으며, 목록과 지도 선택이 양방향으로 동기화됩니다.',
  ),
  render: () => <FleetOverviewFixture />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="fleet-overview"]');
    if (!root) throw new Error('Fleet overview fixture did not render.');
    const summaryButtons = [...root.querySelectorAll('[data-fleet-summary-key]')];
    if (
      summaryButtons.length !== 6
      || summaryButtons[0].getAttribute('aria-pressed') !== 'true'
      || summaryButtons.slice(1).some((button) => button.getAttribute('aria-pressed') !== 'false')
    ) {
      throw new Error('Fleet summary must expose Total as the selected default scope.');
    }

    const initialRows = [...root.querySelectorAll('[data-fleet-robot-row]')];
    const initialMarkers = [...root.querySelectorAll('[data-robot-pose-marker]')];
    if (initialRows.length !== 10 || initialMarkers.length !== 10) {
      throw new Error('The unfiltered fixture must keep list and map on the same ten-robot scope.');
    }
    const fleetMap = root.querySelector('[data-testid="fleet-map"]');
    if (
      fleetMap?.querySelectorAll('[data-occupancy-map-layer]').length !== 1
      || fleetMap.querySelectorAll('[data-lds-spatial-region]').length !== 4
      || fleetMap.querySelectorAll('[data-lk-lane-overlay]').length !== 4
    ) {
      throw new Error('Fleet map must compose the LDS occupancy, region, and lane primitives.');
    }
    if (initialRows.some((row) => (
      !row.hasAttribute('data-robot-status-card')
      || !row.hasAttribute('data-robot-status-cell')
      || !row.querySelector('.lk-status-badge')
    ))) {
      throw new Error('FleetRobotRow must compose the compact RobotStatusCard with a Core StatusBadge.');
    }
    if (initialRows[0].getAttribute('aria-pressed') !== 'true' || initialMarkers[0].getAttribute('aria-pressed') !== 'true') {
      throw new Error('List and map must expose the same initial selection.');
    }

    await userEvent.click(root.querySelector('[data-fleet-summary-key="critical"]'));
    await waitFor(() => {
      const rows = [...root.querySelectorAll('[data-fleet-robot-row]')];
      const markers = [...root.querySelectorAll('[data-robot-pose-marker]')];
      if (rows.length !== 2 || markers.length !== 2) {
        throw new Error('Critical filter must update list and map together.');
      }
      if (!rows.some((row) => row.getAttribute('aria-pressed') === 'true')) {
        throw new Error('Filtering must move selection to a visible eligible robot.');
      }
    });

    const unavailableFilter = root.querySelector('[data-fleet-summary-key="unavailable"]');
    await userEvent.click(unavailableFilter);
    await waitFor(() => {
      const rows = [...root.querySelectorAll('[data-fleet-robot-row]')];
      const markers = [...root.querySelectorAll('[data-robot-pose-marker]')];
      const criticalFilter = root.querySelector('[data-fleet-summary-key="critical"]');
      if (rows.length !== 3 || markers.length !== 3) {
        throw new Error('Overlapping Fleet filters must use a deduplicated OR union.');
      }
      if (
        unavailableFilter.getAttribute('aria-pressed') !== 'true'
        || criticalFilter?.getAttribute('aria-pressed') !== 'true'
      ) {
        throw new Error('Fleet summary must preserve multiple selected filters.');
      }
    });
    await userEvent.click(unavailableFilter);
    await waitFor(() => {
      if (root.querySelectorAll('[data-fleet-robot-row]').length !== 2) {
        throw new Error('Removing one Fleet filter must preserve the remaining filter.');
      }
    });

    const criticalRows = [...root.querySelectorAll('[data-fleet-robot-row]')];
    await userEvent.click(criticalRows[1]);
    await waitFor(() => {
      const selectedId = criticalRows[1].dataset.robotId;
      const marker = root.querySelector(`[data-robot-pose-marker][data-robot-id="${selectedId}"]`);
      if (criticalRows[1].getAttribute('aria-pressed') !== 'true' || marker?.getAttribute('aria-pressed') !== 'true') {
        throw new Error('Selecting a fleet row must select the same map marker.');
      }
    });

    await userEvent.hover(criticalRows[0]);
    await waitFor(() => {
      const marker = root.querySelector(`[data-robot-pose-marker][data-robot-id="${criticalRows[0].dataset.robotId}"]`);
      if (
        marker?.dataset.highlighted !== 'true'
        || !marker.querySelector(`[data-robot-pose-highlighted-scale="${NAV_SELECTION.robotPoseHighlightScale}"]`)
        || marker.dataset.focused === 'true'
        || marker.querySelector('[data-robot-pose-focus-indicator]')
      ) {
        throw new Error('Row preview must highlight the corresponding map marker.');
      }
      // The pointer is on the list, far from the map, so the 1.12x growth has
      // no cursor to anchor it and no sibling to be compared against: the ring
      // is what says WHICH marker the row points at. It must also be the only
      // one on the map, or "which" stops being answered.
      const ring = marker.querySelector('[data-robot-pose-preview-ring]');
      if (!ring) throw new Error('Row preview must draw the absolute preview ring, not scale alone.');
      if (root.querySelectorAll('[data-robot-pose-preview-ring]').length !== 1) {
        throw new Error('Exactly one marker may carry the preview ring at a time.');
      }
      // Outside the scale group: a ring that grew with the body would blur the
      // relative and absolute cues into one vague swell.
      if (ring.closest('[data-navigation-selection-scale]')) {
        throw new Error('The preview ring must sit outside the selection-scale group.');
      }
    });
    await userEvent.unhover(criticalRows[0]);
    await waitFor(() => {
      if (root.querySelector('[data-robot-pose-preview-ring]')) {
        throw new Error('The preview ring must close with the pointer — it is transient, not a state.');
      }
    });

    const firstMarker = root.querySelector('[data-robot-pose-marker]');
    await userEvent.click(firstMarker);
    await waitFor(() => {
      const row = root.querySelector(`[data-fleet-robot-row][data-robot-id="${firstMarker.dataset.robotId}"]`);
      if (row?.getAttribute('aria-pressed') !== 'true') {
        throw new Error('Selecting a map marker must select the corresponding fleet row.');
      }
    });

    await userEvent.click(root.querySelector('[data-fleet-summary-key="total"]'));
    await waitFor(() => {
      if (root.querySelectorAll('[data-fleet-robot-row]').length !== 10) {
        throw new Error('Total must restore the complete fleet scope.');
      }
    });
  },
};

export const HundredRobotDensity = {
  name: '100대 밀도',
  parameters: storyDescription(
    '100대 규모에서 FleetRobotRow의 정보 밀도, 긴 이름, 이기종 상태, 스크롤 컨테이너 적합성을 확인합니다. 실제 제품은 같은 행을 가상화할 수 있으며, 컴포넌트는 전체 목록 상태를 소유하지 않습니다.',
  ),
  render: () => <HundredRobotDensityFixture />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="fleet-density"]');
    if (!root) throw new Error('Fleet density fixture did not render.');
    const rows = [...canvasElement.querySelectorAll('[data-fleet-robot-row]')];
    if (rows.length !== 100) throw new Error('Density fixture must render exactly 100 fleet rows.');
    if (rows.some((row) => row.scrollWidth > row.clientWidth + 1)) {
      throw new Error('Fleet rows must not introduce horizontal overflow at the target width.');
    }

    const criticalFilter = root.querySelector('[data-fleet-summary-key="critical"]');
    await userEvent.click(criticalFilter);
    await waitFor(() => {
      if (root.querySelectorAll('[data-fleet-robot-row]').length !== 4) {
        throw new Error('The density fixture must apply the same Fleet filters as Overview.');
      }
    });

    const attentionFilter = root.querySelector('[data-fleet-summary-key="attention"]');
    await userEvent.click(attentionFilter);
    await waitFor(() => {
      if (root.querySelectorAll('[data-fleet-robot-row]').length !== 13) {
        throw new Error('Overlapping density filters must return a deduplicated OR union.');
      }
      if (
        criticalFilter.getAttribute('aria-pressed') !== 'true'
        || attentionFilter.getAttribute('aria-pressed') !== 'true'
      ) {
        throw new Error('The density fixture must preserve multiple selected filters.');
      }
    });

    await userEvent.click(root.querySelector('[data-fleet-summary-key="total"]'));
    await waitFor(() => {
      if (root.querySelectorAll('[data-fleet-robot-row]').length !== 100) {
        throw new Error('Total must clear all density filters and restore 100 rows.');
      }
    });
  },
};
