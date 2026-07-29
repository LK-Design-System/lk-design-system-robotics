const UPDATED_AT = '2026-07-28T12:00:00+09:00';

function robot({
  id,
  name,
  siteLabel = '서울 R&D 센터',
  fleetLabel,
  vendor,
  model,
  connection,
  freshness,
  operability,
  mission,
  safety = 'normal',
  control = 'autonomous',
  authority = 'unclaimed',
  attention = 'none',
  batteryPercent,
  incidents = 0,
  position,
  headingRad = 0,
  capabilities = {},
}) {
  return {
    id,
    name,
    siteId: 'seoul-rnd',
    siteLabel,
    fleetId: fleetLabel?.toLowerCase().replaceAll(' ', '-'),
    fleetLabel,
    vendor,
    model,
    capabilities,
    incidents,
    state: {
      connection,
      freshness,
      operability,
      mission,
      safety,
      control,
      authority,
      attention,
      batteryPercent,
      updatedAt: UPDATED_AT,
    },
    pose: {
      id,
      label: name,
      mapId: 'seoul-rnd-L1',
      position,
      headingRad,
      state: safety === 'e-stopped'
        ? 'fault'
        : connection === 'disconnected' || connection === 'failed'
          ? 'offline'
          : mission === 'executing'
            ? 'moving'
            : mission === 'paused'
              ? 'paused'
              : 'idle',
    },
  };
}

export const FLEET_ROBOTS = [
  robot({
    id: 'amr-07',
    name: 'AMR-07',
    fleetLabel: '물류 AMR',
    vendor: 'LK Robotics',
    model: 'LKR-AMR 600',
    connection: 'connected',
    freshness: 'current',
    operability: 'busy',
    mission: 'executing',
    batteryPercent: 86,
    position: { x: 128, y: 108 },
    headingRad: 0.2,
    capabilities: { navigation: 'supported', teleoperation: 'supported' },
  }),
  robot({
    id: 'amr-12',
    name: 'AMR-12',
    fleetLabel: '물류 AMR',
    vendor: 'LK Robotics',
    model: 'LKR-AMR 600',
    connection: 'connected',
    freshness: 'current',
    operability: 'available',
    mission: 'queued',
    batteryPercent: 72,
    position: { x: 242, y: 116 },
    headingRad: 1.1,
    capabilities: { navigation: 'supported', teleoperation: 'supported' },
  }),
  robot({
    id: 'forklift-b2',
    name: 'Forklift-B2',
    fleetLabel: '중량물 운반',
    vendor: 'Partner Robotics',
    model: 'FL-20',
    connection: 'degraded',
    freshness: 'delayed',
    operability: 'blocked',
    mission: 'paused',
    safety: 'protective-stop',
    control: 'supervised',
    attention: 'warning',
    batteryPercent: 47,
    incidents: 2,
    position: { x: 356, y: 104 },
    headingRad: 2.5,
    capabilities: { navigation: 'supported', teleoperation: 'unsupported' },
  }),
  robot({
    id: 'spot-03',
    name: 'Inspection-Spot-03',
    fleetLabel: '시설 점검',
    vendor: 'Boston Dynamics',
    model: 'Spot',
    connection: 'connected',
    freshness: 'current',
    operability: 'available',
    mission: 'idle',
    control: 'supervised',
    attention: 'info',
    batteryPercent: 64,
    incidents: 1,
    position: { x: 532, y: 122 },
    headingRad: -0.6,
    capabilities: { navigation: 'supported', inspection: 'supported', teleoperation: 'supported' },
  }),
  robot({
    id: 'dock-09',
    name: 'Docking-09',
    fleetLabel: '도킹 설비',
    vendor: 'LK Robotics',
    model: 'Dock Controller',
    connection: 'disconnected',
    freshness: 'stale',
    operability: 'unavailable',
    mission: 'failed',
    safety: 'e-stopped',
    control: 'unavailable',
    authority: 'revoked',
    attention: 'critical',
    batteryPercent: 12,
    incidents: 4,
    position: { x: 610, y: 302 },
    headingRad: 3.1,
    capabilities: { navigation: 'unsupported', docking: 'supported', teleoperation: 'unsupported' },
  }),
  robot({
    id: 'tug-04',
    name: 'Tug-04',
    fleetLabel: '중량물 운반',
    vendor: 'Partner Robotics',
    model: 'TUG-X',
    connection: 'reconnecting',
    freshness: 'delayed',
    operability: 'unavailable',
    mission: 'assigned',
    control: 'manual',
    attention: 'warning',
    batteryPercent: 39,
    incidents: 1,
    position: { x: 468, y: 282 },
    headingRad: -1.2,
    capabilities: { navigation: 'supported', teleoperation: 'supported' },
  }),
  robot({
    id: 'amr-21',
    name: 'AMR-21',
    fleetLabel: '물류 AMR',
    vendor: 'LK Robotics',
    model: 'LKR-AMR 300',
    connection: 'connected',
    freshness: 'current',
    operability: 'available',
    mission: 'assigned',
    batteryPercent: 91,
    position: { x: 308, y: 286 },
    headingRad: 0.8,
    capabilities: { navigation: 'supported', teleoperation: 'supported' },
  }),
  robot({
    id: 'inspection-02',
    name: 'Thermal-Inspection-02',
    fleetLabel: '시설 점검',
    vendor: 'LK Robotics',
    model: 'VisionX',
    connection: 'connected',
    freshness: 'current',
    operability: 'busy',
    mission: 'executing',
    batteryPercent: 78,
    position: { x: 174, y: 292 },
    headingRad: -2.2,
    capabilities: { navigation: 'supported', inspection: 'supported', teleoperation: 'supported' },
  }),
  robot({
    id: 'cleaner-05',
    name: 'Cleaner-05',
    fleetLabel: '시설 관리',
    vendor: 'Partner Robotics',
    model: 'CleanBot C5',
    connection: 'connected',
    freshness: 'current',
    operability: 'available',
    mission: 'idle',
    batteryPercent: 68,
    position: { x: 92, y: 328 },
    headingRad: 2.9,
    capabilities: { navigation: 'supported', cleaning: 'supported', teleoperation: 'unknown' },
  }),
  robot({
    id: 'agv-legacy-01',
    name: 'AGV-Legacy-01',
    fleetLabel: '레거시 AGV',
    vendor: 'Legacy Vendor',
    model: 'AGV-200',
    connection: 'failed',
    freshness: 'unknown',
    operability: 'unavailable',
    mission: 'unknown',
    safety: 'unknown',
    control: 'unknown',
    authority: 'unknown',
    attention: 'critical',
    incidents: 3,
    position: { x: 648, y: 176 },
    headingRad: 1.6,
    capabilities: { navigation: 'unknown', teleoperation: 'unsupported' },
  }),
];

export const FLEET_COUNTS = {
  total: 10,
  connected: 6,
  attention: 4,
  unavailable: 3,
  stale: 1,
  critical: 2,
};

export function matchesFleetFilters(robotData, filters) {
  const selectedFilters = Array.isArray(filters)
    ? filters.filter((filter) => filter && filter !== 'total')
    : filters && filters !== 'total'
      ? [filters]
      : [];
  if (selectedFilters.length === 0) return true;

  const { state } = robotData;
  return selectedFilters.some((filter) => {
    if (filter === 'connected') return state.connection === 'connected';
    if (filter === 'attention') return state.attention === 'warning' || state.attention === 'critical';
    if (filter === 'unavailable') return state.operability === 'unavailable';
    if (filter === 'stale') return state.freshness === 'stale';
    if (filter === 'critical') return state.attention === 'critical';
    return false;
  });
}

const CONNECTION_CYCLE = ['connected', 'connected', 'connected', 'degraded', 'reconnecting', 'disconnected'];
const MISSION_CYCLE = ['idle', 'queued', 'assigned', 'executing', 'paused'];

export const DENSE_FLEET_ROBOTS = Array.from({ length: 100 }, (_, index) => {
  const template = FLEET_ROBOTS[index % FLEET_ROBOTS.length];
  const number = String(index + 1).padStart(3, '0');
  const connection = CONNECTION_CYCLE[index % CONNECTION_CYCLE.length];
  const mission = MISSION_CYCLE[index % MISSION_CYCLE.length];
  const critical = index % 29 === 0;
  const warning = !critical && index % 11 === 0;
  return {
    ...template,
    id: `dense-${number}`,
    name: `Fleet-Robot-${number}`,
    incidents: critical ? 2 : warning ? 1 : 0,
    state: {
      ...template.state,
      connection,
      freshness: connection === 'disconnected' ? 'stale' : connection === 'degraded' ? 'delayed' : 'current',
      operability: connection === 'disconnected' ? 'unavailable' : mission === 'executing' ? 'busy' : 'available',
      mission,
      safety: critical ? 'protective-stop' : 'normal',
      attention: critical ? 'critical' : warning ? 'warning' : 'none',
      batteryPercent: 20 + ((index * 17) % 79),
    },
  };
});
