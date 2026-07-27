import * as React from 'react';
import type { NavigationFrameRef } from './NavigationCoordinateSystem';

export interface NavigationCoordinateBoundaryValue {
  readonly frame: NavigationFrameRef;
  readonly requireSource: boolean;
  readonly requireProjectedCoordinates: boolean;
  readonly maxAgeMs?: number;
}

export interface NavigationCoordinateBoundaryProps
  extends React.SVGAttributes<SVGGElement> {
  /** The only map/frame/version permitted to render below this boundary. */
  frame: NavigationFrameRef;
  /** Suppress layers without source metadata. Defaults to true. */
  requireSource?: boolean;
  /** Require line geometry produced in SVG map space. Defaults to true. */
  requireProjectedCoordinates?: boolean;
  /** Optional maximum source-to-map timestamp delta. */
  maxAgeMs?: number;
  children?: React.ReactNode;
}

export function isNavigationSourceCompatible(
  source: NavigationFrameRef | undefined,
  boundary: NavigationCoordinateBoundaryValue | null,
): boolean;

export function isNavigationGeometryCompatible(
  geometry:
    | { readonly source?: NavigationFrameRef; readonly coordinateSpace?: string }
    | undefined,
  boundary: NavigationCoordinateBoundaryValue | null,
): boolean;

export function useNavigationCoordinateBoundary(): NavigationCoordinateBoundaryValue | null;

/**
 * SVG `<g>` boundary that prevents layers from another map frame/version from
 * being silently composed into the active map.
 */
export function NavigationCoordinateBoundary(
  props: NavigationCoordinateBoundaryProps,
): React.JSX.Element;
