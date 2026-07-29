import * as React from 'react';

export interface RobotStatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 로봇 이름. */
  name?: React.ReactNode;
  /** 썸네일 이미지 URL(없으면 이니셜). */
  image?: string;
  /** 연결 상태 — 우상단 신호 막대. @default "online" */
  status?: 'online' | 'reconnecting' | 'offline';
  /** 정규화된 transport 연결 상태. 지정하면 legacy `status`보다 우선한다. */
  connectionState?: 'unknown' | 'connecting' | 'connected' | 'degraded' | 'reconnecting' | 'disconnected' | 'failed';
  /** 배터리 %(0–100). 값이 있으면 게이지 렌더(≤20 레드·≤50 앰버). */
  battery?: number;
  /** 운영 모드 칩(예: "순찰", "수동"). */
  mode?: React.ReactNode;
  /** 운영 모드 또는 요약 상태 StatusBadge의 의미 색상. `accent`와 `navy`는 호환을 위해 `signal`로 정규화한다. @default "accent" */
  modeTone?: 'signal' | 'accent' | 'navy' | 'neutral' | 'positive' | 'cautionary' | 'warning' | 'negative';
  /**
   * 서로 독립적인 상태를 여러 개 표시할 때 사용한다. 지정하면 `mode`/`modeTone` 대신
   * 렌더되며, 안전 정지 같은 상태가 주의 상태에 밀려 사라지지 않는다. 순서와 개수 제한은
   * 조합하는 쪽이 결정한다.
   */
  badges?: Array<{
    key?: string;
    label: React.ReactNode;
    tone?: RobotStatusCardProps['modeTone'];
  }>;
  /**
   * 연결·배터리 뒤에 이어 붙는 부가 측정값(갱신 시각, 인시던트 건수 등). 상태 축은
   * `badges`가, 측정값은 `meta`가 맡는다. 화면 낭독기에는 텔레메트리 설명의 일부로 전달된다.
   */
  meta?: React.ReactNode;
  /**
   * 선행 아바타 표시 여부. 이름만으로 로봇이 식별되는 밀도 높은 목록에서는 `false`로
   * 두어 이니셜 중복과 불필요한 타입 단계를 없앤다. @default true
   */
  showAvatar?: boolean;
  /** 카드 정보 밀도. Fleet 목록에는 `compact`, 고밀도 단일 행에는 `single-line`을 사용한다. @default "comfortable" */
  density?: 'comfortable' | 'compact' | 'single-line';
  /** 기본 anatomy를 바꾸지 않고 상태 클러스터에 추가하는 화면 낭독기용 설명. */
  accessibleDescription?: React.ReactNode;
  /** 선택 강조 — 테두리·포커스 링. `onClick`이 있으면 `aria-pressed`로도 노출된다. @default false */
  selected?: boolean;
  /** 비활성 상태. @default false */
  disabled?: boolean;
  /** Storybook 또는 상위 조합에서 강제로 표시할 상호작용 상태. */
  interaction?: boolean | 'hovered' | 'focused' | 'pressed' | 'active';
  /** 클릭 핸들러. 지정하면 카드 전체가 키보드로 조작 가능한 `role="button"`(Enter/Space 활성화)이 되고 로봇 이름으로 명명된다. */
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

/** Comfortable, compact, single-line 밀도를 지원하는 로봇 상태 카드. `onClick`이 있으면 이름으로 명명된 버튼이 된다. */
export function RobotStatusCard(props: RobotStatusCardProps): React.JSX.Element;
