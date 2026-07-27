import type * as React from 'react';
import type { NavigationFrameRef } from './NavigationCoordinateSystem';

export type OccupancyRowOrder = 'top-to-bottom' | 'bottom-to-top';

export interface OccupancyMapOrigin {
  /** X position in the parent SVG coordinate system. @default 0 */
  readonly x?: number;
  /** Y position in the parent SVG coordinate system. @default 0 */
  readonly y?: number;
  /** Optional clockwise SVG rotation in radians. @default 0 */
  readonly headingRad?: number;
}

export interface OccupancyMapData {
  readonly width: number;
  readonly height: number;
  /** Parent-coordinate units represented by one grid cell. */
  readonly resolution: number;
  /** Row-major occupancy values. Missing or non-finite values render as unknown. */
  readonly data: ArrayLike<number>;
  readonly origin?: OccupancyMapOrigin;
  /** Traceability for live or persisted data after source-to-SVG projection. */
  readonly source?: NavigationFrameRef;
}

export interface OccupancyMapLayerProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  readonly map: OccupancyMapData;
  /** Values at or below this threshold render as free. @default 25 */
  readonly freeThreshold?: number;
  /** Values at or above this threshold render as occupied. @default 65 */
  readonly occupiedThreshold?: number;
  /** Explicit unknown sentinel. @default -1 */
  readonly unknownValue?: number;
  /** Serialization order of rows in `map.data`. @default "bottom-to-top" */
  readonly rowOrder?: OccupancyRowOrder;
  /** Draws a non-scaling outline around the supplied grid extent. @default true */
  readonly showBoundary?: boolean;
  /** Removes the base map from the accessibility tree when the viewport already names it. @default true */
  readonly decorative?: boolean;
  /** Accessible name used when `decorative` is false. @default "점유 지도" */
  readonly label?: string;
}

/**
 * SVG occupancy-grid fragment. Mount inside an application-owned SVG.
 * It classifies supplied data and never infers free space from wall geometry.
 */
export function OccupancyMapLayer(props: OccupancyMapLayerProps): React.JSX.Element | null;
