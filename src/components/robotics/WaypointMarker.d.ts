import * as React from 'react';

/** Renderer-neutral 2D point in the owning navigation map's coordinate space. */
export interface NavigationPoint {
  readonly x: number;
  readonly y: number;
}

/** Runtime availability supplied by the navigation source; the marker never infers it. */
export type NavigationAvailability = 'available' | 'unavailable' | 'unknown';

/** Native event delivered by pointer or Enter/Space activation. */
export type NavigationActivateEvent =
  | React.MouseEvent<SVGGElement>
  | React.KeyboardEvent<SVGGElement>;

/** Shared interaction and rendering props for SVG navigation features. */
export interface NavigationSvgFeatureProps extends Omit<
  React.SVGAttributes<SVGGElement>,
  'children' | 'onClick' | 'onKeyDown' | 'transform'
> {
  /** Current parent viewport scale. Geometry is inversely scaled to remain screen-legible. @default 1 */
  viewportScale?: number;
  selected?: boolean;
  focused?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  stale?: boolean;
  /** Show the screen-space feature label supplied by the concrete renderer. @default true */
  showLabel?: boolean;
}

export type WaypointRole = 'holding' | 'passthrough' | 'parking' | 'charger';

export type WaypointAnnotationKind =
  | 'dock'
  | 'cleaning'
  | 'dispenser'
  | 'ingestor'
  | 'lift-approach'
  | 'door-approach'
  | 'mutex'
  | 'custom';

export interface WaypointAnnotation {
  readonly kind: WaypointAnnotationKind;
  /** Product-provided visible name, such as "Lift A approach" or "Dock 03". */
  readonly label: string;
  /** Optional source-system identity for traceability; never used to infer visual state. */
  readonly sourceId?: string;
}

/** Serializable domain data; renderer handles may not be stored here. */
export interface WaypointData {
  readonly id: string;
  readonly label: string;
  readonly mapId: string;
  readonly position: NavigationPoint;
  /** Independent graph roles. Multiple values may be present at the same waypoint. */
  readonly roles?: readonly WaypointRole[];
  /** Product or facility metadata kept separate from graph roles. */
  readonly annotations?: readonly WaypointAnnotation[];
  /** Explicit source state. Omission renders as "unknown" without inferring another state. */
  readonly availability?: NavigationAvailability;
}

export interface WaypointMarkerProps extends NavigationSvgFeatureProps {
  waypoint: WaypointData;
  /** Select or inspect this waypoint. Disabled markers do not call the callback. */
  onActivate?: (waypointId: string, event: NavigationActivateEvent) => void;
}

/** SVG `g` fragment for one navigation-graph waypoint. The consumer owns the SVG root. */
export function WaypointMarker(props: WaypointMarkerProps): React.JSX.Element;
