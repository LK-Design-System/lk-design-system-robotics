import * as React from 'react';

export type ManualControlReleaseReason =
  | 'link-unavailable'
  | 'authority-unavailable'
  | 'disarmed'
  | 'deadman-released'
  | 'focus-lost'
  | 'stop-requested'
  | 'unmount';

export type ManualControlStopRequestState = 'idle' | 'requesting' | 'acknowledged' | 'stopped' | 'failed';

export interface ManualControlSessionContext {
  interactionEnabled: boolean;
  blockReason: React.ReactNode;
  focused: boolean;
  controlMode: 'pointer' | 'keyboard' | 'hybrid';
  stopRequestState: ManualControlStopRequestState;
}

export interface ManualControlSessionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  title?: React.ReactNode;
  /** 내부 제목의 시맨틱 heading level. @default 2 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  linkState?: 'ready' | 'stale' | 'lost';
  authority?: 'checking' | 'granted' | 'denied' | 'revoked';
  armed?: boolean;
  deadmanRequired?: boolean;
  deadmanActive?: boolean;
  controlMode?: 'pointer' | 'keyboard' | 'hybrid';
  focusRequired?: boolean;
  sessionMeta?: React.ReactNode;
  deadmanControl?: React.ReactNode;
  /** 소프트웨어 운행 정지 요청의 전송·수신·실제 정지·실패 상태. Full lifecycle UI를 쓰려면 제어하세요. 생략 시 callback-only 호환 모드입니다. @default "idle" */
  stopRequestState?: ManualControlStopRequestState;
  /** 현재 정지 요청 상태의 기본 설명을 교체합니다. */
  stopRequestMessage?: React.ReactNode;
  /** idle 상태의 정지 요청 버튼 레이블. @default "운행 정지 요청" */
  stopRequestLabel?: string;
  /** arm 상태 변경 요청. 안전 해제·정지 요청에서 전달되는 false를 소비자가 반영해야 합니다. */
  onArmedChange?: (armed: boolean) => void;
  onSafetyReleaseRequest?: (reason: ManualControlReleaseReason) => void;
  /** 안전 등급 E-stop 완료가 아닌 소프트웨어 운행 정지 요청을 시작합니다. */
  onStopRequest?: () => void;
  /** @deprecated onStopRequest를 사용하세요. callback-only 하위 호환 별칭이며 onArmedChange(false)를 반영해야 합니다. */
  onEmergencyStopRequest?: () => void;
  onFocusChange?: (focused: boolean) => void;
  children?: React.ReactNode | ((context: ManualControlSessionContext) => React.ReactNode);
}

/** UI boundary for a manual-control session. Transport STOP and watchdog guarantees remain application responsibilities. */
export function ManualControlSession(props: ManualControlSessionProps): React.JSX.Element;
