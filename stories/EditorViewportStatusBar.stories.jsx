import React from 'react';
import { ViewportStatusBar } from './lds.js';
import { EditorStoryFrame } from './EditorShell.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Editor/Viewport Status Bar',
  component: ViewportStatusBar,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-editor-viewport-status-bar--readouts',
      eyebrow: 'Robotics / Viewport Status Bar',
      title: '뷰포트 상태 바는 좌표와 줌처럼 계속 참고할 로컬 정보를 압축합니다',
      description:
        '운영자가 캔버스를 조작하는 동안 좌표·줌·선택 수·렌더링 상태를 지속해서 확인해야 할 때 적합합니다. 즉시 대응해야 하는 오류나 전역 시스템 상태에는 Status Bar 대신 Alert 또는 상태 배너를 사용하세요.',
    },
    docs: {
      description: {
        component:
          'ViewportStatusBar는 좌표·줌·선택 수·렌더링 상태처럼 수동적인 로컬 정보를 우선순위가 있는 한 줄로 표시하고, 짧은 결과 메시지만 별도 live status로 알립니다.',
      },
    },
  },
};

export default meta;

function StatusFrame({ children, width = 860 }) {
  return (
    <EditorStoryFrame maxWidth={width} height="auto">
      <div
        data-testid="status-frame"
        style={{
          width: '100%',
          padding: '9px 14px',
          border: '1px solid var(--color-semantic-line-normal-normal)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-semantic-background-normal-alternative)',
        }}
      >
        {children}
      </div>
    </EditorStoryFrame>
  );
}

const baseItems = [
  { key: 'mode', label: '모드', value: '선택', priority: 'high' },
  { key: 'selected', label: '선택', value: 2, priority: 'high' },
  { key: 'cursor', label: '커서', value: '12.4, -3.1', mono: true },
  { key: 'zoom', label: '줌', value: 125, unit: '%' },
];

export const Readouts = {
  name: '개요',
  parameters: storyDescription(
    '좌표·줌·선택 수·렌더링 상태를 캔버스 아래에서 계속 참고하는 기본 상황입니다. 항목 라벨과 값이 빠르게 훑히고 수동 정보가 작업 영역보다 시각적으로 앞서지 않는지 확인하세요.',
  ),
  render: () => (
    <StatusFrame>
      <ViewportStatusBar items={baseItems} />
    </StatusFrame>
  ),
};

export const PriorityCompression = {
  name: '반응형 · 좁은 폭 · 정보 우선순위',
  parameters: storyDescription(
    '320px 폭에서 기호 단위와 SI·복합 단위를 포함한 항목을 우선순위에 따라 압축합니다. 핵심 정보가 남고 낮은 우선순위 항목이 먼저 줄어들며 값·단위 결합이 깨지거나 가로 overflow가 생기지 않는지 확인하세요.',
  ),
  render: () => (
    <StatusFrame width={320}>
      <ViewportStatusBar
        data-testid="viewport-status-bar"
        items={[
          { key: 'zoom', label: '줌', value: ' 125 ', unit: ' % ', priority: 'high' },
          { key: 'speed', label: '속도', value: 1.4, unit: ' m/s ' },
          { key: 'torque', label: '토크', value: 12, unit: ' N·m ', priority: 'low' },
        ]}
      />
    </StatusFrame>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('[data-testid="status-frame"]');
    const bar = canvasElement.querySelector('[data-testid="viewport-status-bar"]');
    const values = [...canvasElement.querySelectorAll('[data-viewport-status-value]')];
    const expectedValues = ['125%', '1.4 m/s', '12 N·m'];
    if (!frame || !bar || values.length !== expectedValues.length) throw new Error('ViewportStatusBar 320px fixture is incomplete.');
    if (values.some((value, index) => value.textContent !== expectedValues[index])) {
      throw new Error(`ViewportStatusBar unit text is inconsistent: ${values.map((value) => value.textContent).join(' | ')}`);
    }
    if (getComputedStyle(bar).flexWrap !== 'nowrap') throw new Error('ViewportStatusBar must remain one line at 320px.');
    if (bar.scrollWidth > bar.clientWidth || frame.scrollWidth > frame.clientWidth) {
      throw new Error(`ViewportStatusBar overflowed 320px: bar ${bar.scrollWidth}/${bar.clientWidth}, frame ${frame.scrollWidth}/${frame.clientWidth}.`);
    }
  },
};

export const StatusTones = {
  name: '변형·상태 · 의미별 색상',
  parameters: storyDescription(
    '정상·주의·위험 상태가 한 상태 바에 함께 나타나는 상황입니다. 색상과 프레임 저하·데이터 지연 텍스트가 함께 전달되어 각 tone의 운영 의미가 구분되는지 확인하세요.',
  ),
  render: () => (
    <StatusFrame>
      <ViewportStatusBar
        items={[
          { key: 'selection', label: '선택', value: 1, tone: 'signal', priority: 'high' },
          { key: 'snap', label: '스냅', value: '켜짐', tone: 'positive' },
          { key: 'fps', label: 'FPS', value: 18, tone: 'cautionary', toneLabel: '프레임 저하' },
          { key: 'source', label: '센서', value: '만료', tone: 'negative', toneLabel: '데이터 지연' },
        ]}
      />
    </StatusFrame>
  ),
};

export const TransientMessage = {
  name: '시나리오 · 일시적 작업 결과',
  parameters: storyDescription(
    '선택 영역 계산 완료처럼 현재 뷰포트 작업의 짧은 결과를 알리는 상황입니다. 일시 메시지가 지속 readout과 구분되며 보조 기술에는 완료 의미와 함께 한 번만 전달되는지 확인하세요.',
  ),
  render: () => (
    <StatusFrame>
      <ViewportStatusBar
        message="선택 영역을 계산했습니다."
        messageTone="positive"
        messageToneLabel="완료"
        items={baseItems}
      />
    </StatusFrame>
  ),
};
