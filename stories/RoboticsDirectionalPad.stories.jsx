import React from 'react';
import { userEvent, waitFor } from 'storybook/test';
import { Map2DCanvas } from '@lk-robotics/lds-product';
import { DirectionalPad } from '../src/index.js';
import { assertOverlayOpaque, contrastRatio } from './RoboticsNavigationAssert.shared.jsx';

const meta = {
  title: 'LDS Robotics/Control/Directional Pad',
  tags: ['autodocs'],
  component: DirectionalPad,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-control-directional-pad--directional-pads',
      eyebrow: 'Robotics / Directional Pad',
      title: '방향 패드는 누르는 만큼만 이동하는 momentary 제어입니다',
      description:
        'PTZ·짐벌·조그처럼 단계적 이동이 필요할 때 적합합니다. 탭은 1스텝, 홀드는 rate로 반복하고 손을 떼면 멈추며, 연속 아날로그 주행에는 Joystick을 사용하세요.',
    },
    docs: {
      description: {
        component: 'PTZ·짐벌·조그 제어용 momentary D-pad 패턴입니다. 탭은 1회 스텝, 홀드는 rate Hz 반복, 아날로그 이동은 조이스틱 패턴을 씁니다.',
      },
    },
  },
};

export default meta;

const stageStyle = {
  display: 'grid',
  gap: 'var(--space-4)',
  justifyItems: 'start',
  fontFamily: 'var(--font-sans)',
};

const sampleActionStyle = {
  minWidth: 180,
  fontSize: 12,
  color: 'var(--color-semantic-label-alternative)',
  fontVariantNumeric: 'tabular-nums',
};

const sampleLabelStyle = {
  margin: 0,
  fontSize: 12,
  fontWeight: 'var(--fw-semibold)',
  color: 'var(--color-semantic-label-alternative)',
};

function PadSample({ title, children }) {
  return (
    <figure style={{ display: 'grid', gap: 'var(--space-2)', margin: 0, justifyItems: 'center' }}>
      {children}
      <figcaption style={sampleLabelStyle}>{title}</figcaption>
    </figure>
  );
}

export const DirectionalPads = {
  name: '개요',
  parameters: {
    docs: {
      description: {
        story:
          '실제 스텝·home 이벤트가 하단 로그에 찍힙니다. 탭과 홀드의 반응이 구분되는지, 손을 떼면 반복이 멈추는지 확인하세요.',
      },
    },
  },
  render: () => {
    const [log, setLog] = React.useState('대기');
    return (
      <main style={{ ...stageStyle, gap: 'var(--space-6)' }}>
        <DirectionalPad
          onStep={(direction) => setLog(`step: ${direction}`)}
          onCenter={() => setLog('home')}
          rate={6}
        />
        <code style={sampleActionStyle}>{log}</code>
      </main>
    );
  },
};

export const States = {
  name: '변형·상태 · 작동과 비활성',
  parameters: {
    docs: {
      description: {
        story:
          '기본·비활성·핸들러 없음 상태를 비교합니다. 비활성 시 입력이 차단되는지, 핸들러가 없어도 레이아웃이 깨지지 않는지 확인하세요.',
      },
    },
  },
  render: () => (
    <main style={{ ...stageStyle, display: 'flex', alignItems: 'start', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
      <PadSample title="기본">
        <DirectionalPad onStep={() => {}} onCenter={() => {}} />
      </PadSample>
      <PadSample title="비활성">
        <DirectionalPad onStep={() => {}} onCenter={() => {}} disabled />
      </PadSample>
      <PadSample title="핸들러 없음">
        <DirectionalPad />
      </PadSample>
    </main>
  ),
};

export const Sizes = {
  name: '변형·상태 · 크기',
  parameters: {
    docs: {
      description: {
        story:
          '40·기본·60px 크기를 비교합니다. 작은 크기에서도 터치 타깃과 방향 구분이 유지되는지 확인하세요.',
      },
    },
  },
  render: () => (
    <main style={{ ...stageStyle, display: 'flex', alignItems: 'start', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
      <PadSample title="작게">
        <DirectionalPad size={40} onStep={() => {}} onCenter={() => {}} />
      </PadSample>
      <PadSample title="기본">
        <DirectionalPad onStep={() => {}} onCenter={() => {}} />
      </PadSample>
      <PadSample title="크게">
        <DirectionalPad size={60} onStep={() => {}} onCenter={() => {}} />
      </PadSample>
    </main>
  ),
};

export const OnViewerSurface = {
  name: '뷰어 표면 위',
  parameters: {
    docs: {
      description: {
        story:
          'PTZ·짐벌은 이 패드의 대표 용도이고, 그 자리는 어두운 영상·지도 프레임 위입니다. 기본 ghost 버튼은 페이지 잉크라 어두운 프레임에서 소실되므로 on-dark는 버튼마다 스크림 표면과 밝은 전경을 입힙니다 — ViewerToolbar의 on-dark와 같은 계열이라 한 프레임 위에서 툴바와 패드가 한 가족으로 읽힙니다. 프레임 점유를 줄이기 위해 공유 판 대신 버튼별 스크림을 씁니다.',
      },
    },
  },
  render: () => (
    <main style={{ maxWidth: 640 }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <Map2DCanvas
          appearance="dark"
          label="PTZ 카메라 프레임"
          controls={false}
          panEnabled={false}
          wheelZoom={false}
          keyboard={false}
          defaultViewport={{ x: 0, y: 0, z: 1 }}
          style={{ width: '100%', aspectRatio: '16 / 10' }}
        />
        <div style={{ position: 'absolute', right: 'var(--space-4)', bottom: 'var(--space-4)' }}>
          <DirectionalPad appearance="on-dark" size={40} onStep={() => {}} onCenter={() => {}} label="PTZ 방향 패드" />
        </div>
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const pad = canvasElement.querySelector('[role="group"][data-appearance="on-dark"]');
    if (!pad) throw new Error('The overlay pad must declare data-appearance="on-dark".');
    const view = canvasElement.ownerDocument.defaultView;
    const buttons = [...pad.querySelectorAll('button')];
    if (buttons.length === 0) throw new Error('Overlay pad buttons are missing.');
    for (const button of buttons) {
      const styles = view.getComputedStyle(button);
      // The scrim is deliberately translucent (the blur carries legibility over
      // footage), so measure ink against the scrim's own tone at full opacity —
      // compositing a 72% scrim over the helper's white default would judge the
      // overlay against a page background it never sits on. The helper throws on
      // a fully transparent background, which is the "ghost button floating raw
      // over footage" regression this story exists to block.
      const ratio = contrastRatio(styles.color, assertOverlayOpaque(styles.backgroundColor));
      if (ratio < 3) {
        throw new Error(`${button.getAttribute('aria-label')} ink is ${ratio.toFixed(2)}:1 against its scrim; expected ≥ 3:1.`);
      }
    }
  },
};

/* 홀드 중 부모 리렌더로 onStep 핸들러가 바뀌어도, 실행 중인 반복은 최신
   핸들러를 호출해야 한다(stale 클로저 회귀 방지). aria-keyshortcuts 노출과
   방향 버튼의 키보드 활성화도 함께 고정한다. */
function StaleHandlerFixture() {
  const [generation, setGeneration] = React.useState(0);
  const stepsRef = React.useRef([]);
  const [count, setCount] = React.useState(0);
  const onStep = React.useCallback(
    (dir) => { stepsRef.current.push({ dir, generation }); setCount((value) => value + 1); },
    [generation],
  );
  return (
    <main style={stageStyle}>
      <button type="button" data-testid="bump" onClick={() => setGeneration((value) => value + 1)}>
        세대 증가 (현재 {generation})
      </button>
      <span data-testid="last-generation" hidden>
        {stepsRef.current.length ? stepsRef.current[stepsRef.current.length - 1].generation : ''}
      </span>
      <span data-testid="step-count" hidden>{count}</span>
      <DirectionalPad label="스텝 계약" onStep={onStep} />
    </main>
  );
}

export const StaleHandlerContract = {
  name: '스텝 핸들러 계약',
  tags: ['!dev'],
  render: () => <StaleHandlerFixture />,
  play: async ({ canvasElement }) => {
    const pad = canvasElement.querySelector('[role="group"][aria-label="스텝 계약"]');
    if (!pad || pad.getAttribute('aria-keyshortcuts') !== 'ArrowUp ArrowDown ArrowLeft ArrowRight') {
      throw new Error('D-pad group must expose its arrow-key shortcuts.');
    }

    const up = canvasElement.querySelector('button[aria-label="위로 이동"]') ?? pad.querySelector('button');
    // A single tap steps once through the current handler.
    await userEvent.click(up);
    await waitFor(() => {
      const last = canvasElement.querySelector('[data-testid="last-generation"]');
      if (last?.textContent !== '0') throw new Error('The first step must run through the generation-0 handler.');
    });

    // Swap the handler by bumping the parent generation, then step again: the
    // step must route to the new handler, not the one captured at mount.
    await userEvent.click(canvasElement.querySelector('[data-testid="bump"]'));
    await userEvent.click(up);
    await waitFor(() => {
      const last = canvasElement.querySelector('[data-testid="last-generation"]');
      if (last?.textContent !== '1') throw new Error('After a re-render swaps onStep, the next step must call the current handler.');
    });

    canvasElement.querySelector('[data-testid="bump"]').blur();
    up.blur();
  },
};
