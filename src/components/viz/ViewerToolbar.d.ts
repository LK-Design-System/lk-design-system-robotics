import * as React from 'react';

export interface ViewerToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default "vertical" */
  orientation?: 'vertical' | 'horizontal';
  /**
   * minimal: transparent group with individually surfaced controls.
   * on-dark: transparent group with inverse controls for scene/video surfaces.
   * surface: compact grouped surface for dense light UI.
   * @default "minimal"
   */
  appearance?: 'minimal' | 'on-dark' | 'surface';
  /** toolbar 접근성 라벨. @default "뷰어 컨트롤" */
  label?: string;
  children?: React.ReactNode;
}

export interface ViewerToolbarButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed' | 'children'> {
  /** 일회성 command와 유지되는 toggle을 구분합니다. @default "command" */
  kind?: 'command' | 'toggle';
  /** 제어형 toggle 상태. kind="toggle"에서만 사용합니다. */
  pressed?: boolean;
  /** 비제어 toggle 초기 상태. @default false */
  defaultPressed?: boolean;
  /** toggle 상태 변경 콜백. */
  onPressedChange?: (pressed: boolean) => void;
  /**
   * @deprecated `kind="toggle" pressed={...}`를 사용하세요.
   * 이전 active 사용은 호환을 위해 toggle로 해석됩니다.
   */
  active?: boolean;
  /** 아이콘 전용 컨트롤의 필수 접근성 라벨 + tooltip. */
  label: string;
  /** 16px 아이콘 glyph. */
  children?: React.ReactNode;
}

/** 뷰포트 로컬 툴바. enabled ViewerToolbarButton에 roving focus를 제공합니다. */
export function ViewerToolbar(props: ViewerToolbarProps): React.JSX.Element;
/** 명시적인 일회성 command 또는 persistent toggle 아이콘 컨트롤. */
export function ViewerToolbarButton(props: ViewerToolbarButtonProps): React.JSX.Element;
