import type * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationAvailability,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';

export interface FacilityTransitionEndpoint {
  readonly mapId: string;
  readonly position: NavigationPoint;
  readonly label?: string;
  /** Optional graph identity; no renderer behavior is inferred from it. */
  readonly waypointId?: string;
  /** Optional related spatial-region identity. */
  readonly regionId?: string;
  /** Optional related door identity. */
  readonly doorId?: string;
}

interface FacilityTransitionBase {
  readonly id: string;
  readonly label: string;
  readonly facilityId: string;
  readonly from: FacilityTransitionEndpoint;
  readonly to?: FacilityTransitionEndpoint;
  /** Independent from door/lift/dock state. */
  readonly availability: NavigationAvailability;
}

export type FacilityDoorState = 'closed' | 'moving' | 'open' | 'offline' | 'unknown';
export type DoorTransitionEvent = 'open' | 'close' | 'pass';

export type DoorFacilityTransition = FacilityTransitionBase & {
  readonly kind: 'door';
  readonly doorState: FacilityDoorState;
  readonly event?: DoorTransitionEvent;
};

export type LiftTransitionPhase = 'approach' | 'waiting' | 'boarding' | 'moving' | 'arrival' | 'exiting';
export type LiftMotionState = 'stopped' | 'up' | 'down' | 'unknown';
export type LiftOperatingMode = 'human' | 'agv' | 'fire' | 'offline' | 'emergency' | 'unknown';
export type LiftSessionState = 'none' | 'requested' | 'owned' | 'other' | 'unknown';

export type LiftFacilityTransition = FacilityTransitionBase & {
  readonly kind: 'lift';
  readonly phase: LiftTransitionPhase;
  readonly doorState: FacilityDoorState;
  readonly motionState?: LiftMotionState;
  readonly operatingMode?: LiftOperatingMode;
  readonly sessionState?: LiftSessionState;
  readonly currentMapId?: string;
  readonly destinationMapId?: string;
};

export type DockTransitionPhase = 'approach' | 'docking' | 'docked' | 'undocking' | 'complete';

export type DockFacilityTransition = FacilityTransitionBase & {
  readonly kind: 'dock';
  readonly phase: DockTransitionPhase;
};

/** A passive level-change the AGV traverses (a ramp/slope) — no moving parts, so
 * only `availability` (and the shared selection/focus/error axes) applies. */
export type RampFacilityTransition = FacilityTransitionBase & {
  readonly kind: 'ramp';
};

/** A charging point in the dock family. Only `availability` is modeled here;
 * finer occupancy/charging detail is a product concern and is not inferred. */
export type ChargingFacilityTransition = FacilityTransitionBase & {
  readonly kind: 'charging';
};

/** An access-controlled passage (security gate / speed gate). Only
 * `availability` is modeled; open/closed and authorization are product concerns. */
export type GateFacilityTransition = FacilityTransitionBase & {
  readonly kind: 'gate';
};

/** A payload handoff / transfer point (conveyor, P&D station). Only
 * `availability` is modeled; occupancy and transfer progress are product concerns. */
export type HandoffFacilityTransition = FacilityTransitionBase & {
  readonly kind: 'handoff';
};

export type FacilityTransitionData =
  | DoorFacilityTransition
  | LiftFacilityTransition
  | DockFacilityTransition
  | RampFacilityTransition
  | ChargingFacilityTransition
  | GateFacilityTransition
  | HandoffFacilityTransition;

export interface FacilityTransitionProps extends NavigationSvgFeatureProps {
  /** Serializable renderer-neutral transition model. */
  transition: FacilityTransitionData;
  /** Chooses the visible from/to endpoint and filters unrelated maps. */
  activeMapId: string;
  /** Removes the transition from rendering and the accessibility tree. @default false */
  hidden?: boolean;
  /** Selection/inspection activation only; never issues a facility command. */
  onActivate?: (id: string, event: NavigationActivateEvent) => void;
}

/** SVG fragment for door, lift, dock, ramp, charging, gate, and handoff transition state. Must be mounted inside an application-owned svg. */
export function FacilityTransition(props: FacilityTransitionProps): React.JSX.Element | null;
