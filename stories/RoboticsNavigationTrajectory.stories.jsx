import React from 'react';
import { waitFor } from 'storybook/test';
import { Button } from '@lk-robotics/lds-core';
import {
  NavigationAnnotationLayer,
  RobotPoseMarker,
  TrajectoryOverlay,
} from '../src/index.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import {
  ACTIVE_TRAJECTORY,
  StoryPage,
  PathMap,
  assertPathSystemVisualContract,
  assertTrajectoryTemporalEncoding,
  assertNavigationStateGlyphGeometry,
} from './RoboticsNavigationRouteTrajectory.shared.jsx';

const meta = {
  title: 'LDS Robotics/Navigation/Path System/Trajectory',
  tags: ['autodocs'],
  component: TrajectoryOverlay,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-path-system-trajectory--overview',
      eyebrow: 'Robotics / Navigation / Path System / Trajectory',
      title: '조밀한 궤적은 한 지도에서 시간 순서로 이어진 sample의 계층입니다',
      description:
        '실제 이동 또는 예측에서 생성한 조밀한 위치 sample의 형상과 상태를 표시할 때 사용합니다. 현재 위치·heading은 RobotPoseMarker를 사용하고 기록 재생 cursor는 전용 모드에서만 켭니다.',
      docsDescription:
        'Trajectory는 자유 공간을 지나는 로봇의 조밀한 sample을 시간 순서로 보여주며, 얇은 시간선과 sample 점으로 Route와 구분합니다. 재생 cursor는 기록 재생·디버그 모드에서만 사용하고 실제 위치·heading은 RobotPoseMarker가 소유합니다.',
    },
    docs: {
      description: {
        component:
          '한 지도에 속한 조밀한 시간 순 sample과 lifecycle 상태를 표현하며 기록 재생 cursor는 opt-in인 TrajectoryOverlay입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '대표 지도 하나에서 dense trajectory의 시간선과 sample을 설명합니다. 테마 반복은 회귀 검증으로 분리합니다.',
  ),
  render: () => (
    <StoryPage
      title="Trajectory는 한 지도의 시간 순 sample을 보여줍니다"
      description="궤적은 얇은 시간선 위의 sample 점으로 표시합니다. 실제 robot heading·pose는 대신하지 않으며 재생 cursor는 기록 재생·디버그에서만 켭니다."
      maxWidth={720}
    >
      <PathMap label="Trajectory 대표 지도" eyebrow="TRAJECTORY · L1">
        {(cssViewBoxScale) => <TrajectoryOverlay trajectory={ACTIVE_TRAJECTORY} viewportScale={cssViewBoxScale} />}
      </PathMap>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Trajectory overview');
    const trajectories = canvasElement.querySelectorAll('[data-lk-trajectory-overlay]');
    if (trajectories.length !== 1) {
      throw new Error(`Trajectory overview expected one representative trajectory: ${trajectories.length}.`);
    }
    trajectories.forEach((trajectory) => {
      const path = trajectory.querySelector('[data-trajectory-path]');
      const finalSample = ACTIVE_TRAJECTORY.samples.at(-1)?.position;
      if (!finalSample || !path?.getAttribute('d')?.includes(`L ${finalSample.x} ${finalSample.y}`)) {
        throw new Error('Dense trajectory geometry is incomplete.');
      }
      assertTrajectoryTemporalEncoding(trajectory, 'Overview Trajectory');
      assertNavigationStateGlyphGeometry(trajectory, 'Overview Trajectory');
    });
  },
};

const PLAYBACK_TRAJECTORY = {
  ...ACTIVE_TRAJECTORY,
  id: 'trajectory-recording-playback',
  label: '기록 재생 궤적',
  currentSampleIndex: 3,
};

const PLAYBACK_START_MS = PLAYBACK_TRAJECTORY.samples[0].timeMs;
const PLAYBACK_END_MS = PLAYBACK_TRAJECTORY.samples.at(-1).timeMs;

function replayPoseAt(timeMs) {
  const samples = PLAYBACK_TRAJECTORY.samples;
  const upperIndex = samples.findIndex((sample) => sample.timeMs >= timeMs);
  const upper = samples[upperIndex < 0 ? samples.length - 1 : upperIndex];
  const lower = samples[Math.max(0, (upperIndex < 0 ? samples.length - 1 : upperIndex) - 1)];
  const duration = upper.timeMs - lower.timeMs;
  const ratio = duration <= 0 ? 0 : Math.max(0, Math.min(1, (timeMs - lower.timeMs) / duration));
  const lowerHeading = Number.isFinite(lower.headingRad) ? lower.headingRad : 0;
  const upperHeading = Number.isFinite(upper.headingRad) ? upper.headingRad : lowerHeading;
  const headingDelta = Math.atan2(
    Math.sin(upperHeading - lowerHeading),
    Math.cos(upperHeading - lowerHeading),
  );
  return {
    id: 'robot-2-recording-replay',
    label: 'Robot 2',
    mapId: PLAYBACK_TRAJECTORY.mapId,
    source: PLAYBACK_TRAJECTORY.source,
    coordinateSpace: PLAYBACK_TRAJECTORY.coordinateSpace,
    position: {
      x: lower.position.x + (upper.position.x - lower.position.x) * ratio,
      y: lower.position.y + (upper.position.y - lower.position.y) * ratio,
    },
    headingRad: lowerHeading + headingDelta * ratio,
    state: 'moving',
  };
}

function RecordingPlaybackFixture() {
  const [playbackTimeMs, setPlaybackTimeMs] = React.useState(750);
  const [playing, setPlaying] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const playbackStartRef = React.useRef({ wallTime: 0, trajectoryTime: playbackTimeMs });
  const replayPose = React.useMemo(() => replayPoseAt(playbackTimeMs), [playbackTimeMs]);

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  React.useEffect(() => {
    if (!playing || reducedMotion) return undefined;
    let frame;
    const tick = (wallTime) => {
      const elapsed = wallTime - playbackStartRef.current.wallTime;
      const nextTime = Math.min(
        PLAYBACK_END_MS,
        playbackStartRef.current.trajectoryTime + elapsed,
      );
      setPlaybackTimeMs(nextTime);
      if (nextTime < PLAYBACK_END_MS) {
        frame = window.requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, reducedMotion]);

  const togglePlayback = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    const nextStart = playbackTimeMs >= PLAYBACK_END_MS ? PLAYBACK_START_MS : playbackTimeMs;
    setPlaybackTimeMs(nextStart);
    playbackStartRef.current = {
      wallTime: window.performance.now(),
      trajectoryTime: nextStart,
    };
    setPlaying(true);
  };

  const seek = (event) => {
    const nextTime = Number(event.currentTarget.value);
    setPlaying(false);
    setPlaybackTimeMs(nextTime);
    playbackStartRef.current = {
      wallTime: window.performance.now(),
      trajectoryTime: nextTime,
    };
  };

  return (
    <StoryPage
      title="기록 재생에서는 RobotPose가 저장된 위치와 heading을 따라갑니다"
      description="지도에서는 재생 전용 RobotPose가 기록된 pose를 표시하고, 현재 재생 시점은 아래 타임라인 손잡이가 담당합니다. 실시간 위치와 기록 재생 위치는 동시에 표시하지 않습니다."
      maxWidth={720}
    >
      <PathMap label="기록 재생 Trajectory 지도" eyebrow="TRAJECTORY · RECORDING REPLAY">
        {(cssViewBoxScale) => (
          <NavigationAnnotationLayer detailMode="overview">
            <TrajectoryOverlay
              trajectory={PLAYBACK_TRAJECTORY}
              viewportScale={cssViewBoxScale}
              playbackTimeMs={playbackTimeMs}
            />
            <RobotPoseMarker
              pose={replayPose}
              context="replay"
              viewportScale={cssViewBoxScale}
            />
          </NavigationAnnotationLayer>
        )}
      </PathMap>
      <section
        data-recording-playback-controls=""
        data-playback-state={playing ? 'playing' : 'paused'}
        data-reduced-motion={reducedMotion ? 'true' : 'false'}
        aria-label="기록 재생 제어"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          alignItems: 'center',
        }}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={togglePlayback}
          disabled={reducedMotion}
        >
          {playing ? '일시정지' : playbackTimeMs >= PLAYBACK_END_MS ? '처음부터 재생' : '재생'}
        </Button>
        <input
          type="range"
          aria-label="기록 재생 위치"
          min={PLAYBACK_START_MS}
          max={PLAYBACK_END_MS}
          step="10"
          value={Math.round(playbackTimeMs)}
          onChange={seek}
          style={{ flex: '1 1 220px', minWidth: 120, accentColor: 'var(--viewer-accent, var(--color-semantic-primary-normal))' }}
        />
        <output
          aria-live="off"
          style={{ minWidth: 92, color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--caption1-size)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
        >
          {(playbackTimeMs / 1000).toFixed(2)} / {(PLAYBACK_END_MS / 1000).toFixed(2)} s
        </output>
      </section>
      {reducedMotion && (
        <p style={{ margin: 0, color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--caption1-size)' }}>
          감속 모션 설정에서는 자동 재생하지 않습니다. 타임라인을 직접 조절하세요.
        </p>
      )}
      <aside
        aria-label="기록 재생 cursor 의미"
        style={{
          display: 'grid',
          gap: 'var(--space-2)',
          padding: 'var(--space-4)',
          border: '1px solid var(--color-semantic-line-normal-normal)',
          borderRadius: 'var(--radius-4)',
          color: 'var(--color-semantic-label-neutral)',
          fontSize: 'var(--body2-size)',
          lineHeight: 'var(--body2-line)',
        }}
      >
        <strong style={{ color: 'var(--color-semantic-label-strong)' }}>RobotPose · 기록된 위치와 heading</strong>
        <span>타임라인 손잡이 · 현재 재생 시점</span>
        <span>실시간 운영 위치와 기록 재생 위치는 같은 지도에 함께 표시하지 않습니다.</span>
      </aside>
    </StoryPage>
  );
}

export const RecordingPlayback = {
  name: '사용법 · 기록 재생',
  parameters: storyDescription(
    '저장된 주행 기록을 검토할 때는 RobotPose를 시간에 따라 이동시키고, 현재 재생 시점은 타임라인 손잡이로 표시합니다.',
  ),
  render: () => <RecordingPlaybackFixture />,
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Trajectory recording playback');
    const trajectory = canvasElement.querySelector('[data-trajectory-id="trajectory-recording-playback"]');
    const replayPose = canvasElement.querySelector('[data-robot-id="robot-2-recording-replay"]');
    if (
      !trajectory
      || trajectory.getAttribute('data-time-cursor-visible') !== 'false'
      || trajectory.getAttribute('data-playback-time-ms') !== '750'
      || trajectory.querySelector('[data-trajectory-time-cursor]')
      || !replayPose
      || replayPose.getAttribute('data-robot-pose-context') !== 'replay'
      || replayPose.getAttribute('data-motion-visible') !== 'false'
      || !replayPose.getAttribute('aria-label')?.includes('기록 재생')
      || !canvasElement.querySelector('[data-recording-playback-controls] input[type="range"]')
    ) {
      throw new Error('Recording playback must use a replay RobotPose and keep the Trajectory cursor hidden.');
    }
    assertTrajectoryTemporalEncoding(
      trajectory,
      'Recording playback Trajectory',
      { showPlaybackProgress: true },
    );
  },
};

const TRAJECTORY_QUALITY_ROWS = [
  {
    quality: 'valid',
    label: '정상',
    trajectory: { ...ACTIVE_TRAJECTORY, id: 'trajectory-valid', label: '정상 궤적' },
  },
  {
    quality: 'invalid',
    label: '오류',
    trajectory: { ...ACTIVE_TRAJECTORY, id: 'trajectory-invalid', label: '오류 궤적' },
    invalid: true,
  },
  {
    quality: 'stale',
    label: '오래됨',
    trajectory: { ...ACTIVE_TRAJECTORY, id: 'trajectory-stale', label: '오래된 궤적' },
    stale: true,
  },
];

export const Statuses = {
  name: '변형·상태 · 궤적 수명주기와 데이터 상태',
  parameters: storyDescription(
    '수명주기는 동일한 실선을 공유하므로 반복 지도를 만들지 않습니다. 정상과 데이터 품질 변형만 비교하며, LDS Pulse 정책에 따라 stale만 cautionary pulse, invalid는 정적 negative 선으로 표시합니다.',
  ),
  render: () => (
    <StoryPage
      title="Trajectory는 정상과 데이터 품질 변형만 시각적으로 비교합니다"
      description="계획됨·대기·차단·재계산·완료는 같은 실선을 사용하므로 라벨·상세 정보에서만 구분합니다. 지도에서는 실제로 모양이 다른 정상, 오류, 오래됨 세 가지만 비교하며 invalid와 stale이 겹치면 오류가 우선합니다."
      maxWidth={1120}
    >
      {/* Two-up, not three. ViewerFrame carries a 200px min-height from the pinned
          lds-product build, so a column narrow enough for three cards scaled the
          540-wide map down to ~152px and left a quarter of every dark card empty
          under it. At two columns the map renders ~241px and fills the frame. */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(480px, 100%), 1fr))', gap: 'var(--space-4)', minWidth: 0 }}>
        {TRAJECTORY_QUALITY_ROWS.map(({ quality, label, trajectory, invalid, stale }) => (
          // Ratio-sized rather than PathMap's fixed 270px: the SVG scales with the
          // column, so a fixed height left a dark empty half under every map here.
          // Bare `height: auto` is not the fix - ViewerFrame's 200px floor then
          // becomes the card height and the 240px map overflows it, clipping the
          // scale bar. Matching the map's own 540/250 makes the card track it.
          <PathMap key={quality} appearance="dark" label={`${label} trajectory 지도`} eyebrow="TRAJECTORY" aspectRatio="540 / 250" labelPolicy="always">
            {/* labelPolicy="always" on the map: three cards that all say TRAJECTORY
                in the eyebrow have no other visible discriminator, so the
                trajectory labels are the only thing naming which is which. */}
            {(cssViewBoxScale) => (
              <TrajectoryOverlay
                trajectory={trajectory}
                viewportScale={cssViewBoxScale}
                invalid={invalid}
                stale={stale}
              />
            )}
          </PathMap>
        ))}
      </section>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Trajectory statuses');
    const validTrajectory = canvasElement.querySelector('[data-trajectory-id="trajectory-valid"]');
    const validPath = validTrajectory?.querySelector('[data-trajectory-path]');
    const validSample = validTrajectory?.querySelector('[data-trajectory-sample]');
    if (
      !validPath
      || validPath.hasAttribute('stroke-dasharray')
      || validPath.getAttribute('stroke-width') !== '2.25'
      || !validPath.getAttribute('stroke')?.includes('--viewer-accent')
      || !validSample
      || validSample.hasAttribute('stroke')
      || validSample.getAttribute('opacity') !== '1'
    ) {
      throw new Error('Valid Trajectory must keep the shared solid identity line and uninterrupted samples.');
    }
    assertTrajectoryTemporalEncoding(validTrajectory, 'Valid Trajectory');
    const invalidTrajectory = canvasElement.querySelector('[data-trajectory-id="trajectory-invalid"]');
    const staleTrajectory = canvasElement.querySelector('[data-trajectory-id="trajectory-stale"]');
    if (
      !invalidTrajectory?.querySelector('[data-trajectory-path]')?.getAttribute('stroke')?.includes('--viewer-danger')
      || invalidTrajectory.querySelector('[data-trajectory-freshness-pulse]')
    ) {
      throw new Error('Invalid Trajectory must use the static negative treatment without pulse.');
    }
    if (
      !staleTrajectory?.querySelector('[data-trajectory-path]')?.getAttribute('stroke')?.includes('--viewer-warning')
      || !staleTrajectory.querySelector('[data-trajectory-freshness-pulse]')
    ) {
      throw new Error('Stale Trajectory must reuse the cautionary freshness pulse policy.');
    }
    if (canvasElement.querySelector('[data-trajectory-overlay-state], [data-trajectory-marker-badge]')) {
      throw new Error('Trajectory data quality must not render a point badge.');
    }
    assertTrajectoryTemporalEncoding(invalidTrajectory, 'Invalid Trajectory');
    assertTrajectoryTemporalEncoding(staleTrajectory, 'Stale Trajectory');
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  tags: ['!dev', 'regression'],
  parameters: storyDescription(
    '320px 폭에서 trajectory viewport가 페이지를 밀어내지 않고, 시각 label을 감춰도 운영 기본값이 playback 위치를 현재 로봇 위치처럼 전달하지 않는지 확인합니다.',
  ),
  render: () => (
    <div data-testid="trajectory-narrow" style={{ width: 320, maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      <StoryPage
        title="좁은 화면에서도 궤적 계층은 겹치지 않고 상세 정보는 이름으로 이어집니다"
        description="지도 안에 card를 겹쳐 넣지 않습니다. trajectory의 선·sample을 보존하고 접근성 이름은 수명주기 상태만 전달합니다."
      >
        <PathMap label="320px trajectory 지도" aspectRatio="572 / 282" eyebrow="TRAJECTORY · L1">
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
    assertPathSystemVisualContract(canvasElement, 'Trajectory narrow viewport');
    const narrow = canvasElement.querySelector('[data-testid="trajectory-narrow"]');
    if (!narrow || narrow.scrollWidth > narrow.clientWidth) {
      throw new Error(`Trajectory narrow story overflowed: ${narrow?.scrollWidth}/${narrow?.clientWidth}`);
    }
    const trajectory = narrow.querySelector('[data-lk-trajectory-overlay]');
    if (trajectory?.getAttribute('aria-label')?.includes('현재 sample') || trajectory?.getAttribute('aria-label')?.includes('재생 sample')) {
      throw new Error('Operational trajectory accessibility must not imply that a playback sample is the robot position.');
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
