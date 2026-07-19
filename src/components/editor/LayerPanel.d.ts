import * as React from 'react';

export interface LayerPanelLayer {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Semantic marker tone; arbitrary color strings are intentionally not accepted. @default "signal" */
  tone?: 'neutral' | 'signal' | 'positive' | 'cautionary' | 'negative' | 'warning' | 'danger';
  /** Visible text paired with `tone` when the color conveys semantic state. */
  toneLabel?: React.ReactNode;
  visible?: boolean;
  locked?: boolean;
  /** Initial expansion fallback when no panel-level expansion props are supplied. @default true for groups */
  expanded?: boolean;
  disabled?: boolean;
  count?: React.ReactNode;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  children?: LayerPanelLayer[];
}

export interface LayerPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  layers?: LayerPanelLayer[];
  activeLayerId?: string;
  defaultActiveLayerId?: string;
  onActiveLayerChange?: (id: string) => void;
  visibleLayerIds?: string[];
  defaultVisibleLayerIds?: string[];
  onVisibleLayerIdsChange?: (ids: string[], changedId: string, visible: boolean) => void;
  lockedLayerIds?: string[];
  defaultLockedLayerIds?: string[];
  onLockedLayerIdsChange?: (ids: string[], changedId: string, locked: boolean) => void;
  expandedLayerIds?: string[];
  defaultExpandedLayerIds?: string[];
  onExpandedLayerIdsChange?: (ids: string[], changedId: string, expanded: boolean) => void;
  title?: React.ReactNode;
  label?: string;
  emptyLabel?: React.ReactNode;
  disabled?: boolean;
}

/** 맵/포인트클라우드 편집기용 레이어 패널 — 표시, 잠금, 활성 레이어, 중첩 그룹, 개수/메타. */
export function LayerPanel(props: LayerPanelProps): React.JSX.Element;
