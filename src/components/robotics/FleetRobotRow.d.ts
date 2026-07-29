import * as React from 'react';
import type { FleetRobotData } from './FleetState';

export interface FleetRobotRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  robot: FleetRobotData;
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
