import * as React from 'react';

export type FleetHealthFilter =
  | 'total'
  | 'connected'
  | 'attention'
  | 'unavailable'
  | 'stale'
  | 'critical';

export type FleetHealthStatusFilter = Exclude<FleetHealthFilter, 'total'>;

export interface FleetHealthCounts {
  /** Total robots in the current product-owned scope. */
  total?: number;
  connected?: number;
  /** Warning or critical attention. May overlap other counts. */
  attention?: number;
  unavailable?: number;
  stale?: number;
  critical?: number;
}

export interface FleetHealthSummaryProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  /**
   * Application-supplied counts. Categories may overlap; the component does
   * not derive fleet health or assume the values sum to `total`.
   */
  counts: FleetHealthCounts;
  labels?: Partial<Record<FleetHealthFilter, React.ReactNode>>;
  /**
   * Controlled status filters. Multiple values use OR semantics; `total` is
   * represented by an empty array and is never stored here.
   */
  activeFilters?: readonly FleetHealthStatusFilter[];
  /** Supplying this callback makes the status counts controlled multi-select filters. */
  onFiltersChange?: (filters: FleetHealthStatusFilter[]) => void;
  /** Keep zero-count categories visible for a stable operations layout. @default true */
  showZero?: boolean;
  /** Accessible section name. @default "Fleet 상태 요약" */
  label?: string;
}

/** Fleet-level count summary and optional controlled filter surface. */
export function FleetHealthSummary(props: FleetHealthSummaryProps): React.JSX.Element;
