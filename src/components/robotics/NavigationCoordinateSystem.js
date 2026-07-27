const NANOSECONDS_PER_SECOND = 1_000_000_000;
const MILLISECONDS_PER_SECOND = 1_000;
const DEFAULT_EPSILON = 1e-9;

export const NAVIGATION_COORDINATE_CONVENTION = Object.freeze({
  lengthUnit: 'meter',
  angleUnit: 'radian',
  handedness: 'right',
  worldAxes: Object.freeze({ x: 'positive-x', y: 'positive-y', yaw: 'counter-clockwise' }),
  svgAxes: Object.freeze({ x: 'right', y: 'down', rotation: 'clockwise' }),
});

export class NavigationCoordinateError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'NavigationCoordinateError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new NavigationCoordinateError(code, message, details);
}

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) fail('NON_FINITE', `${name} must be finite.`, { name, value });
  return number;
}

function positive(value, name) {
  const number = finite(value, name);
  if (!(number > 0)) fail('NOT_POSITIVE', `${name} must be greater than zero.`, { name, value });
  return number;
}

function positiveInteger(value, name) {
  const number = finite(value, name);
  if (!Number.isInteger(number) || number <= 0) {
    fail('NOT_POSITIVE_INTEGER', `${name} must be a positive integer.`, { name, value });
  }
  return number;
}

function nonEmptyString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail('EMPTY_IDENTITY', `${name} must be a non-empty string.`, { name, value });
  }
  return value;
}

function normalizedAngle(angle) {
  let value = angle % (Math.PI * 2);
  if (value <= -Math.PI) value += Math.PI * 2;
  if (value > Math.PI) value -= Math.PI * 2;
  return value;
}

function frozenPoint(x, y) {
  return Object.freeze({ x, y });
}

function applyAffine(matrix, point) {
  const x = finite(point?.x, 'point.x');
  const y = finite(point?.y, 'point.y');
  return frozenPoint(
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  );
}

function invertAffine(matrix) {
  const determinant = matrix[0] * matrix[3] - matrix[1] * matrix[2];
  if (Math.abs(determinant) <= DEFAULT_EPSILON) {
    fail('NON_INVERTIBLE', 'Navigation coordinate transform is not invertible.', { matrix });
  }
  return Object.freeze([
    matrix[3] / determinant,
    -matrix[1] / determinant,
    -matrix[2] / determinant,
    matrix[0] / determinant,
    (matrix[2] * matrix[5] - matrix[3] * matrix[4]) / determinant,
    (matrix[1] * matrix[4] - matrix[0] * matrix[5]) / determinant,
  ]);
}

function normalizeOrigin(origin) {
  return Object.freeze({
    xM: finite(origin?.xM ?? 0, 'origin.xM'),
    yM: finite(origin?.yM ?? 0, 'origin.yM'),
    yawRad: normalizedAngle(finite(origin?.yawRad ?? 0, 'origin.yawRad')),
  });
}

export function normalizeNavigationStamp(stamp) {
  if (stamp == null) return undefined;
  let sec = finite(stamp.sec ?? stamp.seconds ?? 0, 'stamp.sec');
  let nanosec = finite(stamp.nanosec ?? stamp.nanoseconds ?? 0, 'stamp.nanosec');
  if (!Number.isInteger(sec) || !Number.isInteger(nanosec)) {
    fail('INVALID_STAMP', 'Navigation timestamps require integer seconds and nanoseconds.', { stamp });
  }
  sec += Math.floor(nanosec / NANOSECONDS_PER_SECOND);
  nanosec %= NANOSECONDS_PER_SECOND;
  if (nanosec < 0) {
    sec -= 1;
    nanosec += NANOSECONDS_PER_SECOND;
  }
  return Object.freeze({ sec, nanosec });
}

export function navigationStampToMilliseconds(stamp) {
  const normalized = normalizeNavigationStamp(stamp);
  return normalized
    ? normalized.sec * MILLISECONDS_PER_SECOND + normalized.nanosec / 1_000_000
    : undefined;
}

export function compareNavigationStamps(a, b) {
  const left = normalizeNavigationStamp(a);
  const right = normalizeNavigationStamp(b);
  if (left == null || right == null) {
    fail('MISSING_STAMP', 'Both navigation timestamps are required for comparison.', { a, b });
  }
  return left.sec === right.sec ? Math.sign(left.nanosec - right.nanosec) : Math.sign(left.sec - right.sec);
}

export function navigationAgeMilliseconds(stamp, referenceStamp) {
  const value = navigationStampToMilliseconds(stamp);
  const reference = navigationStampToMilliseconds(referenceStamp);
  if (value == null || reference == null) {
    fail('MISSING_STAMP', 'A source and reference timestamp are required to calculate age.', {
      stamp,
      referenceStamp,
    });
  }
  return reference - value;
}

export function classifyNavigationFreshness(stamp, referenceStamp, options = {}) {
  const staleAfterMs = positive(options.staleAfterMs ?? 1_000, 'staleAfterMs');
  const expiredAfterMs = positive(options.expiredAfterMs ?? 5_000, 'expiredAfterMs');
  if (expiredAfterMs < staleAfterMs) {
    fail('INVALID_FRESHNESS_POLICY', 'expiredAfterMs must be greater than or equal to staleAfterMs.', {
      staleAfterMs,
      expiredAfterMs,
    });
  }
  const ageMs = navigationAgeMilliseconds(stamp, referenceStamp);
  if (ageMs < 0) return Object.freeze({ state: 'future', ageMs });
  if (ageMs >= expiredAfterMs) return Object.freeze({ state: 'expired', ageMs });
  if (ageMs >= staleAfterMs) return Object.freeze({ state: 'stale', ageMs });
  return Object.freeze({ state: 'fresh', ageMs });
}

export function createNavigationFrameRef({
  mapId,
  frameId,
  mapVersion,
  stamp,
} = {}) {
  return Object.freeze({
    mapId: nonEmptyString(mapId, 'mapId'),
    frameId: nonEmptyString(frameId, 'frameId'),
    mapVersion: nonEmptyString(mapVersion, 'mapVersion'),
    stamp: normalizeNavigationStamp(stamp),
  });
}

export function assertNavigationFrameCompatible(actual, expected, options = {}) {
  const actualFrame = createNavigationFrameRef(actual);
  const expectedFrame = createNavigationFrameRef(expected);
  const mismatches = [];
  if (actualFrame.mapId !== expectedFrame.mapId) mismatches.push('mapId');
  if (actualFrame.frameId !== expectedFrame.frameId) mismatches.push('frameId');
  if (actualFrame.mapVersion !== expectedFrame.mapVersion) mismatches.push('mapVersion');
  if (mismatches.length > 0) {
    fail('FRAME_MISMATCH', `Navigation frame mismatch: ${mismatches.join(', ')}.`, {
      actual: actualFrame,
      expected: expectedFrame,
      mismatches,
    });
  }
  const maxAgeMs = Number(options.maxAgeMs);
  if (Number.isFinite(maxAgeMs) && maxAgeMs >= 0 && actualFrame.stamp && expectedFrame.stamp) {
    const ageMs = Math.abs(
      navigationStampToMilliseconds(actualFrame.stamp)
      - navigationStampToMilliseconds(expectedFrame.stamp),
    );
    if (ageMs > maxAgeMs) {
      fail('STAMP_MISMATCH', `Navigation timestamps differ by ${ageMs}ms.`, {
        actual: actualFrame.stamp,
        expected: expectedFrame.stamp,
        ageMs,
        maxAgeMs,
      });
    }
  }
  return true;
}

export function quaternionToPlanarYaw(quaternion, options = {}) {
  const x = finite(quaternion?.x ?? 0, 'quaternion.x');
  const y = finite(quaternion?.y ?? 0, 'quaternion.y');
  const z = finite(quaternion?.z ?? 0, 'quaternion.z');
  const w = finite(quaternion?.w ?? 1, 'quaternion.w');
  const norm = Math.hypot(x, y, z, w);
  if (!(norm > DEFAULT_EPSILON)) fail('INVALID_QUATERNION', 'Quaternion norm must be non-zero.');
  const qx = x / norm;
  const qy = y / norm;
  const qz = z / norm;
  const qw = w / norm;
  const sinRollCosPitch = 2 * (qw * qx + qy * qz);
  const cosRollCosPitch = 1 - 2 * (qx * qx + qy * qy);
  const roll = Math.atan2(sinRollCosPitch, cosRollCosPitch);
  const sinPitch = 2 * (qw * qy - qz * qx);
  const pitch = Math.abs(sinPitch) >= 1 ? Math.sign(sinPitch) * Math.PI / 2 : Math.asin(sinPitch);
  const yaw = Math.atan2(2 * (qw * qz + qx * qy), 1 - 2 * (qy * qy + qz * qz));
  const planarToleranceRad = Number.isFinite(options.planarToleranceRad)
    ? Math.max(0, options.planarToleranceRad)
    : 1e-5;
  if (Math.abs(roll) > planarToleranceRad || Math.abs(pitch) > planarToleranceRad) {
    fail('NON_PLANAR_ORIENTATION', 'Navigation map orientation must be planar.', {
      roll,
      pitch,
      yaw,
      planarToleranceRad,
    });
  }
  return normalizedAngle(yaw);
}

function validateMapMetadata(metadata) {
  const frame = createNavigationFrameRef(metadata);
  return Object.freeze({
    ...frame,
    widthCells: positiveInteger(metadata?.widthCells, 'widthCells'),
    heightCells: positiveInteger(metadata?.heightCells, 'heightCells'),
    resolutionMPerCell: positive(metadata?.resolutionMPerCell, 'resolutionMPerCell'),
    origin: normalizeOrigin(metadata?.origin),
    loadedAt: normalizeNavigationStamp(metadata?.loadedAt),
  });
}

export function createNavigationViewportTransform({
  viewport,
  svgCssScale = 1,
  screenOrigin = { x: 0, y: 0 },
} = {}) {
  const x = finite(viewport?.x ?? 0, 'viewport.x');
  const y = finite(viewport?.y ?? 0, 'viewport.y');
  const zoom = positive(viewport?.z ?? 1, 'viewport.z');
  const scale = positive(svgCssScale, 'svgCssScale') * zoom;
  const originX = finite(screenOrigin?.x ?? 0, 'screenOrigin.x');
  const originY = finite(screenOrigin?.y ?? 0, 'screenOrigin.y');
  const svgToScreenMatrix = Object.freeze([scale, 0, 0, scale, originX + x, originY + y]);
  const screenToSvgMatrix = invertAffine(svgToScreenMatrix);
  return Object.freeze({
    viewport: Object.freeze({ x, y, z: zoom }),
    svgCssScale,
    screenOrigin: frozenPoint(originX, originY),
    svgToScreenMatrix,
    screenToSvgMatrix,
    svgToScreen: (point) => applyAffine(svgToScreenMatrix, point),
    screenToSvg: (point) => applyAffine(screenToSvgMatrix, point),
  });
}

export function createNavigationMapTransform(metadata, options = {}) {
  const map = validateMapMetadata(metadata);
  const svgUnitsPerMeter = positive(options.svgUnitsPerMeter ?? 1, 'svgUnitsPerMeter');
  const svgOrigin = frozenPoint(
    finite(options.svgOrigin?.x ?? 0, 'svgOrigin.x'),
    finite(options.svgOrigin?.y ?? 0, 'svgOrigin.y'),
  );
  const widthM = map.widthCells * map.resolutionMPerCell;
  const heightM = map.heightCells * map.resolutionMPerCell;
  const cosine = Math.cos(map.origin.yawRad);
  const sine = Math.sin(map.origin.yawRad);
  const worldToSvgMatrix = Object.freeze([
    svgUnitsPerMeter * cosine,
    svgUnitsPerMeter * sine,
    svgUnitsPerMeter * sine,
    -svgUnitsPerMeter * cosine,
    svgOrigin.x - svgUnitsPerMeter * (cosine * map.origin.xM + sine * map.origin.yM),
    svgOrigin.y + svgUnitsPerMeter * heightM
      - svgUnitsPerMeter * sine * map.origin.xM
      + svgUnitsPerMeter * cosine * map.origin.yM,
  ]);
  const svgToWorldMatrix = invertAffine(worldToSvgMatrix);
  const widthSvg = widthM * svgUnitsPerMeter;
  const heightSvg = heightM * svgUnitsPerMeter;

  const worldToSvg = (point) => applyAffine(worldToSvgMatrix, point);
  const svgToWorld = (point) => applyAffine(svgToWorldMatrix, point);
  const worldHeadingToSvg = (headingRad) => {
    const angle = finite(headingRad, 'headingRad');
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    return normalizedAngle(Math.atan2(
      worldToSvgMatrix[1] * dx + worldToSvgMatrix[3] * dy,
      worldToSvgMatrix[0] * dx + worldToSvgMatrix[2] * dy,
    ));
  };
  const svgHeadingToWorld = (headingRad) => {
    const angle = finite(headingRad, 'headingRad');
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    return normalizedAngle(Math.atan2(
      svgToWorldMatrix[1] * dx + svgToWorldMatrix[3] * dy,
      svgToWorldMatrix[0] * dx + svgToWorldMatrix[2] * dy,
    ));
  };
  const gridCellToWorld = ({ column, row }, cellOptions = {}) => {
    const col = finite(column, 'cell.column');
    const sourceRow = finite(row, 'cell.row');
    const offset = cellOptions.anchor === 'corner' ? 0 : 0.5;
    const localX = (col + offset) * map.resolutionMPerCell;
    const localY = (sourceRow + offset) * map.resolutionMPerCell;
    return frozenPoint(
      map.origin.xM + cosine * localX - sine * localY,
      map.origin.yM + sine * localX + cosine * localY,
    );
  };
  const worldToGridCell = (point) => {
    const x = finite(point?.x, 'point.x') - map.origin.xM;
    const y = finite(point?.y, 'point.y') - map.origin.yM;
    const localX = cosine * x + sine * y;
    const localY = -sine * x + cosine * y;
    const columnFloat = localX / map.resolutionMPerCell;
    const rowFloat = localY / map.resolutionMPerCell;
    const column = Math.floor(columnFloat);
    const row = Math.floor(rowFloat);
    return Object.freeze({
      column,
      row,
      columnFloat,
      rowFloat,
      inside: column >= 0 && column < map.widthCells && row >= 0 && row < map.heightCells,
    });
  };
  const withViewport = (viewportOptions) => {
    const viewportTransform = createNavigationViewportTransform(viewportOptions);
    return Object.freeze({
      ...viewportTransform,
      worldToScreen: (point) => viewportTransform.svgToScreen(worldToSvg(point)),
      screenToWorld: (point) => svgToWorld(viewportTransform.screenToSvg(point)),
    });
  };

  return Object.freeze({
    metadata: map,
    convention: NAVIGATION_COORDINATE_CONVENTION,
    svgUnitsPerMeter,
    svgOrigin,
    widthM,
    heightM,
    widthSvg,
    heightSvg,
    worldToSvgMatrix,
    svgToWorldMatrix,
    worldToSvg,
    svgToWorld,
    worldHeadingToSvg,
    svgHeadingToWorld,
    gridCellToWorld,
    worldToGridCell,
    gridCellToSvg: (cell, cellOptions) => worldToSvg(gridCellToWorld(cell, cellOptions)),
    svgToGridCell: (point) => worldToGridCell(svgToWorld(point)),
    withViewport,
  });
}

export function covariance2dEllipse(covariance, options = {}) {
  if (covariance == null || typeof covariance.length !== 'number') {
    fail('INVALID_COVARIANCE', 'Covariance must be an array-like 6x6 row-major matrix.');
  }
  if (covariance.length < 36) {
    fail('INVALID_COVARIANCE', 'Pose covariance must contain 36 values.', { length: covariance.length });
  }
  const xx = finite(covariance[0], 'covariance[0]');
  const xy = (finite(covariance[1], 'covariance[1]') + finite(covariance[6], 'covariance[6]')) / 2;
  const yy = finite(covariance[7], 'covariance[7]');
  const trace = xx + yy;
  const discriminant = Math.sqrt(Math.max(0, (xx - yy) ** 2 + 4 * xy ** 2));
  const majorVariance = Math.max(0, (trace + discriminant) / 2);
  const minorVariance = Math.max(0, (trace - discriminant) / 2);
  const standardDeviations = positive(options.standardDeviations ?? 2, 'standardDeviations');
  return Object.freeze({
    majorRadiusM: Math.sqrt(majorVariance) * standardDeviations,
    minorRadiusM: Math.sqrt(minorVariance) * standardDeviations,
    yawRad: normalizedAngle(0.5 * Math.atan2(2 * xy, xx - yy)),
    standardDeviations,
    yawVariance: Math.max(0, finite(covariance[35], 'covariance[35]')),
  });
}
