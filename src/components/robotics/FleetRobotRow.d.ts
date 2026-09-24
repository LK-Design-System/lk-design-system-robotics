import * as React from 'react';
import type { FleetRobotData } from './FleetState';

export interface FleetRobotRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  robot: FleetRobotData;
  /** 배치. `card`는 로봇마다 RobotStatusCard 한 장, `row`는 대수가 많은 Fleet용 조밀 목록이다. `row`는 로봇당 한 줄, 카드 외곽 없음, 행 아래 1px 구분선이며 세로 여백은 ListCell `small` 토큰을 써서 `ops` 표현 프로필이 조밀하게 만든다. 행들은 테두리 있는 표면 하나에 담는다. @default "card" */
  layout?: 'card' | 'row';
  selected?: boolean;
  /** Cross-surface preview, such as list hover mirrored from a map marker. */
  highlighted?: boolean;
  disabled?: boolean;
  /**
   * Product-formatted timestamp, announced when freshness is not current. The
   * source ISO time comes from `robot.state.updatedAt`.
   */
  updatedAtLabel?: React.ReactNode;
  /** Passive incident or capability detail added to the accessible description. */
  detail?: React.ReactNode;
  /** Additional passive detail added to the accessible description. */
  trailing?: React.ReactNode;
  onActivate?: (robotId: string, event: React.MouseEvent | React.KeyboardEvent) => void;
  /** Reports the robot id while hovered or focused, and null when preview ends. */
  onHighlightChange?: (robotId: string | null) => void;
}

/**
 * Dense fleet scan row. All operational axes remain available through data
 * attributes and accessible text; the visible RobotStatusCard surface keeps
 * identity, connection, battery, and one mission/attention summary.
 * Applications own normalization, virtualization, commands, and safety.
 */
export function FleetRobotRow(props: FleetRobotRowProps): React.JSX.Element;
