// Shared telemetry tone -> Korean status label. TelemetryGauge and TelemetryValue
// both pair a semantic tone with a visible status label (never colour alone), and
// the label vocabulary is byte-identical across the two, so it lives here as one
// source instead of being re-declared per component. Other status surfaces
// (ViewportStatusBar, StatusBadge) carry their own label sets, so this is
// intentionally the telemetry-specific vocabulary — not a universal status map.
// Internal module; not exported from the public entry.
export const TELEMETRY_STATUS_LABEL = {
  signal: '정보',
  positive: '정상',
  cautionary: '주의',
  negative: '위험',
};
