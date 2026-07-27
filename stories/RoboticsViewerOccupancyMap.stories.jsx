import React from 'react';
import { Map2DCanvas } from '@lk-robotics/lds-product';
import {
  NavigationAnnotationLayer,
  NavigationCoordinateBoundary,
  OccupancyMapLayer,
  RobotPoseMarker,
  TrajectoryOverlay,
  adaptRosOccupancyGrid,
  adaptRosPathToTrajectory,
  adaptRosPoseWithCovarianceStamped,
} from '../src/index.js';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Viewer/2D Map/Occupancy Layer',
  tags: ['autodocs'],
  component: OccupancyMapLayer,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-viewer-2d-map-occupancy-layer--overview',
      eyebrow: 'Robotics / Occupancy Map',
      title: '점유 지도는 자유·점유·미확인 공간을 데이터 상태로 구분합니다',
      description:
        '벽 윤곽으로 내부를 추론하지 않고 소스의 occupancy 값을 그대로 표시합니다. 경로·로봇·구역보다 아래에 놓이는 구조 지도이며 강조색은 사용하지 않습니다.',
    },
    docs: {
      description: {
        component:
          '행 우선 occupancy 데이터를 free·occupied·unknown 중립 토큰으로 그리는 SVG 기반 지도 레이어입니다.',
      },
    },
  },
};

export default meta;

function createFixtureMap() {
  const width = 20;
  const height = 12;
  const data = new Int8Array(width * height).fill(-1);
  const setCell = (column, row, value) => {
    data[row * width + column] = value;
  };

  for (let row = 2; row <= 9; row += 1) {
    for (let column = 2; column <= 17; column += 1) {
      setCell(column, row, 0);
    }
  }
  for (let column = 2; column <= 17; column += 1) {
    setCell(column, 2, 100);
    setCell(column, 9, 100);
  }
  for (let row = 2; row <= 9; row += 1) {
    setCell(2, row, 100);
    setCell(17, row, 100);
  }
  for (let row = 2; row <= 7; row += 1) {
    if (row < 5 || row > 6) setCell(9, row, 100);
  }
  for (let column = 9; column <= 17; column += 1) {
    if (column < 13 || column > 14) setCell(column, 7, 100);
  }

  return {
    width,
    height,
    resolution: 16,
    origin: { x: 40, y: 24 },
    data,
  };
}

const FIXTURE_MAP = createFixtureMap();

const ROS_GRID_WIDTH = 16;
const ROS_GRID_HEIGHT = 10;
const ROS_GRID_DATA = new Int8Array(ROS_GRID_WIDTH * ROS_GRID_HEIGHT).fill(0);
for (let column = 0; column < ROS_GRID_WIDTH; column += 1) {
  ROS_GRID_DATA[column] = 100;
  ROS_GRID_DATA[(ROS_GRID_HEIGHT - 1) * ROS_GRID_WIDTH + column] = 100;
}
for (let row = 0; row < ROS_GRID_HEIGHT; row += 1) {
  ROS_GRID_DATA[row * ROS_GRID_WIDTH] = 100;
  ROS_GRID_DATA[row * ROS_GRID_WIDTH + ROS_GRID_WIDTH - 1] = 100;
}
const ROS_MAP_YAW = Math.PI / 12;
const ROS_OCCUPANCY = {
  header: {
    frame_id: 'warehouse_L1/map',
    stamp: { sec: 1_720_000_010, nanosec: 0 },
  },
  info: {
    map_load_time: { sec: 1_720_000_000, nanosec: 0 },
    width: ROS_GRID_WIDTH,
    height: ROS_GRID_HEIGHT,
    resolution: 0.5,
    origin: {
      position: { x: -2, y: 3, z: 0 },
      orientation: {
        x: 0,
        y: 0,
        z: Math.sin(ROS_MAP_YAW / 2),
        w: Math.cos(ROS_MAP_YAW / 2),
      },
    },
  },
  data: ROS_GRID_DATA,
};
const ROS_ADAPTED_MAP = adaptRosOccupancyGrid(ROS_OCCUPANCY, {
  mapId: 'warehouse-L1',
  mapVersion: 'fixture-map-v1',
  svgUnitsPerMeter: 30,
  svgOrigin: { x: 42, y: 32 },
});
const cellWorld = (column, row) => ROS_ADAPTED_MAP.transform.gridCellToWorld({ column, row });
const yawQuaternion = (yawRad) => ({
  x: 0,
  y: 0,
  z: Math.sin(yawRad / 2),
  w: Math.cos(yawRad / 2),
});
const pathPose = (column, row, sec, yawRad = 0) => ({
  header: {
    frame_id: 'warehouse_L1/map',
    stamp: { sec, nanosec: 0 },
  },
  pose: {
    position: { ...cellWorld(column, row), z: 0 },
    orientation: yawQuaternion(yawRad),
  },
});
const ROS_TRAJECTORY = adaptRosPathToTrajectory({
  header: ROS_OCCUPANCY.header,
  poses: [
    pathPose(2, 2, 1_720_000_010, ROS_MAP_YAW),
    pathPose(5, 3, 1_720_000_011, ROS_MAP_YAW + 0.15),
    pathPose(9, 5, 1_720_000_012, ROS_MAP_YAW + 0.25),
    pathPose(13, 7, 1_720_000_013, ROS_MAP_YAW),
  ],
}, {
  transform: ROS_ADAPTED_MAP.transform,
  id: 'ros-path-robot-7',
  label: 'Robot 7 ROS Path',
  status: 'active',
  currentSampleIndex: 2,
});
const ROS_POSE_COVARIANCE = new Array(36).fill(0);
ROS_POSE_COVARIANCE[0] = 0.04;
ROS_POSE_COVARIANCE[1] = 0.012;
ROS_POSE_COVARIANCE[6] = 0.012;
ROS_POSE_COVARIANCE[7] = 0.01;
ROS_POSE_COVARIANCE[35] = 0.03;
const ROS_POSE = adaptRosPoseWithCovarianceStamped({
  header: {
    frame_id: 'warehouse_L1/map',
    stamp: { sec: 1_720_000_012, nanosec: 0 },
  },
  pose: {
    pose: pathPose(9, 5, 1_720_000_012, ROS_MAP_YAW + 0.25).pose,
    covariance: ROS_POSE_COVARIANCE,
  },
}, {
  transform: ROS_ADAPTED_MAP.transform,
  id: 'robot-7',
  label: 'Robot 7',
  state: 'moving',
});
const WRONG_VERSION_TRAJECTORY = {
  ...ROS_TRAJECTORY,
  id: 'wrong-map-version',
  source: {
    ...ROS_TRAJECTORY.source,
    mapVersion: 'fixture-map-v0',
  },
};

function Preview({ appearance }) {
  const label = `${appearance === 'dark' ? '어두운' : '밝은'} 점유 지도`;
  return (
    <Map2DCanvas
      appearance={appearance}
      label={label}
      controls={false}
      panEnabled={false}
      wheelZoom={false}
      keyboard={false}
      grid={false}
      style={{ width: '100%', height: 240 }}
    >
      <svg
        width="400"
        height="240"
        viewBox="0 0 400 240"
        role="group"
        aria-label={label}
        style={{ display: 'block', width: 400, height: 240 }}
      >
        <OccupancyMapLayer
          map={FIXTURE_MAP}
          rowOrder="top-to-bottom"
          decorative={false}
          label="창고 1층 점유 지도"
        />
      </svg>
    </Map2DCanvas>
  );
}

export const Overview = {
  name: '개요 · 자유·점유·미확인',
  parameters: storyDescription(
    '동일한 occupancy 데이터가 light·dark에서 free·occupied·unknown의 의미 위계를 유지하는지 비교합니다. 건물 바깥은 unknown이며, 내부 partition의 문은 데이터에 명시된 free 셀입니다.',
  ),
  render: () => (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
        gap: 'var(--space-4)',
        width: '100%',
        maxWidth: 880,
      }}
    >
      <Preview appearance="light" />
      <Preview appearance="dark" />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const frames = [...canvasElement.querySelectorAll('[data-lds-viewer-frame]')];
    if (frames.map((frame) => frame.dataset.viewerAppearance).join(',') !== 'light,dark') {
      throw new Error('Occupancy overview must render equivalent light and dark viewers.');
    }

    frames.forEach((frame) => {
      const layer = frame.querySelector('[data-occupancy-map-layer]');
      if (!layer || layer.getAttribute('role') !== 'img' || !layer.querySelector('title')) {
        throw new Error('Non-decorative occupancy data must expose an accessible image name.');
      }
      const resolvedFills = ['free', 'occupied', 'unknown'].map((state) => {
        const run = layer.querySelector(`[data-occupancy-state="${state}"]`);
        return run ? getComputedStyle(run).fill : '';
      });
      if (resolvedFills.some((fill) => !fill) || new Set(resolvedFills).size !== 3) {
        throw new Error(`Occupancy states must resolve to three distinct fills: ${resolvedFills.join(', ')}`);
      }
      if (!layer.querySelector('[data-occupancy-boundary]')) {
        throw new Error('The default occupancy extent boundary is missing.');
      }
    });
  },
};

export const RosCoordinateProjection = {
  name: '사용법 · ROS 좌표 투영',
  parameters: storyDescription(
    'ROS OccupancyGrid, Path, PoseWithCovarianceStamped를 동일한 frame·map version·timestamp 계약으로 검증한 뒤 SVG map space로 투영합니다. 회전된 map origin, Y축 반전, 경로 heading, 위치 covariance가 한 좌표계에서 정렬되는지 확인합니다.',
  ),
  render: () => (
    <Map2DCanvas
      appearance="light"
      label="ROS 좌표 계약 지도"
      controls={false}
      panEnabled={false}
      wheelZoom={false}
      keyboard={false}
      grid={false}
      style={{ width: 340, height: 220 }}
    >
      <svg
        width="340"
        height="220"
        viewBox="0 0 340 220"
        role="group"
        aria-label="ROS 좌표 계약으로 투영한 지도"
        style={{ display: 'block', width: 340, height: 220 }}
      >
        <NavigationCoordinateBoundary frame={ROS_ADAPTED_MAP.metadata}>
          <NavigationAnnotationLayer detailMode="standard">
            <OccupancyMapLayer
              map={ROS_ADAPTED_MAP.layerMap}
              rowOrder={ROS_ADAPTED_MAP.rowOrder}
              decorative
            />
            <TrajectoryOverlay trajectory={ROS_TRAJECTORY} viewportScale={1} />
            <TrajectoryOverlay trajectory={WRONG_VERSION_TRAJECTORY} viewportScale={1} />
            <RobotPoseMarker pose={ROS_POSE} viewportScale={1} />
          </NavigationAnnotationLayer>
        </NavigationCoordinateBoundary>
      </svg>
    </Map2DCanvas>
  ),
  play: async ({ canvasElement }) => {
    const map = canvasElement.querySelector('[data-occupancy-map-layer]');
    const trajectory = canvasElement.querySelector('[data-lk-trajectory-overlay]');
    const pose = canvasElement.querySelector('[data-robot-pose-marker]');
    const covariance = pose?.querySelector('[data-robot-pose-covariance]');
    const coordinateBoundary = canvasElement.querySelector('[data-navigation-coordinate-boundary]');
    if (
      map?.getAttribute('data-source-frame-id') !== 'warehouse_L1/map'
      || trajectory?.getAttribute('data-source-frame-id') !== 'warehouse_L1/map'
      || pose?.getAttribute('data-source-frame-id') !== 'warehouse_L1/map'
    ) {
      throw new Error('ROS projection must preserve one source frame across map, path, and pose.');
    }
    if (
      map.getAttribute('data-source-map-version') !== 'fixture-map-v1'
      || trajectory.getAttribute('data-source-map-version') !== 'fixture-map-v1'
      || pose.getAttribute('data-source-map-version') !== 'fixture-map-v1'
    ) {
      throw new Error('ROS projection must preserve the immutable map version.');
    }
    if (
      coordinateBoundary?.getAttribute('data-source-map-version') !== 'fixture-map-v1'
      || canvasElement.querySelector('[data-trajectory-id="wrong-map-version"]')
    ) {
      throw new Error('Coordinate boundary must suppress a layer from another map version.');
    }
    if (!covariance || Number(covariance.getAttribute('rx')) <= Number(covariance.getAttribute('ry'))) {
      throw new Error('Pose covariance must render as a projected major/minor uncertainty ellipse.');
    }
    const roundTrip = ROS_ADAPTED_MAP.transform.svgToWorld(
      ROS_ADAPTED_MAP.transform.worldToSvg(cellWorld(7, 4)),
    );
    const expected = cellWorld(7, 4);
    if (Math.hypot(roundTrip.x - expected.x, roundTrip.y - expected.y) > 1e-8) {
      throw new Error('World/SVG coordinate round trip drifted.');
    }
  },
};
