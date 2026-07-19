import React from 'react';
import { HistoryToolbar } from './lds.js';
import { EditorStoryFrame } from './EditorShell.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Editor/History Toolbar',
  component: HistoryToolbar,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-editor-history-toolbar--available-history',
      eyebrow: 'Robotics / History Toolbar',
      title: '히스토리 툴바는 되돌리기 가능 여부와 실제 문서 명령을 함께 보여줍니다',
      description:
        '운영자가 편집 이력을 되돌리거나 다시 적용하고 문서를 초기화해야 할 때 적합합니다. 일반 탐색 기록이나 서버 버전 목록에는 History Toolbar 대신 별도 History 패턴을 사용하세요.',
    },
    docs: {
      description: {
        component:
          'HistoryToolbar는 undo·redo 가능 상태와 실제 handler를 함께 검증하고, 문서 초기화를 별도 명령 그룹으로 구분합니다.',
      },
    },
  },
};

export default meta;

function HistoryFrame({ children }) {
  return (
    <EditorStoryFrame maxWidth={420} height="auto">
      <div
        style={{
          display: 'flex',
          padding: 16,
          border: '1px solid var(--color-semantic-line-normal-normal)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-semantic-background-elevated-normal)',
        }}
      >
        {children}
      </div>
    </EditorStoryFrame>
  );
}

function AvailableHistoryFixture() {
  const [available, setAvailable] = React.useState(true);
  const [focusCaptureCount, setFocusCaptureCount] = React.useState(0);
  const action = available ? () => {} : undefined;

  return (
    <>
      <HistoryFrame>
        <HistoryToolbar
          canUndo={available}
          canRedo={available}
          onUndo={action}
          onRedo={action}
          onReset={action}
          onFocusCapture={() => setFocusCaptureCount((count) => count + 1)}
        />
      </HistoryFrame>
      <button data-testid="disable-all-history" type="button" hidden onClick={() => setAvailable(false)}>전체 이력 비활성</button>
      <button data-testid="enable-history" type="button" hidden onClick={() => setAvailable(true)}>이력 다시 활성</button>
      <output data-testid="history-focus-captures" hidden>{focusCaptureCount}</output>
    </>
  );
}

export const AvailableHistory = {
  name: '개요',
  parameters: storyDescription(
    '실행 취소와 다시 실행 이력이 모두 있고 문서 초기화도 가능한 편집 상황입니다. 이력 이동과 되돌릴 수 없는 초기화가 별도 명령 그룹으로 구분되는지 확인하세요.',
  ),
  render: () => <AvailableHistoryFixture />,
  play: async ({ canvasElement }) => {
    const toolbar = canvasElement.querySelector('[role="toolbar"][aria-label="편집 이력"]');
    const enabled = [...(toolbar?.querySelectorAll('[data-lk-history-toolbar-item]:not(:disabled)') ?? [])];
    if (!toolbar || enabled.length !== 3 || enabled.filter((item) => item.tabIndex === 0).length !== 1) {
      throw new Error('HistoryToolbar must expose one roving Tab stop across its enabled commands.');
    }
    enabled[0].focus();
    enabled[0].dispatchEvent(new canvasElement.ownerDocument.defaultView.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    if (canvasElement.ownerDocument.activeElement !== enabled[1] || enabled[1].tabIndex !== 0) {
      throw new Error('HistoryToolbar ArrowRight must advance the shared roving focus.');
    }
    enabled[1].dispatchEvent(new canvasElement.ownerDocument.defaultView.KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    if (canvasElement.ownerDocument.activeElement !== enabled[2]) throw new Error('HistoryToolbar End must focus the final command.');

    enabled[0].focus();
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (Number(canvasElement.querySelector('[data-testid="history-focus-captures"]')?.textContent) < 1) {
      throw new Error('A consumer onFocusCapture handler must compose with the roving-focus engine.');
    }

    canvasElement.querySelector('[data-testid="disable-all-history"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const disabledItems = [...toolbar.querySelectorAll('[data-lk-history-toolbar-item]')];
    if (canvasElement.ownerDocument.activeElement !== toolbar || toolbar.tabIndex !== 0) {
      throw new Error('When every history command becomes unavailable, focus must recover to the toolbar fallback.');
    }
    if (disabledItems.some((item) => item.tabIndex === 0)) {
      throw new Error('An all-disabled HistoryToolbar must not leave a command in the Tab sequence.');
    }

    canvasElement.querySelector('[data-testid="enable-history"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const restoredUndo = toolbar.querySelector('[data-lk-toolbar-key="undo"]');
    if (canvasElement.ownerDocument.activeElement !== restoredUndo || restoredUndo?.tabIndex !== 0 || toolbar.tabIndex !== -1) {
      throw new Error('When history returns, focus must move from the toolbar fallback to the preferred command.');
    }
  },
};

export const MissingHandlers = {
  name: '변형·상태 · 동작 없음 · 비활성',
  parameters: storyDescription(
    '가능 상태는 전달됐지만 실행 handler가 연결되지 않은 통합 경계입니다. 호출할 수 없는 undo·redo가 활성처럼 보이지 않고 키보드나 포인터로 실행되지 않는지 확인하세요.',
  ),
  render: () => (
    <HistoryFrame>
      <HistoryToolbar canUndo canRedo />
    </HistoryFrame>
  ),
};

export const MediumDensity = {
  name: '반응형 · 40px 제어',
  parameters: storyDescription(
    '40px 중간 크기의 이력 제어를 비교하는 상황입니다. 크기가 커져도 명령 그룹의 간격과 undo 활성 상태가 주변 에디터 제어와 일관되는지 확인하세요.',
  ),
  render: () => (
    <HistoryFrame>
      <HistoryToolbar size="md" canUndo onUndo={() => {}} />
    </HistoryFrame>
  ),
};
