import { FloorSelector } from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';

const waitFor = async (predicate, message) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(message);
};

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

export const RadioGroupKeyboardContract = {
  name: '상호작용 · 라디오 그룹 키보드 계약',
  tags: ['!dev'],
  parameters: {
    docs: {
      description: {
        story:
          'radiogroup·radio·aria-checked 시맨틱, 단일 tab stop(선택 항목만 tabbable), 화살표 이동+선택, Home/End, 끝에서의 wrap, 클릭 선택을 자동 검증합니다. 선언은 listbox인데 화살표 이동이 없고 층마다 tab stop이 생기던 가짜 listbox 회귀를 고정하는 계약입니다.',
      },
    },
  },
  render: () => (
    <main data-testid="floor-contract" style={{ maxWidth: 200 }}>
      <FloorSelector floors={floors} defaultValue="1F" />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="floor-contract"]');
    if (!root) throw new Error('FloorSelector contract fixture did not render.');
    const doc = root.ownerDocument;
    const group = root.querySelector('[role="radiogroup"]');
    if (!group) throw new Error('FloorSelector must expose role="radiogroup".');
    if (!group.getAttribute('aria-label')) throw new Error('The radio group must have an accessible name.');

    const radios = () => [...group.querySelectorAll('[role="radio"]')];
    const checked = () => radios().find((r) => r.getAttribute('aria-checked') === 'true');
    const tabbable = () => radios().filter((r) => r.getAttribute('tabindex') === '0');

    const items = radios();
    if (items.length !== 4) throw new Error('Expected four floor radios.');
    if (items.some((r) => r.getAttribute('role') !== 'radio')) throw new Error('Each floor must be role="radio".');
    if (radios().filter((r) => r.getAttribute('aria-checked') === 'true').length !== 1) {
      throw new Error('Exactly one radio must be checked.');
    }
    if (tabbable().length !== 1 || radios().filter((r) => r.getAttribute('tabindex') === '-1').length !== 3) {
      throw new Error('A radio group must have a single tab stop, not one per floor.');
    }
    if (checked().textContent.trim() !== '1F' || tabbable()[0].textContent.trim() !== '1F') {
      throw new Error('The checked floor must be the single tab stop.');
    }

    const KeyboardEvent = doc.defaultView.KeyboardEvent;
    const press = (key) => {
      const current = checked();
      current.focus();
      current.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    };

    press('ArrowDown');
    await waitFor(() => checked() && checked().textContent.trim() === 'B1' && doc.activeElement === checked(),
      'ArrowDown must move selection and focus to the next floor.');
    if (tabbable().length !== 1 || tabbable()[0].textContent.trim() !== 'B1') {
      throw new Error('The single tab stop must follow the selection.');
    }

    press('ArrowUp');
    await waitFor(() => checked() && checked().textContent.trim() === '1F', 'ArrowUp must move to the previous floor.');

    press('Home');
    await waitFor(() => checked() && checked().textContent.trim() === '3F', 'Home must select the first floor.');

    press('End');
    await waitFor(() => checked() && checked().textContent.trim() === 'B1', 'End must select the last floor.');

    press('ArrowDown');
    await waitFor(() => checked() && checked().textContent.trim() === '3F', 'ArrowDown must wrap from the last floor to the first.');

    const twoF = radios().find((r) => r.textContent.trim() === '2F');
    twoF.click();
    await waitFor(() => twoF.getAttribute('aria-checked') === 'true', 'Clicking a floor must select it.');

    radios().forEach((r) => r.blur && r.blur());
  },
};
