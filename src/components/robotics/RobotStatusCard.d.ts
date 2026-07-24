import * as React from 'react';

export interface RobotStatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 로봇 이름. */
  name?: React.ReactNode;
  /** 썸네일 이미지 URL(없으면 이니셜). */
  image?: string;
  /** 연결 상태 — 우상단 신호 막대. @default "online" */
  status?: 'online' | 'reconnecting' | 'offline';
  /** 배터리 %(0–100). 값이 있으면 게이지 렌더(≤20 레드·≤50 앰버). */
  battery?: number;
  /** 운영 모드 칩(예: "순찰", "수동"). */
  mode?: React.ReactNode;
  /** 선택 강조 — 테두리·포커스 링. `onClick`이 있으면 `aria-pressed`로도 노출된다. @default false */
  selected?: boolean;
  /** 클릭 핸들러. 지정하면 카드 전체가 키보드로 조작 가능한 `role="button"`(Enter/Space 활성화)이 되고 로봇 이름으로 명명된다. */
  onClick?: (e: React.MouseEvent) => void;
}

/** 로봇 라이브 상태 카드 — 썸네일 · 이름(좌) + 우상단 상태 클러스터(모드 칩 · 연결 막대 · 배터리 게이지). `onClick`이 있으면 이름으로 명명된 버튼이 된다. */
export function RobotStatusCard(props: RobotStatusCardProps): React.JSX.Element;
