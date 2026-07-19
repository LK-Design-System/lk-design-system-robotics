import type * as React from 'react';
import type {
  NavigationActivateEvent,
  NavigationPoint,
  NavigationSvgFeatureProps,
} from './WaypointMarker';

export type SpatialRegionShape =
  | {
      readonly kind: 'polygon';
      readonly points: readonly NavigationPoint[];
    }
  | {
      readonly kind: 'circle';
      readonly center: NavigationPoint;
      readonly radius: number;
    };

interface SpatialRegionBase {
  readonly id: string;
  readonly mapId: string;
  readonly label: string;
  readonly shape: SpatialRegionShape;
}

export type BehaviorRule =
  | { readonly kind: 'keep-out' }
  | { readonly kind: 'speed-limit'; readonly speedLimitMps: number }
  | { readonly kind: 'preferred' }
  | { readonly kind: 'operation-area'; readonly operation?: string }
  | { readonly kind: 'custom'; readonly label: string };

export type BehaviorSpatialRegion = SpatialRegionBase & {
  readonly category: 'behavior';
  readonly rule: BehaviorRule;
};

export type FacilityRegionKind =
  | 'lift-cabin'
  | 'lift-lobby'
  | 'door-area'
  | 'dock-area'
  | 'charger-area'
  | 'custom';

export type FacilitySpatialRegion = SpatialRegionBase & {
  readonly category: 'facility';
  readonly kind: FacilityRegionKind;
  /** Stable facility identity owned by the product/backend adapter. */
  readonly facilityId?: string;
};

export type TerrainRegionKind = 'slope' | 'rough' | 'clearance' | 'custom';
export type TerrainTraversability = 'allowed' | 'restricted' | 'blocked' | 'unknown';

export interface TerrainGrade {
  readonly value: number;
  readonly unit: 'percent' | 'degree';
  /** Optional direction in map-frame radians; the renderer never infers it from polygon geometry. */
  readonly directionRad?: number;
}

export type TerrainSpatialRegion = SpatialRegionBase & {
  readonly category: 'terrain';
  readonly kind: TerrainRegionKind;
  readonly traversability?: TerrainTraversability;
  readonly grade?: TerrainGrade;
};

export type SpatialRegionData =
  | BehaviorSpatialRegion
  | FacilitySpatialRegion
  | TerrainSpatialRegion;

export interface SpatialRegionProps extends NavigationSvgFeatureProps {
  /** Serializable renderer-neutral region model. */
  region: SpatialRegionData;
  /** Removes the region from rendering and the accessibility tree. @default false */
  hidden?: boolean;
  /** Selection/inspection activation only; never executes a navigation command. */
  onActivate?: (id: string, event: NavigationActivateEvent) => void;
}

/** SVG fragment for behavior, facility, or terrain regions. Must be mounted inside an application-owned svg. */
export function SpatialRegion(props: SpatialRegionProps): React.JSX.Element | null;
