import * as React from 'react';

export interface HistoryToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Toolbar accessible name. @default "편집 이력" */
  label?: string;
  /** 실행 취소 가능 여부. 실제 handler가 없으면 항상 비활성입니다. @default false */
  canUndo?: boolean;
  /** 다시 실행 가능 여부. 실제 handler가 없으면 항상 비활성입니다. @default false */
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  /** Set only when the owning editor implements this undo shortcut globally. */
  undoKeyShortcuts?: string;
  /** Set only when the owning editor implements this redo shortcut globally. */
  redoKeyShortcuts?: string;
  /** 함수가 있으면 별도 그룹의 변경사항 초기화 버튼을 표시합니다. */
  onReset?: () => void;
  /** Shared LDS editor control density. sm=32px, md=40px. @default "sm" */
  size?: 'sm' | 'md';
}

/** 에디터용 실행 취소 / 다시 실행 / 초기화 툴바. Arrow/Home/End roving focus를 제공합니다. */
export function HistoryToolbar(props: HistoryToolbarProps): React.JSX.Element;
