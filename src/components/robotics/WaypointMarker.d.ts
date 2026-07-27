import * as React from 'react';
import type { NavigationFrameRef } from './NavigationCoordinateSystem';
import type {
  NavigationDetailVisibility,
  NavigationLabelVisibility,
} from './NavigationAnnotationLayer';

/** Renderer-neutral 2D point in the owning navigation map's coordinate space. */
export interface NavigationPoint {
  readonly x: number;
  readonly y: number;
}

/** Runtime availability supplied by the navigation source; the marker never infers it. */
export type NavigationAvailability = 'available' | 'unavailable' | 'unknown';

/** Visible-name disclosure policy for a waypoint marker. */
export type WaypointLabelVisibility = NavigationLabelVisibility;

/** Secondary annotation disclosure policy for a visible waypoint label. */
export type WaypointDetailVisibility = NavigationDetailVisibility;

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
  /**
   * Legacy visible-label switch. `true` forces all label detail on and `false`
   * hides the label unless an explicit visibility policy overrides it.
   */
  showLabel?: boolean;
  /** Override the inherited map label disclosure policy. */
  labelVisibility?: NavigationLabelVisibility;
  /** Override the inherited map detail disclosure policy. */
  detailVisibility?: NavigationDetailVisibility;
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
  /** Source frame/version/time retained after projection into SVG map space. */
  readonly source?: NavigationFrameRef;
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
  /**
   * Visible-name policy. The default `interaction` mode reveals the label for
   * hover, keyboard focus, or selection. `priority` is an explicit override.
   * @default interaction
   */
  labelVisibility?: WaypointLabelVisibility;
  /** Secondary annotation policy. Operational detail defaults to selection only. @default selected */
  detailVisibility?: WaypointDetailVisibility;
  /**
   * Legacy label switch. `true` maps to `labelVisibility="always"` and `false`
   * maps to `"hidden"` when `labelVisibility` is omitted.
   * @deprecated Prefer labelVisibility.
   */
  showLabel?: boolean;
  /** Select or inspect this waypoint. Disabled markers do not call the callback. */
  onActivate?: (waypointId: string, event: NavigationActivateEvent) => void;
}

/** SVG `g` fragment for one navigation-graph waypoint. The consumer owns the SVG root. */
export function WaypointMarker(props: WaypointMarkerProps): React.JSX.Element;
