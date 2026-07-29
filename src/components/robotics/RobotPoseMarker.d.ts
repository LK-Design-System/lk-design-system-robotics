import * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';
import type { NavigationFrameRef } from './NavigationCoordinateSystem';
import type { NavigationGeometrySpace } from './NavigationGeometryAdapters';

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
  /** Proof that position and heading were projected into SVG map space. */
  readonly coordinateSpace?: NavigationGeometrySpace;
  readonly position: NavigationPoint;
  /** Heading in radians, where 0 points along the positive x-axis. @default 0 */
  readonly headingRad?: number;
  /** Explicit operational state. The pose body uses the state tone; only exceptional states retain a glyph badge. */
  readonly state: RobotPoseState;
  /** Optional fleet/robot identity color used for the normal moving state. Operational warning/error/offline tones take precedence. */
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
  /** Rendering context. Replay keeps the pose anatomy and heading but replaces live motion treatment with an explicit recording-replay label. @default 'live' */
  context?: 'live' | 'replay';
  /** Pointer 또는 연결된 목록 행의 일시적 preview 강조. 키보드 focus ring과 독립적으로 본체만 작게 확대한다. @default false */
  highlighted?: boolean;
  /** Legacy visible-label switch. Omission inherits the shared map disclosure policy. */
  showLabel?: boolean;
  /** Select or inspect this robot. Disabled markers do not call the callback. */
  onActivate?: (robotId: string, event: NavigationActivateEvent) => void;
}

/** SVG `g` fragment for one screen-legible robot pose. The consumer owns the SVG root. */
export function RobotPoseMarker(props: RobotPoseMarkerProps): React.JSX.Element;
