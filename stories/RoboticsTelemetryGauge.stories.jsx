import React from 'react';
import { TelemetryGauge } from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Status/Telemetry Gauge',
  component: TelemetryGauge,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-status-telemetry-gauge--telemetry-overview',
      eyebrow: 'Robotics / Telemetry Gauge',
      title: '텔레메트리 게이지는 현재 값이 운영 범위에서 어디에 있는지 보여줍니다',
      description:
        '운영자가 배터리·속도·온도처럼 최소·최대 범위가 있는 측정값의 수준과 severity를 빠르게 판단할 때 적합합니다. 범위보다 정확한 값·수집 시각·freshness가 중요하다면 Telemetry Gauge 대신 Telemetry Value를 사용하세요.',
    },
    docs: {
      description: {
        component:
          '범위형 수치의 현재 수준과 severity를 meter로 표현하는 LK Robotics TelemetryGauge 패턴입니다. 제품이 tone을 판정하고 값·단위·상태를 색에만 의존하지 않고 함께 전달합니다.',
      },
    },
  },
};

export default meta;

export const TelemetryOverview = {
  name: '개요',
  parameters: storyDescription(
    '배터리·속도·신호·부하의 현재 수준을 한 운영 화면에서 비교하는 상황입니다. 네 meter 모두 범위와 현재 값, 사람이 읽을 수 있는 값·상태 텍스트를 함께 노출하는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-5)', width: '100%', maxWidth: 820, minWidth: 0 }}>
      <section
        aria-label="주요 텔레메트리"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 'var(--space-4)', alignItems: 'end', minWidth: 0 }}
      >
        <TelemetryGauge value={86} unit="%" label="배터리" tone="positive" statusLabel="충분" />
        <TelemetryGauge value={1.4} max={2} unit="m/s" label="속도" tone="signal" statusLabel="주행 중" />
        <TelemetryGauge value={68} unit="%" label="신호" tone="positive" statusLabel="안정" />
        <TelemetryGauge value={74} unit="%" label="부하" tone="cautionary" statusLabel="주의" />
      </section>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const meters = [...canvasElement.querySelectorAll('[role="meter"]')];
    if (meters.length !== 4) throw new Error(`TelemetryOverview must expose four meters; received ${meters.length}.`);
    if (!meters.every((meter) => meter.hasAttribute('aria-valuemin') && meter.hasAttribute('aria-valuemax') && meter.hasAttribute('aria-valuenow') && meter.hasAttribute('aria-valuetext'))) {
      throw new Error('Every telemetry gauge must expose min, max, now, and human-readable value text.');
    }
    const speedMeter = meters.find((meter) => meter.getAttribute('aria-valuenow') === '1.4');
    if (!speedMeter || !speedMeter.textContent?.includes('1.4')) throw new Error('Meaningful decimal values must remain visible without implicit rounding.');
  },
};

export const SeverityStates = {
  name: '변형·상태 · 심각도 색상',
  parameters: storyDescription(
    '측정 중·정상·주의·위험의 severity를 같은 범위형 게이지에서 비교합니다. 각 tone이 색뿐 아니라 상태 라벨로도 전달되고 위험도가 높아질수록 운영 의미가 분명해지는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-5)', width: '100%', maxWidth: 760, minWidth: 0 }}>
      <section aria-label="텔레메트리 상태" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 'var(--space-4)', alignItems: 'end' }}>
        <TelemetryGauge value={48} unit="%" label="기본 정보" tone="signal" statusLabel="측정 중" />
        <TelemetryGauge value={82} unit="%" label="정상 상태" tone="positive" statusLabel="정상" />
        <TelemetryGauge value={64} unit="°C" label="주의 상태" tone="cautionary" statusLabel="상한 접근" />
        <TelemetryGauge value={92} unit="°C" label="위험 상태" tone="negative" statusLabel="상한 초과" />
      </section>
    </main>
  ),
};

export const FormattingAndValueText = {
  name: '시나리오 · 표시 형식과 읽을 수 있는 값',
  parameters: storyDescription(
    '0~1 신뢰도 값을 84.67%로 변환해 표시하는 제품 포맷 상황입니다. 원래 측정값은 aria-valuenow에 보존되고 화면 포맷과 상태 라벨이 aria-valuetext에 동일하게 반영되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', width: '100%', maxWidth: 280, minWidth: 0 }}>
      <TelemetryGauge
        value={0.8467}
        max={1}
        unit=" % "
        label="모델 신뢰도"
        tone="positive"
        statusLabel="허용 범위"
        formatter={(current) => (current * 100).toFixed(2)}
      />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const meter = canvasElement.querySelector('[role="meter"]');
    if (!meter) throw new Error('TelemetryGauge must expose role=meter.');
    if (meter.getAttribute('aria-valuenow') !== '0.8467') throw new Error('aria-valuenow must preserve the measured value.');
    if (meter.getAttribute('aria-valuetext') !== '84.67%, 허용 범위') throw new Error('aria-valuetext must attach symbol units to the formatted value.');
    const lockup = meter.querySelector('[data-telemetry-gauge-lockup]');
    if (lockup?.textContent !== '84.67%') throw new Error('Visible gauge text must normalize and attach the same unit as aria-valuetext.');
  },
};

export const UnitFormattingAt320 = {
  name: '반응형 · 320px 단위 결합',
  parameters: storyDescription(
    '320px 상태 패널에서 기호 단위와 SI·복합 단위를 나란히 비교합니다. 중앙 lockup과 aria-valuetext가 동일한 정규화 결과를 사용하고 두 열 게이지가 패널 밖으로 넘치지 않는지 확인하세요.',
  ),
  render: () => (
    <main
      data-testid="telemetry-gauge-narrow"
      style={{ width: 320, maxWidth: '100%', minWidth: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', justifyItems: 'center', gap: 'var(--space-4) var(--space-2)' }}
    >
      <TelemetryGauge value={18} unit=" % " label="퍼센트" size={104} />
      <TelemetryGauge value={2} unit=" ‰ " label="퍼밀" size={104} />
      <TelemetryGauge value={90} unit=" ° " label="평면각" size={104} />
      <TelemetryGauge value={64} unit=" °C " label="온도" size={104} />
      <TelemetryGauge value={1.4} max={2} unit=" m/s " label="속도" size={104} />
      <TelemetryGauge value={12} unit=" N·m " label="토크" size={104} />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const narrow = canvasElement.querySelector('[data-testid="telemetry-gauge-narrow"]');
    const meters = [...canvasElement.querySelectorAll('[role="meter"]')];
    const lockups = [...canvasElement.querySelectorAll('[data-telemetry-gauge-lockup]')];
    const expectedValues = ['18%', '2‰', '90°', '64 °C', '1.4 m/s', '12 N·m'];
    if (!narrow || meters.length !== expectedValues.length || lockups.length !== expectedValues.length) {
      throw new Error('TelemetryGauge 320px unit fixture is incomplete.');
    }
    if (lockups.some((lockup, index) => lockup.textContent !== expectedValues[index])) {
      throw new Error(`TelemetryGauge visible text has inconsistent unit spacing: ${lockups.map((lockup) => lockup.textContent).join(' | ')}`);
    }
    if (meters.some((meter, index) => meter.getAttribute('aria-valuetext') !== expectedValues[index])) {
      throw new Error(`TelemetryGauge aria-valuetext must match visible lockups: ${meters.map((meter) => meter.getAttribute('aria-valuetext')).join(' | ')}`);
    }
    if (narrow.scrollWidth > narrow.clientWidth) {
      throw new Error(`TelemetryGauge overflowed 320px: ${narrow.scrollWidth}px > ${narrow.clientWidth}px.`);
    }
  },
};

export const ThresholdDirections = {
  name: '임계 방향 호환',
  tags: ['!dev'],
  parameters: {
    docs: {
      description: {
        story: '새 제품 코드는 severity를 계산해 tone을 전달하는 방식을 우선합니다. 기존 threshold 사용처는 값이 클수록 좋은지 또는 나쁜지를 반드시 명시합니다.',
      },
    },
  },
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-5)', width: '100%', maxWidth: 640, minWidth: 0 }}>
      <section aria-label="임계 방향 비교" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 'var(--space-5)', alignItems: 'end' }}>
        <TelemetryGauge
          value={18}
          unit="%"
          label="배터리"
          thresholds={{ low: 20, high: 50, direction: 'higher-is-better' }}
        />
        <TelemetryGauge
          value={82}
          max={120}
          unit="°C"
          label="모터 온도"
          thresholds={{ low: 50, high: 67, direction: 'lower-is-better' }}
        />
      </section>
    </main>
  ),
};

export const TelemetryGaugeCard = {
  name: 'TelemetryGauge card parity',
  tags: ['!dev', 'visual-parity'],
  render: () => (
    <div data-visual-crop-root style={{ width: 920, height: 248, background: 'var(--color-semantic-background-normal-normal)', padding: 24, boxSizing: 'border-box', fontFamily: 'var(--font-sans)', color: 'var(--color-semantic-label-normal)' }}>
      <div style={{ margin: '0 0 12px', color: 'var(--color-semantic-label-neutral)', fontSize: 11, lineHeight: 1.4, fontWeight: 'var(--fw-extra)', letterSpacing: 1.6, textTransform: 'uppercase' }}>
        TelemetryGauge
      </div>
      <div style={{ display: 'flex', gap: 26, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <TelemetryGauge value={82} unit="%" label="배터리" thresholds={{ low: 20, high: 50, direction: 'higher-is-better' }} />
        <TelemetryGauge value={14} unit="%" label="배터리" thresholds={{ low: 20, high: 50, direction: 'higher-is-better' }} />
        <TelemetryGauge value={1.4} max={2} unit="m/s" label="속도" tone="signal" statusLabel="주행 중" size={104} />
        <TelemetryGauge value={68} unit="%" label="신호" tone="positive" statusLabel="안정" size={104} />
      </div>
    </div>
  ),
};
