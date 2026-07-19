import * as React from 'react';

export interface EditorTool {
  value: string;
  /** 아이콘 노드(예: <Icon name="…" />). */
  icon?: React.ReactNode;
  /** 접근성 라벨 + 툴팁. */
  label: string;
  /** 비활성 툴. */
  disabled?: boolean;
  /** 툴팁에 표시할 선택 단축키. */
  shortcut?: React.ReactNode;
  /** Assistive-technology shortcut declaration. String `shortcut` is used when omitted. */
  ariaKeyShortcuts?: string;
  /** 비활성 사유. 툴팁에서 툴 이름과 함께 표시합니다. */
  disabledReason?: string;
}

export interface EditorToolbarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 툴 목록 — `{ value, icon, label }`. */
  items: readonly EditorTool[];
  /** 제어되는 선택 툴. */
  value?: string;
  /** 비제어 초기 툴(기본 첫 항목). */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** @default "vertical" */
  orientation?: 'vertical' | 'horizontal';
  /** toolbar 접근성 라벨. @default "편집 도구" */
  label?: string;
  /** 전체 툴바 비활성화. */
  disabled?: boolean;
  /** 전체 비활성 사유. item의 disabledReason이 우선합니다. */
  disabledReason?: string;
  /** 툴팁 위치. 기본값은 세로 `right`, 가로 `bottom`. */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/** 캔버스 에디터용 단일 선택 툴 그룹(선택·그리기·지우기·폴리곤·팬). 활성 툴은 공통 선택 tint를 사용합니다. */
export function EditorToolbar(props: EditorToolbarProps): React.JSX.Element;
