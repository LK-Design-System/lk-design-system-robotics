import * as React from 'react';

export type PadDirection = 'up' | 'down' | 'left' | 'right';

export interface DirectionalPadProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 방향 스텝 콜백. 누르고 있으면 rate Hz로 반복하며, 없으면 방향 버튼이 비활성화됩니다. */
  onStep?: (dir: PadDirection) => void;
  /** 홀드 반복 주기(Hz). @default 8 */
  rate?: number;
  /** 버튼 한 변 크기(px). @default 48 */
  size?: number;
  disabled?: boolean;
  /** 가운데 버튼 콘텐츠(예: HOME). 없고 onCenter만 있으면 home 아이콘을 표시합니다. */
  center?: React.ReactNode;
  onCenter?: () => void;
  /** Group accessible name. @default "방향 패드" */
  label?: string;
  /** Direction button accessible names. */
  directionLabels?: Partial<Record<PadDirection, string>>;
  /** Center button accessible name. @default "가운데" */
  centerLabel?: string;
}

/** PTZ·짐벌·조그용 D-pad. 누르고 있으면 반복 스텝, 탭은 1회. 아날로그는 Joystick. */
export function DirectionalPad(props: DirectionalPadProps): React.JSX.Element;
