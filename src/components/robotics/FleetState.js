/**
 * Canonical fleet presentation vocabulary.
 *
 * These axes stay independent on purpose. Applications may derive attention
 * for sorting and triage, but must not replace connection, freshness, mission,
 * safety, or authority truth with one aggregate status.
 */
export const FLEET_FRESHNESS_STATES = Object.freeze([
  'current',
  'delayed',
  'stale',
  'unknown',
]);

export const FLEET_OPERABILITY_STATES = Object.freeze([
  'available',
  'busy',
  'blocked',
  'unavailable',
  'unknown',
]);

export const FLEET_MISSION_STATES = Object.freeze([
  'idle',
  'queued',
  'assigned',
  'executing',
  'paused',
  'completed',
  'failed',
  'cancelled',
  'unknown',
]);

export const FLEET_SAFETY_STATES = Object.freeze([
  'normal',
  'protective-stop',
  'software-stop-requested',
  'e-stopped',
  'unknown',
]);

export const FLEET_CONTROL_STATES = Object.freeze([
  'autonomous',
  'supervised',
  'manual',
  'teleoperated',
  'unavailable',
  'unknown',
]);

export const FLEET_AUTHORITY_STATES = Object.freeze([
  'unclaimed',
  'requested',
  'owned',
  'denied',
  'revoked',
  'unknown',
]);

export const FLEET_ATTENTION_LEVELS = Object.freeze([
  'none',
  'info',
  'warning',
  'critical',
]);

export const FLEET_CAPABILITY_STATES = Object.freeze([
  'supported',
  'unsupported',
  'unknown',
]);

