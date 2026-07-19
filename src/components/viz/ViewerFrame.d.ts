import * as React from 'react';

export type ViewerState =
  | 'idle'
  | 'no-source'
  | 'loading'
  | 'connecting'
  | 'ready'
  | 'live'
  | 'degraded'
  | 'stale'
  | 'frozen'
  | 'paused'
  | 'unavailable'
  | 'disconnected'
  | 'no-signal'
  | 'error';

export const VIEWER_STATES: readonly ViewerState[];
export const VIEWER_BLOCKING_STATES: readonly ViewerState[];

export interface ViewerFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renderer or media content. Rendering and transport remain application-owned. */
  children?: React.ReactNode;
  /** Accessible name for the region. */
  label: string;
  /** Visible source or viewport identity in the top-left chrome. */
  source?: React.ReactNode;
  /** Passive badges adjacent to the source identity. */
  badges?: React.ReactNode;
  /** Compact, passive diagnostics. Keep the default HUD to essential values only. */
  hud?: React.ReactNode;
  /** Viewport-local controls such as zoom, fit, mute, or fullscreen. */
  toolbar?: React.ReactNode;
  /** Edge used for the viewport-local toolbar. @default "top-right" */
  toolbarPlacement?: 'top-right' | 'bottom-right';
  /** Non-interactive render overlay placed above the content. */
  overlay?: React.ReactNode;
  /** Passive metadata such as frame rate, resolution, scale, or freshness. */
  status?: React.ReactNode;
  /** Normalized availability and freshness state. Disconnected/no-signal/error blocking transitions are assertive; retained-content states are polite. @default "ready" */
  state?: ViewerState;
  /** Optional user-facing override for the normalized state label. */
  stateLabel?: React.ReactNode;
  /** Optional user-facing override for the normalized state description. Pass null to omit. */
  stateDescription?: React.ReactNode;
  /** Optional state icon override. */
  stateIcon?: React.ReactNode;
  /** Optional recovery or resume action. The application owns its behavior. */
  stateAction?: React.ReactNode;
  /** Theme-stable viewport presentation shared by map, 3D, and video presets. @default "dark" */
  appearance?: 'dark' | 'light';
  /** Perimeter ownership. "embedded" drops the frame's own border and radius so a parent surface (CanvasEditorShell, Card) owns one continuous outline; viewport chrome, state, and a11y roles are unchanged. @default "standalone" */
  variant?: 'standalone' | 'embedded';
}

/** Shared named viewport frame for map, 3D, and video renderer presets. */
export const ViewerFrame: React.ForwardRefExoticComponent<ViewerFrameProps & React.RefAttributes<HTMLDivElement>>;
