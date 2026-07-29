export type FleetConnectionState =
  | 'unknown'
  | 'connecting'
  | 'connected'
  | 'degraded'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export type FleetFreshnessState = 'current' | 'delayed' | 'stale' | 'unknown';
export type FleetOperabilityState = 'available' | 'busy' | 'blocked' | 'unavailable' | 'unknown';
export type FleetMissionState =
  | 'idle'
  | 'queued'
  | 'assigned'
  | 'executing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unknown';
export type FleetSafetyState =
  | 'normal'
  | 'protective-stop'
  | 'software-stop-requested'
  | 'e-stopped'
  | 'unknown';
export type FleetControlState =
  | 'autonomous'
  | 'supervised'
  | 'manual'
  | 'teleoperated'
  | 'unavailable'
  | 'unknown';
export type FleetAuthorityState =
  | 'unclaimed'
  | 'requested'
  | 'owned'
  | 'denied'
  | 'revoked'
  | 'unknown';
export type FleetAttentionLevel = 'none' | 'info' | 'warning' | 'critical';
export type FleetCapabilityState = 'supported' | 'unsupported' | 'unknown';

export interface FleetRobotState {
  readonly connection: FleetConnectionState;
  readonly freshness: FleetFreshnessState;
  readonly operability: FleetOperabilityState;
  readonly mission: FleetMissionState;
  readonly safety: FleetSafetyState;
  readonly control: FleetControlState;
  readonly authority: FleetAuthorityState;
  /** Derived triage priority. Source axes above remain the operational truth. */
  readonly attention: FleetAttentionLevel;
  /** ISO 8601 source update time. Relative display text remains product-owned. */
  readonly updatedAt?: string;
  readonly batteryPercent?: number;
}

export interface FleetRobotData {
  readonly id: string;
  readonly name: string;
  readonly image?: string;
  readonly siteId?: string;
  readonly siteLabel?: string;
  readonly fleetId?: string;
  readonly fleetLabel?: string;
  readonly vendor?: string;
  readonly model?: string;
  readonly serialNumber?: string;
  readonly tags?: readonly string[];
  /**
   * `unsupported` means the robot lacks a capability. `unknown` means the
   * capability exists but its current availability cannot be established.
   */
  readonly capabilities?: Readonly<Record<string, FleetCapabilityState>>;
  readonly state: FleetRobotState;
}

export interface FleetIncidentData {
  readonly id: string;
  readonly robotId: string;
  readonly title: string;
  readonly category: string;
  readonly severity: Exclude<FleetAttentionLevel, 'none'>;
  readonly status: 'open' | 'acknowledged' | 'resolved';
  readonly startedAt: string;
  readonly endedAt?: string;
}

export interface FleetMissionData {
  readonly id: string;
  readonly label: string;
  readonly state: FleetMissionState;
  readonly assignedRobotId?: string;
  readonly priority?: number;
  readonly startedAt?: string;
  readonly updatedAt?: string;
}

export interface FleetCommandResult {
  readonly targetId: string;
  readonly state:
    | 'queued'
    | 'sent'
    | 'accepted'
    | 'executing'
    | 'succeeded'
    | 'failed'
    | 'cancelled'
    | 'expired';
  readonly reason?: string;
  readonly updatedAt?: string;
}

export const FLEET_FRESHNESS_STATES: readonly FleetFreshnessState[];
export const FLEET_OPERABILITY_STATES: readonly FleetOperabilityState[];
export const FLEET_MISSION_STATES: readonly FleetMissionState[];
export const FLEET_SAFETY_STATES: readonly FleetSafetyState[];
export const FLEET_CONTROL_STATES: readonly FleetControlState[];
export const FLEET_AUTHORITY_STATES: readonly FleetAuthorityState[];
export const FLEET_ATTENTION_LEVELS: readonly FleetAttentionLevel[];
export const FLEET_CAPABILITY_STATES: readonly FleetCapabilityState[];

