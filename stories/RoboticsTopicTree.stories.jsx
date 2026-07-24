import React from 'react';
import { userEvent, waitFor } from 'storybook/test';
import { TopicTree } from './lds.js';
import { TopicTreeCard as TopicTreeCardStory } from './RoboticsAndViz.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Data/Topic Tree',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-data-topic-tree--topic-tree-pattern',
      eyebrow: 'Robotics / Topic Tree',
      title: '토픽 트리는 네임스페이스와 구독 가능 상태를 계층으로 탐색하게 합니다',
      description:
        '운영자나 개발자가 ROS 토픽 구조를 훑고 구독 대상을 선택해야 할 때 적합합니다. 계층 관계가 없거나 값 자체를 비교하는 화면에는 Topic Tree 대신 목록이나 텔레메트리 표를 사용하세요.',
    },
    docs: {
      description: {
        component: 'ROS 토픽, 네임스페이스, 구독 상태를 계층으로 확인하는 TopicTree 패턴입니다.',
      },
    },
  },
};

export default meta;

const topicNodes = [
  {
    name: '/fleet',
    type: 'namespace',
    children: [
      { name: '/amr_07/status', type: 'lk_msgs/RobotStatus', hz: 5, subscribable: true, subscribed: true },
      { name: '/amr_07/scan', type: 'sensor_msgs/LaserScan', hz: 12, subscribable: true },
      { name: '/dock_03/battery', type: 'std_msgs/Float32', hz: 1, subscribable: true },
    ],
  },
];

export const TopicTreePattern = {
  name: '개요',
  parameters: storyDescription(
    'fleet 네임스페이스 아래 상태·스캔·배터리 토픽을 탐색하는 상황입니다. 계층, 메시지 타입, 주기와 구독 상태가 한 행에서 구분되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ maxWidth: 520, border: '1px solid var(--color-semantic-line-normal-normal)', borderRadius: 'var(--radius-lg)', background: 'var(--color-semantic-background-elevated-normal)', padding: 'var(--space-2)' }}>
      <TopicTree nodes={topicNodes} />
    </main>
  ),
};

export const KeyboardNavigationContract = {
  name: '트리 키보드 내비게이션 계약',
  tags: ['!dev'],
  parameters: storyDescription(
    'APG 트리 패턴 계약을 고정하는 fixture입니다. 리프를 포함한 모든 행이 roving tabindex로 포커스 가능하고, 방향키·Home/End 내비게이션과 aria-level·role=group이 계층을 전달하며, 구독 Switch가 탭 순서에서 빠진 채 행의 Enter로 토글되는지 확인하세요.',
  ),
  render: function Example() {
    const [subs, setSubs] = React.useState({ '/amr_07/status': true });
    const nodes = [
      {
        name: '/fleet',
        type: 'namespace',
        children: [
          { name: '/amr_07/status', type: 'lk_msgs/RobotStatus', hz: 5, subscribable: true, subscribed: !!subs['/amr_07/status'] },
          { name: '/amr_07/scan', type: 'sensor_msgs/LaserScan', hz: 12, subscribable: true, subscribed: !!subs['/amr_07/scan'] },
          { name: 'tf', children: [{ name: 'map' }, { name: 'base_link' }] },
        ],
      },
      { name: '/diagnostics', type: 'diagnostic_msgs/DiagnosticArray', hz: 1, subscribable: true, subscribed: !!subs['/diagnostics'] },
    ];
    return (
      <main
        data-testid="topic-tree-contract"
        style={{ width: 480, maxWidth: 'calc(100vw - 48px)', border: '1px solid var(--color-semantic-line-normal-normal)', borderRadius: 'var(--radius-lg)', background: 'var(--color-semantic-background-elevated-normal)', padding: 'var(--space-2)' }}
      >
        <TopicTree nodes={nodes} onToggleSubscribe={(node) => setSubs((state) => ({ ...state, [node.name]: !state[node.name] }))} />
      </main>
    );
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('[data-testid="topic-tree-contract"]');
    const tree = host?.querySelector('[role="tree"]');
    if (!tree || !(tree.getAttribute('aria-label') || '').length) throw new Error('TopicTree must render a named role=tree.');
    const rows = () => Array.from(tree.querySelectorAll('[role="treeitem"]'));
    const rowByText = (text) => rows().find((row) => (row.textContent || '').includes(text));

    if (!rows().every((row) => row.hasAttribute('tabindex'))) {
      throw new Error('Every treeitem — leaves included — must be focusable via a roving tabindex.');
    }
    if (rows().filter((row) => row.getAttribute('tabindex') === '0').length !== 1) {
      throw new Error('A roving tree must expose exactly one tab stop.');
    }
    if (rows()[0].getAttribute('tabindex') !== '0') throw new Error('The initial tab stop must be the first row.');

    const fleet = rowByText('/fleet');
    const status = rowByText('/amr_07/status');
    if (fleet.getAttribute('aria-level') !== '1' || status.getAttribute('aria-level') !== '2') {
      throw new Error('aria-level must reflect each row depth.');
    }
    if (!tree.querySelector('[role="group"] [role="treeitem"]')) throw new Error('Child rows must be wrapped in a role=group.');

    const statusLabel = status.getAttribute('aria-label') || '';
    if (!statusLabel.includes('lk_msgs/RobotStatus') || !statusLabel.includes('5 Hz')) {
      throw new Error('A leaf row must announce its message type and rate.');
    }
    if (status.querySelector('[role="switch"]').tabIndex !== -1) {
      throw new Error('The subscribe switch must be pulled out of the page tab sequence.');
    }

    fleet.focus();
    fleet.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => {
      if (document.activeElement !== rowByText('/amr_07/status')) throw new Error('ArrowDown must move focus to the next visible row.');
      if (rowByText('/amr_07/status').getAttribute('tabindex') !== '0' || rowByText('/fleet').getAttribute('tabindex') !== '-1') {
        throw new Error('The roving tab stop must follow arrow-key focus.');
      }
    });

    const tf = rowByText('tf');
    tf.focus();
    if (tf.getAttribute('aria-expanded') !== 'false') throw new Error('The tf group must start collapsed.');
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => { if (rowByText('tf').getAttribute('aria-expanded') !== 'true') throw new Error('ArrowRight must expand a collapsed group.'); });
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      const map = rowByText('map');
      if (document.activeElement !== map || map.getAttribute('aria-level') !== '3') throw new Error('ArrowRight on an expanded group must enter its first child.');
    });

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => { if (document.activeElement !== rowByText('tf')) throw new Error('ArrowLeft on a child must move to its parent.'); });
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => { if (rowByText('tf').getAttribute('aria-expanded') !== 'false') throw new Error('ArrowLeft on an expanded group must collapse it.'); });

    await userEvent.keyboard('{End}');
    await waitFor(() => { if (document.activeElement !== rowByText('/diagnostics')) throw new Error('End must jump to the last row.'); });
    await userEvent.keyboard('{Home}');
    await waitFor(() => { if (document.activeElement !== rowByText('/fleet')) throw new Error('Home must jump to the first row.'); });

    const diagnostics = rowByText('/diagnostics');
    diagnostics.focus();
    const beforeChecked = diagnostics.querySelector('[role="switch"]').getAttribute('aria-checked');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      const now = rowByText('/diagnostics');
      if (beforeChecked !== 'false' || now.querySelector('[role="switch"]').getAttribute('aria-checked') !== 'true') {
        throw new Error('Enter on a subscribable leaf must toggle its subscription.');
      }
      if (!(now.getAttribute('aria-label') || '').includes('구독 켜짐')) throw new Error('The row must announce the updated subscription state.');
    });

    rowByText('/fleet').focus();
    document.activeElement?.blur?.();
  },
};

export const TopicTreeCard = { ...TopicTreeCardStory, name: 'TopicTree card parity', tags: ['!dev', 'visual-parity'] };
