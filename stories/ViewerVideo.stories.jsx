import React from 'react';
import { Button, Icon, VideoStreamTile, ViewerToolbar, ViewerToolbarButton } from './lds.js';
import { VideoStreamTileCard as VideoStreamTileCardStory } from './RoboticsAndViz.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Viewer/Video Stream',
  component: VideoStreamTile,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-viewer-video-stream--video-stream-overview',
      eyebrow: 'Robotics / Video Stream',
      title: '영상 스트림은 실시간 피드와 신호 상태·복구 동작을 함께 보여줍니다',
      description:
        '운영자가 카메라 영상을 보면서 연결 상태와 뷰포트 도구를 즉시 판단해야 할 때 적합합니다. 정지 이미지나 공간 경로를 탐색하는 화면에는 Video Stream 대신 Image 또는 2D Map을 사용하세요.',
    },
    docs: {
      description: {
        component: '영상 소스를 담는 공통 viewer frame preset입니다. 앱이 video/WebRTC 렌더러와 전송을 소유하고, 컴포넌트는 source·freshness·가용성 상태와 viewport-local 도구를 일관되게 배치합니다.',
      },
    },
  },
};

export default meta;

const monoFont = 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)';

function FeedPlaceholder({ children }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'repeating-linear-gradient(135deg, var(--component-viewer-surface) 0 10px, var(--component-viewer-surface-elevated) 10px 20px)',
      }}
    >
      <span style={{ fontFamily: monoFont, fontSize: 11, fontWeight: 'var(--fw-bold)', letterSpacing: 1.2, color: 'var(--component-viewer-muted)' }}>{children}</span>
    </div>
  );
}

function VideoDemo({ state = 'live', label = 'AMR-07 · FRONT', aspectRatio = '16 / 9', metadata = '1080p · 30 FPS', stateAction }) {
  const [muted, setMuted] = React.useState(false);
  const [snapshotCount, setSnapshotCount] = React.useState(0);
  const [fullscreenRequested, setFullscreenRequested] = React.useState(false);

  return (
    <VideoStreamTile
      label={label}
      state={state}
      aspectRatio={aspectRatio}
      metadata={`${snapshotCount > 0 ? `스냅샷 ${snapshotCount}장 · ` : ''}${fullscreenRequested ? '전체 화면 · ' : ''}${metadata}`}
      stateAction={stateAction}
      toolbar={(
        <ViewerToolbar orientation="horizontal" appearance="on-dark" label="영상 도구">
          <ViewerToolbarButton label={muted ? '음소거 해제' : '음소거'} kind="toggle" pressed={muted} onPressedChange={setMuted}>
            <Icon name={muted ? 'volume-x' : 'volume-2'} size={17} />
          </ViewerToolbarButton>
          <ViewerToolbarButton label="스냅샷" onClick={() => setSnapshotCount((value) => value + 1)}>
            <Icon name="camera" size={17} />
          </ViewerToolbarButton>
          <ViewerToolbarButton label={fullscreenRequested ? '전체 화면 종료' : '전체 화면'} onClick={() => setFullscreenRequested((value) => !value)}>
            <Icon name="maximize" size={17} />
          </ViewerToolbarButton>
        </ViewerToolbar>
      )}
    >
      <FeedPlaceholder>{state === 'live' ? 'LIVE · RTSP' : 'LAST FRAME'}</FeedPlaceholder>
    </VideoStreamTile>
  );
}

function RetryFixture() {
  const [state, setState] = React.useState('no-signal');
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <VideoDemo
        state={state}
        label="AMR-07 · FRONT"
        stateAction={<Button data-testid="video-retry" size="sm" onClick={() => setState('live')}>다시 연결</Button>}
      />
    </div>
  );
}

export const VideoStreamOverview = {
  name: '개요',
  parameters: storyDescription(
    '주 영상과 RGB·IR·EO 보조 피드를 live·loading·disconnected 상태로 함께 보는 운영 상황입니다. 각 소스의 정체와 가용 상태가 영상보다 먼저 판단되고 여러 타일의 위계가 분명한지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 920, minWidth: 0 }}>
      <VideoDemo />
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 'var(--space-3)', minWidth: 0 }}>
        <VideoDemo label="RGB" state="live" />
        <VideoDemo label="IR" state="loading" />
        <VideoDemo label="EO-1" state="disconnected" />
      </section>
    </main>
  ),
};

const STREAM_STATES = [
  'idle',
  'no-source',
  'loading',
  'connecting',
  'ready',
  'live',
  'degraded',
  'stale',
  'frozen',
  'paused',
  'unavailable',
  'disconnected',
  'no-signal',
  'error',
];

export const CommonStateContract = {
  name: '영상 상태 계약',
  tags: ['!dev'],
  parameters: storyDescription(
    'idle부터 live·stale·no-signal·error까지 영상 소스의 공통 상태를 전부 비교합니다. 차단 상태에서는 도구와 콘텐츠가 입력에서 제외되고 유지 상태에서는 마지막 영상 맥락이 계속 노출되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px, 100%), 1fr))', gap: 'var(--space-4)', width: '100%', maxWidth: 1120, minWidth: 0 }}>
      {STREAM_STATES.map((state) => (
        <VideoDemo key={state} label={state.toUpperCase()} state={state} metadata="마지막 수신 8초 전" />
      ))}
    </main>
  ),
  play: async ({ canvasElement }) => {
    const blockingStates = new Set(['idle', 'no-source', 'loading', 'connecting', 'unavailable', 'disconnected', 'no-signal', 'error']);
    for (const frame of canvasElement.querySelectorAll('[data-lds-viewer-frame]')) {
      const isBlocking = blockingStates.has(frame.dataset.viewerState);
      const toolbar = frame.querySelector('[data-viewer-toolbar]');
      if (isBlocking && toolbar && !toolbar.hasAttribute('inert')) {
        throw new Error(`${frame.dataset.viewerState}: hidden video toolbar must be inert`);
      }
      if (!isBlocking && !frame.querySelector('[data-viewer-content]:not([aria-hidden="true"])')) {
        throw new Error(`${frame.dataset.viewerState}: retained content must remain exposed`);
      }
    }
  },
};

export const DarkTheme = {
  name: '변형·상태 · 어두운 배경',
  parameters: {
    ...storyDescription(
      '다크 애플리케이션 배경에서 stale 영상 스트림을 표시하는 상황입니다. 프레임과 상태 문구가 외부 배경에 묻히지 않고 지연 의미가 색과 텍스트로 함께 유지되는지 확인하세요.',
    ),
    backgrounds: { default: 'Dark' },
  },
  render: () => (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <VideoDemo state="stale" />
    </div>
  ),
};

export const NarrowWidth = {
  name: '반응형 · 좁은 폭',
  parameters: storyDescription(
    '320px 폭에서 긴 카메라 소스 이름과 degraded 상태를 표시합니다. 소스 정체와 상태가 줄임 뒤에도 구분되고 영상 비율과 로컬 도구가 가로 overflow 없이 유지되는지 확인하세요.',
  ),
  render: () => (
    <div style={{ width: 320, maxWidth: '100%' }}>
      <VideoDemo label="AMR-07 · LONG FRONT CAMERA SOURCE" state="degraded" />
    </div>
  ),
};

export const RecoveryAction = {
  name: '변형·상태 · 신호 없음 · 다시 연결',
  parameters: storyDescription(
    '카메라 신호가 끊긴 뒤 운영자가 다시 연결을 요청하는 복구 상황입니다. no-signal 상태와 복구 동작이 중앙에서 분명히 보이고 성공 후 차단 상태가 사라져 live 콘텐츠로 돌아오는지 확인하세요.',
  ),
  render: () => <RetryFixture />,
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('[data-lds-viewer-frame]');
    const retry = canvasElement.querySelector('[data-testid="video-retry"]');
    if (frame?.dataset.viewerState !== 'no-signal' || !retry) {
      throw new Error('No-signal recovery state is not exposed.');
    }
    retry.click();
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (frame.dataset.viewerState !== 'live' || frame.querySelector('[data-viewer-blocking-state]')) {
      throw new Error('Retry action did not restore the live stream state.');
    }
  },
};

export const VideoStreamTileCard = { ...VideoStreamTileCardStory, name: 'VideoStreamTile card parity', tags: ['!dev', 'visual-parity'] };
