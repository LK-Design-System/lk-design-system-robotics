import { FloorSelector } from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Viewer/Floor Selector',
  component: FloorSelector,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-viewer-floor-selector--floor-selection',
      eyebrow: 'Robotics / Floor Selector',
      title: '층 선택기는 현재 지도 레벨을 빠르게 전환하고 활성 층을 분명히 표시합니다',
      description:
        '운영자가 다층 건물 지도에서 한 층을 반복해서 전환해야 할 때 적합합니다. 선택지가 많거나 층 외의 복잡한 필터에는 Floor Selector 대신 Select 또는 Tree를 사용하세요.',
    },
    docs: {
      description: {
        component: '맵·플로어 뷰의 우측 컨트롤로 쓰는 빌딩 층/레벨 선택기입니다. 단일 선택 리스트이며 활성 층은 시그널 잉크로 채워집니다.',
      },
    },
  },
};

export default meta;

const floors = [
  { value: '3F', label: '3F' },
  { value: '2F', label: '2F' },
  { value: '1F', label: '1F' },
  { value: 'B1', label: 'B1' },
];

export const FloorSelection = {
  name: '개요',
  parameters: storyDescription(
    '지상 3층부터 지하 1층까지 있는 건물 지도에서 현재 층을 전환합니다. 활성 층이 색 외에도 선택 상태로 전달되고 층 순서가 공간적 기대와 맞는지 확인하세요.',
  ),
  render: () => (
    <main style={{ maxWidth: 200 }}>
      <FloorSelector floors={floors} defaultValue="1F" />
    </main>
  ),
};

export const StringFloors = {
  name: '문자열 층 목록',
  tags: ['!dev'],
  parameters: storyDescription(
    '객체 대신 문자열 배열로 층 목록을 전달하는 호환 상황입니다. 기본 선택값과 각 층 라벨이 동일하게 작동하며 선택 변경이 안정적으로 유지되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ maxWidth: 200 }}>
      <FloorSelector floors={['5F', '4F', '3F', '2F', '1F']} defaultValue="3F" />
    </main>
  ),
};
