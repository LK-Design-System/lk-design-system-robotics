import React from 'react';
import { userEvent } from 'storybook/test';
import { RobotStatusCard } from '../src/index.js';
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

function RobotStateOverview() {
  const [selected, setSelected] = React.useState('r1');
  return (
    <main style={{ display: 'grid', gap: 'var(--space-6)', width: '100%', maxWidth: 1024, minWidth: 0 }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {contractRobots.map((robot) => (
          <RobotStatusCard
            key={robot.id}
            name={robot.name}
            status={robot.status}
            battery={robot.battery}
            mode={robot.mode}
            selected={selected === robot.id}
            onClick={() => setSelected(robot.id)}
          />
        ))}
      </section>
    </main>
  );
}

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

function RobotDensityVariants() {
  const renderStatePair = (density) => (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      {[
        { label: '선택 안 됨', selected: false },
        { label: '선택됨', selected: true },
      ].map((state) => (
        <div
          key={state.label}
          data-density-state={state.selected ? 'selected' : 'unselected'}
          style={{ display: 'grid', gap: 'var(--space-1)' }}
        >
          <span
            style={{
              color: 'var(--color-semantic-label-alternative)',
              fontSize: 'var(--label2-size)',
              lineHeight: 'var(--label2-line)',
            }}
          >
            {state.label}
          </span>
          <RobotStatusCard
            name="AMR-07"
            status="online"
            battery={86}
            mode="순찰"
            density={density}
            selected={state.selected}
          />
        </div>
      ))}
    </div>
  );

  return (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        alignItems: 'start',
        gap: 'var(--space-6)',
        width: '100%',
        maxWidth: 760,
      }}
    >
      <section aria-label="편안한 밀도" style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <strong>Comfortable</strong>
        {renderStatePair('comfortable')}
      </section>
      <section aria-label="Fleet용 조밀한 밀도" style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <strong>Compact</strong>
        {renderStatePair('compact')}
      </section>
      <section
        aria-label="한 줄 밀도"
        style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}
      >
        <strong>Single-line</strong>
        {renderStatePair('single-line')}
      </section>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Status/Robot State',
  tags: ['autodocs'],
  component: RobotStatusCard,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-status-robot-state--robot-state',
      eyebrow: 'Robotics / Robot State',
      title: '로봇 상태 카드는 편대의 연결·배터리·모드를 한눈에 읽습니다',
      description:
        '여러 로봇의 운영 가능 상태를 나란히 비교할 때 적합합니다. 상태는 색과 라벨을 함께 써서 전달하며, 단일 로봇의 상세 제어에는 이 카드 대신 제어 패널을 사용하세요.',
    },
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
  render: () => <RobotStateOverview />,
};

export const DensityVariants = {
  name: '밀도 · Comfortable / Compact / Single-line',
  parameters: {
    docs: {
      description: {
        story:
          '동일한 RobotStatusCard를 단일 로봇 선택 카드, Fleet 목록 행, 고밀도 한 줄 행에 맞는 세 밀도로 비교합니다. Single-line은 로봇명·연결·배터리·모드를 한 행에 유지하고 공간이 부족하면 로봇명을 먼저 말줄임합니다.',
      },
    },
  },
  render: () => <RobotDensityVariants />,
  play: async ({ canvasElement }) => {
    ['comfortable', 'compact', 'single-line'].forEach((density) => {
      // Scope to card roots: the packaged RobotStatusCell renders its own
      // nested data-density node, so a bare density query over-matches.
      const cards = [...canvasElement.querySelectorAll(`[data-robot-status-card][data-density="${density}"]`)];
      if (
        cards.length !== 2
        || cards.map((card) => card.getAttribute('data-selected')).join(',') !== 'false,true'
      ) {
        throw new Error(`${density} must show unselected and selected RobotStatusCard states.`);
      }
    });
    const singleLine = canvasElement.querySelector(
      '[data-density-state="unselected"] [data-robot-status-card][data-density="single-line"]',
    );
    if (!singleLine) throw new Error('Unselected single-line RobotStatusCard did not render.');
    const content = singleLine.children[1];
    const description = content?.children[1];
    const contentStyle = content && getComputedStyle(content);
    const descriptionStyle = description && getComputedStyle(description);
    if (
      contentStyle?.display !== 'flex'
      || contentStyle?.alignItems !== 'center'
      || descriptionStyle?.marginTop !== '0px'
    ) {
      throw new Error('Single-line density must keep identity and telemetry on one row.');
    }
  },
};

export const RobotStatusCardCard = { ...RobotStatusCardCardStory, name: 'RobotStatusCard card parity', tags: ['!dev', 'visual-parity'] };

export const KeyboardAndSelectionContract = {
  name: '상호작용 · 키보드와 선택 계약',
  tags: ['!dev'],
  parameters: {
    docs: {
      description: {
        story:
          'onClick이 있는 카드가 role="button"·Tab 도달·Enter/Space 활성화·로봇 이름으로 명명·aria-pressed로 선택 노출·상태 클러스터를 aria-describedby로 연결하는지 자동 검증합니다. 선택은 primary surface와 border, 키보드 포커스는 별도 외곽 outline을 사용해 두 상태가 동시에 남아야 합니다.',
      },
    },
  },
  render: () => <RobotCardContractFixture />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="robot-card-contract"]');
    if (!root) throw new Error('RobotStatusCard contract fixture did not render.');
    const doc = root.ownerDocument;
    const cards = [...root.querySelectorAll('[data-interactive] [data-robot-status-card]')];
    if (cards.length !== 3) throw new Error('Expected three interactive cards.');
    if (cards.some((card) => !card.hasAttribute('data-robot-status-cell'))) {
      throw new Error('RobotStatusCard must use the shared robot status cell.');
    }
    if (cards.some((card) => !card.querySelector('.lk-status-badge'))) {
      throw new Error('RobotStatusCard mode must use the LDS Core StatusBadge.');
    }

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
    const selectedSurface = cards[0].parentElement;
    if (
      cards[0].getAttribute('data-selected') !== 'true'
      || cards[1].getAttribute('data-selected') !== 'false'
      || selectedSurface?.style.background !== 'var(--color-semantic-primary-surface-normal)'
      || selectedSurface?.style.border.includes('primary-normal') === false
      || selectedSurface?.style.boxShadow.includes('focus')
    ) {
      throw new Error('Selected card paint must use primary surface/border without borrowing the focus ring token.');
    }

    await userEvent.tab();
    if (
      doc.activeElement !== cards[0]
      || !cards[0].matches(':focus-visible')
      || doc.defaultView.getComputedStyle(cards[0]).outlineStyle === 'none'
    ) {
      throw new Error('Keyboard focus must add an independent focus-visible outline to the selected card.');
    }

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => cards[1].getAttribute('aria-pressed') === 'true' && cards[0].getAttribute('aria-pressed') === 'false',
      'Enter must activate the focused card.');

    await userEvent.tab();
    await userEvent.keyboard(' ');
    await waitFor(() => cards[2].getAttribute('aria-pressed') === 'true' && cards[1].getAttribute('aria-pressed') === 'false',
      'Space must activate the focused card.');

    const staticCard = root.querySelector('[data-static] [data-robot-status-card]');
    if (staticCard.getAttribute('role') !== null || staticCard.getAttribute('tabindex') !== null || staticCard.getAttribute('aria-pressed') !== null) {
      throw new Error('A card without onClick must stay presentational (no button semantics).');
    }

    cards.forEach((card) => card.blur && card.blur());
  },
};
