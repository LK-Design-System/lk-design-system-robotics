import React from 'react';
import { DirectionalPad } from './lds.js';

const meta = {
  title: 'LDS Robotics/Control/Directional Pad',
  parameters: {
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
        <header style={{ display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' }}>
          <p className="lk-overline lk-overline--signal" style={{ margin: 0 }}>
            Robotics / Directional Pad
          </p>
          <h1 style={{ margin: 0, color: 'var(--color-semantic-label-strong)', fontSize: 'var(--title2-size)', lineHeight: 'var(--title2-line)' }}>
            방향 패드는 누르는 만큼만 이동하는 momentary 제어입니다
          </h1>
          <p style={{ margin: 0, maxWidth: 640, color: 'var(--color-semantic-label-neutral)', lineHeight: 1.7 }}>
            PTZ·짐벌·조그처럼 단계적 이동이 필요할 때 적합합니다. 탭은 1스텝, 홀드는 rate(Hz)로 반복하며, 손을
            떼면 멈춥니다. 연속 아날로그 주행에는 이 패드 대신 Joystick을 쓰세요.
          </p>
        </header>
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
