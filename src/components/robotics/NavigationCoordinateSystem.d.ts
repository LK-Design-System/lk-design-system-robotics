export interface NavigationPoint2D {
  readonly x: number;
  readonly y: number;
}

export interface NavigationTimestamp {
  readonly sec: number;
  readonly nanosec: number;
}

export interface NavigationFrameRef {
  readonly mapId: string;
  readonly frameId: string;
  readonly mapVersion: string;
  readonly stamp?: NavigationTimestamp;
}

export interface NavigationMapOrigin {
  readonly xM: number;
  readonly yM: number;
  /** REP-103 yaw: radians, positive counter-clockwise in the world frame. */
  readonly yawRad: number;
}

export interface NavigationMapMetadata extends NavigationFrameRef {
  readonly widthCells: number;
  readonly heightCells: number;
  readonly resolutionMPerCell: number;
  readonly origin: NavigationMapOrigin;
  readonly loadedAt?: NavigationTimestamp;
}

export interface NavigationViewport {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface NavigationGridCell {
  readonly column: number;
  readonly row: number;
}

export interface NavigationGridCellResult extends NavigationGridCell {
  readonly columnFloat: number;
  readonly rowFloat: number;
  readonly inside: boolean;
}

export interface NavigationCovarianceEllipse {
  readonly majorRadiusM: number;
  readonly minorRadiusM: number;
  readonly yawRad: number;
  readonly standardDeviations: number;
  readonly yawVariance: number;
}

export interface NavigationViewportTransform {
  readonly viewport: NavigationViewport;
  readonly svgCssScale: number;
  readonly screenOrigin: NavigationPoint2D;
  readonly svgToScreenMatrix: readonly [number, number, number, number, number, number];
  readonly screenToSvgMatrix: readonly [number, number, number, number, number, number];
  svgToScreen(point: NavigationPoint2D): NavigationPoint2D;
  screenToSvg(point: NavigationPoint2D): NavigationPoint2D;
}

export interface NavigationMapTransform {
  readonly metadata: NavigationMapMetadata;
  readonly convention: typeof NAVIGATION_COORDINATE_CONVENTION;
  readonly svgUnitsPerMeter: number;
  readonly svgOrigin: NavigationPoint2D;
  readonly widthM: number;
  readonly heightM: number;
  readonly widthSvg: number;
  readonly heightSvg: number;
  readonly worldToSvgMatrix: readonly [number, number, number, number, number, number];
  readonly svgToWorldMatrix: readonly [number, number, number, number, number, number];
  worldToSvg(point: NavigationPoint2D): NavigationPoint2D;
  svgToWorld(point: NavigationPoint2D): NavigationPoint2D;
  worldHeadingToSvg(headingRad: number): number;
  svgHeadingToWorld(headingRad: number): number;
  gridCellToWorld(
    cell: NavigationGridCell,
    options?: { readonly anchor?: 'center' | 'corner' },
  ): NavigationPoint2D;
  worldToGridCell(point: NavigationPoint2D): NavigationGridCellResult;
  gridCellToSvg(
    cell: NavigationGridCell,
    options?: { readonly anchor?: 'center' | 'corner' },
  ): NavigationPoint2D;
  svgToGridCell(point: NavigationPoint2D): NavigationGridCellResult;
  withViewport(options: NavigationViewportTransformOptions): NavigationViewportTransform & {
    worldToScreen(point: NavigationPoint2D): NavigationPoint2D;
    screenToWorld(point: NavigationPoint2D): NavigationPoint2D;
  };
}

export interface NavigationViewportTransformOptions {
  readonly viewport: NavigationViewport;
  readonly svgCssScale?: number;
  readonly screenOrigin?: NavigationPoint2D;
}

export class NavigationCoordinateError extends Error {
  readonly code: string;
  readonly details?: unknown;
  constructor(code: string, message: string, details?: unknown);
}

export const NAVIGATION_COORDINATE_CONVENTION: Readonly<{
  lengthUnit: 'meter';
  angleUnit: 'radian';
  handedness: 'right';
  worldAxes: Readonly<{ x: string; y: string; yaw: 'counter-clockwise' }>;
  svgAxes: Readonly<{ x: 'right'; y: 'down'; rotation: 'clockwise' }>;
}>;

export function normalizeNavigationStamp(
  stamp?: NavigationTimestamp | { readonly seconds?: number; readonly nanoseconds?: number },
): NavigationTimestamp | undefined;
export function navigationStampToMilliseconds(stamp?: NavigationTimestamp): number | undefined;
export function compareNavigationStamps(a: NavigationTimestamp, b: NavigationTimestamp): number;
export function navigationAgeMilliseconds(
  stamp: NavigationTimestamp,
  referenceStamp: NavigationTimestamp,
): number;
export function classifyNavigationFreshness(
  stamp: NavigationTimestamp,
  referenceStamp: NavigationTimestamp,
  options?: {
    readonly staleAfterMs?: number;
    readonly expiredAfterMs?: number;
  },
): Readonly<{
  state: 'fresh' | 'stale' | 'expired' | 'future';
  ageMs: number;
}>;
export function createNavigationFrameRef(frame: NavigationFrameRef): NavigationFrameRef;
export function assertNavigationFrameCompatible(
  actual: NavigationFrameRef,
  expected: NavigationFrameRef,
  options?: { readonly maxAgeMs?: number },
): true;
export function quaternionToPlanarYaw(
  quaternion: { readonly x: number; readonly y: number; readonly z: number; readonly w: number },
  options?: { readonly planarToleranceRad?: number },
): number;
export function createNavigationViewportTransform(
  options: NavigationViewportTransformOptions,
): NavigationViewportTransform;
export function createNavigationMapTransform(
  metadata: NavigationMapMetadata,
  options?: {
    readonly svgUnitsPerMeter?: number;
    readonly svgOrigin?: NavigationPoint2D;
  },
): NavigationMapTransform;
export function covariance2dEllipse(
  covariance: ArrayLike<number>,
  options?: { readonly standardDeviations?: number },
): NavigationCovarianceEllipse;
