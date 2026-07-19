import * as React from 'react';
import type { ViewerState } from './ViewerFrame';

export interface Scene3DFrameProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Three.js, R3F, point-cloud, or other renderer output. */
  children?: React.ReactNode;
  /** Visible scene or source identity. */
  title?: React.ReactNode;
  /** Passive badges adjacent to the scene identity. */
  badges?: React.ReactNode;
  /** Compact passive diagnostics; keep the default HUD to essential values. */
  hud?: React.ReactNode;
  /** Viewport-local camera, fit, zoom, and display controls. */
  toolbar?: React.ReactNode;
  /** Non-interactive renderer overlay. */
  overlay?: React.ReactNode;
  /** Passive renderer metadata such as FPS or point count. */
  status?: React.ReactNode;
  /** Normalized availability/freshness state. @default "ready" */
  state?: ViewerState;
  stateLabel?: React.ReactNode;
  stateDescription?: React.ReactNode;
  stateIcon?: React.ReactNode;
  stateAction?: React.ReactNode;
  /** @deprecated Use state="loading". */
  loading?: boolean;
  /** @deprecated Use state="no-source" and stateLabel. */
  empty?: React.ReactNode;
  /** Theme-stable viewport presentation. @default "dark" */
  appearance?: 'dark' | 'light';
  /** Accessible region name. @default "3D 뷰포트" */
  label?: string;
  /** Perimeter ownership. "embedded" drops the viewport's own border and radius so a parent surface (CanvasEditorShell, Card) owns one continuous outline. @default "standalone" */
  variant?: 'standalone' | 'embedded';
}

/** Renderer-independent 3D viewport preset built on ViewerFrame. */
export function Scene3DFrame(props: Scene3DFrameProps): React.JSX.Element;
