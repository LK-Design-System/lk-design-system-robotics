import {
  RobotStatusCard,
} from './lds.js';
import {
  RobotStatusCardCard as RobotStatusCardCardStory,
} from './RoboticsAndViz.shared.jsx';

const meta = {
  title: 'LDS Robotics/Status/Robot State',
  parameters: {
    docs: {
      description: {
        component: '로봇의 연결, 배터리, 모드, 선택 상태를 한 행으로 보여주는 RobotStatusCard 패턴입니다.',
      },
    },
  },
};

export default meta;

export const RobotState = {
  name: '개요',
  parameters: {
    docs: {
      description: {
        story:
          'online·reconnecting·offline과 배터리 12~86%를 나란히 봅니다. 상태색만으로 안전을 전달하지 않고 라벨이 함께 읽히는지, offline·저배터리 로봇이 먼저 눈에 띄는지 확인하세요.',
      },
    },
  },
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-6)', width: '100%', maxWidth: 920, minWidth: 0 }}>
      <header style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <p className="lk-overline lk-overline--signal" style={{ margin: 0 }}>
          Robotics / Robot State
        </p>
        <h1 style={{ margin: 0, color: 'var(--color-semantic-label-strong)', fontSize: 'var(--title2-size)', lineHeight: 'var(--title2-line)' }}>
          로봇 상태 카드는 편대의 연결·배터리·모드를 한눈에 읽습니다
        </h1>
        <p style={{ margin: 0, maxWidth: 760, color: 'var(--color-semantic-label-neutral)', lineHeight: 1.7 }}>
          여러 로봇의 운영 가능 상태를 나란히 비교할 때 적합합니다. online은 정상, reconnecting은 통신 회복 대기,
          offline은 개입 필요를 뜻하며, 상태는 색과 라벨을 함께 써서 전달합니다. 단일 로봇의 상세 제어에는 이 카드
          대신 제어 패널을 쓰세요.
        </p>
      </header>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <RobotStatusCard name="AMR-07" status="online" battery={86} mode="순찰" selected />
        <RobotStatusCard name="Forklift-B2" status="reconnecting" battery={47} mode="수동" />
        <RobotStatusCard name="Docking-03" status="offline" battery={12} mode="충전" />
      </section>
    </main>
  ),
};

export const RobotStatusCardCard = { ...RobotStatusCardCardStory, name: 'RobotStatusCard card parity', tags: ['!dev', 'visual-parity'] };
