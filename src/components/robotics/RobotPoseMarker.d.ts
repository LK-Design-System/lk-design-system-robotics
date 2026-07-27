import * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';
import type { NavigationFrameRef } from './NavigationCoordinateSystem';

export type RobotPoseState =
  | 'moving'
  | 'idle'
  | 'paused'
  | 'fault'
  | 'offline'
  | 'unknown';

/** Serializable robot pose in the owning navigation map's coordinate space. */
export interface RobotPoseData {
  readonly id: string;
  readonly label: string;
  readonly mapId: string;
  /** Source frame/version/time retained after projection into SVG map space. */
  readonly source?: NavigationFrameRef;
  readonly position: NavigationPoint;
  /** Heading in radians, where 0 points along the positive x-axis. @default 0 */
  readonly headingRad?: number;
  /** Explicit operational state. `moving` has no badge; other states use one replaceable badge slot. */
  readonly state: RobotPoseState;
  /** Optional fleet/robot identity color. Omission uses the appearance-stable primary color; operational state never recolors the pose body. */
  readonly color?: string;
  /** Optional projected 2D localization uncertainty. */
  readonly localization?: {
    readonly covariance: readonly number[];
    readonly ellipse: {
      readonly majorRadius: number;
      readonly minorRadius: number;
      /** SVG radians: positive clockwise because SVG y increases downward. */
      readonly headingRad: number;
      readonly standardDeviations: number;
      readonly yawVariance: number;
    };
  };
}

export interface RobotPoseMarkerProps extends NavigationSvgFeatureProps {
  pose: RobotPoseData;
  /** Omission shows the label only while selected or focused. */
  showLabel?: boolean;
  /** Select or inspect this robot. Disabled markers do not call the callback. */
  onActivate?: (robotId: string, event: NavigationActivateEvent) => void;
}

/** SVG `g` fragment for one screen-legible robot pose. The consumer owns the SVG root. */
export function RobotPoseMarker(props: RobotPoseMarkerProps): React.JSX.Element;
