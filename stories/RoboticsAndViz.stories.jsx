import React from 'react';
import {
  RobotStatusCard,
} from './lds.js';
import {
  RobotStatusCardCard as RobotStatusCardCardStory,
} from './RoboticsAndViz.shared.jsx';

const waitFor = async (predicate, message) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(message);
};

const contractRobots = [
  { id: 'r1', name: 'AMR-07', status: 'online', battery: 86, mode: '순찰' },
  { id: 'r2', name: 'Forklift-B2', status: 'reconnecting', battery: 47, mode: '수동' },
  { id: 'r3', name: 'Docking-03', status: 'offline', battery: 12, mode: '충전' },
];

function RobotCardContractFixture() {
  const [selected, setSelected] = React.useState('r1');
  return (
    <main data-testid="robot-card-contract" style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 360 }}>
      <div data-interactive style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {contractRobots.map((r) => (
          <RobotStatusCard key={r.id} name={r.name} status={r.status} battery={r.battery} mode={r.mode}
            selected={selected === r.id} onClick={() => setSelected(r.id)} />
        ))}
      </div>
      <div data-static>
        <RobotStatusCard name="Docking-09" status="online" battery={50} mode="대기" />
      </div>
    </main>
  );
}

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

export const KeyboardAndSelectionContract = {
  name: '상호작용 · 키보드와 선택 계약',
  tags: ['!dev'],
  parameters: {
    docs: {
      description: {
        story:
          'onClick이 있는 카드가 role="button"·Tab 도달·Enter/Space 활성화·로봇 이름으로 명명·aria-pressed로 선택 노출·상태 클러스터를 aria-describedby로 연결하는지, onClick이 없는 카드는 위젯 시맨틱 없이 표시용으로 남는지 자동 검증합니다. 키보드 조작 불가·이름 부재·색만으로 선택 전달 회귀를 고정하는 계약입니다.',
      },
    },
  },
  render: () => <RobotCardContractFixture />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="robot-card-contract"]');
    if (!root) throw new Error('RobotStatusCard contract fixture did not render.');
    const doc = root.ownerDocument;
    const cards = [...root.querySelector('[data-interactive]').children];
    if (cards.length !== 3) throw new Error('Expected three interactive cards.');

    cards.forEach((card) => {
      if (card.getAttribute('role') !== 'button') throw new Error('An onClick card must expose role="button".');
      if (card.getAttribute('tabindex') !== '0') throw new Error('An onClick card must be reachable with Tab.');
      const labelId = card.getAttribute('aria-labelledby');
      const labelEl = labelId && doc.getElementById(labelId);
      if (!labelEl || !labelEl.textContent.trim()) throw new Error('A card must be named by its robot name.');
      const describedId = card.getAttribute('aria-describedby');
      if (!describedId || !doc.getElementById(describedId)) throw new Error('A card must describe its status cluster.');
      if (card.querySelectorAll('a[href],button,input,select,textarea,[tabindex]').length !== 0) {
        throw new Error('A card must not contain nested focusable elements.');
      }
    });

    if (cards.map((card) => card.getAttribute('aria-pressed')).join(',') !== 'true,false,false') {
      throw new Error('aria-pressed must expose which card is selected (not colour alone).');
    }
    if (doc.getElementById(cards[0].getAttribute('aria-labelledby')).textContent.trim() !== 'AMR-07') {
      throw new Error('The accessible name must be the robot name.');
    }

    const KeyboardEvent = doc.defaultView.KeyboardEvent;
    cards[1].focus();
    cards[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await waitFor(() => cards[1].getAttribute('aria-pressed') === 'true' && cards[0].getAttribute('aria-pressed') === 'false',
      'Enter must activate the focused card.');

    cards[2].focus();
    cards[2].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await waitFor(() => cards[2].getAttribute('aria-pressed') === 'true' && cards[1].getAttribute('aria-pressed') === 'false',
      'Space must activate the focused card.');

    const staticCard = root.querySelector('[data-static]').firstElementChild;
    if (staticCard.getAttribute('role') !== null || staticCard.getAttribute('tabindex') !== null || staticCard.getAttribute('aria-pressed') !== null) {
      throw new Error('A card without onClick must stay presentational (no button semantics).');
    }

    cards.forEach((card) => card.blur && card.blur());
  },
};
