import React from 'react';
import { Button, CanvasEditorCommandBar } from './lds.js';
import { EditorStoryFrame } from './EditorShell.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Editor/Command Bar',
  component: CanvasEditorCommandBar,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-editor-command-bar--document-commands',
      eyebrow: 'Robotics / Command Bar',
      title: '커맨드 바는 문서 전체에 영향을 주는 명령을 한곳에 모읍니다',
      description:
        '운영자가 저장·내보내기·실행 취소처럼 편집 문서 전체의 수명주기를 다룰 때 적합합니다. 줌·카메라·레이어처럼 현재 뷰포트에만 영향을 주는 동작에는 Viewer Toolbar 또는 해당 로컬 도구를 사용하세요.',
    },
    docs: {
      description: {
        component:
          'CanvasEditorCommandBar는 문서 수준의 히스토리와 저장·내보내기 명령을 그룹화합니다. 줌·fit·카메라 명령은 뷰포트 로컬 툴바에 둡니다.',
      },
    },
  },
};

export default meta;

function CommandBarFrame({ children, maxWidth = 760 }) {
  return (
    <EditorStoryFrame maxWidth={maxWidth} height="auto">
      <div
        data-testid="command-bar-frame"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
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

const documentActions = [
  {
    value: 'export',
    label: '문서 내보내기',
    icon: 'download',
    onClick: () => {},
  },
];

export const DocumentCommands = {
  name: '개요',
  parameters: storyDescription(
    '편집 문서의 실행 취소·다시 실행·저장·내보내기를 한 막대에서 사용하는 기본 상황입니다. 명령 그룹과 현재 가능한 작업이 아이콘과 접근 가능한 이름으로 구분되는지 확인하세요.',
  ),
  render: () => (
    <CommandBarFrame>
      <CanvasEditorCommandBar
        documentActions={documentActions}
        canUndo
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        onReset={() => {}}
      >
        <Button size="sm" onClick={() => {}}>저장</Button>
      </CanvasEditorCommandBar>
    </CommandBarFrame>
  ),
  play: async ({ canvasElement }) => {
    const history = canvasElement.querySelector('[role="toolbar"][aria-label="편집 이력"]');
    const documentToolbar = canvasElement.querySelector('[role="toolbar"][aria-label="문서 명령"]');
    const historyItems = [...(history?.querySelectorAll('[data-lk-history-toolbar-item]') ?? [])];
    const documentItems = [...(documentToolbar?.querySelectorAll('[data-lk-command-toolbar-item]') ?? [])];
    const enabledHistory = historyItems.filter((item) => !item.disabled);
    const enabledDocument = documentItems.filter((item) => !item.disabled);
    if (!history || !documentToolbar || enabledHistory.filter((item) => item.tabIndex === 0).length !== 1 || enabledDocument.filter((item) => item.tabIndex === 0).length !== 1) {
      throw new Error('Each command group must preserve exactly one roving Tab stop.');
    }
    enabledHistory[0].focus();
    enabledHistory[0].dispatchEvent(new canvasElement.ownerDocument.defaultView.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    if (canvasElement.ownerDocument.activeElement !== enabledHistory[1]) {
      throw new Error('History focus must skip unavailable commands and reach reset.');
    }
  },
};

export const HandlerGating = {
  name: '변형·상태 · 작업 가능 여부',
  parameters: storyDescription(
    '가능 상태는 true지만 대응 handler가 없거나 그 반대인 불완전한 연결 상황입니다. 실제 실행 가능한 명령만 활성화되어 눌러도 무응답인 제어가 생기지 않는지 확인하세요.',
  ),
  render: () => (
    <CommandBarFrame>
      <CanvasEditorCommandBar
        canUndo
        canRedo
        documentActions={[
          { value: 'export', label: '내보내기 권한 없음', icon: 'download', disabled: true },
        ]}
      />
    </CommandBarFrame>
  ),
};

export const MediumDensity = {
  name: '반응형 · 40px 문서 제어',
  parameters: storyDescription(
    '중간 밀도의 40px 문서 제어를 에디터 상단에 배치한 상황입니다. 버튼 크기와 간격이 인접 도구와 조화를 이루면서 포인터 타깃과 라벨이 유지되는지 확인하세요.',
  ),
  render: () => (
    <CommandBarFrame>
      <CanvasEditorCommandBar
        size="md"
        canUndo
        onUndo={() => {}}
        documentActions={documentActions}
      >
        <Button size="md" onClick={() => {}}>저장</Button>
      </CanvasEditorCommandBar>
    </CommandBarFrame>
  ),
};

export const NarrowCommandTargets = {
  name: '반응형 · 좁은 폭 · 긴 문서 작업',
  parameters: storyDescription(
    '좁은 편집 폭에서 긴 문서 작업명과 여러 명령이 함께 놓이는 상황입니다. 필수 명령이 겹치거나 잘리지 않고 긴 사용자 작업명이 타깃 안에서 자연스럽게 줄바꿈되는지 확인하세요.',
  ),
  render: () => (
    <CommandBarFrame maxWidth={360}>
      <CanvasEditorCommandBar
        data-testid="narrow-command-bar"
        documentLabel="문서 내보내기 작업"
        extraLabel="검토 완료 작업"
        documentActions={[
          {
            value: 'archive-export',
            label: '장기 보관 형식으로 문서 내보내기',
            icon: 'download',
            onClick: () => {},
          },
        ]}
        canUndo
        canRedo
        onUndo={() => {}}
        onRedo={() => {}}
        onReset={() => {}}
        style={{
          width: '100%',
          maxWidth: '100%',
          flexShrink: 1,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          size="sm"
          onClick={() => {}}
          style={{ width: 128, minHeight: 32, height: 'auto', paddingBlock: 'var(--space-1)', whiteSpace: 'normal', textAlign: 'center' }}
        >
          검토 완료본 저장 후 승인 요청
        </Button>
      </CanvasEditorCommandBar>
    </CommandBarFrame>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('[data-testid="command-bar-frame"]');
    const commandBar = canvasElement.querySelector('[data-testid="narrow-command-bar"]');
    const documentToolbar = canvasElement.querySelector('[role="toolbar"][aria-label="문서 내보내기 작업"]');
    const customGroup = canvasElement.querySelector('[role="group"][aria-label="검토 완료 작업"]');
    const documentAction = canvasElement.querySelector('button[aria-label="장기 보관 형식으로 문서 내보내기"]');
    const customAction = Array.from(customGroup?.querySelectorAll('button') ?? [])
      .find((button) => button.textContent?.trim() === '검토 완료본 저장 후 승인 요청');

    if (!frame || !commandBar || !documentToolbar || !customGroup || !documentAction || !customAction) {
      throw new Error('The narrow command bar must preserve its document and custom action groups.');
    }
    if (Math.round(frame.getBoundingClientRect().width) !== 360) {
      throw new Error('The narrow command bar fixture must render at the 360px target width.');
    }
    if (commandBar.scrollWidth > commandBar.clientWidth + 1 || frame.scrollWidth > frame.clientWidth + 1) {
      throw new Error('The wrapped command bar must not introduce horizontal overflow.');
    }
    if (customAction.getBoundingClientRect().height <= 32 || customAction.scrollWidth > customAction.clientWidth + 1) {
      throw new Error('The long custom action must wrap inside its target without clipping at 360px.');
    }
    for (const action of [documentAction, customAction]) {
      const target = action.getBoundingClientRect();
      if (target.width < 32 || target.height < 32) {
        throw new Error('Document and custom actions must preserve at least a 32px target.');
      }
    }
  },
};
