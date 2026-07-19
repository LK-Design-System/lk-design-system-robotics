import * as React from 'react';

export interface JoystickChange {
  /** −1..1, 오른쪽이 양수. */
  x: number;
  /** −1..1, 위가 양수. */
  y: number;
}

export type JoystickEndReason =
  | 'pointer-release'
  | 'pointer-cancel'
  | 'pointer-capture-lost'
  | 'keyboard-release'
  | 'keyboard-cancel'
  | 'blur'
  | 'disabled'
  | 'unmount';

export interface JoystickProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 지름(px). @default 160 */
  size?: number;
  /** 포인터를 누르거나 이동하고, 화살표 키를 누르는 동안 정규화 좌표로 호출. 모든 종료 경로에서 마지막으로 {x:0,y:0}을 호출합니다. */
  onChange?: (v: JoystickChange) => void;
  /** 정지 벡터를 내보낸 뒤 종료 원인과 함께 호출. */
  onEnd?: (reason: JoystickEndReason) => void;
  /** 놓은 뒤 노브의 마지막 시각적 위치만 유지합니다. 출력 명령은 항상 0으로 정지합니다. @default false */
  sticky?: boolean;
  /** 비활성. @default false */
  disabled?: boolean;
  /** 화면에 보이며 조작 영역의 접근 가능한 이름으로도 쓰는 라벨. @default '조이스틱' */
  label?: React.ReactNode;
  /** 화면에 보이며 `aria-describedby`로 연결되는 조작 안내. `null`이면 숨깁니다. */
  instructions?: React.ReactNode;
  /** 현재 명령의 텍스트 피드백을 표시합니다. 라이브 영역으로 자동 공지하지 않습니다. @default true */
  showValue?: boolean;
}

/** 홀드-투-런 텔레옵 조이스틱 — 누르는 동안 벡터를 내보내고 모든 종료 경로에서 0으로 정지. */
export function Joystick(props: JoystickProps): React.JSX.Element;
