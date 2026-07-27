import React from 'react';
import { waitFor } from 'storybook/test';
import { TrajectoryOverlay } from '../src/index.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import {
  ACTIVE_TRAJECTORY,
  L2_TRAJECTORY,
  StoryPage,
  PathMap,
  assertTrajectoryTemporalEncoding,
  assertNavigationStateGlyphGeometry,
} from './RoboticsNavigationRouteTrajectory.shared.jsx';

const meta = {
  title: 'LDS Robotics/Navigation/Trajectory',
  tags: ['autodocs'],
  component: TrajectoryOverlay,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-trajectory--overview',
      eyebrow: 'Robotics / Navigation / Trajectory',
      title: '조밀한 궤적은 한 지도에서 시간 순서로 이어진 sample의 계층입니다',
      description:
        '실제 이동에서 수집한 조밀한 위치 sample과 현재 sample까지의 진행을 표시할 때 사용합니다. 계획된 graph 경로의 진행률이나 로봇 pose·heading에는 Route 또는 RobotPoseMarker를 사용하세요.',
      docsDescription:
        'Trajectory는 자유 공간을 지나는 로봇의 조밀한 sample을 시간 순서로 보여주며, 얇은 시간선·sample 점·원형 current-sample cursor로 Route와 구분합니다. 실제 이동에서 수집한 위치 표본과 그 수명주기를 표시할 때 사용합니다. 계획된 graph 경로의 진행률이나 로봇 pose·heading을 대신 표시하는 용도에는 사용하지 마세요.',
    },
    docs: {
      description: {
        component:
          '한 지도에 속한 조밀한 시간 순 sample, 원형 current-sample cursor, lifecycle 상태를 표현하는 TrajectoryOverlay입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '같은 로봇 이동을 light/dark 지도에서 dense trajectory로 표현합니다. 현재 sample 이전 선은 강하고 이후 선은 약하며, open head가 경로 tangent에 결합되는지 확인하세요.',
  ),
  render: () => (
    <StoryPage
      title="Trajectory는 한 지도의 시간 순 sample을 보여줍니다"
      description="궤적은 얇은 시간선 위의 sample 점과 원형 current-sample cursor로 표시합니다. Route의 방향 화살표나 robot heading·pose를 대신하지 않습니다."
    >
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 'var(--space-4)', minWidth: 0 }}>
        <PathMap label="Light trajectory 지도" eyebrow="TRAJECTORY · L1">
          {(cssViewBoxScale) => <TrajectoryOverlay trajectory={ACTIVE_TRAJECTORY} viewportScale={cssViewBoxScale} />}
        </PathMap>
        <PathMap appearance="dark" label="Dark trajectory 지도" eyebrow="TRAJECTORY · L1">
          {(cssViewBoxScale) => <TrajectoryOverlay trajectory={ACTIVE_TRAJECTORY} viewportScale={cssViewBoxScale} />}
        </PathMap>
      </section>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    const trajectories = canvasElement.querySelectorAll('[data-lk-trajectory-overlay]');
    if (trajectories.length !== 2) {
      throw new Error(`Light/dark trajectory parity failed: ${trajectories.length} trajectories.`);
    }
    trajectories.forEach((trajectory) => {
      const path = trajectory.querySelector('[data-trajectory-path]');
      if (!path?.getAttribute('d')?.includes('L 468 164')) throw new Error('Dense trajectory geometry is incomplete.');
      assertTrajectoryTemporalEncoding(trajectory, 'Overview Trajectory');
      assertNavigationStateGlyphGeometry(trajectory, 'Overview Trajectory');
    });
  },
};

const TRAJECTORY_STATUS_LABEL = {
  planned: '계획됨',
  waiting: '대기 중',
  blocked: '차단됨',
  rerouting: '경로 재계산 중',
  completed: '완료됨',
};

function trajectoryForStatus(status) {
  return {
    ...ACTIVE_TRAJECTORY,
    id: `trajectory-${status}`,
    label: `${TRAJECTORY_STATUS_LABEL[status]} 궤적`,
    status,
  };
}

// planned reuses the shared L2 planned trajectory verbatim; the remaining
// statuses clone the dense L1 trajectory so only the status (line pattern +
// state glyph) changes across the matrix.
const TRAJECTORY_STATUS_ROWS = [
  { status: 'planned', trajectory: L2_TRAJECTORY },
  // Head at index 1 (not 0): the tail sample sits closest to the stage scale
  // bar, and the head-anchored label would overlap that chrome corner.
  { status: 'waiting', trajectory: { ...trajectoryForStatus('waiting'), currentSampleIndex: 1 } },
  { status: 'blocked', trajectory: trajectoryForStatus('blocked') },
  { status: 'rerouting', trajectory: trajectoryForStatus('rerouting') },
  { status: 'completed', trajectory: { ...trajectoryForStatus('completed'), currentSampleIndex: ACTIVE_TRAJECTORY.samples.length - 1 } },
];

const INVALID_STALE_TRAJECTORY = {
  ...ACTIVE_TRAJECTORY,
  id: 'trajectory-invalid-stale',
  label: '오류·오래됨 궤적',
  status: 'active',
};

export const Statuses = {
  name: '변형·상태 · 궤적 수명주기와 데이터 상태',
  parameters: storyDescription(
    'trajectory status별 dense layer를 나란히 비교합니다. 수명주기 상태는 선 위에서 톤과 NAV_PATH_DASH 대시 패턴으로 전달하며(뱃지가 아니라), invalid·stale 데이터 품질만 점 뱃지로 독립적으로 겹쳐 표시됩니다.',
  ),
  render: () => (
    <StoryPage
      title="Trajectory status는 색이 아니라 선의 dash pattern으로 구분됩니다"
      description="한 지도의 조밀한 궤적도 계획됨·대기·차단·재계산·완료의 수명주기 상태를 선의 톤과 대시로 전달하며, 데이터 오류(invalid)와 오래됨(stale)만 점 뱃지로 상태와 무관하게 독립 표시됩니다."
      maxWidth={1120}
    >
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 'var(--space-4)', minWidth: 0 }}>
        {TRAJECTORY_STATUS_ROWS.map(({ status, trajectory }) => (
          <PathMap key={status} label={`${status} trajectory 지도`} eyebrow="TRAJECTORY">
            {(cssViewBoxScale) => <TrajectoryOverlay trajectory={trajectory} viewportScale={cssViewBoxScale} />}
          </PathMap>
        ))}
        <PathMap appearance="dark" label="invalid·stale trajectory 지도" eyebrow="TRAJECTORY">
          {(cssViewBoxScale) => (
            <TrajectoryOverlay trajectory={INVALID_STALE_TRAJECTORY} viewportScale={cssViewBoxScale} invalid stale />
          )}
        </PathMap>
      </section>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    // Lifecycle status lives on the LINE: tone + a specific NAV_PATH_DASH
    // pattern, no on-line status glyph badge. Assert the exact dash per status.
    const STATUS_DASH = { planned: '2 6', waiting: '10 3 2 3', blocked: '1 5', rerouting: '3 3', completed: '7 4' };
    for (const [status, dash] of Object.entries(STATUS_DASH)) {
      const trajectory = canvasElement.querySelector(`[data-trajectory-status="${status}"]`);
      if (!trajectory) throw new Error(`${status} trajectory did not render.`);
      if (trajectory.querySelector('[data-trajectory-status-marker]')) {
        throw new Error(`${status} trajectory must not paint a lifecycle status badge — the line carries it.`);
      }
      if (trajectory.querySelector('[data-trajectory-path]')?.getAttribute('stroke-dasharray') !== dash) {
        throw new Error(`${status} trajectory must encode its state with the ${dash} dash pattern.`);
      }
      if (status !== 'planned') {
        assertTrajectoryTemporalEncoding(trajectory, `${status} Trajectory`);
      }
    }
    const compound = canvasElement.querySelector('[data-trajectory-id="trajectory-invalid-stale"]');
    if (!compound?.querySelector('[data-trajectory-overlay-state="invalid"]') || !compound.querySelector('[data-trajectory-overlay-state="stale"]')) {
      throw new Error('Trajectory invalid + stale needs independent ! and ~ visual evidence.');
    }
    if (compound.style.opacity !== '0.76') {
      throw new Error(`Stale Trajectory opacity must match the shared 0.76 contract: ${compound.style.opacity}.`);
    }
    assertNavigationStateGlyphGeometry(canvasElement, 'Trajectory statuses');
    assertTrajectoryTemporalEncoding(compound, 'Invalid + stale Trajectory');
    // The only glyph badges left are the data-quality flags.
    const renderedKinds = new Set(Array.from(canvasElement.querySelectorAll('[data-navigation-state-glyph]'))
      .map((glyph) => glyph.getAttribute('data-navigation-state-glyph')));
    for (const kind of ['invalid', 'stale']) {
      if (!renderedKinds.has(kind)) throw new Error(`Trajectory state glyph mapping is missing ${kind}.`);
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 폭에서 trajectory viewport가 페이지를 밀어내지 않고, 시각 label을 감춰도 접근성 이름이 현재 sample 정보를 유지하는지 확인합니다.',
  ),
  render: () => (
    <div data-testid="trajectory-narrow" style={{ width: 320, maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      <StoryPage
        title="좁은 화면에서도 궤적 계층은 겹치지 않고 상세 정보는 이름으로 이어집니다"
        description="지도 안에 card를 겹쳐 넣지 않습니다. trajectory의 선·glyph를 보존하고 접근성 이름이 현재 sample과 상태를 제공합니다."
      >
        <PathMap label="320px trajectory 지도" height={230} eyebrow="TRAJECTORY · L1">
          {(cssViewBoxScale) => (
            <TrajectoryOverlay
              trajectory={ACTIVE_TRAJECTORY}
              showLabel={false}
              viewportScale={cssViewBoxScale}
              tabIndex={-1}
              onActivate={() => {}}
            />
          )}
        </PathMap>
      </StoryPage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const narrow = canvasElement.querySelector('[data-testid="trajectory-narrow"]');
    if (!narrow || narrow.scrollWidth > narrow.clientWidth) {
      throw new Error(`Trajectory narrow story overflowed: ${narrow?.scrollWidth}/${narrow?.clientWidth}`);
    }
    const trajectory = narrow.querySelector('[data-lk-trajectory-overlay]');
    if (!trajectory?.getAttribute('aria-label')?.includes('현재 sample 6')) {
      throw new Error('Hiding visual labels removed current trajectory sample from the accessible name.');
    }
    await waitFor(() => {
      const svg = narrow.querySelector('svg[data-css-viewbox-scale]');
      const cssScale = Number(svg?.getAttribute('data-css-viewbox-scale'));
      const trajectoryScale = Number(trajectory?.getAttribute('data-viewport-scale'));
      if (!svg || !Number.isFinite(cssScale) || cssScale >= 0.95 || Math.abs(cssScale - trajectoryScale) > 0.01) {
        throw new Error(`Narrow SVG scale was not passed to TrajectoryOverlay: css=${cssScale}, trajectory=${trajectoryScale}.`);
      }
      const core = narrow.querySelector('[data-trajectory-hit-target-core]');
      const rect = core?.getBoundingClientRect();
      if (!rect || Math.min(rect.width, rect.height) / Math.SQRT2 < 23.9) {
        throw new Error(`Trajectory hit core does not contain a 24×24 CSS px square: ${rect?.width}×${rect?.height}.`);
      }
      assertNavigationStateGlyphGeometry(trajectory, '320px Trajectory');
      assertTrajectoryTemporalEncoding(trajectory, '320px Trajectory');
    });
  },
};

export const TrajectoryVisualParity = {
  ...Statuses,
  name: 'Trajectory visual parity',
  tags: ['!dev', 'visual-parity'],
};
