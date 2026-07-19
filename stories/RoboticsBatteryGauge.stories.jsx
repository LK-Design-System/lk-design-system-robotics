import { BatteryGauge } from './lds.js';

const meta = {
  title: 'LDS Robotics/Status/Battery Gauge',
  parameters: {
    docs: {
      description: {
        component: '배터리 잔량을 셸 + 레벨색 fill + % 표기로 보여주는 BatteryGauge 패턴입니다. 색은 잔량을 따릅니다: ≤20% red · ≤50% amber · else green.',
      },
    },
  },
};

export default meta;

export const BatteryLevels = {
  name: '개요',
  parameters: {
    docs: {
      description: {
        story:
          '정상·주의·위험 구간과 sm 크기, 라벨 숨김을 봅니다. 저잔량이 색과 숫자로 동시에 읽히는지, 작은 크기에서도 값이 판독되는지 확인하세요.',
      },
    },
  },
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: 720 }}>
      <header style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <p className="lk-overline lk-overline--signal" style={{ margin: 0 }}>
          Robotics / Battery Gauge
        </p>
        <h1 style={{ margin: 0, color: 'var(--color-semantic-label-strong)', fontSize: 'var(--title2-size)', lineHeight: 'var(--title2-line)' }}>
          배터리 게이지는 잔량을 색과 숫자로 함께 알립니다
        </h1>
        <p style={{ margin: 0, maxWidth: 640, color: 'var(--color-semantic-label-neutral)', lineHeight: 1.7 }}>
          로봇·설비의 배터리 잔량을 한눈에 판단해야 할 때 적합합니다. 색은 잔량 구간을 따르되(≤20% 위험, ≤50%
          주의, 그 외 정상) 색만으로 판단하지 않도록 % 숫자를 항상 함께 보여 줍니다. 상세 전력 추이에는 이 게이지
          대신 차트를 쓰세요.
        </p>
      </header>
      <section style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'center' }}>
        <BatteryGauge value={86} />
        <BatteryGauge value={47} />
        <BatteryGauge value={12} />
      </section>
      <section style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'center' }}>
        <BatteryGauge value={86} size="sm" />
        <BatteryGauge value={47} size="sm" />
        <BatteryGauge value={12} size="sm" showLabel={false} />
      </section>
    </main>
  ),
};
