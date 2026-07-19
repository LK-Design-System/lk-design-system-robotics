import * as React from 'react';

export interface CanvasEditorCommandBarAction {
  key?: React.Key;
  value?: string;
  label: string;
  icon: React.ReactNode | string;
  active?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  /** Keyboard shortcut exposed to assistive technology, e.g. "Control+S Meta+S". */
  ariaKeyShortcuts?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export interface CanvasEditorCommandBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 전체 document command group 접근성 라벨. */
  label?: string;
  /** documentActions가 있을 때 렌더링되는 문서 명령 툴바 라벨. */
  documentLabel?: string;
  /** 저장, 내보내기처럼 문서 수명주기에 속하는 명령. */
  documentActions?: CanvasEditorCommandBarAction[];
  /** @deprecated Viewport zoom/fit/camera controls belong in a viewport-local toolbar. */
  viewLabel?: string;
  /** @deprecated Kept for source compatibility. Move these actions beside the viewport. */
  viewActions?: CanvasEditorCommandBarAction[];
  /** Document/history icon control density. sm=32px, md=40px. @default "sm" */
  size?: 'sm' | 'md';
  /** 히스토리 툴바 표시 여부. @default true */
  showHistory?: boolean;
  /** 히스토리 툴바 접근성 라벨. */
  historyLabel?: string;
  /** 실행 취소 가능 여부. 실제 handler가 없으면 비활성입니다. @default false */
  canUndo?: boolean;
  /** 다시 실행 가능 여부. 실제 handler가 없으면 비활성입니다. @default false */
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  /** Set only when the owning editor implements this undo shortcut globally. */
  undoKeyShortcuts?: string;
  /** Set only when the owning editor implements this redo shortcut globally. */
  redoKeyShortcuts?: string;
  /** 함수가 있으면 변경사항 초기화 버튼 표시. */
  onReset?: () => void;
  /** 저장 버튼처럼 별도 컴포넌트가 필요한 문서 작업 슬롯. */
  children?: React.ReactNode;
  /** 추가 명령 슬롯 접근성 라벨. */
  extraLabel?: string;
}

/** CanvasEditorShell 상단의 document/history 명령 바. Viewport controls are intentionally excluded. */
export function CanvasEditorCommandBar(props: CanvasEditorCommandBarProps): React.JSX.Element;
