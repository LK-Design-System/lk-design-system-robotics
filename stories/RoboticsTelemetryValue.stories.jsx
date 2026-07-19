import React from 'react';
import { TelemetryValue } from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';

const readouts = [
  { sensor: '배터리', value: ' 18 ', unit: ' %', tone: 'negative', statusLabel: '충전 필요', helper: '임계값 20% 이하', timestamp: '10:42:18 KST' },
  { sensor: 'RSSI', value: '-71', unit: 'dBm', tone: 'cautionary', statusLabel: '신호 약함', helper: '최근 10초 평균', timestamp: '10:42:18 KST' },
  { sensor: '속도', value: '1.4', unit: 'm/s', tone: 'positive', statusLabel: '정상 범위', helper: '목표 1.5 m/s', timestamp: '10:42:18 KST' },
  { sensor: 'LiDAR', value: '0', unit: 'Hz', stale: true, helper: '마지막 패킷 4분 전', timestamp: '10:38:02 KST' },
];

function ReadoutGrid({ rows = readouts }) {
  return (
    <section
      aria-label="센서 텔레메트리"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        width: '100%',
        minWidth: 0,
        borderTop: '1px solid var(--color-semantic-line-normal-normal)',
      }}
    >
      {rows.map((row) => (
        <article
          key={row.sensor}
          style={{
            minWidth: 0,
            padding: 'var(--space-4) var(--space-3)',
            borderBottom: '1px solid var(--color-semantic-line-normal-normal)',
          }}
        >
          <TelemetryValue
            label={row.sensor}
            value={row.value}
            unit={row.unit}
            tone={row.tone}
            statusLabel={row.statusLabel}
            stale={row.stale}
            helper={row.helper}
            timestamp={row.timestamp}
            size="sm"
          />
        </article>
      ))}
    </section>
  );
}

const meta = {
  title: 'LDS Robotics/Status/Telemetry Value',
  component: TelemetryValue,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-status-telemetry-value--compact-readouts',
      eyebrow: 'Robotics / Telemetry Value',
      title: '텔레메트리 값은 정확한 수치와 상태·수집 맥락을 함께 전달합니다',
      description:
        '운영자가 센서의 정확한 값·단위·상태·freshness·수집 시각을 좁은 공간에서 확인해야 할 때 적합합니다. 최소·최대 범위 안의 상대적 수준을 빠르게 판단해야 한다면 Telemetry Value 대신 Telemetry Gauge를 사용하세요.',
    },
    docs: {
      description: {
        component:
          '정확한 측정값과 단위, 상태, freshness, 보조 설명과 수집 시각을 압축해 표시하는 LK Robotics TelemetryValue 패턴입니다.',
      },
    },
  },
};

export default meta;

export const CompactReadouts = {
  name: '개요',
  parameters: storyDescription(
    '배터리·RSSI·속도·LiDAR 값을 반응형 readout 격자로 비교하는 상황입니다. 320px에서도 고정 폭 표처럼 넘치지 않고 값·단위·상태·도움말·시각이 의미 단위로 줄바꿈되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-5)', width: '100%', maxWidth: 860, minWidth: 0 }}>
      <ReadoutGrid />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const lockups = [...canvasElement.querySelectorAll('[data-telemetry-value-lockup]')];
    if (lockups.length !== readouts.length) throw new Error('Every telemetry readout must expose one value-unit lockup.');
    if (lockups[0]?.dataset.unitAttachment !== 'attached') throw new Error('Symbol units such as % must attach to the value.');
    if (!lockups.slice(1).every((lockup) => lockup.dataset.unitAttachment === 'spaced')) {
      throw new Error('Text units such as dBm, m/s, and Hz must keep one visual space from the value.');
    }
    const renderedValues = lockups.map((lockup) => lockup.textContent);
    const expectedValues = ['18%', '-71 dBm', '1.4 m/s', '0 Hz'];
    if (renderedValues.some((value, index) => value !== expectedValues[index])) {
      throw new Error(`Visible telemetry lockups must normalize whitespace: ${renderedValues.join(' | ')}`);
    }
  },
};

export const UnitFormattingAt320 = {
  name: '반응형 · 320px 단위 결합',
  parameters: storyDescription(
    '320px 진단 패널에서 비율·각도 기호와 SI·복합 단위를 함께 비교합니다. 입력 단위의 앞뒤 공백을 제거한 뒤 %·‰·평면각 °는 값에 붙고 °C·m/s·N·m은 한 칸 띄며, 어떤 readout도 가로 overflow를 만들지 않아야 합니다.',
  ),
  render: () => (
    <main data-testid="telemetry-value-narrow" style={{ width: 320, maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      <ReadoutGrid rows={[
        { sensor: '퍼센트', value: ' 18 ', unit: ' %' },
        { sensor: '퍼밀', value: 2, unit: ' ‰ ' },
        { sensor: '평면각', value: 90, unit: ' ° ' },
        { sensor: '온도', value: 64, unit: ' °C ' },
        { sensor: '속도', value: 1.4, unit: ' m/s ' },
        { sensor: '토크', value: 12, unit: ' N·m ' },
      ]} />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const narrow = canvasElement.querySelector('[data-testid="telemetry-value-narrow"]');
    const lockups = [...canvasElement.querySelectorAll('[data-telemetry-value-lockup]')];
    const expectedValues = ['18%', '2‰', '90°', '64 °C', '1.4 m/s', '12 N·m'];
    if (!narrow || lockups.length !== expectedValues.length) throw new Error('TelemetryValue 320px unit fixture is incomplete.');
    if (lockups.some((lockup, index) => lockup.textContent !== expectedValues[index])) {
      throw new Error(`TelemetryValue visible and accessible text must share one unit rule: ${lockups.map((lockup) => lockup.textContent).join(' | ')}`);
    }
    if (narrow.scrollWidth > narrow.clientWidth) {
      throw new Error(`TelemetryValue overflowed 320px: ${narrow.scrollWidth}px > ${narrow.clientWidth}px.`);
    }
  },
};

export const StaleAndMetadata = {
  name: '변형·상태 · 지연 값과 부가 정보',
  parameters: storyDescription(
    'LiDAR 수신이 지연된 상태에서 마지막 패킷 경과 시간과 수집 시각을 함께 보여줍니다. stale 의미가 색 외의 라벨로 전달되고 helper와 timestamp가 모두 보존되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 360, minWidth: 0 }}>
      <TelemetryValue
        label="LiDAR scan rate"
        value="0"
        unit="Hz"
        stale
        staleLabel="수신 지연"
        helper="마지막 패킷 4분 전"
        timestamp="10:38:02 KST"
      />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const text = canvasElement.textContent || '';
    if (!text.includes('마지막 패킷 4분 전') || !text.includes('10:38:02 KST')) {
      throw new Error('TelemetryValue must preserve helper and timestamp when both are supplied.');
    }
    if (!text.includes('수신 지연')) throw new Error('Stale state must have a visible non-colour label.');
  },
};
