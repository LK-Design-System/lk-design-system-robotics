import React from 'react';
import { EditorToolbar } from './lds.js';
import { EditorStoryFrame, editorTools } from './EditorShell.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Editor/Editor Toolbar',
  component: EditorToolbar,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-editor-editor-toolbar--vertical',
      eyebrow: 'Robotics / Editor Toolbar',
      title: '에디터 툴바는 현재 캔버스 편집 모드를 하나만 선택하게 합니다',
      description:
        '선택·영역·확대·이동처럼 서로 배타적인 편집 모드를 전환할 때 적합합니다. 저장이나 삭제 같은 즉시 실행 명령에는 Editor Toolbar 대신 Command Bar 또는 Button을 사용하세요.',
    },
    docs: {
      description: {
        component:
          'EditorToolbar는 캔버스 편집 모드 중 하나를 선택하는 32px 단일 선택 도구 그룹입니다. roving Tab stop, 방향키, Home/End와 ARIA 단축키 선언을 지원하며, 외곽 rail surface와 divider는 상위 편집 셸이 소유합니다.',
      },
    },
  },
};

export default meta;

const toolsWithShortcuts = editorTools.map((item, index) => ({
  ...item,
  shortcut: ['V', 'R', 'Z', 'M'][index],
  ariaKeyShortcuts: ['V', 'R', 'Z', 'M'][index],
}));

function ToolbarExample({ orientation = 'vertical', disabled = false, itemDisabled = false, dynamicOrder = false, initialValue = 'select', uncontrolled = false }) {
  const [value, setValue] = React.useState(initialValue);
  const [reportedValue, setReportedValue] = React.useState(initialValue);
  const [changeCount, setChangeCount] = React.useState(0);
  const [reversed, setReversed] = React.useState(false);
  const baseItems = itemDisabled
    ? toolsWithShortcuts.map((item) => item.value === 'region' ? { ...item, disabled: true, disabledReason: '읽기 전용 레이어에서는 영역을 편집할 수 없습니다.' } : item)
    : toolsWithShortcuts;
  const items = reversed ? [...baseItems].reverse() : baseItems;
  const handleChange = (nextValue) => {
    if (!uncontrolled) setValue(nextValue);
    setReportedValue(nextValue);
    setChangeCount((count) => count + 1);
  };
  return (
    <EditorStoryFrame maxWidth={orientation === 'vertical' ? 96 : 260} height={orientation === 'vertical' ? 220 : 72}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'flex-start',
        }}
      >
        <EditorToolbar
          data-testid="editor-toolbar"
          items={items}
          value={uncontrolled ? undefined : value}
          defaultValue={uncontrolled ? initialValue : undefined}
          onChange={handleChange}
          orientation={orientation}
          disabled={disabled}
          disabledReason={disabled ? '현재 문서는 읽기 전용입니다.' : undefined}
        />
      </div>
      {dynamicOrder && (
        <button data-testid="reverse-tools" type="button" hidden onClick={() => setReversed((current) => !current)}>
          도구 순서 반전
        </button>
      )}
      <output data-testid="selected-tool" hidden>{reportedValue}</output>
      <output data-testid="change-count" hidden>{changeCount}</output>
    </EditorStoryFrame>
  );
}

function pressKey(element, key) {
  const view = element.ownerDocument.defaultView;
  element.dispatchEvent(new view.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function waitForRender() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

export const Vertical = {
  name: '개요',
  parameters: storyDescription(
    '캔버스 왼쪽에 세로 방향의 단일 선택 편집 도구를 배치한 기본 상황입니다. 선택 모드와 roving Tab stop이 일치하고 Home·End 키가 시각적 순서대로 이동하는지 확인하세요.',
  ),
  render: () => <ToolbarExample uncontrolled initialValue="region" />,
  play: async ({ canvasElement }) => {
    const toolbar = canvasElement.querySelector('[data-testid="editor-toolbar"]');
    const items = Array.from(toolbar.querySelectorAll('[data-lk-editor-toolbar-item]'));
    const rect = toolbar.getBoundingClientRect();
    const expectedMainSize = items.length * 32 + (items.length - 1) * 4;
    if (toolbar.getAttribute('aria-orientation') !== 'vertical' || !toolbar.getAttribute('aria-label')) {
      throw new Error('EditorToolbar must expose its orientation and accessible name.');
    }
    if (items.filter((item) => item.tabIndex === 0).length !== 1) {
      throw new Error('EditorToolbar must expose exactly one Tab stop.');
    }
    if (Math.abs(rect.width - 32) > 1 || Math.abs(rect.height - expectedMainSize) > 1) {
      throw new Error('A vertical EditorToolbar must keep its shared 32px control geometry and intrinsic length.');
    }
    if (items[2].getAttribute('aria-pressed') !== 'true' || items[2].tabIndex !== 0) {
      throw new Error('defaultValue must select the initial uncontrolled editor mode and Tab stop.');
    }
    items[1].click();
    await waitForRender();
    if (items[1].getAttribute('aria-pressed') !== 'true' || items[2].getAttribute('aria-pressed') !== 'false' || canvasElement.querySelector('[data-testid="selected-tool"]').textContent !== 'route') {
      throw new Error('An uncontrolled EditorToolbar did not update its internal selection.');
    }
    items[0].focus();
    pressKey(items[0], 'End');
    if (canvasElement.ownerDocument.activeElement !== items.at(-1)) {
      throw new Error('Vertical End did not move focus to the final editor tool.');
    }
    pressKey(items.at(-1), 'Home');
    if (canvasElement.ownerDocument.activeElement !== items[0]) {
      throw new Error('Vertical Home did not move focus to the first editor tool.');
    }
    items[0].blur();
  },
};

export const Horizontal = {
  name: '시나리오 · 가로 도구 막대',
  parameters: storyDescription(
    '좁은 높이나 상단 배치에 맞춰 도구를 가로로 제공하는 상황입니다. 방향키 이동이 가로 축을 따르고 포커스 이동만으로 선택 모드가 바뀌지 않는지 확인하세요.',
  ),
  render: () => <ToolbarExample orientation="horizontal" initialValue="region" />,
  play: async ({ canvasElement }) => {
    const toolbar = canvasElement.querySelector('[data-testid="editor-toolbar"]');
    const items = Array.from(toolbar.querySelectorAll('[data-lk-editor-toolbar-item]'));
    const rect = toolbar.getBoundingClientRect();
    const expectedMainSize = items.length * 32 + (items.length - 1) * 4;
    if (Math.abs(rect.height - 32) > 1 || Math.abs(rect.width - expectedMainSize) > 1) {
      throw new Error('A horizontal EditorToolbar must keep its shared 32px control geometry and intrinsic length.');
    }
    if (items[2].getAttribute('aria-pressed') !== 'true' || items[2].tabIndex !== 0 || items[0].tabIndex !== -1) {
      throw new Error('The selected non-first editor tool must be the initial roving Tab stop.');
    }
    items[0].focus();
    pressKey(items[0], 'ArrowRight');
    if (canvasElement.ownerDocument.activeElement !== items[1]) {
      throw new Error('ArrowRight did not move focus in the horizontal EditorToolbar.');
    }
    if (items[2].getAttribute('aria-pressed') !== 'true') {
      throw new Error('Moving focus must not change the selected editor tool.');
    }
    pressKey(items[1], 'End');
    if (canvasElement.ownerDocument.activeElement !== items.at(-1)) {
      throw new Error('End did not move focus to the final editor tool.');
    }
    pressKey(items.at(-1), 'Home');
    if (canvasElement.ownerDocument.activeElement !== items[0]) {
      throw new Error('Home did not move focus to the first editor tool.');
    }
    items[0].blur();
  },
};

export const Disabled = {
  name: '변형·상태 · 전체 비활성',
  parameters: storyDescription(
    '읽기 전용 또는 편집 잠금으로 모든 캔버스 도구를 사용할 수 없는 상황입니다. 비활성 이유가 그룹에 전달되고 모든 항목이 입력과 Tab 순서에서 제외되는지 확인하세요.',
  ),
  render: () => <ToolbarExample disabled />,
  play: async ({ canvasElement }) => {
    const toolbar = canvasElement.querySelector('[data-testid="editor-toolbar"]');
    const items = Array.from(toolbar.querySelectorAll('[data-lk-editor-toolbar-item]'));
    if (toolbar.getAttribute('aria-disabled') !== 'true') {
      throw new Error('A globally disabled EditorToolbar must expose aria-disabled.');
    }
    if (!toolbar.getAttribute('aria-description')) {
      throw new Error('A globally disabled EditorToolbar must expose its disabled reason at the group level.');
    }
    if (items.some((item) => !item.disabled || item.getAttribute('aria-disabled') !== 'true' || item.tabIndex !== -1)) {
      throw new Error('Globally disabled editor tools must be native-disabled and absent from the Tab sequence.');
    }
    items[0].click();
    await waitForRender();
    if (canvasElement.querySelector('[data-testid="change-count"]').textContent !== '0') {
      throw new Error('A globally disabled EditorToolbar activated a tool.');
    }
  },
};

export const ItemDisabled = {
  name: '변형·상태 · 개별 비활성 · 동적 순서',
  parameters: storyDescription(
    '일부 편집 모드만 사용할 수 없고 도구 순서가 실행 중 바뀌는 상황입니다. 비활성 항목은 이유와 단축키를 유지하며 선택되지 않고, 재정렬 뒤에도 포커스가 같은 도구를 따라가는지 확인하세요.',
  ),
  render: () => <ToolbarExample itemDisabled dynamicOrder />,
  play: async ({ canvasElement }) => {
    const toolbar = canvasElement.querySelector('[data-testid="editor-toolbar"]');
    const byKey = (key) => toolbar.querySelector(`[data-lk-toolbar-key="${key}"]`);
    const selectedOutput = canvasElement.querySelector('[data-testid="selected-tool"]');
    const changeOutput = canvasElement.querySelector('[data-testid="change-count"]');
    const select = byKey('select');
    const route = byKey('route');
    const region = byKey('region');
    const marker = byKey('marker');

    select.focus();
    pressKey(select, 'ArrowDown');
    pressKey(route, 'ArrowDown');
    if (canvasElement.ownerDocument.activeElement !== region || region.disabled || region.getAttribute('aria-disabled') !== 'true') {
      throw new Error('An individually unavailable editor tool must remain Arrow-reachable via aria-disabled.');
    }
    if (!region.getAttribute('aria-description') || region.getAttribute('aria-keyshortcuts') !== 'Z') {
      throw new Error('An unavailable editor tool must expose its reason and keyboard shortcut.');
    }
    region.click();
    await waitForRender();
    if (selectedOutput.textContent !== 'select' || changeOutput.textContent !== '0') {
      throw new Error('An aria-disabled editor tool must not activate.');
    }

    pressKey(region, 'ArrowDown');
    if (canvasElement.ownerDocument.activeElement !== marker || select.getAttribute('aria-pressed') !== 'true') {
      throw new Error('Focus movement changed selection before activation.');
    }
    marker.click();
    await waitForRender();
    marker.click();
    await waitForRender();
    if (selectedOutput.textContent !== 'marker' || changeOutput.textContent !== '2' || marker.getAttribute('aria-pressed') !== 'true') {
      throw new Error('An active editor mode must remain selected when it is activated again.');
    }

    canvasElement.querySelector('[data-testid="reverse-tools"]').click();
    await waitForRender();
    const reorderedItems = Array.from(toolbar.querySelectorAll('[data-lk-editor-toolbar-item]'));
    if (reorderedItems.map((item) => item.getAttribute('data-lk-toolbar-key')).join(',') !== 'marker,region,route,select') {
      throw new Error('The dynamic-order fixture did not actually reorder the editor tools.');
    }
    if (canvasElement.ownerDocument.activeElement !== marker || marker.tabIndex !== 0) {
      throw new Error('Roving focus did not follow the stable editor-tool value after reordering.');
    }
    if (reorderedItems.filter((item) => item.tabIndex === 0).length !== 1) {
      throw new Error('Reordering created multiple EditorToolbar Tab stops.');
    }
    marker.blur();
  },
};
