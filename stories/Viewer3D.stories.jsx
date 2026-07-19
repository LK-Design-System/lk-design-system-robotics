import React from 'react';
import { Icon, Scene3DFrame, ViewerToolbar, ViewerToolbarButton } from './lds.js';
import { Scene3DFrameCard as Scene3DFrameCardStory } from './RoboticsAndViz.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Viewer/3D Scene',
  component: Scene3DFrame,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-viewer-3d-scene--scene-3-d-overview',
      eyebrow: 'Robotics / 3D Scene',
      title: '3D 장면은 깊이와 자세가 중요한 공간 데이터를 우선해 보여줍니다',
      description:
        '운영자가 포인트 클라우드·설비 자세·입체 장애물처럼 깊이 정보가 필요한 장면을 검사할 때 적합합니다. 평면 경로 확인이나 영상 감시에는 3D Scene 대신 2D Map 또는 Video Stream을 사용하세요.',
    },
    docs: {
      description: {
        component: '3D 렌더러를 담는 공통 viewer frame preset입니다. 장면을 우선하고 카메라 도구, 최소 HUD, 가용성·freshness 상태만 프레임에 둡니다.',
      },
    },
  },
};

export default meta;

function PointCloudPreview({ layersVisible = true }) {
  const points = Array.from({ length: 90 }, (_, index) => {
    const x = (index * 37) % 100;
    const y = (index * 61) % 100;
    return { x, y, r: 0.7 + (index % 5) * 0.22, accent: index % 9 === 0 };
  });

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 20%, var(--color-semantic-primary-surface-strong), transparent 60%)' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="포인트 클라우드 예시">
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={point.r} fill={point.accent ? 'var(--color-semantic-primary-normal)' : 'var(--viewer-foreground)'} opacity={layersVisible ? (point.accent ? 0.72 : 0.34) : (point.accent ? 0.5 : 0.04)} />
        ))}
      </svg>
    </div>
  );
}

function CompactHud() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, color: 'var(--viewer-muted)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
      <span>1.2M points</span>
      <span aria-hidden="true">·</span>
      <span>38 FPS</span>
    </div>
  );
}

function SceneDemo({ appearance = 'dark', state = 'live', stateLabel, stateDescription, height = 420, title = 'AMR-07 · POINT CLOUD', label }) {
  const [layersVisible, setLayersVisible] = React.useState(true);
  const [camera, setCamera] = React.useState('원근');

  return (
    <Scene3DFrame
      label={label ?? `${title} 3D 뷰포트`}
      title={title}
      appearance={appearance}
      state={state}
      stateLabel={stateLabel}
      stateDescription={stateDescription}
      hud={<CompactHud />}
      status={`${camera} · 좌표계 map`}
      toolbar={(
        <ViewerToolbar orientation="horizontal" appearance={appearance === 'dark' ? 'on-dark' : 'surface'} label="3D 카메라 도구">
          <ViewerToolbarButton label="홈 뷰" onClick={() => setCamera('홈')}><Icon name="home" size={16} /></ViewerToolbarButton>
          <ViewerToolbarButton label="카메라 전환" onClick={() => setCamera((value) => value === '원근' ? '상단' : '원근')}><Icon name="camera" size={16} /></ViewerToolbarButton>
          <ViewerToolbarButton label="레이어 표시" kind="toggle" pressed={layersVisible} onPressedChange={setLayersVisible}><Icon name="layers" size={16} /></ViewerToolbarButton>
        </ViewerToolbar>
      )}
      style={{ height }}
    >
      <PointCloudPreview layersVisible={layersVisible} />
    </Scene3DFrame>
  );
}

export const Scene3DOverview = {
  name: '개요',
  parameters: storyDescription(
    'AMR 포인트 클라우드와 최소 카메라 도구를 함께 보는 기본 3D 장면입니다. 장면이 주 시각 영역으로 남고 상태·도구·HUD가 공간 데이터를 가리지 않는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 840, minWidth: 0 }}>
      <SceneDemo />
    </main>
  ),
};

const STATE_CASES = [
  { state: 'idle', title: 'IDLE' },
  { state: 'no-source', title: 'NO SOURCE' },
  { state: 'loading', title: 'LOADING' },
  { state: 'connecting', title: 'CONNECTING' },
  { state: 'ready', title: 'READY' },
  { state: 'live', title: 'LIVE' },
  { state: 'degraded', title: 'DEGRADED' },
  { state: 'stale', title: 'STALE' },
  { state: 'frozen', title: 'FROZEN' },
  { state: 'paused', title: 'PAUSED' },
  { state: 'unavailable', title: 'UNAVAILABLE' },
  { state: 'disconnected', title: 'DISCONNECTED' },
  { state: 'no-signal', title: 'NO SIGNAL' },
  { state: 'error', title: 'ERROR' },
];

export const CommonStateContract = {
  name: '3D 상태 계약',
  tags: ['!dev'],
  parameters: storyDescription(
    '연결 준비부터 live·stale·오류까지 3D 소스의 공통 상태를 전부 비교합니다. 차단 상태에서는 장면과 도구가 inert 처리되고 사용 가능한 상태에서는 콘텐츠 맥락이 유지되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 'var(--space-4)', width: '100%', maxWidth: 1120, minWidth: 0 }}>
      {STATE_CASES.map(({ state, title }) => (
        <SceneDemo key={state} state={state} title={title} height={220} />
      ))}
    </main>
  ),
  play: async ({ canvasElement }) => {
    const blockingStates = new Set(['idle', 'no-source', 'loading', 'connecting', 'unavailable', 'disconnected', 'no-signal', 'error']);
    const frames = Array.from(canvasElement.querySelectorAll('[data-lds-viewer-frame]'));
    for (const frame of frames) {
      const isBlocking = blockingStates.has(frame.dataset.viewerState);
      const content = frame.querySelector('[data-viewer-content]');
      const toolbar = frame.querySelector('[data-viewer-toolbar]');
      if (isBlocking && (!content?.hasAttribute('inert') || content.getAttribute('aria-hidden') !== 'true')) {
        throw new Error(`${frame.dataset.viewerState}: blocking content must be inert and aria-hidden`);
      }
      if (isBlocking && toolbar && (!toolbar.hasAttribute('inert') || toolbar.getAttribute('aria-hidden') !== 'true')) {
        throw new Error(`${frame.dataset.viewerState}: blocking toolbar must be inert and aria-hidden`);
      }
      if (!isBlocking && frame.querySelector('[data-viewer-blocking-state]')) {
        throw new Error(`${frame.dataset.viewerState}: usable content must not have a blocking overlay`);
      }
    }
  },
};

export const AppearanceVariants = {
  name: '변형·상태 · 밝은·어두운 외형',
  parameters: storyDescription(
    '동일한 준비 완료 3D 장면을 dark와 light appearance에서 비교합니다. 포인트·도구·상태 문구의 대비와 정보 위계가 두 배경에서 동등한지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 'var(--space-4)', width: '100%', maxWidth: 960 }}>
      <section aria-labelledby="scene-dark-label" style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <strong id="scene-dark-label" style={{ fontSize: 'var(--body2-size)' }}>Dark · 기본값</strong>
        <SceneDemo appearance="dark" state="ready" height={320} label="Dark AMR-07 3D 뷰포트" />
      </section>
      <section aria-labelledby="scene-light-label" style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <strong id="scene-light-label" style={{ fontSize: 'var(--body2-size)' }}>Light</strong>
        <SceneDemo appearance="light" state="ready" height={320} label="Light AMR-07 3D 뷰포트" />
      </section>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const appearances = Array.from(canvasElement.querySelectorAll('[data-lds-viewer-frame]'))
      .map((frame) => frame.dataset.viewerAppearance);
    if (appearances.join(',') !== 'dark,light') {
      throw new Error(`Scene3DFrame must expose equivalent dark/light appearances: ${appearances.join(',')}`);
    }
  },
};

export const NarrowWidth = {
  name: '반응형 · 좁은 3D 화면',
  parameters: storyDescription(
    '320px 폭에서 긴 소스 이름과 stale 상태를 함께 표시하는 상황입니다. 상태 정보와 장면이 겹치지 않고 긴 제목이 도구를 밀어내거나 가로 overflow를 만들지 않는지 확인하세요.',
  ),
  render: () => (
    <div style={{ width: 320, maxWidth: '100%' }}>
      <SceneDemo state="stale" height={300} title="AMR-07 · LONG POINT CLOUD SOURCE" />
    </div>
  ),
};

export const Scene3DFrameCard = { ...Scene3DFrameCardStory, name: 'Scene3DFrame card parity', tags: ['!dev', 'visual-parity'] };
