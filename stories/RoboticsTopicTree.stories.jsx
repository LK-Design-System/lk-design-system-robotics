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

export const TopicTreeCard = { ...TopicTreeCardStory, name: 'TopicTree card parity', tags: ['!dev', 'visual-parity'] };
